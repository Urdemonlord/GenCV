import { beforeEach, describe, expect, it } from 'vitest';
import { normalizeCV } from './normalize';
import { createDocument, deleteDocument, duplicateDocument, listDocuments, loadDocument, saveDocument } from './storage';

class MemoryStorage implements Storage {
  private data = new Map<string, string>();
  get length() {
    return this.data.size;
  }
  clear() {
    this.data.clear();
  }
  getItem(key: string) {
    return this.data.has(key) ? this.data.get(key)! : null;
  }
  key(index: number) {
    return [...this.data.keys()][index] ?? null;
  }
  removeItem(key: string) {
    this.data.delete(key);
  }
  setItem(key: string, value: string) {
    this.data.set(key, String(value));
  }
}

let storage: MemoryStorage;
beforeEach(() => {
  storage = new MemoryStorage();
});

describe('CV document storage', () => {
  it('migrates the single legacy draft once and removes the old keys', () => {
    storage.setItem('cv-data', JSON.stringify({ personalInfo: { fullName: 'Rina' }, experience: [{ position: 'Dev', description: '- A\n- B' }] }));
    storage.setItem('cv-data-saved-at', '1000');

    const docs = listDocuments(storage);
    expect(docs).toHaveLength(1);
    expect(docs[0]).toMatchObject({ name: 'Rina', updatedAt: 1000 });
    expect(loadDocument(docs[0].id, storage)?.experience[0].bullets).toEqual(['A', 'B']);
    expect(storage.getItem('cv-data')).toBeNull();
    expect(listDocuments(storage)).toHaveLength(1);
  });

  it('starts empty without a legacy draft', () => {
    expect(listDocuments(storage)).toEqual([]);
  });

  it('creates, saves, duplicates and deletes documents', () => {
    const id = createDocument(normalizeCV({ title: 'CV Data', personalInfo: { fullName: 'Rina' }, jobDescription: 'Python' }), storage);
    saveDocument(id, normalizeCV({ ...loadDocument(id, storage), personalInfo: { fullName: 'Rina A' } }), storage);
    expect(listDocuments(storage)[0]).toMatchObject({ id, name: 'Rina A' });

    const copyId = duplicateDocument(id, storage)!;
    const copy = loadDocument(copyId, storage)!;
    expect(copy.title).toBe('CV Data (salinan)');
    expect(copy.jobDescription).toBe('');
    expect(listDocuments(storage).map((d) => d.id)).toEqual([copyId, id]);

    deleteDocument(id, storage);
    expect(listDocuments(storage).map((d) => d.id)).toEqual([copyId]);
    expect(loadDocument(id, storage)).toBeNull();
  });
});
