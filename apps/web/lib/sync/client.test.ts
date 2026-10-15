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