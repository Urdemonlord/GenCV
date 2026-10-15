import { listDocuments, loadDocument } from '@/lib/cv/storage';
import { hashText, isRecordLike, type SyncRecord } from './merge';

/**
 * Local side of the sync protocol: reads the stored CVs and produces `SyncRecord`s for
 * `planMerge`.
 *
 * Only *tombstones* are stored here. For a live document the record is derived from storage
 * on demand, so there is no second copy of `updatedAt` to fall out of step with the CV
 * itself — a cache that disagrees with the source is worse than no cache. A tombstone has no
 * such source: the CV is already gone, and without its record the next round would pull the
 * document straight back from a peer that still has it.
 */

const TOMBSTONE_KEY = 'gencv:sync-tombstones';

/** Raised when the stored deletions cannot be read. Sync must stop, not guess. */
export class TombstonesUnreadableError extends Error {
  constructor(reason: string) {
    super(`Data sinkronisasi di perangkat ini tidak bisa dibaca: ${reason}`);
    this.name = 'TombstonesUnreadableError';
  }
}

/**
 * The stored deletions.
 *
 * Throws rather than skipping a malformed entry. An unreadable tombstone is indistinguishable
 * from "this device never knew about the deletion", so skipping it would let a live server
 * copy be downloaded straight over a deletion — the exact resurrection the tombstone exists to
 * prevent. Failing the round is loud; guessing is silent and wrong.
 */
export function readTombstones(storage: Storage = localStorage): SyncRecord[] {
  const raw = storage.getItem(TOMBSTONE_KEY);
  if (raw === null) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new TombstonesUnreadableError('bukan JSON yang valid');
  }
  if (!Array.isArray(parsed)) throw new TombstonesUnreadableError('bentuknya bukan array');

  const records: SyncRecord[] = [];
  for (const entry of parsed) {
    // The same validator the server uses, so a record this device stores can never be one the
    // server would reject on every round.
    if (!isRecordLike(entry) || entry.deleted !== true) {
      throw new TombstonesUnreadableError('ada catatan penghapusan yang bentuknya tidak sah');
    }
    records.push(entry);
  }
  return records;
}

/** Reads the tombstones, or `null` when they are unreadable (the caller reports, not crashes). */
export function tryReadTombstones(storage: Storage = localStorage): SyncRecord[] | null {
  try {
    return readTombstones(storage);
  } catch {
    return null;
  }
}

function writeTombstones(tombstones: SyncRecord[], storage: Storage) {
  storage.setItem(TOMBSTONE_KEY, JSON.stringify(tombstones));
}

/**
 * Records for everything this device knows: live documents derived from storage, plus the
 * stored tombstones.
 *
 * A tombstone and a live document cannot both exist for one id — if the document came back
 * (restored from a JSON import, say) the live copy is the truth and the tombstone is dropped.
 * Keeping both would make every round re-report the deletion.
 *
 * The tombstone is dropped only once the body has actually been read. A summary whose body is
 * missing or unreadable is a broken index, not a restored document; treating it as live would
 * push an empty CV, and treating it as absent would drop the deletion and resurrect the
 * document from the server.
 */
export function readLocalRecords(storage: Storage = localStorage): SyncRecord[] {
  const tombstones = new Map(readTombstones(storage).map((record) => [record.id, record]));
  const records: SyncRecord[] = [];

  for (const summary of listDocuments(storage)) {
    const cv = loadDocument(summary.id, storage);
    if (!cv) continue;
    tombstones.delete(summary.id);
    records.push({
      id: summary.id,
      updatedAt: summary.updatedAt,
      deleted: false,
      hash: hashText(JSON.stringify(cv)),
    });
  }

  return [...records, ...tombstones.values()];
}

/**
 * Records a deletion locally so the next round pushes it.
 *
 * The tombstone is stamped with the *deletion* time, never the document's last-save time.
 * Reusing the old timestamp would let a server copy written after that save outrank the
 * deletion, and the deleted CV would be downloaded back.
 */
export function recordDeletion(record: SyncRecord, storage: Storage = localStorage, deletedAt = Date.now()): void {
  const tombstones = readTombstones(storage).filter((existing) => existing.id !== record.id);
  tombstones.push({ ...record, deleted: true, updatedAt: Math.max(deletedAt, record.updatedAt) });
  writeTombstones(tombstones, storage);
}

/** Adds tombstones (the outcome of a merge round) without dropping the existing ones. */
export function saveTombstones(records: SyncRecord[], storage: Storage = localStorage): void {
  const merged = new Map(readTombstones(storage).map((record) => [record.id, record]));
  for (const record of records) merged.set(record.id, { ...record, deleted: true });
  writeTombstones([...merged.values()], storage);
}

/** Drops tombstones for documents that exist again, so they stop being reported. */
export function pruneTombstones(liveIds: string[], storage: Storage = localStorage): void {
  const live = new Set(liveIds);
  writeTombstones(
    readTombstones(storage).filter((record) => !live.has(record.id)),
    storage,
  );
}

/**
 * Forgets every tombstone. The way out when `readTombstones` reports unreadable data: sync
 * resumes, at the cost of possibly re-downloading documents deleted on another device.
 */
export function clearTombstones(storage: Storage = localStorage): void {
  storage.removeItem(TOMBSTONE_KEY);
}
