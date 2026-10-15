import { listDocuments, loadDocument } from '@/lib/cv/storage';
import { hashText, type SyncRecord } from './merge';

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

/** Remembers deletions so they reach other devices instead of being re-downloaded. */
export function readTombstones(storage: Storage = localStorage): SyncRecord[] {
  const raw = storage.getItem(TOMBSTONE_KEY);
  if (raw === null) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Shapes are validated field by field: a malformed record would otherwise reach
    // `planMerge` and be treated as a live document, silently resurrecting a deletion.
    return parsed.filter(isTombstone);
  } catch {
    return [];
  }
}

function isTombstone(value: unknown): value is SyncRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<SyncRecord>;
  return (
    typeof record.id === 'string' &&
    typeof record.updatedAt === 'number' &&
    Number.isFinite(record.updatedAt) &&
    typeof record.hash === 'string' &&
    record.deleted === true
  );
}

function writeTombstones(tombstones: SyncRecord[], storage: Storage) {
  storage.setItem(TOMBSTONE_KEY, JSON.stringify(tombstones));
}

/**
 * Records for everything this device knows: live documents derived from storage, plus the
 * stored tombstones.
 *
 * A tombstone and a live document cannot both exist for one id — if the document came back
 * (restored from a JSON import, say) the live copy is the truth and the tombstone is
 * dropped. Keeping both would make every round re-report the deletion.
 */
export function readLocalRecords(storage: Storage = localStorage): SyncRecord[] {
  const tombstones = new Map(readTombstones(storage).map((record) => [record.id, record]));
  const records: SyncRecord[] = [];

  for (const summary of listDocuments(storage)) {
    tombstones.delete(summary.id);
    const cv = loadDocument(summary.id, storage);
    if (!cv) continue;
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
 * Records a deletion locally so the next round pushes it. The record is *found*, not
 * invented: the caller passes the metadata they already held, because the CV body is gone
 * by then and its hash cannot be recomputed.
 */
export function recordDeletion(record: SyncRecord, storage: Storage = localStorage): void {
  const tombstones = readTombstones(storage).filter((existing) => existing.id !== record.id);
  tombstones.push({ ...record, deleted: true });
  writeTombstones(tombstones, storage);
}

/** Replaces the tombstone set with `records` (the outcome of a merge round). */
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
