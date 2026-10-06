'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { emptyCV } from '@/lib/cv/schema';
import { createDocument, listDocuments } from '@/lib/cv/storage';
import { toTemplateId } from '@/lib/cv/templates';

/**
 * `/editor` without an id: open the most recent CV, or start a new one (also when asked to,
 * e.g. from the template gallery).
 */
export function EditorEntry({ createNew, template }: { createNew: boolean; template?: string }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    // Strict mode runs effects twice in development; create at most one CV.
    if (done.current) return;
    done.current = true;
    let id = createNew ? undefined : listDocuments()[0]?.id;
    if (!id) {
      const cv = emptyCV();
      if (template) cv.settings.template = toTemplateId(template);
      id = createDocument(cv);
    }
    router.replace(`/editor?id=${encodeURIComponent(id)}`);
  }, [createNew, router, template]);

  return (
    <p className="grid h-dvh place-items-center text-sm text-muted-foreground" role="status">
      Membuka editor…
    </p>
  );
}
