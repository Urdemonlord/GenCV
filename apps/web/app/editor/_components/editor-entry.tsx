'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { emptyCV } from '@/lib/cv/model';
import { createDocument, listDocuments } from '@/lib/cv/storage';
import { toTemplateId } from '@/lib/cv/templates';
import { authClient } from '@/lib/sync/auth-client';
import { runSyncRound } from '@/lib/sync/client';
import { EditorSkeleton } from './editor-skeleton';

/**
 * `/editor` without an id: open the most recent CV, or start a new one (also when asked to,
 * e.g. from the template gallery).
 *
 * Membuat CV baru wajib login (kalau login tersedia): tanpa akun, CV hanya hidup di
 * perangkat ini. Membuka CV yang sudah ada di perangkat ini tetap bebas login — mengunci
 * data lokal user di balik login akan membuatnya kehilangan akses ke CV-nya sendiri.
 */
export function EditorEntry({
  createNew,
  template,
  syncConfigured,
}: {
  createNew: boolean;
  template?: string;
  syncConfigured: boolean;
}) {
  const router = useRouter();
  const done = useRef(false);
  const { data: session, isPending: sessionPending, error: sessionError } = authClient.useSession();

  useEffect(() => {
    // Strict mode runs effects twice in development; create at most one CV.
    if (done.current) return;
    const docs = listDocuments();
    const wouldCreate = createNew || docs.length === 0;
    if (syncConfigured && wouldCreate && sessionPending) return;
    // Gagal total memeriksa sesi bukan bukti belum masuk: lanjut lokal saja,
    // sinkronisasi bisa susulan dari panel dashboard.
    if (syncConfigured && wouldCreate && !sessionError && !session) {
      done.current = true;
      const back = createNew ? '/editor?new=1' : '/editor';
      router.replace(`/masuk?callbackURL=${encodeURIComponent(back)}`);
      return;
    }
    done.current = true;
    void (async () => {
      let id = createNew ? undefined : docs[0]?.id;
      if (!id) {
        const cv = emptyCV();
        if (template) cv.settings.template = toTemplateId(template);
        id = createDocument(cv);
        // Langsung sinkronkan ke akun; gagal sinkron tidak membatalkan pembuatan.
        if (syncConfigured && session) {
          try {
            await runSyncRound();
          } catch {
            // Best-effort, panel dashboard bisa mencoba lagi.
          }
        }
      }
      router.replace(`/editor?id=${encodeURIComponent(id)}`);
    })();
  }, [createNew, router, template, syncConfigured, session, sessionPending, sessionError]);

  return <EditorSkeleton />;
}
