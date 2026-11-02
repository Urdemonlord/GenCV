'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bookmark, FileText, Search, Upload } from 'lucide-react';
import { Button, Chip } from '@/components/ds';
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/sync/auth-client';
import { runSyncRound } from '@/lib/sync/client';
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
  cvTitleForJob,
  parseHunterJobs,
  type HunterJob,
} from '@/lib/cv/hunter';

/**
 * Portal lowongan GenCV — redesign "Editorial Intelligence" (design.md +
 * mockup, Nov 2026), diimplementasikan dengan data feed yang nyata saja.
 *
 * Yang disengaja TIDAK ada di halaman ini, sesuai design.md sendiri:
 * - badge % cocok: feed tidak membawa deskripsi/skill, jadi tidak ada sinyal
 *   kecocokan yang jujur. Job Match tetap hidup di editor, dari deskripsi
 *   yang ditempel user.
 * - jumlah per tab/per sumber: angka mockup (27.842 dsb.) adalah data demo.
 *   Yang tampil hanya jumlah hasil yang benar-benar terfilter di sini.
 * - label sumber per kartu: diputuskan di PR #70 untuk disembunyikan, jadi
 *   tidak ada filter/faset sumber di halaman publik ini.
 * - gaji, verifikasi perusahaan, "Lamaran Saya": tidak ada datanya; lamaran
 *   tetap manual di situs lowongan aslinya.
 * - kontrol operasional hunter (seksi portal, impor JSON) tidak lagi di
 *   halaman publik: impor hanya muncul sebagai fallback saat feed gagal.
 *
 * "Tersimpan" disimpan di perangkat ini (localStorage), seperti CV — bukan
 * di akun, jadi tidak butuh login dan tidak hilang saat keluar.
 */

type Tab = 'all' | 'remote' | 'full-time' | 'part-time' | 'internship';
type Sort = 'feed' | 'newest' | 'title';
type View = 'all' | 'saved';

const SAVED_KEY = 'gencv:saved-jobs';

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'remote', label: 'Remote' },
  { id: 'full-time', label: 'Full-time' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'internship', label: 'Magang' },
];

/** jobType feed adalah teks bebas JobSpy ("fulltime", "parttime, contract", …). */
function normalizedType(job: HunterJob): Tab | 'contract' | null {
  const raw = job.jobType.toLowerCase();
  if (raw.includes('full')) return 'full-time';
  if (raw.includes('part')) return 'part-time';
  if (raw.includes('intern')) return 'internship';
  if (raw.includes('contract')) return 'contract';
  return null;
}

const TYPE_LABEL: Record<string, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Magang',
};

function isRemoteJob(job: HunterJob): boolean {
  return job.isRemote || /remote|jarak jauh/i.test(job.location ?? '');
}

function postedTime(job: HunterJob): number {
  // datePosted feed biasanya ISO (2026-11-02); yang tak terurai dianggap paling
  // lama supaya tidak tiba-tiba meloncat ke atas saat diurutkan terbaru.
  const time = Date.parse(job.datePosted);
  return Number.isNaN(time) ? 0 : time;
}

function loadSaved(): Set<string> {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]');
    return new Set(Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : []);
  } catch {
    return new Set();
  }
}

