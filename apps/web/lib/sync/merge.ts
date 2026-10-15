/**
 * Offline-first sync planning. Pure functions only: no network, no database, no clock.
 *
 * The device stays the source of truth. A sync round sends only *metadata* first
 * (`SyncRecord`), decides who wins per document, and then transfers just the bodies that
 * changed. That keeps a round cheap on a phone connection and makes the decision testable
 * without a server.
 *
 * Conflict rule: last write wins, using `updatedAt` (ms epoch) as the clock. Ties are
 * broken by `hash`, so two edits landing in the same millisecond still converge.
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
  /** Content fingerprint, used only to break exact timestamp ties. Not a security hash. */
  hash: string;
}

export interface MergePlan {
  /** Local copies to push (missing remotely, or newer locally). */
  upload: string[];
  /** Remote copies to pull (missing locally, or newer remotely). */
  download: string[];
  /** Local tombstones to push, so the deletion reaches the other side. */
  deleteRemote: string[];
  /** Remote tombstones to apply locally. */
  deleteLocal: string[];
  /** Already identical on both sides; nothing to transfer. */
  unchanged: string[];
}

const EMPTY: MergePlan = { upload: [], download: [], deleteRemote: [], deleteLocal: [], unchanged: [] };

/**
 * Local wins when it is strictly newer. When the clocks tie, the *larger* hash wins.
 *
 * Comparing the two hashes (instead of only noticing they differ) is what makes this a
 * total order. With a mere inequality, both devices would see their own copy as the winner
 * — each runs this with the sides swapped — so both would upload and the round would
 * ping-pong forever instead of converging.
 */
function localWins(local: SyncRecord, remote: SyncRecord): boolean {
  if (local.updatedAt !== remote.updatedAt) return local.updatedAt > remote.updatedAt;
  return local.hash > remote.hash;
}

/**
 * Decides, for every document known to either side, which side's copy should survive.
 * Pure and symmetric in the sense that both devices reach the same plan from the same
 * two record sets, so a round converges instead of ping-ponging.
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
      if (!there.deleted) plan.download.push(id);
      continue;
    }
    if (!here || !there) continue;

    // Both sides know it: compare clocks.
    if (!localWins(here, there)) {
      // Remote wins. Equal clocks AND equal hashes means nothing to do.
      if (here.updatedAt === there.updatedAt && here.hash === there.hash) plan.unchanged.push(id);
      else if (there.deleted) plan.deleteLocal.push(id);
      else plan.download.push(id);
      continue;
    }

    if (here.deleted) plan.deleteRemote.push(id);
    else plan.upload.push(id);
  }

  for (const key of ['upload', 'download', 'deleteRemote', 'deleteLocal', 'unchanged'] as const) {
    plan[key].sort();
  }
  return plan;
}

/**
 * Stable fingerprint of a document body. Not cryptographic and not meant to be: it only
 * distinguishes two edits that share a millisecond. djb2 keeps it dependency-free and
 * synchronous, so it can run while saving to localStorage.
 */
export function hashText(text: string): string {
  let hash = 5381;
  for (let i = 0; i < text.length; i++) hash = ((hash << 5) + hash + text.charCodeAt(i)) | 0;
  return (hash >>> 0).toString(36);
}

/** Applies a merge plan's deletions to a local list, returning the surviving records. */
export function applyLocalDeletions(local: SyncRecord[], plan: MergePlan): SyncRecord[] {
  const gone = new Set(plan.deleteLocal);
  return local.filter((record) => !gone.has(record.id));
}
