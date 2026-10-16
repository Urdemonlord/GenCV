import { beforeEach, describe, expect, it, vi } from 'vitest';
import { deleteDocument, listDocuments, loadDocument, saveDocument } from '@/lib/cv/storage';
import { emptyCV, type CV } from '@/lib/cv/model';
import { hashText, winsOver, type SyncRecord } from './merge';
import { readTombstones, recordDeletion, saveTombstones } from './local';
import { runSyncRound } from './client';

/**
 * Tests for one sync round.
 *
 * The server is faked here, but it applies the *same* `winsOver` rule the real one does — so
 * these tests exercise the thing that actually matters: that two devices exchanging rounds
 * converge instead of ping-ponging, and that nothing is lost along the way.
 */

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (key: string) => map.get(key) ?? null,
    key: (index: number) => [...map.keys()][index] ?? null,
    removeItem: (key: string) => void map.delete(key),
    setItem: (key: string, value: string) => void map.set(key, String(value)),
  };
}

interface Upsert extends SyncRecord {
  body: unknown | null;
}

/** A server row whose hash matches its body, the way a real device would have written it. */
const row = (id: string, updatedAt: number, body: unknown | null, deleted = false): Upsert => ({
  id,
  updatedAt,
  deleted,
  // A tombstone has no body to hash, so any stable value will do; it only breaks ties.
  hash: body === null ? 'tombstone' : hashText(JSON.stringify(body)),
  body,
});

/** A stand-in for `/api/sync`: the same protocol, backed by a Map. */
function fakeServer(initial: Upsert[] = []) {
  const rows = new Map(initial.map((r) => [r.id, r]));
  let requests = 0;

  const fetchImpl = (async (_input: string, init: RequestInit) => {
    requests += 1;
    const { upserts = [], want = [] } = JSON.parse(String(init.body ?? '{}')) as {
      upserts?: Upsert[];
      want?: string[];
    };

    for (const upsert of upserts) {
      const current = rows.get(upsert.id);
      // The real server's only rule: accept the write only if it wins the total order.
      if (current && !winsOver(upsert, current)) continue;
      rows.set(upsert.id, upsert);
    }

    const records: SyncRecord[] = [...rows.values()].map(({ id, updatedAt, deleted, hash }) => ({
      id,
      updatedAt,
      deleted,
      hash,
    }));
    const documents = want.map((id) => rows.get(id)).filter((r): r is Upsert => r !== undefined);

    return new Response(JSON.stringify({ success: true, records, documents }), { status: 200 });
  }) as unknown as typeof fetch;

  return { fetchImpl, rows, requestCount: () => requests };
}

/** A response whose shape matches `/api/sync` without touching a server. */
const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });

/** Points the module-level `localStorage` at a throwaway store, as the browser would. */
function useDevice(): Storage {
  const storage = memoryStorage();
  vi.stubGlobal('localStorage', storage);
  return storage;
}

