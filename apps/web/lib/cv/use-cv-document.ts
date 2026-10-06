'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { emptyCV, type CV } from './schema';
import { listDocuments, loadDocument, saveDocument } from './storage';

export type CvUpdate = CV | ((previous: CV) => CV);

export type CvDocumentStatus = 'loading' | 'ready' | 'missing';

/**
 * One stored CV, autosaved to this device. Nothing is written until the stored copy has been
 * read, so the empty initial state can never overwrite it, and merely opening a CV does not
 * count as an edit.
 */
export function useCvDocument(id: string) {
  const [cv, setCv] = useState<CV>(emptyCV);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [status, setStatus] = useState<CvDocumentStatus>('loading');
  const [saveError, setSaveError] = useState(false);
  const loaded = useRef<CV | null>(null);

  useEffect(() => {
    try {
      const stored = loadDocument(id);
      if (!stored) {
        setStatus('missing');
        return;
      }
      loaded.current = stored;
      setCv(stored);
      setSavedAt(listDocuments().find((doc) => doc.id === id)?.updatedAt ?? null);
      setStatus('ready');
    } catch {
      setStatus('missing');
    }
  }, [id]);

  useEffect(() => {
    if (status !== 'ready' || cv === loaded.current) return;
    const timer = setTimeout(() => {
      try {
        setSavedAt(saveDocument(id, cv));
        setSaveError(false);
      } catch {
        // Usually a full quota (e.g. a large photo); the edit stays in memory.
        setSaveError(true);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [cv, id, status]);

  /** Prefer the updater form: async callbacks would otherwise overwrite newer edits. */
  const update = useCallback((next: CvUpdate) => {
    setCv((previous) => (typeof next === 'function' ? next(previous) : next));
  }, []);

  return { cv, update, status, ready: status === 'ready', savedAt, saveError };
}
