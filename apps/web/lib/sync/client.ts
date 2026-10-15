'use client';

import { deleteDocument, loadDocument, saveDocument } from '@/lib/cv/storage';
import { normalizeCV } from '@/lib/cv/normalize';
import { planMerge, winsOver, type SyncRecord } from './merge';
import { pruneTombstones, readLocalRecords, saveTombstones, TombstonesUnreadableError } from './local';

/**
 * One sync round, driven from the device.
 *
 * The device decides what to send — it is the only side that knows what is stored locally —
 * and the server only accepts or refuses each write. Splitting it that way keeps a single
 * implementation of the conflict rule instead of two that can drift apart.
 *
 * Two phases so a round with nothing new transfers no bodies:
 *   1. metadata only: send nothing, receive theirs, run `planMerge`;
 *   2. transfer: push the winners we hold, pull the bodies we are missing.
 */

interface ServerResponse {
  success?: boolean;
  error?: string;
  records?: SyncRecord[];
  documents?: (SyncRecord & { body: unknown | null })[];
}

export type SyncResult =
  | { ok: true; uploaded: number; downloaded: number; deleted: number }
  | {
      ok: false;
      reason: 'offline' | 'unauthenticated' | 'error' | 'local-data-unreadable';
      message: string;
    };

/** Server caps, mirrored so a large library is chunked instead of rejected outright. */
const MAX_UPSERTS_PER_REQUEST = 200;
const MAX_WANT_PER_REQUEST = 500;

/** Metadata-only view of a record; the body is read separately, and only when it must move. */
const toUpsert = ({ id, updatedAt, deleted, hash }: SyncRecord) => ({ id, updatedAt, deleted, hash });

/** Splits a list into chunks of at most `size`, so no request exceeds the server cap. */
function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/**
 * Whether a body from the server can be handed to `normalizeCV`.
 *
 * Deliberately *not* `isCvLike`: that validator (used for JSON import) demands a filled-in
 * personal field, so it would reject a CV the user had only just created — and the download
 * would silently never arrive. The shape check here is only "a plain object", which is what
 * `normalizeCV` needs; it does the actual coercion of every field.
 */
const isCvBody = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/**
 * Runs one round, never two at once.
 *
 * Concurrent rounds each read the local state, push it, then reconcile against a world the
 * other round has already changed, so the later one acts on a stale plan. Serialising them in
 * the client is cheaper and more honest than making every interleaving safe on the server.
 */
let inFlight: Promise<SyncResult> | null = null;

export function runSyncRound(fetchImpl: typeof fetch = fetch): Promise<SyncResult> {
  if (inFlight) return inFlight;
  const round = performRound(fetchImpl).finally(() => {
    inFlight = null;
  });
  inFlight = round;
  return round;
}

