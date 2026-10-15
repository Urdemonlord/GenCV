import { describe, expect, it } from 'vitest';
import { createDocument, deleteDocument, listDocuments, saveDocument } from '@/lib/cv/storage';
import { emptyCV } from '@/lib/cv/model';
import { hashText } from './merge';
import { readLocalRecords, readTombstones, pruneTombstones, saveTombstones } from './local';

/** Minimal in-memory `Storage`, so these tests need no browser. */
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

const titled = (title: string) => ({ ...emptyCV(), title });

describe('readLocalRecords', () => {
  it('derives a record per stored document, with a hash of the stored body', () => {
    const storage = memoryStorage();
    const id = createDocument(titled('CV satu'), storage);

    const records = readLocalRecords(storage);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ id, deleted: false });
    // The hash must describe what is actually stored, or two devices would disagree on
    // whether the content matches.
    expect(records[0].hash).toBe(hashText(JSON.stringify({ ...emptyCV(), title: 'CV satu' })));
  });

  it('carries tombstones, so a deletion is not silently forgotten', () => {
    const storage = memoryStorage();
    saveTombstones([{ id: 'gone', updatedAt: 1234, deleted: true, hash: 'h' }], storage);

    const records = readLocalRecords(storage);
    expect(records).toEqual([{ id: 'gone', updatedAt: 1234, deleted: true, hash: 'h' }]);
  });

  it('drops a tombstone once the document exists again', () => {
    // Restoring a deleted CV from a JSON import must stop the deletion being reported, or
    // every round would ask the server to delete a document that is present.
    const storage = memoryStorage();
    saveTombstones([{ id: 'back', updatedAt: 1, deleted: true, hash: 'h' }], storage);
    saveDocument('back', titled('Kembali'), storage);

    const records = readLocalRecords(storage);
    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({ id: 'back', deleted: false });
  });

  it('ignores malformed stored tombstones instead of trusting them', () => {
    // A record with `deleted: false` would read as a live document with no body, which the
    // server would reject forever.
    const storage = memoryStorage();
    storage.setItem(
      'gencv:sync-tombstones',
      JSON.stringify([
        { id: 'ok', updatedAt: 1, deleted: true, hash: 'h' },
        { id: 'live', updatedAt: 1, deleted: false, hash: 'h' },
        { id: 'noUpdatedAt', deleted: true, hash: 'h' },
        { id: 'nan', updatedAt: 'x', deleted: true, hash: 'h' },
        null,
      ]),
    );

    expect(readTombstones(storage)).toEqual([{ id: 'ok', updatedAt: 1, deleted: true, hash: 'h' }]);
  });

  it('survives unreadable storage rather than throwing', () => {
    const storage = memoryStorage();
    storage.setItem('gencv:sync-tombstones', '{not json');
    expect(readTombstones(storage)).toEqual([]);
  });

  it('drops a document whose body is missing but whose summary remains', () => {
    // The index and the bodies are separate keys, so they can disagree. A summary with no
    // body has nothing to hash, and reporting it would push an empty CV over a real one.
    const storage = memoryStorage();
    const id = createDocument(titled('Ada di indeks'), storage);
    storage.removeItem(`gencv:doc:${id}`);

    expect(listDocuments(storage)).toHaveLength(1);
    expect(readLocalRecords(storage)).toEqual([]);
  });
});

describe('pruneTombstones', () => {
  it('forgets only the documents that are live again', () => {
    const storage = memoryStorage();
    saveTombstones(
      [
        { id: 'a', updatedAt: 1, deleted: true, hash: 'h' },
        { id: 'b', updatedAt: 1, deleted: true, hash: 'h' },
      ],
      storage,
    );
    saveDocument('a', titled('A hidup lagi'), storage);

    pruneTombstones(['a'], storage);
    expect(readTombstones(storage).map((record) => record.id)).toEqual(['b']);
  });

  it('leaves deletions alone when nothing came back', () => {
    const storage = memoryStorage();
    saveTombstones([{ id: 'a', updatedAt: 1, deleted: true, hash: 'h' }], storage);
    pruneTombstones([], storage);
    expect(readTombstones(storage)).toHaveLength(1);
  });
});

describe('saveTombstones', () => {
  it('replaces an existing tombstone for the same document instead of duplicating it', () => {
    const storage = memoryStorage();
    saveTombstones([{ id: 'a', updatedAt: 1, deleted: true, hash: 'h1' }], storage);
    saveTombstones([{ id: 'a', updatedAt: 2, deleted: true, hash: 'h2' }], storage);

    expect(readTombstones(storage)).toEqual([{ id: 'a', updatedAt: 2, deleted: true, hash: 'h2' }]);
  });

  it('forces `deleted: true` on whatever it is given', () => {
    // The caller passes the remote record; a live one would otherwise be stored as a tombstone
    // that still reads as live, which is the one shape the server must never receive.
    const storage = memoryStorage();
    saveTombstones([{ id: 'a', updatedAt: 1, deleted: false, hash: 'h' }], storage);
    expect(readTombstones(storage)[0].deleted).toBe(true);
  });
});

describe('readLocalRecords with deletions', () => {
  it('never reports the same id twice', () => {
    // A live document plus a stale tombstone for the same id would make the plan contradictory.
    const storage = memoryStorage();
    const id = createDocument(titled('Hidup'), storage);
    saveTombstones([{ id, updatedAt: 99, deleted: true, hash: 'h' }], storage);

    const ids = readLocalRecords(storage).map((record) => record.id);
    expect(ids).toEqual([id]);
    expect(readLocalRecords(storage)[0].deleted).toBe(false);
  });

  it('reports a document deleted locally, after its body is removed', () => {
    const storage = memoryStorage();
    const id = createDocument(titled('Akan dihapus'), storage);
    const record = readLocalRecords(storage)[0];

    deleteDocument(id, storage);
    saveTombstones([{ ...record, deleted: true }], storage);

    expect(readLocalRecords(storage)).toEqual([{ ...record, deleted: true }]);
  });
});
