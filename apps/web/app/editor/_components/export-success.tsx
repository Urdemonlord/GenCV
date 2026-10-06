'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, CheckCircle2, Copy, FileJson, Target, X } from 'lucide-react';
import { Button } from '@/components/ds';
import { hasPlaceholder } from '@/lib/ai/suggestions';
import { matchKeywords } from '@/lib/cv/analysis/keywords';
import { downloadCvJson } from '@/lib/cv/download';
import type { CV } from '@/lib/cv/schema';
import { duplicateDocument } from '@/lib/cv/storage';

/**
 * Shown after a successful PDF/DOCX export, in place of a "thank you" page: what to do next
 * with this CV, plus a last warning if it still contains unfilled AI placeholders.
 */
export function ExportSuccess({
  cv,
  docId,
  format,
  onOpenJobMatch,
  onClose,
}: {
  cv: CV;
  docId: string;
  format: 'PDF' | 'DOCX';
  onOpenJobMatch: () => void;
  onClose: () => void;
}) {
  const router = useRouter();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const match = cv.jobDescription.trim() ? matchKeywords(cv, cv.jobDescription) : null;
  const placeholders = [cv.professionalSummary, ...cv.experience.flatMap((e) => e.bullets), ...cv.projects.flatMap((p) => p.bullets)].filter(
    hasPlaceholder
  ).length;

  useEffect(() => headingRef.current?.focus(), []);

  const action = 'flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-primary-soft';

  return (
    <div
      role="dialog"
      aria-labelledby="export-success-title"
      className="absolute right-0 top-full z-50 mt-2 w-80 rounded-xl border border-border bg-popover p-4 shadow-xl"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      <div className="flex items-start gap-2">
        <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" aria-hidden="true" />
        <h2 id="export-success-title" ref={headingRef} tabIndex={-1} className="flex-1 font-semibold outline-none">
          {format} berhasil diunduh
        </h2>
        <button type="button" aria-label="Tutup" className="rounded p-0.5 text-muted-foreground hover:text-foreground" onClick={onClose}>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>

      {placeholders > 0 && (
        <p className="mt-3 flex gap-2 rounded-lg border border-warning/30 bg-warning/10 p-2 text-xs text-warning">
          <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
          Masih ada {placeholders} teks berisi placeholder seperti [X%]. Isi dengan angka asli atau hapus sebelum mengirim.
        </p>
      )}

      <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Langkah berikutnya</p>
      <ul className="mt-1 space-y-0.5">
        <li>
          <button
            type="button"
            className={action}
            onClick={() => {
              onOpenJobMatch();
              onClose();
            }}
          >
            <Target aria-hidden="true" />
            <span>
              {match?.score != null ? `Job Match ${match.score}%: lihat keyword yang belum ada` : 'Cek kecocokan dengan lowongan di Job Match'}
            </span>
          </button>
        </li>
        <li>
          <button type="button" className={action} onClick={() => downloadCvJson(cv)}>
            <FileJson aria-hidden="true" />
            <span>Simpan backup JSON, karena CV hanya tersimpan di browser ini</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            className={action}
            onClick={() => {
              const copyId = duplicateDocument(docId);
              if (copyId) router.push(`/editor?id=${encodeURIComponent(copyId)}`);
            }}
          >
            <Copy aria-hidden="true" />
            <span>Buat salinan untuk lowongan lain</span>
          </button>
        </li>
      </ul>
      <Button variant="ghost" size="sm" className="mt-2 w-full" onClick={onClose}>
        Selesai
      </Button>
    </div>
  );
}