async function performRound(fetchImpl: typeof fetch): Promise<SyncResult> {
  let local: SyncRecord[];
  try {
    local = readLocalRecords();
  } catch (error) {
    // Unreadable deletions mean the local picture is unknown; syncing anyway could pull back a
    // document the user deleted. Stop and say so rather than guess.
    const message =
      error instanceof TombstonesUnreadableError ? error.message : 'Data sinkronisasi di perangkat ini tidak bisa dibaca.';
    return { ok: false, reason: 'local-data-unreadable', message };
  }

  const post = (payload: unknown) =>
    fetchImpl('/api/sync', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

  // Phase 1: metadata only. Nothing is sent up yet, so an idle round costs one small request.
  let first: Response;
  try {
    first = await post({});
  } catch {
    return { ok: false, reason: 'offline', message: 'Tidak ada koneksi ke server sinkronisasi.' };
  }
  if (first.status === 401) {
    return { ok: false, reason: 'unauthenticated', message: 'Sesi masuk sudah berakhir.' };
  }

  const firstBody = (await first.json().catch(() => ({}))) as ServerResponse;
  if (!first.ok || !firstBody.success) {
    return { ok: false, reason: 'error', message: firstBody.error ?? 'Sinkronisasi gagal.' };
  }

  const plan = planMerge(local, firstBody.records ?? []);

  // Tombstones the server holds are recorded locally with the *remote* metadata: keeping only
  // the local timestamp would let a stale peer's live copy win the next round and resurrect
  // the document.
  saveTombstones(plan.deleteLocal);
  for (const record of plan.deleteLocal) deleteDocument(record.id);

  // Phase 2: push the winners this device holds, then pull what it is behind on.
  const byId = new Map(local.map((record) => [record.id, record]));
  const toPush = [...new Set([...plan.upload, ...plan.deleteRemote])]
    .map((id) => byId.get(id))
    .filter((record): record is SyncRecord => record !== undefined)
    .map((record) => ({
      ...toUpsert(record),
      // A tombstone has no body left to read; the record alone carries the deletion.
      body: record.deleted ? null : (loadDocument(record.id) ?? null),
    }));

  let uploaded = 0;
  const received: NonNullable<ServerResponse['documents']> = [];
  /** Ids discovered mid-round that this device turned out to be behind on. */
  const extraWanted = new Set<string>();

  // One request per chunk of upserts. Chunking means a library larger than the server's
  // per-request cap still syncs, a few documents at a time, instead of failing the whole round.
  const pushChunks = chunk(toPush, MAX_UPSERTS_PER_REQUEST);
  const wantQueue = [...plan.download];

  // Nothing to push and nothing to pull: phase 1 already answered the whole question, so an
  // idle round stays at one request. Sending an empty phase-2 request anyway would double the
  // cost of every no-op round — which is most of them.
  if (toPush.length === 0 && wantQueue.length === 0) {
    pruneAgainstLocalState();
    return { ok: true, uploaded: 0, downloaded: 0, deleted: 0 };
  }

  const rounds = Math.max(pushChunks.length, 1);

  for (let index = 0; index < rounds; index++) {
    const upserts = pushChunks[index] ?? [];
    // Bodies are asked for on the last chunk, once every push has been accepted: a body the
    // server just took from us does not need to come back down.
    const isLast = index === rounds - 1;
    const want = isLast ? [...new Set([...wantQueue, ...extraWanted])] : [];

    let response: Response;
    try {
      response = await post({ upserts, want });
    } catch {
      return { ok: false, reason: 'offline', message: 'Koneksi terputus saat mengirim perubahan.' };
    }
    // The session can expire between the two phases, and that is a different situation from a
    // generic failure: the caller should prompt for sign-in again, not show an error.
    if (response.status === 401) {
      return { ok: false, reason: 'unauthenticated', message: 'Sesi masuk sudah berakhir.' };
    }

    const body = (await response.json().catch(() => ({}))) as ServerResponse;
    if (!response.ok || !body.success) {
      return { ok: false, reason: 'error', message: body.error ?? 'Sinkronisasi gagal saat mengirim perubahan.' };
    }

    uploaded += upserts.length;
    received.push(...(body.documents ?? []));

    // A concurrent write on another device can have made the server reject one of our pushes.
    // The response carries the winner, so this round is not finished for that document: it goes
    // into `extraWanted` and the loop below drains it. Leaving it to the *next* round would
    // report success while this device is still behind.
    //
    // The comparison is `winsOver`, not a timestamp check: a winner can win on the hash
    // tie-break at the same timestamp, and a timestamp-only test would miss it.
    const have = new Set(received.map((doc) => doc.id));
    for (const record of body.records ?? []) {
      const ours = byId.get(record.id) ?? { id: record.id, updatedAt: 0, deleted: false, hash: '' };
      if (winsOver(record, ours) && !record.deleted && !have.has(record.id)) extraWanted.add(record.id);
    }
  }

  // Drain the ids discovered during the pushes. Bounded by the server's per-request cap, and
  // the loop is bounded too: `extraWanted` only ever receives ids from the records the server
  // just reported, and a fetched body stops it being asked for again.
  const MAX_FOLLOW_UP_ROUNDS = 10;
  for (let attempt = 0; attempt < MAX_FOLLOW_UP_ROUNDS && extraWanted.size > 0; attempt++) {
    const batch = [...extraWanted].slice(0, MAX_WANT_PER_REQUEST);
    batch.forEach((id) => extraWanted.delete(id));

    let response: Response;
    try {
      response = await post({ want: batch });
    } catch {
      return { ok: false, reason: 'offline', message: 'Koneksi terputus saat mengambil perubahan terbaru.' };
    }
    if (response.status === 401) {
      return { ok: false, reason: 'unauthenticated', message: 'Sesi masuk sudah berakhir.' };
    }

    const body = (await response.json().catch(() => ({}))) as ServerResponse;
    if (!response.ok || !body.success) {
      return { ok: false, reason: 'error', message: body.error ?? 'Sinkronisasi gagal saat mengambil perubahan terbaru.' };
    }
    received.push(...(body.documents ?? []));
  }

  let downloaded = 0;
  for (const incoming of received) {
    // A tombstone carries no body, and its local copy is already gone (handled above).
    if (incoming.deleted || incoming.body === null || incoming.body === undefined) continue;
    // The server is not trusted to send a well-formed CV: `saveDocument` writes it straight to
    // storage, where a malformed body would break the editor when it loads.
    if (!isCvBody(incoming.body)) continue;
    // Stored with the *server's* timestamp: stamping a downloaded document with the local
    // clock would make it look newer than the server next round, so it would be uploaded back
    // every time and the two sides would never converge.
    saveDocument(incoming.id, normalizeCV(incoming.body), localStorage, incoming.updatedAt);
    downloaded += 1;
  }

  // A document that exists again must stop being reported as deleted. The ids are read *after*
  // the round, not from the snapshot taken at the start: that snapshot still lists the
  // documents this round just deleted, so pruning against it would throw away the tombstones
  // the round had only moments ago recorded.
  pruneAgainstLocalState();

  return { ok: true, uploaded, downloaded, deleted: plan.deleteRemote.length };
}

/** Forgets tombstones for documents that exist locally right now. */
function pruneAgainstLocalState(): void {
  pruneTombstones(
    readLocalRecords()
      .filter((record) => !record.deleted)
      .map((record) => record.id),
  );
}
