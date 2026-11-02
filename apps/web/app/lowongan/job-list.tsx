'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Upload } from 'lucide-react';
import { Button, Chip } from '@/components/ds';
import { useToast } from '@/hooks/use-toast';
import { emptyCV } from '@/lib/cv/model';
import {
  createDocument,
  duplicateDocument,
  listDocuments,
  loadDocument,
  saveDocument,
  type CvSummary,
} from '@/lib/cv/storage';
import {
  HUNTER_FEED_URL,
  HUNTER_PORTALS,
  cvTitleForJob,
  parseHunterJobs,
  type HunterJob,
} from '@/lib/cv/hunter';

/**
 * Lowongan dari hunter VPS: impor file jobs.json, lalu buat satu CV per
 * lowongan dari CV dasar yang sudah ada (atau dari CV kosong).
 *
 * Tidak ada yang dikirim ke server dan tidak ada lamaran yang dikirim:
 * tombol "Lihat lowongan" hanya membuka halaman asli lowongannya, dan
 * lamaran tetap dikirim manual oleh user dari sana.
 */
export function JobList() {
  const router = useRouter();
  const { toast } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<HunterJob[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [feedState, setFeedState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const [feedSource, setFeedSource] = useState<'otomatis' | 'manual'>('otomatis');
  const [baseId, setBaseId] = useState('');
  // localStorage only exists in the browser: reading it during render would
  // break the static prerender of this page, the same reason CvList reads
  // its list inside an effect.
  const [bases, setBases] = useState<CvSummary[]>([]);
  useEffect(() => {
    setBases(listDocuments());
  }, []);

  // Feed otomatis: hunter harian mempublikasikan jobs.json ke repo data
  // publik, dan halaman ini memuatnya langsung. Impor manual tetap ada
  // sebagai fallback kalau feed tidak bisa dijangkau.
  useEffect(() => {
    let cancelled = false;
    fetch(HUNTER_FEED_URL, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((parsed: unknown) => {
        if (cancelled) return;
        const { jobs: feedJobs, skipped: dropped } = parseHunterJobs(parsed);
        if (feedJobs.length === 0) throw new Error();
        setJobs(feedJobs);
        setSkipped(dropped);
        setFeedSource('otomatis');
        setFeedState('loaded');
      })
      .catch(() => {
        if (!cancelled) setFeedState('failed');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const importFile = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const { jobs: parsed, skipped: dropped } = parseHunterJobs(JSON.parse(String(reader.result ?? '')));
        if (parsed.length === 0) throw new Error();
        setJobs(parsed);
        setSkipped(dropped);
        setFeedSource('manual');
        setFeedState('loaded');
      } catch {
        toast({
          variant: 'destructive',
          title: 'File tidak valid',
          description: 'Pilih file jobs.json hasil hunter (daftar lowongan), bukan file JSON CV.',
        });
      }
    };
    reader.readAsText(file);
  };

  const createCv = (job: HunterJob) => {
    try {
      let id: string;
      if (baseId) {
        const copyId = duplicateDocument(baseId);
        if (!copyId) throw new Error();
        const copy = loadDocument(copyId);
        if (!copy) throw new Error();
        // duplicateDocument clears the previous ad; set this job's title and ad.
        saveDocument(copyId, { ...copy, title: cvTitleForJob(job), jobDescription: job.description });
        id = copyId;
      } else {
        const cv = emptyCV();
        cv.title = cvTitleForJob(job);
        cv.jobDescription = job.description;
        id = createDocument(cv);
      }
      router.push(`/editor?id=${encodeURIComponent(id)}`);
    } catch {
      toast({ variant: 'destructive', title: 'Gagal membuat CV', description: 'Penyimpanan perangkat mungkin penuh.' });
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight">Lowongan hunter</h1>
      <section aria-label="Portal lowongan yang tersedia" className="mt-6 rounded-xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold">Portal yang tersedia</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Hanya portal berstatus aktif yang benar-benar dicari hunter harian. Portal lain yang didukung alatnya belum
          diaktifkan, dan JobStreet/Glints belum bisa dicari otomatis sama sekali.
        </p>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {HUNTER_PORTALS.map((portal) => (
            <li key={portal.name} className="flex items-baseline gap-2 text-sm">
              <Chip tone={portal.status === 'aktif' ? 'primary' : undefined}>
                {portal.status === 'aktif' ? 'Aktif' : portal.status === 'didukung' ? 'Didukung' : 'Belum tersedia'}
              </Chip>
              <span>
                <strong>{portal.name}</strong> <span className="text-muted-foreground">— {portal.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>
      <p className="mt-2 max-w-2xl text-muted-foreground">
        Impor file <code>jobs.json</code> dari hunter VPS, pilih lowongan, lalu buat CV yang disesuaikan untuk lowongan itu.
        Deskripsi lowongan yang belum ada di file harus ditempel manual di editor sebelum menjalankan Job Match — GenCV
        tidak pernah mengarang deskripsi.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={() => fileInput.current?.click()}>
          <Upload aria-hidden="true" />
          Impor jobs.json
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
        {bases.length > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted-foreground">
            CV dasar
            <select
              value={baseId}
              onChange={(e) => setBaseId(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-foreground"
            >
              <option value="">CV kosong</option>
              {bases.map((doc) => (
                <option key={doc.id} value={doc.id}>
                  {doc.title || doc.headline || doc.name || 'CV tanpa judul'}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {jobs === null ? (
        <div className="mt-10 rounded-xl border border-dashed border-border p-10 text-center">
          <FileText className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="mt-4 text-lg font-semibold">
            {feedState === 'loading' ? 'Memuat lowongan dari hunter…' : 'Belum ada daftar lowongan'}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            {feedState === 'failed'
              ? 'Feed otomatis hunter tidak bisa dijangkau. Impor file jobs.json secara manual di atas, atau tempel deskripsi lowongan langsung di editor seperti biasa.'
              : 'Daftar lowongan dimuat otomatis dari hunter harian. Kalau belum muncul, impor file jobs.json secara manual di atas.'}
          </p>
        </div>
      ) : (
        <>
          <p className="mt-8 text-sm text-muted-foreground">
            {jobs.length} lowongan{skipped > 0 ? `, ${skipped} entri tidak valid dilewati` : ''}
            {feedSource === 'otomatis'
              ? ' — dimuat otomatis dari hunter (diperbarui tiap pagi).'
              : ' — dari file yang kamu impor.'}
          </p>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {jobs.map((job) => (
              <li key={job.jobUrl} className="flex flex-col rounded-xl border border-border bg-surface p-5">
                <h2 className="text-lg font-semibold">
                  <a href={job.jobUrl} target="_blank" rel="noreferrer" className="hover:underline">
                    {job.title}
                  </a>
                </h2>
                <p className="mt-1 truncate text-sm text-muted-foreground">
                  {[job.company, job.location].filter(Boolean).join(' \u00b7 ')}
                </p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {job.site && <Chip>{job.site}</Chip>}
                  {job.isRemote && <Chip tone="primary">Remote</Chip>}
                  {job.datePosted && <Chip>{job.datePosted}</Chip>}
                  {job.flagDemoLike && <Chip>Perlu dicek — mirip lowongan demo</Chip>}
                  {!job.description && <Chip>Deskripsi belum ada — tempel di editor</Chip>}
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button variant="primary" onClick={() => createCv(job)}>
                    Buat CV dari lowongan ini
                  </Button>
                  <Button asChild variant="outline">
                    <a href={job.jobUrl} target="_blank" rel="noreferrer">
                      Lihat lowongan
                    </a>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
