'use client';

import { useCallback, useEffect, useState } from 'react';
import { normalizeCV } from './normalize';
import { emptyCV, type CV } from './schema';

export type CvUpdate = CV | ((previous: CV) => CV);

const DATA_KEY = 'cv-data';
const SAVED_AT_KEY = 'cv-data-saved-at';

function readDraft(): { cv: CV; savedAt: number | null } {
  try {
    const raw = localStorage.getItem(DATA_KEY);
    const savedAt = Number(localStorage.getItem(SAVED_AT_KEY)) || null;
    return { cv: raw ? normalizeCV(JSON.parse(raw)) : emptyCV(), savedAt };
  } catch {
    return { cv: emptyCV(), savedAt: null };
  }
}

/**
 * The CV being edited, autosaved to this device. `ready` is false until the stored draft
 * has been read, so the empty initial state can never overwrite it.
 */
export function useCvDocument() {
  const [cv, setCv] = useState<CV>(emptyCV);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    const draft = readDraft();
    setCv(draft.cv);
    setSavedAt(draft.savedAt);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(cv));
        const now = Date.now();
        localStorage.setItem(SAVED_AT_KEY, String(now));
        setSavedAt(now);
        setSaveError(false);
      } catch {
        // Usually a full quota (e.g. a large photo); the edit stays in memory.
        setSaveError(true);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [cv, ready]);

  /** Prefer the updater form: async callbacks would otherwise overwrite newer edits. */
  const update = useCallback((next: CvUpdate) => {
    setCv((previous) => (typeof next === 'function' ? next(previous) : next));
  }, []);

  return { cv, update, ready, savedAt, saveError };
}
