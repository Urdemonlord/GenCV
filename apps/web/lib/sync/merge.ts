/**
 * Offline-first sync planning. Pure functions only: no network, no database, no clock.
 *
 * The device stays the source of truth. A sync round sends only *metadata* first
 * (`SyncRecord`), decides who wins per document, and then transfers just the bodies that
 * changed. That keeps a round cheap on a phone connection and makes the decision testable
 * without a server.
 *
 * Conflict rule: a strict total order, so both devices compute the same winner.
 *  1. newer `updatedAt` (ms epoch) wins;
 *  2. then the larger `hash`;
 *  3. then a tombstone beats a live copy.
 * Step 2 must compare, not merely notice a difference: with an inequality both devices
 * would pick their own copy and the round would ping-pong forever. Step 3 exists because a
 * live record and a tombstone can share a timestamp and a hash.
 */

/** A document's sync metadata: enough to decide the winner without sending the body. */
export interface SyncRecord {
  id: string;
  /** ms epoch of the last write on this side; the last-write-wins clock. */
  updatedAt: number;
  /**
   * Tombstone: the document was deleted here. A deletion has to travel as a record,
   * otherwise the other side just re-uploads the document it still has and the CV
   * comes back from the dead.
   */
  deleted: boolean;
  /** Content fingerprint, used only to break timestamp ties. Not a security hash. */
  hash: string;
}

export interface MergePlan {
  /** Local copies to push (missing remotely, or newer locally). */
  upload: string[];
  /** Remote copies to pull (missing locally, or newer remotely). */
  download: string[];
  /** Local tombstones to push, so the deletion reaches the other side. */
  deleteRemote: string[];
  /**
   * Remote tombstones to record locally, carrying the *remote* metadata. Storing the
   * tombstone's own `updatedAt` matters: keeping only the local (older) timestamp would let
   * a stale peer's live copy win the next round and resurrect the document.
   */
  deleteLocal: SyncRecord[];
  /** Already identical on both sides; nothing to transfer. */
  unchanged: string[];
}

const EMPTY: MergePlan = { upload: [], download: [], deleteRemote: [], deleteLocal: [], unchanged: [] };

/**
 * Bounds the protocol agrees on, shared so local state can never be *stored* in a shape the
 * server would then reject on every round — a poisoned record would break sync until the user
 * cleared storage by hand.
 */
export const RECORD_LIMITS = {
  idLength: 128,
  hashLength: 64,
  /** ECMAScript's maximum date. Anything beyond it is a clock bug, not a timestamp. */
  maxTimestamp: 8.64e15,
} as const;

/** Shape check for a record. The one validator both sides use instead of two that can drift. */
export function isRecordLike(value: unknown): value is SyncRecord {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Partial<SyncRecord>;
  return (
    typeof record.id === 'string' &&
    record.id.length > 0 &&
    record.id.length <= RECORD_LIMITS.idLength &&
    typeof record.updatedAt === 'number' &&
    Number.isInteger(record.updatedAt) &&
    record.updatedAt >= 0 &&
    record.updatedAt <= RECORD_LIMITS.maxTimestamp &&
    typeof record.deleted === 'boolean' &&
    typeof record.hash === 'string' &&
    record.hash.length > 0 &&
    record.hash.length <= RECORD_LIMITS.hashLength
  );
}

/**
 * Strict total order over two records for the same document; `true` means `a` wins.
 *
 * Exported because the server applies the same rule before accepting a write. Two
 * implementations of "who wins" would be two chances to disagree, and a disagreement here is
 * a sync that never converges.
 */
export function winsOver(a: SyncRecord, b: SyncRecord): boolean {
  if (a.updatedAt !== b.updatedAt) return a.updatedAt > b.updatedAt;
  if (a.hash !== b.hash) return a.hash > b.hash;
  // Same clock, same content: only `deleted` can differ. Let the deletion win so it
  // propagates instead of being silently ignored.
  return a.deleted && !b.deleted;
}

/** True when the two records describe the same state, tombstone included. */
function sameState(a: SyncRecord, b: SyncRecord): boolean {
  return a.updatedAt === b.updatedAt && a.hash === b.hash && a.deleted === b.deleted;
}

/**
 * Decides, for every document known to either side, which side's copy should survive.
 * Pure, and both devices reach the same plan from the same two record sets, so a round
 * converges instead of ping-ponging.
 */
export function planMerge(local: SyncRecord[], remote: SyncRecord[]): MergePlan {
  const localById = new Map(local.map((record) => [record.id, record]));
  const remoteById = new Map(remote.map((record) => [record.id, record]));
  const plan: MergePlan = { ...EMPTY, upload: [], download: [], deleteRemote: [], deleteLocal: [], unchanged: [] };

  for (const id of new Set([...localById.keys(), ...remoteById.keys()])) {
    const here = localById.get(id);
    const there = remoteById.get(id);

    // Only one side knows about it. A tombstone still has to be pushed, or the document
    // it deletes would be re-created by the next pull.
    if (here && !there) {
      (here.deleted ? plan.deleteRemote : plan.upload).push(id);
      continue;
    }
    if (there && !here) {
      // A tombstone for an unknown document carries nothing to apply, so it is ignored.
      if (!there.deleted) plan.download.push(id);
      continue;
    }
    if (!here || !there) continue;

    if (sameState(here, there)) {
      plan.unchanged.push(id);
      continue;
    }

    if (!winsOver(here, there)) {
      // Remote wins.
      if (there.deleted) plan.deleteLocal.push(there);
      else plan.download.push(id);
      continue;
    }

    if (here.deleted) plan.deleteRemote.push(id);
    else plan.upload.push(id);
  }

  plan.upload.sort();
  plan.download.sort();
  plan.deleteRemote.sort();
  plan.unchanged.sort();
  plan.deleteLocal.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return plan;
}

/**
 * Stable fingerprint of a document body, 128 bits.
 *
 * Not cryptographic and never to be used for integrity or security. It must merely be wide
 * enough that two *different* bodies do not collide, because `planMerge` treats equal
 * hashes as equal content and would silently drop one of them. A 32-bit hash was not wide
 * enough: djb2 maps both 'Aa' and 'B@' to the same value.
 */
export function hashText(text: string): string {
  const seeds = [0x811c9dc5, 0x01000193, 0x9e3779b9, 0x85ebca6b];
  return seeds
    .map((seed) => {
      let hash = seed;
      for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193);
      }
      return (hash >>> 0).toString(16).padStart(8, '0');
    })
    .join('');
}

/**
 * Applies the plan's deletions to the local metadata list.
 *
 * A deleted document keeps a *tombstone* record rather than disappearing. Dropping it
 * entirely would make the document look "missing here, present there" on the next round
 * with a peer that still has the old copy — and it would be downloaded straight back.
 * Callers must also clear the stored body; the tombstone is metadata only.
 */
export function applyLocalDeletions(local: SyncRecord[], plan: MergePlan): SyncRecord[] {
  const tombstones = new Map(plan.deleteLocal.map((record) => [record.id, record]));
  const updated = local.map((record) => tombstones.get(record.id) ?? record);
  // A tombstone for a document this device had not seen yet still has to be recorded,
  // or the next pull would re-create it.
  const known = new Set(local.map((record) => record.id));
  for (const tombstone of plan.deleteLocal) if (!known.has(tombstone.id)) updated.push(tombstone);
  return updated;
}
