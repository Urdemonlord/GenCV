import { normalizeCV } from './normalize';
import { emptyCV, newId, type CV } from './schema';
import type { TemplateId } from './templates';

/**
 * Several CVs per device (typically one per job application), kept in localStorage:
 * an index of summaries plus one entry per document.
 */

export interface CvSummary {
  id: string;
  title: string;
  name: string;
  headline: string;
  template: TemplateId;
  hasJobDescription: boolean;
  updatedAt: number;
}

const INDEX_KEY = 'gencv:documents';
const docKey = (id: string) => `gencv:doc:${id}`;
const LEGACY_DATA_KEY = 'cv-data';
const LEGACY_SAVED_AT_KEY = 'cv-data-saved-at';

function summarize(id: string, cv: CV, updatedAt: number): CvSummary {
  return {
    id,
    title: cv.title.trim(),
    name: cv.personalInfo.fullName.trim(),
    headline: cv.personalInfo.headline.trim(),
    template: cv.settings.template,
    hasJobDescription: cv.jobDescription.trim() !== '',
    updatedAt,
  };
}

function readIndex(storage: Storage): CvSummary[] | null {
  const raw = storage.getItem(INDEX_KEY);
  if (raw === null) return null;
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIndex(storage: Storage, index: CvSummary[]) {
  storage.setItem(INDEX_KEY, JSON.stringify(index));
}

/** Moves the single pre-dashboard draft into the document store, once. */
function migrateLegacy(storage: Storage): CvSummary[] {
  const index: CvSummary[] = [];
  const legacy = storage.getItem(LEGACY_DATA_KEY);
  if (legacy) {
    try {
      const cv = normalizeCV(JSON.parse(legacy));
      const id = newId('cv');
      const updatedAt = Number(storage.getItem(LEGACY_SAVED_AT_KEY)) || Date.now();
      storage.setItem(docKey(id), JSON.stringify(cv));
      index.push(summarize(id, cv, updatedAt));
    } catch {
      // Unreadable legacy draft: leave it in place rather than lose it.
      return index;
    }
  }
  writeIndex(storage, index);
  // Only drop the old keys once the copy and the index are written.
  storage.removeItem(LEGACY_DATA_KEY);
  storage.removeItem(LEGACY_SAVED_AT_KEY);
  return index;
}

export function listDocuments(storage: Storage = localStorage): CvSummary[] {
  const index = readIndex(storage) ?? migrateLegacy(storage);
  return [...index].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function loadDocument(id: string, storage: Storage = localStorage): CV | null {
  const raw = storage.getItem(docKey(id));
  if (raw === null) return null;
  try {
    return normalizeCV(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveDocument(id: string, cv: CV, storage: Storage = localStorage): number {
  const updatedAt = Date.now();
  storage.setItem(docKey(id), JSON.stringify(cv));
  const index = listDocuments(storage).filter((doc) => doc.id !== id);
  writeIndex(storage, [summarize(id, cv, updatedAt), ...index]);
  return updatedAt;
}

export function createDocument(cv: CV = emptyCV(), storage: Storage = localStorage): string {
  const id = newId('cv');
  saveDocument(id, cv, storage);
  return id;
}

/** A copy to tailor for another job: same content, without the previous job ad. */
export function duplicateDocument(id: string, storage: Storage = localStorage): string | null {
  const cv = loadDocument(id, storage);
  if (!cv) return null;
  const title = cv.title.trim() || cv.personalInfo.headline.trim() || 'CV';
  return createDocument({ ...cv, title: `${title} (salinan)`, jobDescription: '' }, storage);
}

export function deleteDocument(id: string, storage: Storage = localStorage) {
  storage.removeItem(docKey(id));
  writeIndex(storage, listDocuments(storage).filter((doc) => doc.id !== id));
}