export function JobList({ syncConfigured }: { syncConfigured: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, isPending: sessionPending, error: sessionError } = authClient.useSession();
  const fileInput = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<HunterJob[] | null>(null);
  const [skipped, setSkipped] = useState(0);
  const [feedState, setFeedState] = useState<'loading' | 'loaded' | 'failed'>('loading');
  const [feedSource, setFeedSource] = useState<'otomatis' | 'manual'>('otomatis');
  // null = belum dipilih: begitu daftar CV terbaca, default-nya adalah CV
  // terbaru (yang terakhir diisi/diubah user), bukan CV kosong — supaya
  // "Buat CV dari lowongan ini" langsung membawa data user dan pratinjau
  // tidak tampil kosong. "CV kosong" tetap bisa dipilih eksplisit.
  const [baseId, setBaseId] = useState<string | null>(null);
  // localStorage only exists in the browser: reading it during render would
  // break the static prerender of this page, the same reason CvList reads
  // its list inside an effect.
  const [bases, setBases] = useState<CvSummary[]>([]);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [sort, setSort] = useState<Sort>('feed');
  const [view, setView] = useState<View>('all');

  useEffect(() => {
    const docs = listDocuments();
    setBases(docs);
    setBaseId((prev) => prev ?? (docs[0]?.id ?? ''));
    setSaved(loadSaved());
  }, []);

  const loadFeed = () => {
    setFeedState('loading');
    fetch(HUNTER_FEED_URL, { cache: 'no-store' })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json();
      })
      .then((parsed: unknown) => {
        const { jobs: feedJobs, skipped: dropped } = parseHunterJobs(parsed);
        if (feedJobs.length === 0) throw new Error();
        setJobs(feedJobs);
        setSkipped(dropped);
        setFeedSource('otomatis');
        setFeedState('loaded');
      })
      .catch(() => setFeedState('failed'));
  };

  // Feed otomatis: hunter harian mempublikasikan jobs.json ke repo data
  // publik, dan halaman ini memuatnya langsung. Impor manual hanya jadi
  // fallback kalau feed tidak bisa dijangkau.
  useEffect(loadFeed, []);

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

  const toggleSaved = (jobUrl: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(jobUrl)) {
        next.delete(jobUrl);
        toast({ title: 'Dihapus dari tersimpan' });
      } else {
        next.add(jobUrl);
        toast({ title: 'Lowongan disimpan', description: 'Tersimpan di perangkat ini, bisa dibuka dari menu Tersimpan.' });
      }
      try {
        localStorage.setItem(SAVED_KEY, JSON.stringify([...next]));
      } catch {
        // Penyimpanan penuh: status tombol tetap berubah di sesi ini.
      }
      return next;
    });
  };

  const resetFilters = () => {
    setQuery('');
    setLocationFilter('');
    setTypeFilter('');
    setTab('all');
    setSort('feed');
  };

  const filtersActive = query !== '' || locationFilter !== '' || typeFilter !== '' || tab !== 'all' || sort !== 'feed';

  const visibleJobs = useMemo(() => {
    if (!jobs) return [];
    const q = query.trim().toLowerCase();
    const list = jobs.filter((job) => {
      if (view === 'saved' && !saved.has(job.jobUrl)) return false;
      if (q && !(job.title + ' ' + job.company + ' ' + job.location).toLowerCase().includes(q)) return false;
      if (locationFilter === 'remote' && !isRemoteJob(job)) return false;
      if (locationFilter === 'indonesia' && !job.location.toLowerCase().includes('indonesia')) return false;
      const type = normalizedType(job);
      if (typeFilter === 'full-time' && type !== 'full-time') return false;
      if (typeFilter === 'part-time' && type !== 'part-time') return false;
      if (typeFilter === 'contract' && type !== 'contract') return false;
      if (typeFilter === 'internship' && type !== 'internship') return false;
      if (tab === 'remote' && !isRemoteJob(job)) return false;
      if (tab === 'full-time' && type !== 'full-time') return false;
      if (tab === 'part-time' && type !== 'part-time') return false;
      if (tab === 'internship' && type !== 'internship') return false;
      return true;
    });
    if (sort === 'newest') return [...list].sort((a, b) => postedTime(b) - postedTime(a));
    if (sort === 'title') return [...list].sort((a, b) => a.title.localeCompare(b.title));
    return list;
  }, [jobs, view, saved, query, locationFilter, typeFilter, tab, sort]);

  const createCv = async (job: HunterJob) => {
    // Membuat CV baru wajib login (kalau login tersedia di deployment ini):
    // tanpa akun, CV hanya hidup di perangkat ini dan tidak pernah sinkron
    // ke profil. Pemeriksaan sesi yang gagal total (server tidak terjangkau)
    // tidak mengunci user: pembuatan lanjut lokal, sinkronisasi bisa susulan
    // dari panel dashboard.
    if (syncConfigured && sessionPending) {
      toast({ title: 'Memeriksa status masuk…', description: 'Tunggu sebentar lalu coba lagi.' });
      return;
    }
    if (syncConfigured && !sessionError && !session) {
      router.push(`/masuk?callbackURL=${encodeURIComponent('/lowongan')}`);
      return;
    }
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
      // Langsung sinkronkan ke akun supaya CV baru ini ada di profil, bukan
      // hanya di perangkat ini. Gagal sinkron tidak membatalkan pembuatan:
      // salinan lokal tetap ada dan panel dashboard bisa mencoba lagi.
      if (syncConfigured && session) {
        try {
          await runSyncRound();
        } catch {
          // Best-effort: kegagalan sinkron dilaporkan lewat panel dashboard.
        }
      }
      // Lowongan feed tidak membawa deskripsi, dan Job Match hanya bisa
      // menghitung skor dari deskripsi: kalau deskripsi kosong, beri tahu
      // editor agar menampilkan panduan tempel deskripsi, bukan diam-diam
      // membiarkan Job Match tampil kosong.
      const needsDescription = !job.description?.trim();
      const target = `/editor?id=${encodeURIComponent(id)}${needsDescription ? `&fromJob=1&jobTitle=${encodeURIComponent(job.title)}&jobUrl=${encodeURIComponent(job.jobUrl)}` : ''}`;
      router.push(target);
    } catch {
      toast({ variant: 'destructive', title: 'Gagal membuat CV', description: 'Penyimpanan perangkat mungkin penuh.' });
    }
  };

  const sidebar = (
    <nav aria-label="Navigasi lowongan" className="flex gap-2 overflow-x-auto md:sticky md:top-4 md:flex-col md:overflow-visible">
      <button
        type="button"
        onClick={() => setView('all')}
        aria-current={view === 'all' ? 'page' : undefined}
        className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm font-semibold md:w-full ${
          view === 'all' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
        }`}
      >
        Jelajahi Lowongan
      </button>
      <button
        type="button"
        onClick={() => setView('saved')}
        aria-current={view === 'saved' ? 'page' : undefined}
        className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold md:w-full ${
          view === 'saved' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-surface-raised hover:text-foreground'
        }`}
      >
        Tersimpan
        <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted-foreground">{saved.size}</span>
      </button>
      <p className="hidden text-xs leading-relaxed text-muted-foreground md:mt-2 md:block">
        Lowongan tersimpan hanya ada di perangkat ini. Masuk tidak diperlukan, dan keluar tidak menghapusnya.
      </p>
    </nav>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Hero editorial: judul + penjelasan, tanpa panel skor (tidak ada sinyal). */}
      <section>
        <p className="text-xs font-bold tracking-widest text-muted-foreground">JOB PORTAL BY GENCV</p>
        <h1 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          Temukan peluang kerja yang sesuai dengan profilmu.
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Jelajahi lowongan dari berbagai sumber, simpan yang menarik, lalu buat CV yang disesuaikan untuk lowongan itu.
          Kecocokan dengan lowongan dihitung di editor lewat Job Match — dari deskripsi lowongan yang kamu tempel, bukan
          dari angka yang dikarang.
        </p>
        {jobs !== null && bases.length === 0 && (
          <p className="mt-4 max-w-2xl rounded-xl border border-border bg-surface p-4 text-sm text-muted-foreground">
            Belum punya CV?{' '}
            <a href="/editor?new=1" className="font-semibold text-foreground underline underline-offset-4">
              Buat CV dulu
            </a>{' '}
            supaya tombol “Buat CV dari lowongan ini” langsung memakai datamu.
          </p>
        )}
      </section>

      {/* Search + filter dari field feed yang nyata. */}
      <form
        className="mt-8 grid gap-3 md:grid-cols-[minmax(0,1.5fr)_repeat(2,minmax(0,0.5fr))]"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3">
          <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className="sr-only">Cari posisi, perusahaan, atau lokasi</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari posisi, perusahaan, atau lokasi…"
            className="w-full min-w-0 bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
          />
        </label>
        <label className="rounded-xl border border-border bg-surface px-3">
          <span className="sr-only">Filter lokasi</span>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="w-full bg-transparent py-3 text-sm outline-none"
          >
            <option value="">Semua lokasi</option>
            <option value="remote">Remote</option>
            <option value="indonesia">Indonesia</option>
          </select>
        </label>
        <label className="rounded-xl border border-border bg-surface px-3">
          <span className="sr-only">Filter tipe kerja</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full bg-transparent py-3 text-sm outline-none"
          >
            <option value="">Semua tipe kerja</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Magang</option>
          </select>
        </label>
      </form>

      <div className="mt-8 grid items-start gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        {sidebar}

        <section aria-label="Hasil lowongan">
          {/* Tab + sortir. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border">
            <div role="tablist" aria-label="Kategori lowongan" className="flex gap-5 overflow-x-auto">
              {TAB_LABELS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`whitespace-nowrap border-b-2 pb-3 text-sm ${
                    tab === t.id
                      ? 'border-primary font-bold text-foreground'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <label className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
              Urutkan
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="rounded-lg border border-border bg-surface px-2 py-1.5 text-foreground"
              >
                <option value="feed">Urutan hunter</option>
                <option value="newest">Terbaru</option>
                <option value="title">Nama posisi</option>
              </select>
            </label>
          </div>

          {jobs === null ? (
            feedState === 'loading' ? (
              <div aria-busy="true" className="mt-6 grid gap-4" aria-label="Memuat lowongan">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="animate-pulse rounded-xl border border-border bg-surface p-5">
                    <div className="h-5 w-2/3 rounded bg-surface-raised" />
                    <div className="mt-3 h-4 w-1/3 rounded bg-surface-raised" />
                    <div className="mt-4 h-9 w-40 rounded bg-surface-raised" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
                <FileText className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold">Feed otomatis hunter tidak bisa dijangkau</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Sebagai fallback, impor file jobs.json hasil hunter secara manual. Daftar ini tidak dikirim ke server
                  mana pun.
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  <Button variant="outline" onClick={() => fileInput.current?.click()}>
                    <Upload aria-hidden="true" />
                    Impor jobs.json
                  </Button>
                  <Button variant="ghost" onClick={loadFeed}>
                    Coba lagi
                  </Button>
                </div>
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
              </div>
            )
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground" aria-live="polite">
                  <strong className="text-foreground">{visibleJobs.length}</strong> lowongan
                  {skipped > 0 ? `, ${skipped} entri tidak valid dilewati` : ''}
                  {feedSource === 'otomatis'
                    ? ' — dimuat otomatis dari hunter (diperbarui tiap pagi).'
                    : ' — dari file yang kamu impor.'}
                </p>
                {feedSource === 'manual' && (
                  <Button variant="ghost" size="sm" onClick={loadFeed}>
                    Kembali ke feed otomatis
                  </Button>
                )}
                {filtersActive && (
                  <Button variant="ghost" size="sm" onClick={resetFilters}>
                    Reset filter
                  </Button>
                )}
                {bases.length > 0 && (
                  <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                    CV dasar
                    <select
                      value={baseId ?? ''}
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

              {visibleJobs.length === 0 ? (
                <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center">
                  <h2 className="text-lg font-semibold">
                    {view === 'saved' ? 'Belum ada lowongan tersimpan' : 'Tidak ada lowongan yang cocok'}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    {view === 'saved'
                      ? 'Ketuk ikon bookmark di kartu lowongan untuk menyimpannya di perangkat ini.'
                      : 'Coba ubah kata kunci, hapus filter, atau pindah ke tab Semua.'}
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    {view === 'saved' ? (
                      <Button variant="outline" onClick={() => setView('all')}>
                        Jelajahi lowongan
                      </Button>
                    ) : (
                      <Button variant="outline" onClick={resetFilters}>
                        Tampilkan semua lowongan
                      </Button>
                    )}
                  </div>
                </div>
              ) : (
                <ul className="mt-4 grid gap-4" aria-live="polite">
                  {visibleJobs.map((job) => {
                    const type = normalizedType(job);
                    const isSaved = saved.has(job.jobUrl);
                    return (
                      <li key={job.jobUrl} className="flex gap-4 rounded-xl border border-border bg-surface p-5">
                        <span
                          aria-hidden="true"
                          className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-xl font-bold"
                        >
                          {job.company.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-semibold">
                            <a href={job.jobUrl} target="_blank" rel="noreferrer" className="hover:underline">
                              {job.title}
                            </a>
                          </h2>
                          <p className="mt-1 truncate text-sm text-muted-foreground">
                            {[job.company, job.location].filter(Boolean).join(' \u00b7 ')}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {isRemoteJob(job) && <Chip tone="primary">Remote</Chip>}
                            {type && <Chip>{TYPE_LABEL[type]}</Chip>}
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
                        </div>
                        <button
                          type="button"
                          onClick={() => toggleSaved(job.jobUrl)}
                          aria-pressed={isSaved}
                          aria-label={isSaved ? 'Hapus dari tersimpan' : 'Simpan lowongan'}
                          title={isSaved ? 'Tersimpan' : 'Simpan'}
                          className="h-fit shrink-0 rounded-lg p-2 text-muted-foreground hover:bg-surface-raised hover:text-foreground"
                        >
                          <Bookmark className="size-5" fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}
