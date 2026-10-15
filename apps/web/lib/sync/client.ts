'use client';

import { deleteDocument, loadDocument, saveDocument } from '@/lib/cv/storage';
import type { CV } from '@/lib/cv/model';
import { planMerge, type SyncRecord } from './merge';
import { pruneTombstones, readLocalRecords, saveTombstones } from './local';

/**
 * One sync round, driven from the device.
 *
 * The device decides what to send — it is the only side that knows what is stored locally —
 * and the server only accepts or refuses each write. Splitting it that way keeps a single
 * implementation of the conflict rule instead of two that can drift apart.
 *
 * Two phases so a round with nothing new transfers no bodies:
 *   1. metadata only: send ours, receive theirs, run `planMerge`;
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
  | { ok: false; reason: 'offline' | 'unauthenticated' | 'error'; message: string };

/** Metadata-only view of a record; the body is read separately, and only when it must move. */
const toUpsert = ({ id, updatedAt, deleted, hash }: SyncRecord) => ({ id, updatedAt, deleted, hash });

async function post(fetchImpl: typeof fetch, payload: unknown): Promise<Response> {
  return fetchImpl('/api/sync', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

/** Talks to `/api/sync`; exported so a test can drive a round without a browser. */
export async function runSyncRound(fetchImpl: typeof fetch = fetch): Promise<SyncResult> {
  const local = readLocalRecords();

  // Phase 1: metadata only. Nothing is sent up yet, so an idle round costs one small request.
  let first: Response;
  try {
    first = await post(fetchImpl, {});
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
  // the document. `applyLocalDeletions` decides which records become tombstones; here the plan
  // already names them.
  saveTombstones(plan.deleteLocal);
  for (const record of plan.deleteLocal) deleteDocument(record.id);

  // Phase 2: push the winners this device holds, then pull the bodies it is behind on.
  const byId = new Map(local.map((record) => [record.id, record]));
  const toPush = [...new Set([...plan.upload, ...plan.deleteRemote])]
    .map((id) => byId.get(id))
    .filter((record): record is SyncRecord => record !== undefined)
    .map((record) => ({
      ...toUpsert(record),
      // A tombstone has no body left to read; the record alone carries the deletion.
      body: record.deleted ? null : (loadDocument(record.id) ?? null),
    }));

  const secondBody = { documents: [] as ServerResponse['documents'] };
  if (toPush.length > 0 || plan.download.length > 0) {
    let second: Response;
    try {
      second = await post(fetchImpl, { upserts: toPush, want: plan.download });
    } catch {
      return { ok: false, reason: 'offline', message: 'Koneksi terputus saat mengirim perubahan.' };
    }
    const parsed = (await second.json().catch(() => ({}))) as ServerResponse;
    if (!second.ok || !parsed.success) {
      return { ok: false, reason: 'error', message: parsed.error ?? 'Sinkronisasi gagal saat mengirim perubahan.' };
    }
    secondBody.documents = parsed.documents;
  }

  let downloaded = 0;
  for (const incoming of secondBody.documents ?? []) {
    // A tombstone carries no body, and its local copy is already gone (handled above).
    if (incoming.deleted || incoming.body === null || incoming.body === undefined) continue;
    // Stored with the *server's* timestamp: stamping a downloaded document with the local
    // clock would make it look newer than the server next round, so it would be uploaded back
    // every time and the two sides would never converge.
    saveDocument(incoming.id, incoming.body as CV, localStorage, incoming.updatedAt);
    downloaded += 1;
  }

  // A document that exists again must stop being reported as deleted. The ids are read
  // *after* the round, not from the `local` snapshot taken at the start: that snapshot still
  // lists the documents this round just deleted, so pruning against it would throw away the
  // tombstones the round had only moments ago recorded.
  pruneTombstones(
    readLocalRecords()
      .filter((record) => !record.deleted)
      .map((record) => record.id),
  );

  return { ok: true, uploaded: toPush.length, downloaded, deleted: plan.deleteRemote.length };
}
