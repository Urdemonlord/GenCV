'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Download, FileJson, FileText, Loader2, Share2, Upload } from 'lucide-react';
import { Button } from '@/components/ds';
import { useToast } from '@/hooks/use-toast';
import { downloadCvDocx, downloadCvJson, downloadCvPdf, shareCvPdf } from '@/lib/cv/download';
import { isCvLike, normalizeCV } from '@/lib/cv/normalize';
import type { CV } from '@/lib/cv/schema';
import type { CvUpdate } from '@/lib/cv/use-cv-document';

interface ExportMenuProps {
  cv: CV;
  update: (next: CvUpdate) => void;
}

export function ExportMenu({ cv, update }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const template = cv.settings.template;

  useEffect(() => {
    // Sharing files is mostly a mobile capability; only offer it where it works.
    setCanShare(typeof navigator !== 'undefined' && typeof navigator.canShare === 'function' &&
      navigator.canShare({ files: [new File([''], 'cv.pdf', { type: 'application/pdf' })] }));
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);

  const run = async (key: string, action: () => Promise<void> | void) => {
    setOpen(false);
    setBusy(key);
    try {
      await action();
    } catch (error) {
      if ((error as Error)?.name === 'AbortError') return; // user closed the share sheet
      toast({ variant: 'destructive', title: 'Gagal mengekspor', description: error instanceof Error ? error.message : undefined });
    } finally {
      setBusy(null);
    }
  };

  const importFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result ?? ''));
        if (!isCvLike(parsed)) throw new Error();
        update(normalizeCV(parsed));
        toast({ title: 'CV berhasil diimpor' });
      } catch {
        toast({ variant: 'destructive', title: 'File tidak valid', description: 'Pilih file JSON hasil ekspor GenCV.' });
      }
    };
    reader.readAsText(file);
  };

  const item = 'flex w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground';

  return (
    <div ref={rootRef} className="relative flex">
      <Button variant="primary" size="sm" className="rounded-r-none" disabled={busy !== null} aria-label="Export PDF" onClick={() => run('pdf', () => downloadCvPdf(cv, template))}>
        {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Download aria-hidden="true" />}
        <span className="hidden sm:inline">Export PDF</span>
      </Button>
      <Button
        variant="primary"
        size="sm"
        className="rounded-l-none border-l border-white/20 px-2"
        aria-label="Opsi ekspor lainnya"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <ChevronDown aria-hidden="true" />
      </Button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-border bg-popover p-1 shadow-xl">
          <button role="menuitem" className={item} onClick={() => run('docx', () => downloadCvDocx(cv, template))}>
            <FileText /> Word (DOCX)
          </button>
          {canShare && (
            <button role="menuitem" className={item} onClick={() => run('share', () => shareCvPdf(cv, template))}>
              <Share2 /> Bagikan PDF
            </button>
          )}
          <div className="my-1 border-t border-border" />
          <button role="menuitem" className={item} onClick={() => run('json', () => downloadCvJson(cv))}>
            <FileJson /> Backup data (JSON)
          </button>
          <button
            role="menuitem"
            className={item}
            onClick={() => {
              setOpen(false);
              fileRef.current?.click();
            }}
          >
            <Upload /> Impor dari JSON
          </button>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".json,application/json"
        className="hidden"
        onChange={(e) => {
          importFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />
    </div>
  );
}
