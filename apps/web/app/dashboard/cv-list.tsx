'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Copy, FilePlus2, FileText, Pencil, Trash2, Upload } from 'lucide-react';
import { Button, Chip } from '@/components/ds';
import { useToast } from '@/hooks/use-toast';
import { analyzeCv } from '@/lib/cv/analysis/analyze';
import { isCvLike, normalizeCV } from '@/lib/cv/normalize';
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  listDocuments,
  loadDocument,
  saveDocument,
  type CvSummary,
} from '@/lib/cv/storage';
import { TEMPLATE_INFO } from '@/lib/cv/templates';
import { relativeTimeLabel } from '@/lib/relative-time';

interface Item extends CvSummary {
  ats: number | null;
  jobMatch: number | null;
}

function readItems(): Item[] {
  return listDocuments().map((doc) => {
    const cv = loadDocument(doc.id);
    const analysis = cv ? analyzeCv(cv) : null;
    return { ...doc, ats: analysis?.overall ?? null, jobMatch: analysis?.keywords.score ?? null };
  });
}

const displayTitle = (item: CvSummary) => item.title || item.headline || item.name || 'CV tanpa judul';

export function CvList() {
  const router = useRouter();
  const { toast } = useToast();
  const [items, setItems] = useState<Item[] | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [renaming, setRenaming] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = useCallback(() => {
    setItems(readItems());
    setNow(Date.now());
  }, []);

  useEffect(() => {
    refresh();
    // Another tab (e.g. the editor) may change the list.
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key.startsWith('gencv:')) refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const fail = (title: string) => toast({ variant: 'destructive', title, description: 'Penyimpanan perangkat mungkin penuh.' });

  const duplicate = (id: string) => {
    try {
      const copyId = duplicateDocument(id);
      if (copyId) router.push(`/editor?id=${encodeURIComponent(copyId)}`);
    } catch {
      fail('Gagal menduplikat CV');
    }
  };

  const rename = (id: string, title: string) => {
    setRenaming(null);
    const cv = loadDocument(id);
    if (!cv || cv.title === title.trim()) return;
    try {
      saveDocument(id, { ...cv, title: title.trim() });
      refresh();
    } catch {
      fail('Gagal mengganti nama');
    }
  };

  const remove = (id: string) => {
    deleteDocument(id);
    setConfirmDelete(null);
    refresh();
    toast({ title: 'CV dihapus' });
  };

  const importFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed: unknown = JSON.parse(String(reader.result ?? ''));
        if (!isCvLike(parsed)) throw new Error();
        const id = createDocument(normalizeCV(parsed));
        router.push(`/editor?id=${encodeURIComponent(id)}`);
      } catch {
        toast({ variant: 'destructive', title: 'File tidak valid', description: 'Pilih file JSON hasil ekspor GenCV.' });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CV saya</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Tersimpan di perangkat ini saja. Buat satu CV per lowongan: duplikat CV yang sudah ada, lalu sesuaikan dengan
            deskripsi pekerjaannya.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <Upload aria-hidden="true" />
            Impor JSON
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              importFile(e.target.files?.[0]);
              e.target.value = '';
            }}
          />
          <Button asChild variant="primary">
            <Link href="/editor?new=1">
              <FilePlus2 aria-hidden="true" />
              CV baru
            </Link>
          </Button>
        </div>
      </div>

      {items === null ? (
        <p className="mt-10 text-sm text-muted-foreground" role="status">
          Memuat CV…
        </p>
      ) : items.length === 0 ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
          <FileText className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold">Belum ada CV di perangkat ini</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Mulai dari nol, atau impor file JSON yang pernah kamu ekspor dari GenCV.
          </p>
          <Button asChild variant="primary" className="mt-6">
            <Link href="/editor?new=1">Buat CV pertama</Link>
          </Button>
        </div>
      ) : (
        <ul className="mt-10 grid gap-4 md:grid-cols-2">
          {items.map((item) => {
            const title = displayTitle(item);
            // The title falls back to the headline or name; don't repeat it underneath.
            const subtitle = [item.name, item.headline].filter((part) => part && part !== title).join(' · ');
            return (
              <li key={item.id} className="flex flex-col rounded-xl border border-border bg-surface p-5">
                {renaming === item.id ? (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      rename(item.id, String(new FormData(e.currentTarget).get('title') ?? ''));
                    }}
                  >
                    <label htmlFor={`title-${item.id}`} className="sr-only">
                      Nama CV
                    </label>
                    <input
                      id={`title-${item.id}`}
                      name="title"
                      defaultValue={item.title}
                      placeholder={title}
                      autoFocus
                      onBlur={(e) => rename(item.id, e.target.value)}
                      onKeyDown={(e) => e.key === 'Escape' && setRenaming(null)}
                      className="w-full rounded-md border border-input bg-background px-2 py-1 text-lg font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                  </form>
                ) : (
                  <h2 className="truncate text-lg font-semibold">
                    <Link href={`/editor?id=${encodeURIComponent(item.id)}`} className="hover:underline">
                      {title}
                    </Link>
                  </h2>
                )}
                {subtitle && <p className="mt-1 truncate text-sm text-muted-foreground">{subtitle}</p>}

                <div className="mt-3 flex flex-wrap gap-1.5">
                  <Chip>{TEMPLATE_INFO[item.template]?.name ?? item.template}</Chip>
                  {item.ats !== null && <Chip tone="primary">Skor ATS {item.ats}</Chip>}
                  {item.jobMatch !== null ? (
                    <Chip tone="success">Job Match {item.jobMatch}%</Chip>
                  ) : (
                    <Chip tone="warning">Belum ada lowongan</Chip>
                  )}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Diubah {relativeTimeLabel(item.updatedAt, now)}</p>

                {confirmDelete === item.id ? (
                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4" role="alert">
                    <p className="mr-auto text-sm">Hapus CV ini dari perangkat? Tidak bisa dibatalkan.</p>
                    <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(null)}>
                      Batal
                    </Button>
                    <Button variant="danger" size="sm" onClick={() => remove(item.id)}>
                      Hapus
                    </Button>
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
                    <Button asChild variant="secondary" size="sm">
                      <Link href={`/editor?id=${encodeURIComponent(item.id)}`}>Buka</Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => duplicate(item.id)}>
                      <Copy aria-hidden="true" />
                      Sesuaikan untuk lowongan lain
                    </Button>
                    <Button variant="ghost" size="sm" aria-label={`Ganti nama ${title}`} onClick={() => setRenaming(item.id)}>
                      <Pencil aria-hidden="true" />
                      <span className="hidden sm:inline">Ganti nama</span>
                    </Button>
                    <Button variant="ghost" size="sm" aria-label={`Hapus ${title}`} onClick={() => setConfirmDelete(item.id)}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