const titled = (title: string) => ({ ...emptyCV(), title });
const bodyOf = (storage: Storage, id: string): CV | null => loadDocument(id, storage);

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe('runSyncRound', () => {
  it('uploads a document only this device has', async () => {
    const storage = useDevice();
    const id = 'cv-a';
    saveDocument(id, titled('Punya saya'), storage);
    const server = fakeServer();

    const result = await runSyncRound(server.fetchImpl);

    expect(result).toMatchObject({ ok: true, uploaded: 1, downloaded: 0 });
    expect(server.rows.get(id)).toMatchObject({ deleted: false });
    expect(server.rows.get(id)!.body).toEqual(titled('Punya saya'));
  });

  it('downloads a document only the server has, with the server\'s timestamp', async () => {
    const storage = useDevice();
    const server = fakeServer([
      row('cv-b', 1_700_000_000_000, titled('Dari server')),
    ]);

    const result = await runSyncRound(server.fetchImpl);

    expect(result).toMatchObject({ ok: true, uploaded: 0, downloaded: 1 });
    expect(bodyOf(storage, 'cv-b')).toEqual(titled('Dari server'));
    // The stored timestamp must be the server's. With the local clock it would look newer
    // than the server on the next round and be uploaded back forever.
    expect(listDocuments(storage).find((doc) => doc.id === 'cv-b')!.updatedAt).toBe(1_700_000_000_000);
  });

  it('converges: a second round transfers nothing', async () => {
    const storage = useDevice();
    saveDocument('cv-a', titled('Milik saya'), storage);
    const server = fakeServer([
      row('cv-b', 1_700_000_000_000, titled('Milik server')),
    ]);

    await runSyncRound(server.fetchImpl);
    const requestsAfterFirst = server.requestCount();
    const second = await runSyncRound(server.fetchImpl);

    expect(second).toMatchObject({ ok: true, uploaded: 0, downloaded: 0 });
    // One metadata request only: nothing to push and nothing to pull.
    expect(server.requestCount() - requestsAfterFirst).toBe(1);
  });

  it('keeps the newer local edit and does not let an older server copy win', async () => {
    const storage = useDevice();
    saveDocument('cv-a', titled('Lokal baru'), storage);
    const localUpdatedAt = listDocuments(storage)[0].updatedAt;

    // The server holds a strictly older copy of the same document.
    const server = fakeServer([
      row('cv-a', localUpdatedAt - 60_000, titled('Server lama')),
    ]);

    await runSyncRound(server.fetchImpl);

    expect(server.rows.get('cv-a')!.body).toEqual(titled('Lokal baru'));
    expect(bodyOf(storage, 'cv-a')).toEqual(titled('Lokal baru'));
  });

  it('adopts a newer server edit and overwrites the local copy', async () => {
    const storage = useDevice();
    saveDocument('cv-a', titled('Lokal lama'), storage);
    const localUpdatedAt = listDocuments(storage)[0].updatedAt;

    const server = fakeServer([
      row('cv-a', localUpdatedAt + 60_000, titled('Server baru')),
    ]);

    await runSyncRound(server.fetchImpl);

    expect(bodyOf(storage, 'cv-a')).toEqual(titled('Server baru'));
    expect(server.rows.get('cv-a')!.body).toEqual(titled('Server baru'));
  });

  it('propagates a deletion: the tombstone travels and removes the peer copy', async () => {
    const storage = useDevice();
    // A deleted CV: the body is gone, the record is remembered.
    const record: SyncRecord = { id: 'cv-gone', updatedAt: 5_000, deleted: false, hash: 'h' };
    saveTombstones([], storage);
    recordDeletion(record, storage);

    // The server still has the live copy from an earlier round.
    const server = fakeServer([row(record.id, record.updatedAt, titled('Masih ada'))]);

    const result = await runSyncRound(server.fetchImpl);

    expect(result).toMatchObject({ ok: true, deleted: 1 });
    // The server now holds a tombstone with no body, and the deletion survives to the peer.
    expect(server.rows.get('cv-gone')).toMatchObject({ deleted: true, body: null });
  });

  it('applies a remote deletion locally and forgets the body', async () => {
    const storage = useDevice();
    saveDocument('cv-a', titled('Akan dihapus'), storage);
    const localUpdatedAt = listDocuments(storage)[0].updatedAt;

    const server = fakeServer([
      row('cv-a', localUpdatedAt + 1, null, true),
    ]);

    await runSyncRound(server.fetchImpl);

    // Gone from this device, and remembered as a tombstone so it is not pulled back.
    expect(loadDocument('cv-a', storage)).toBeNull();
    expect(readTombstones(storage)).toEqual([
      { id: 'cv-a', updatedAt: localUpdatedAt + 1, deleted: true, hash: 'tombstone' },
    ]);
  });

  it('does not resurrect a document the server already deleted', async () => {
    const storage = useDevice();
    const server = fakeServer([row('cv-a', 9_000, null, true)]);

    await runSyncRound(server.fetchImpl);
    const again = await runSyncRound(server.fetchImpl);

    // A tombstone for a document this device never had carries nothing to apply; it must not
    // be treated as a download, and the second round must stay empty.
    expect(again).toMatchObject({ ok: true, uploaded: 0, downloaded: 0 });
    expect(listDocuments(storage)).toEqual([]);
  });

  it('reports an unauthenticated session instead of pretending to sync', async () => {
    useDevice();
    const fetchImpl = (async () => new Response('{}', { status: 401 })) as unknown as typeof fetch;

    expect(await runSyncRound(fetchImpl)).toMatchObject({ ok: false, reason: 'unauthenticated' });
  });

  it('reports being offline when the request cannot be made', async () => {
    useDevice();
    const fetchImpl = (async () => {
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;

    expect(await runSyncRound(fetchImpl)).toMatchObject({ ok: false, reason: 'offline' });
  });

  it('reports a server error with its message', async () => {
    useDevice();
    const fetchImpl = (async () =>
      new Response(JSON.stringify({ success: false, error: 'Isi CV terlalu besar.' }), {
        status: 413,
      })) as unknown as typeof fetch;

    const result = await runSyncRound(fetchImpl);
    expect(result).toMatchObject({ ok: false, reason: 'error', message: 'Isi CV terlalu besar.' });
  });

  it('does not lose local work when the second phase fails', async () => {
    // Phase 1 succeeds and reveals something to push; phase 2 dies. The local document must
    // still be there — a failed sync never deletes local data.
    const storage = useDevice();
    saveDocument('cv-a', titled('Kerja saya'), storage);

    let calls = 0;
    const fetchImpl = (async (_input: string, init: RequestInit) => {
      calls += 1;
      if (calls === 1) return new Response(JSON.stringify({ success: true, records: [] }), { status: 200 });
      throw new TypeError('fetch failed');
    }) as unknown as typeof fetch;

    const result = await runSyncRound(fetchImpl);

    expect(result).toMatchObject({ ok: false, reason: 'offline' });
    expect(bodyOf(storage, 'cv-a')).toEqual(titled('Kerja saya'));
  });

  it('never drops a local document that the plan did not mark for deletion', async () => {
    const storage = useDevice();
    saveDocument('keep', titled('Tetap ada'), storage);
    saveDocument('also-keep', titled('Ini juga'), storage);
    const server = fakeServer();

    await runSyncRound(server.fetchImpl);

    expect(listDocuments(storage).map((doc) => doc.id).sort()).toEqual(['also-keep', 'keep']);
  });

  it('forgets a tombstone once the same document exists locally again', async () => {
    const storage = useDevice();
    saveTombstones([{ id: 'cv-a', updatedAt: 1, deleted: true, hash: 'h' }], storage);
    // Restored from a JSON import: the live copy is the truth now.
    saveDocument('cv-a', titled('Kembali'), storage);
    const server = fakeServer();

    await runSyncRound(server.fetchImpl);

    expect(readTombstones(storage)).toEqual([]);
    // And the live copy reached the server rather than the stale deletion.
    expect(server.rows.get('cv-a')).toMatchObject({ deleted: false });
  });

  it('does not delete a local document merely because a deletion exists for another id', async () => {
    const storage = useDevice();
    saveDocument('cv-keep', titled('Jangan dihapus'), storage);
    const server = fakeServer([row('cv-other', 5, null, true)]);

    await runSyncRound(server.fetchImpl);

    expect(loadDocument('cv-keep', storage)).toEqual(titled('Jangan dihapus'));
  });

  it('two devices converge on the same state after exchanging rounds', async () => {
    // The property that matters: no matter who starts, both end up identical. A rule that is
    // not a total order passes single-device tests and fails exactly here.
    const storageA = memoryStorage();
    vi.stubGlobal('localStorage', storageA);
    saveDocument('shared', titled('Dari A'), storageA);
    const idA = listDocuments(storageA)[0].updatedAt;

    const storageB = memoryStorage();
    const server = fakeServer();

    // A pushes.
    await runSyncRound(server.fetchImpl);

    // B pulls the document, edits it, and pushes the edit.
    vi.stubGlobal('localStorage', storageB);
    await runSyncRound(server.fetchImpl);
    expect(bodyOf(storageB, 'shared')).toEqual(titled('Dari A'));
    // Stored explicitly newer: `saveDocument` would stamp `Date.now()`, which is not
    // guaranteed to exceed `idA` if the two devices run in the same millisecond.
    saveDocument('shared', titled('Dari B lebih baru'), storageB, idA + 1000);
    await runSyncRound(server.fetchImpl);

    // A pulls B's newer edit.
    vi.stubGlobal('localStorage', storageA);
    await runSyncRound(server.fetchImpl);
    expect(bodyOf(storageA, 'shared')).toEqual(titled('Dari B lebih baru'));

    // And now both sides agree, with no further transfer.
    vi.stubGlobal('localStorage', storageB);
    const settleB = await runSyncRound(server.fetchImpl);
    vi.stubGlobal('localStorage', storageA);
    const settleA = await runSyncRound(server.fetchImpl);

    expect(settleA).toMatchObject({ uploaded: 0, downloaded: 0 });
    expect(settleB).toMatchObject({ uploaded: 0, downloaded: 0 });
    expect(bodyOf(storageA, 'shared')).toEqual(bodyOf(storageB, 'shared'));
  });
});

describe('deleting a document locally', () => {
  it('keeps a tombstone, so the deletion is not re-downloaded', () => {
    // The rule the UI must follow: record the deletion *before* removing the body, because
    // afterwards the record can no longer be derived.
    const storage = useDevice();
    saveDocument('cv-a', titled('Akan dihapus'), storage);
    const record: SyncRecord = {
      id: 'cv-a',
      updatedAt: listDocuments(storage)[0].updatedAt,
      deleted: false,
      hash: 'h',
    };

    recordDeletion(record, storage);
    deleteDocument('cv-a', storage);

    expect(loadDocument('cv-a', storage)).toBeNull();
    expect(readTombstones(storage)).toEqual([{ ...record, deleted: true }]);
  });
});
describe('runSyncRound robustness', () => {
  it('sends nothing when there is nothing to send or fetch', async () => {
    // Most rounds are like this. A second request here would double the cost of every idle
    // round, which is the common case today.
    useDevice();
    const server = fakeServer();
    await runSyncRound(server.fetchImpl);
    const after = server.requestCount();
    await runSyncRound(server.fetchImpl);
    expect(server.requestCount() - after).toBe(1);
  });

  it('chunks a library larger than the server cap instead of failing the round', async () => {
    // The server rejects over 200 upserts per request. A device with more CVs than that must
    // still sync, in batches, rather than failing wholesale.
    const storage = useDevice();
    for (let i = 0; i < 205; i++) saveDocument(`cv-${i}`, titled(`CV ${i}`), storage);

    const bodiesSeen: number[] = [];
    const fetchImpl = (async (_input: string, init: RequestInit) => {
      const { upserts = [] } = JSON.parse(String(init.body ?? '{}')) as { upserts?: unknown[] };
      bodiesSeen.push(upserts.length);
      return jsonResponse({ success: true, records: [], documents: [] });
    }) as unknown as typeof fetch;

    const result = await runSyncRound(fetchImpl);

    expect(result).toMatchObject({ ok: true, uploaded: 205 });
    // No request exceeds the cap; the whole library went up across batched calls.
    expect(Math.max(...bodiesSeen)).toBeLessThanOrEqual(200);
    expect(bodiesSeen.reduce((a, b) => a + b, 0)).toBe(205);
  });

  it('keeps each request under the byte budget, not just the upsert count', async () => {
    // Eight CVs at the per-body cap already exceed the server's total request limit, so a
    // count-only chunk would be refused with a 413.
    const storage = useDevice();
    const big = 'x'.repeat(400 * 1024);
    for (let i = 0; i < 8; i++) {
      saveDocument(`big-${i}`, { ...emptyCV(), title: `CV ${i}`, jobDescription: big }, storage);
    }

    const sizes: number[] = [];
    const fetchImpl = (async (_input: string, init: RequestInit) => {
      const raw = String(init.body ?? '');
      if (raw.includes('"upserts":[{"id"')) sizes.push(raw.length);
      return jsonResponse({ success: true, records: [], documents: [] });
    }) as unknown as typeof fetch;

    await runSyncRound(fetchImpl);

    expect(sizes.length).toBeGreaterThan(1);
    for (const size of sizes) expect(size).toBeLessThan(4 * 1024 * 1024);
  });

  it('measures the byte budget in UTF-8, not UTF-16 code units', async () => {
    // A string's `.length` counts UTF-16 code units while the server measures UTF-8 bytes. Text
    // that is mostly CJK takes up to three bytes per code unit, so a batch counted as 1.4 MiB
    // can arrive as ~4.3 MiB and be refused with a 413 on every retry.
    //
    // Each body stays well inside the server's per-body cap; it is the total that overflows.
    const storage = useDevice();
    const cjk = '漢'.repeat(60_000); // ~180 KB as UTF-8, ~60 K code units
    for (let i = 0; i < 24; i++) {
      saveDocument(`cjk-${i}`, { ...emptyCV(), title: `CV ${i}`, jobDescription: cjk }, storage);
    }

    const utf8Sizes: number[] = [];
    const fetchImpl = (async (_input: string, init: RequestInit) => {
      const raw = String(init.body ?? '');
      if (raw.includes('"upserts":[{"id"')) utf8Sizes.push(Buffer.byteLength(raw, 'utf8'));
      return jsonResponse({ success: true, records: [], documents: [] });
    }) as unknown as typeof fetch;

    await runSyncRound(fetchImpl);

    // The mis-counted version would have sent all 24 as one ~4.3 MB request.
    expect(utf8Sizes.length).toBeGreaterThan(1);
    for (const size of utf8Sizes) expect(size).toBeLessThanOrEqual(3 * 1024 * 1024);
  });

  it('ignores a body the server should never have sent', async () => {
    // The body goes straight into storage, so a non-object would break the editor on load.
    const storage = useDevice();
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({
          success: true,
          records: [{ id: 'cv-bad', updatedAt: 1_000, deleted: false, hash: 'h' }],
          documents: [],
        });
      }
      return jsonResponse({
        success: true,
        records: [],
        documents: [{ id: 'cv-bad', updatedAt: 1_000, deleted: false, hash: 'h', body: 'not a CV' }],
      });
    }) as unknown as typeof fetch;

    const result = await runSyncRound(fetchImpl);

    expect(result).toMatchObject({ ok: true, downloaded: 0 });
    expect(loadDocument('cv-bad', storage)).toBeNull();
  });

  it('accepts an empty CV, which is a real CV a user just created', async () => {
    // `isCvLike` (the JSON-import validator) demands a filled personal field and would reject
    // this, silently losing the download.
    const storage = useDevice();
    const fresh = emptyCV();
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({ success: true, records: [{ id: 'cv-new', updatedAt: 5_000, deleted: false, hash: 'h' }] });
      }
      return jsonResponse({
        success: true,
        records: [],
        documents: [{ id: 'cv-new', updatedAt: 5_000, deleted: false, hash: 'h', body: fresh }],
      });
    }) as unknown as typeof fetch;

    const result = await runSyncRound(fetchImpl);

    expect(result).toMatchObject({ ok: true, downloaded: 1 });
    expect(loadDocument('cv-new', storage)).toEqual(fresh);
  });

  it('stops instead of guessing when the local deletions are unreadable', async () => {
    // Syncing with an unknown local picture could pull back a document the user deleted, so
    // the round refuses to run rather than pretending to succeed.
    const storage = useDevice();
    saveDocument('cv-a', titled('Punya saya'), storage);
    storage.setItem('gencv:sync-tombstones', '{not json');
    const server = fakeServer();

    const result = await runSyncRound(server.fetchImpl);

    expect(result).toMatchObject({ ok: false, reason: 'local-data-unreadable' });
    // Nothing was pushed: the server never heard about this round.
    expect(server.rows.size).toBe(0);
  });

  it('reports `unauthenticated` when the session expires during phase 2', async () => {
    // Phase 2 failing with 401 means the caller should prompt for sign-in, not show a generic
    // error — the two need different messages.
    const storage = useDevice();
    saveDocument('cv-a', titled('Perlu dikirim'), storage);

    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      if (calls === 1) return jsonResponse({ success: true, records: [] });
      return new Response('{}', { status: 401 });
    }) as unknown as typeof fetch;

    expect(await runSyncRound(fetchImpl)).toMatchObject({ ok: false, reason: 'unauthenticated' });
  });

  it('fetches the body when a concurrent write made the server reject our push', async () => {
    // Our upload loses to a newer write that arrived in between. Reporting success while this
    // device is still behind would leave the two sides disagreeing indefinitely.
    const storage = useDevice();
    const id = 'cv-a';
    saveDocument(id, titled('Versi saya'), storage, 1_000);

    const newer = titled('Versi perangkat lain');
    let calls = 0;
    const fetchImpl = (async (_input: string, init: RequestInit) => {
      calls += 1;
      const payload = JSON.parse(String(init.body ?? '{}')) as { upserts?: unknown[]; want?: string[] };
      if (calls === 1) {
        // Phase 1: the server already holds a newer copy.
        return jsonResponse({ success: true, records: [{ id, updatedAt: 9_000, deleted: false, hash: 'z' }] });
      }
      if ((payload.want ?? []).includes(id)) {
        return jsonResponse({
          success: true,
          records: [],
          documents: [{ id, updatedAt: 9_000, deleted: false, hash: 'z', body: newer }],
        });
      }
      // The push is refused, but the winning record comes back in the response.
      return jsonResponse({ success: true, records: [{ id, updatedAt: 9_000, deleted: false, hash: 'z' }] });
    }) as unknown as typeof fetch;

    await runSyncRound(fetchImpl);

    expect(bodyOf(storage, id)).toEqual(newer);
  });

  it('never runs two rounds at once', async () => {
    // Overlapping rounds read the same local state and then act on a world the other one has
    // already changed. They are serialised rather than made interleaving-safe.
    useDevice();
    let concurrent = 0;
    let maxConcurrent = 0;
    const fetchImpl = (async () => {
      concurrent += 1;
      maxConcurrent = Math.max(maxConcurrent, concurrent);
      await new Promise((resolve) => setTimeout(resolve, 20));
      concurrent -= 1;
      return jsonResponse({ success: true, records: [] });
    }) as unknown as typeof fetch;

    const [a, b] = await Promise.all([runSyncRound(fetchImpl), runSyncRound(fetchImpl)]);

    expect(maxConcurrent).toBe(1);
    expect(a).toMatchObject({ ok: true });
    expect(b).toMatchObject({ ok: true });
  });
});

