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
import { cvTitleForJob, parseHunterJobs, type HunterJob } from '@/lib/cv/hunter';

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
  const [baseId, setBaseId] = useState('');
  // localStorage only exists in the browser: reading it during render would
  // break the static prerender of this page, the same reason CvList reads
  // its list inside an effect.
  const [bases, setBases] = useState<CvSummary[]>([]);
  useEffect(() => {
    setBases(listDocuments());
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
          <h2 className="mt-4 text-lg font-semibold">Belum ada daftar lowongan</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Hunter harian di VPS menulis <code>jobs.json</code> setiap pagi. Impor file itu di sini, atau tempel deskripsi
            lowongan langsung di editor seperti biasa.
          </p>
        </div>
      ) : (
        <>
          <p className="mt-8 text-sm text-muted-foreground">
            {jobs.length} lowongan{skipped > 0 ? `, ${skipped} entri tidak valid dilewati` : ''}.
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