describe('late winners', () => {
  it('fetches the winning body in the same round, not some later one', async () => {
    // The winner appears only when our push is *refused* — a concurrent write, not something
    // phase 1 could have known about. Reporting success without fetching it would leave this
    // device behind until the next round, and forever if the user never syncs again.
    const storage = useDevice();
    const id = 'cv-a';
    saveDocument(id, titled('Versi saya'), storage, 1_000);

    const winner = titled('Versi perangkat lain');
    const winningRecord = { id, updatedAt: 1_000, deleted: false, hash: 'zzzz' };
    const requests: { upserts?: unknown[]; want?: string[] }[] = [];
    let sawPush = false;

    const fetchImpl = (async (_input: string, init: RequestInit) => {
      const payload = JSON.parse(String(init.body ?? '{}')) as { upserts?: unknown[]; want?: string[] };
      requests.push(payload);

      if ((payload.upserts ?? []).length > 0) {
        sawPush = true;
        // The upload is refused, and the winner comes back in the same response.
        return jsonResponse({ success: true, records: [winningRecord] });
      }
      if ((payload.want ?? []).includes(id)) {
        return jsonResponse({ success: true, records: [], documents: [{ ...winningRecord, body: winner }] });
      }
      // Phase 1: the server looks identical, so nothing is scheduled up front.
      return jsonResponse({ success: true, records: [] });
    }) as unknown as typeof fetch;

    await runSyncRound(fetchImpl);

    // The upload really was rejected, and a follow-up request fetched the winner.
    expect(sawPush).toBe(true);
    expect(requests.some((r) => (r.want ?? []).includes(id))).toBe(true);
    expect(bodyOf(storage, id)).toEqual(winner);
  });

  it('applies a deletion that arrives as the winner of a concurrent write', async () => {
    // A tombstone has no body to fetch, so queueing it cannot work. Without applying it on the
    // spot, this device keeps a live copy the server has deleted and uploads it back.
    const storage = useDevice();
    const id = 'cv-a';
    saveDocument(id, titled('Sudah dihapus di tempat lain'), storage, 1_000);

    const fetchImpl = (async (_input: string, init: RequestInit) => {
      const payload = JSON.parse(String(init.body ?? '{}')) as { upserts?: unknown[] };
      if ((payload.upserts ?? []).length > 0) {
        return jsonResponse({ success: true, records: [{ id, updatedAt: 2_000, deleted: true, hash: 'z' }] });
      }
      return jsonResponse({ success: true, records: [] });
    }) as unknown as typeof fetch;

    await runSyncRound(fetchImpl);

    expect(loadDocument(id, storage)).toBeNull();
    expect(readTombstones(storage).map((record) => record.id)).toContain(id);
  });

  it('does not count a winning deletion as a download', async () => {
    // A tombstone carries no body, so it must not be saved or counted.
    const storage = useDevice();
    const id = 'cv-a';
    saveDocument(id, titled('Akan hilang'), storage, 1_000);

    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      if (calls === 1) {
        return jsonResponse({ success: true, records: [{ id, updatedAt: 1_000, deleted: false, hash: 'z' }] });
      }
      return jsonResponse({ success: true, records: [{ id, updatedAt: 2_000, deleted: true, hash: 'z' }] });
    }) as unknown as typeof fetch;

    const result = await runSyncRound(fetchImpl);

    expect(result).toMatchObject({ ok: true, downloaded: 0 });
  });
});
