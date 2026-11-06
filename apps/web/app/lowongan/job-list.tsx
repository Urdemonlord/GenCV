'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BarChart3, Bookmark, Briefcase, ChevronDown, FileText, Layers, MapPin, Search, Sparkles, Upload } from 'lucide-react';
import { HeroArt } from '../components/landing/hero-art';
import { JobCard, isRemoteJob, normalizedType, siteName } from './job-card';
import { HERO_TITLE_BAR, HERO_TITLE_DISPLAY } from '../components/landing/page-hero';
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
import { matchKeywords, type KeywordMatch } from '@/lib/cv/analysis/keywords';
import type { CV } from '@/lib/cv/model';
import {
  HUNTER_FEED_URL,
  cvTitleForJob,
  parseHunterJobs,
  type HunterJob,
  type HunterParseResult,
} from '@/lib/cv/hunter';

/**
 * Portal lowongan Ayo Kerja — dibuat semirip mungkin dengan mockup design.md /
 * index.html (token brand-accent kuning + primary biru royal: hero kuning, seksi hasil
 * biru, kartu putih, badge kuning, sidebar sumber, tab berjumlah).
 *
 * Yang tetap jujur dan TIDAK meniru angka mockup:
 * - Jumlah tab dan sumber dihitung dari feed yang nyata. Angka mockup
 *   (27.842, 12,4k, dst.) tidak pernah dipakai.
 * - Badge % cocok dihitung sungguhan dari kata kunci teks lowongan
 *   (deskripsi bila ada, judul bila tidak) vs CV dasar, pakai matchKeywords
 *   yang sama dengan Job Match editor. Tanpa CV dasar, kartu menampilkan
 *   ajakan "Lengkapi profil untuk Job Match", bukan persentase karangan.
 * - Tidak ada verifikasi perusahaan atau gaji: feed tidak membawa data itu,
 *   jadi tidak ditampilkan.
 * - Filter Pengalaman adalah perkiraan dari teks lowongan (judul +
 *   deskripsi), karena feed tidak membawa field pengalaman. Polanya
 *   didokumentasikan di experienceBand; kartu tidak pernah menampilkan
 *   pengalaman hasil perkiraan ini.
 * - Tombol utama "Buat CV & Lamar ↗" (membuat CV dari lowongan, bukan
 *   mengirim lamaran — Ayo Kerja tidak mengirim lamaran) dan "Lihat Detail"
 *   membuka iklan asli di sumbernya, karena halaman detail internal belum
 *   ada.
 * - "Lamaran Saya" adalah panel penjelasan, bukan daftar lamaran: pelacakan
 *   lamaran belum termasuk dalam portal ini (mockup pun menandainya
 *   placeholder).
 *
 * "Tersimpan" disimpan di perangkat ini (localStorage), seperti CV — bukan
 * di akun, jadi tidak butuh login dan tidak hilang saat keluar.
 */

type Tab = 'all' | 'remote' | 'full-time' | 'part-time' | 'internship';
type Sort = 'relevant' | 'newest' | 'title';
type View = 'all' | 'recommended' | 'saved' | 'applications';

const SAVED_KEY = 'gencv:saved-jobs';

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'remote', label: 'Remote' },
  { id: 'full-time', label: 'Full-time' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'internship', label: 'Magang' },
];

type ExperienceBand = 'entry' | '1-3' | '2-5' | 'senior';

const EXPERIENCE_OPTIONS: { id: ExperienceBand; label: string }[] = [
  { id: 'entry', label: 'Entry level' },
  { id: '1-3', label: '1–3 tahun' },
  { id: '2-5', label: '2–5 tahun' },
  { id: 'senior', label: 'Senior' },
];

/**
 * Perkiraan band pengalaman dari teks lowongan (judul + deskripsi) — BUKAN
 * data resmi sumber. Pola yang dikenali: "senior", "entry level",
 * "fresh graduate", "junior", rentang "X–Y tahun/years", "X+ tahun/years",
 * dan "minimal X tahun/years". Lowongan tanpa pola yang dikenali
 * mengembalikan null dan tidak lolos filter pengalaman yang aktif.
 */
function experienceBand(job: HunterJob): ExperienceBand | null {
  const text = `${job.title} ${job.description ?? ''}`;
  if (/\bsenior\b/i.test(text)) return 'senior';
  const plus = text.match(/(\d+)\s*\+\s*(tahun|years?)\b/i);
  if (plus) {
    const years = Number(plus[1]);
    if (years >= 5) return 'senior';
    if (years <= 1) return 'entry';
    if (years <= 3) return '1-3';
    return '2-5';
  }
  if (/\b(entry level|fresh graduate|junior)\b/i.test(text)) return 'entry';
  const range = text.match(/(\d+)\s*[-–]\s*(\d+)\s*(tahun|years?)\b/i);
  if (range) {
    const hi = Number(range[2]);
    if (hi <= 1) return 'entry';
    if (hi <= 3) return '1-3';
    if (hi <= 5) return '2-5';
    return 'senior';
  }
  const min = text.match(/\b(minimal|minimum|at least|pengalaman)\s*(\d+)\s*(tahun|years?)\b/i);
  if (min) {
    const years = Number(min[2]);
    if (years <= 1) return 'entry';
    if (years <= 3) return '1-3';
    if (years <= 5) return '2-5';
    return 'senior';
  }
  return null;
}

function tabMatches(job: HunterJob, tab: Tab): boolean {
  if (tab === 'all') return true;
  if (tab === 'remote') return isRemoteJob(job);
  return normalizedType(job) === tab;
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

const btnPrimary =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50';
const btnWhite =
  'inline-flex items-center justify-center gap-2 rounded-[13px] bg-white px-4 py-2.5 text-sm font-extrabold text-primary transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 disabled:opacity-50';
const btnGhostLight =
  'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2';

export function JobList({
  syncConfigured,
  initialFeed,
}: {
  syncConfigured: boolean;
  /** Feed yang sudah diambil server; null bila gagal, lalu browser mencoba sendiri. */
  initialFeed: HunterParseResult | null;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, isPending: sessionPending, error: sessionError } = authClient.useSession();
  const fileInput = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<HunterJob[] | null>(initialFeed?.jobs ?? null);
  const [skipped, setSkipped] = useState(initialFeed?.skipped ?? 0);
  const [feedState, setFeedState] = useState<'loading' | 'loaded' | 'failed'>(initialFeed ? 'loaded' : 'loading');
  const [feedSource, setFeedSource] = useState<'otomatis' | 'manual'>('otomatis');
  // null = belum dipilih: begitu daftar CV terbaca, default-nya adalah CV
  // terbaru (yang terakhir diisi/diubah user), bukan CV kosong — supaya
  // "Buat CV & Lamar" langsung membawa data user dan pratinjau
  // tidak tampil kosong. "CV kosong" tetap bisa dipilih eksplisit.
  const [baseId, setBaseId] = useState<string | null>(null);
  // localStorage only exists in the browser: reading it during render would
  // break the static prerender of this page, the same reason CvList reads
  // its list inside an effect.
  const [bases, setBases] = useState<CvSummary[]>([]);
  const [baseDoc, setBaseDoc] = useState<CV | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [sort, setSort] = useState<Sort>('relevant');
  const [view, setView] = useState<View>('all');
  const [limit, setLimit] = useState(6);

  useEffect(() => {
    const docs = listDocuments();
    setBases(docs);
    setBaseId((prev) => prev ?? (docs[0]?.id ?? ''));
    setSaved(loadSaved());
    // Search box hero Beranda mengarahkan ke sini dengan ?q=: isi pencarian
    // dari URL sekali saat mount (window.location, bukan useSearchParams,
    // supaya tidak butuh Suspense boundary saat prerender).
    const q = new URLSearchParams(window.location.search).get('q');
    if (q) setQuery(q);
  }, []);

  useEffect(() => {
    setBaseDoc(baseId ? loadDocument(baseId) : null);
  }, [baseId]);

  // Seperti mockup: ganti filter/tab/sort/view kembali menampilkan 6 pertama.
  useEffect(() => {
    setLimit(6);
  }, [query, locationFilter, typeFilter, experienceFilter, sourceFilter, tab, sort, view]);

  // Baris tab portal & chip tipe di-scroll horizontal di mobile: pastikan
  // tab yang aktif selalu terlihat utuh, bukan terpotong di tepi.
  const portalNavButtons = useRef<Partial<Record<View, HTMLButtonElement | null>>>({});
  const tabButtons = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({});
  useEffect(() => {
    portalNavButtons.current[view]?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [view]);
  useEffect(() => {
    tabButtons.current[tab]?.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  }, [tab]);

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
  // publik. Server sudah memuatnya (initialFeed); browser hanya mengambil
  // sendiri bila server gagal. Impor manual jadi fallback terakhir.
  useEffect(() => {
    if (!initialFeed) loadFeed();
    // Sekali saat mount: initialFeed tidak berubah selama halaman terbuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    setExperienceFilter('');
    setSourceFilter('');
    setTab('all');
    setSort('relevant');
    setView('all');
    setLimit(6);
  };

  const filtersActive =
    query !== '' ||
    locationFilter !== '' ||
    typeFilter !== '' ||
    experienceFilter !== '' ||
    sourceFilter !== '' ||
    tab !== 'all' ||
    sort !== 'relevant';

  /** Skor nyata per lowongan: deskripsi bila ada, judul bila tidak. */
  const scores = useMemo(() => {
    const map = new Map<string, KeywordMatch>();
    if (!jobs || !baseDoc) return map;
    for (const job of jobs) {
      const text = job.description?.trim() ? job.description : job.title;
      map.set(job.jobUrl, matchKeywords(baseDoc, text));
    }
    return map;
  }, [jobs, baseDoc]);

  const bestMatch = useMemo(() => {
    if (!jobs) return null;
    let best: { job: HunterJob; result: KeywordMatch; score: number } | null = null;
    for (const job of jobs) {
      const result = scores.get(job.jobUrl);
      if (!result) continue;
      const score = result.score;
      if (typeof score !== 'number') continue;
      if (!best || score > best.score) best = { job, result, score };
    }
    return best;
  }, [jobs, scores]);

  const tabCounts = useMemo(() => {
    const counts: Record<Tab, number> = { all: 0, remote: 0, 'full-time': 0, 'part-time': 0, internship: 0 };
    for (const job of jobs ?? []) {
      counts.all += 1;
      if (tabMatches(job, 'remote')) counts.remote += 1;
      if (tabMatches(job, 'full-time')) counts['full-time'] += 1;
      if (tabMatches(job, 'part-time')) counts['part-time'] += 1;
      if (tabMatches(job, 'internship')) counts.internship += 1;
    }
    return counts;
  }, [jobs]);

  const sourceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs ?? []) {
      const name = siteName(job.site);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [jobs]);

  const visibleJobs = useMemo(() => {
    if (!jobs) return [];
    const q = query.trim().toLowerCase();
    const list = jobs.filter((job) => {
      if (view === 'applications') return false;
      if (view === 'saved' && !saved.has(job.jobUrl)) return false;
      if (view === 'recommended' && typeof scores.get(job.jobUrl)?.score !== 'number') return false;
      if (q && !(job.title + ' ' + job.company + ' ' + job.location).toLowerCase().includes(q)) return false;
      if (locationFilter === 'remote' && !isRemoteJob(job)) return false;
      if (locationFilter === 'indonesia' && !job.location.toLowerCase().includes('indonesia')) return false;
      const type = normalizedType(job);
      if (typeFilter === 'full-time' && type !== 'full-time') return false;
      if (typeFilter === 'part-time' && type !== 'part-time') return false;
      if (typeFilter === 'contract' && type !== 'contract') return false;
      if (typeFilter === 'internship' && type !== 'internship') return false;
      if (experienceFilter && experienceBand(job) !== experienceFilter) return false;
      if (sourceFilter && job.site.toLowerCase() !== sourceFilter) return false;
      if (!tabMatches(job, tab)) return false;
      return true;
    });
    if (sort === 'newest') return [...list].sort((a, b) => postedTime(b) - postedTime(a));
    if (sort === 'title') return [...list].sort((a, b) => a.title.localeCompare(b.title));
    // Paling relevan: skor tertinggi dulu, yang tanpa skor tetap di urutan hunter.
    return [...list].sort((a, b) => {
      const sa = scores.get(a.jobUrl)?.score;
      const sb = scores.get(b.jobUrl)?.score;
      if (sa === undefined || sa === null) return sb === undefined || sb === null ? 0 : 1;
      if (sb === undefined || sb === null) return -1;
      return sb - sa;
    });
  }, [jobs, view, saved, query, locationFilter, typeFilter, experienceFilter, sourceFilter, tab, sort, scores]);

  const shownJobs = visibleJobs.slice(0, limit);

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

  const filterSelectClass =
    'w-full appearance-none bg-transparent py-3 text-[13px] font-extrabold text-primary outline-none sm:py-3.5 sm:text-sm [&>option]:bg-white [&>option]:text-foreground';

  return (
    <>
      {/* Hero portal ala mockup Ayo Kerja: seksi kuning, headline, megaphone. */}
      <section className="bg-brand-accent text-foreground">
        <div className="mx-auto max-w-[1440px] px-4 py-8 lg:py-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.08fr_0.92fr]">
            <div>
              <p className="flex items-center gap-2.5 text-[13px] font-black uppercase tracking-[0.045em] text-primary">
                <span aria-hidden="true" className="inline-block size-2.5 rounded-[3px] bg-primary" />
                Portal Karier &amp; Peluang Kerja
              </p>
              <h1 className={HERO_TITLE_DISPLAY}>
                <span className="block">Temukan peluang kerja yang sesuai</span>
                <span className={HERO_TITLE_BAR}>dengan profilmu.</span>
              </h1>
              <p className="mt-4 max-w-[620px] text-base font-medium leading-[1.55] text-foreground-soft">
                Jelajahi lowongan dari berbagai sumber, dapatkan rekomendasi yang relevan, dan persiapkan CV untuk
                langkah karier berikutnya.
              </p>
            </div>
            <HeroArt />
          </div>

          {/* Search + filter di dalam hero, seperti mockup. */}
          <form
            className="mt-6 grid grid-cols-2 gap-2 sm:gap-3 lg:grid-cols-[minmax(250px,1.65fr)_repeat(4,minmax(120px,auto))]"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="col-span-2 flex min-w-0 items-center gap-2.5 rounded-[14px] border-[1.5px] border-primary bg-white py-1.5 pl-4 pr-1.5 lg:col-span-1">
              <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="sr-only">Cari posisi, perusahaan, atau skill</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari posisi, perusahaan, atau skill..."
                className="w-full min-w-0 bg-transparent px-1 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-[13px] bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-primary-strong"
              >
                Cari
              </button>
            </label>
            <label className="flex min-h-[46px] items-center gap-1.5 rounded-[13px] border-[1.5px] border-primary px-2.5 text-xs font-extrabold text-primary sm:min-h-[54px] sm:gap-2 sm:px-3 sm:text-[13px]">
              <MapPin className="size-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Filter lokasi</span>
              <select
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
                className={filterSelectClass}
              >
                <option value="">Lokasi</option>
                <option value="remote">Remote</option>
                <option value="indonesia">Indonesia</option>
              </select>
              <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
            </label>
            <label className="flex min-h-[46px] items-center gap-1.5 rounded-[13px] border-[1.5px] border-primary px-2.5 text-xs font-extrabold text-primary sm:min-h-[54px] sm:gap-2 sm:px-3 sm:text-[13px]">
              <Briefcase className="size-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Filter tipe kerja</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={filterSelectClass}>
                <option value="">Tipe Kerja</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Magang</option>
              </select>
              <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
            </label>
            <label className="flex min-h-[46px] items-center gap-1.5 rounded-[13px] border-[1.5px] border-primary px-2.5 text-xs font-extrabold text-primary sm:min-h-[54px] sm:gap-2 sm:px-3 sm:text-[13px]">
              <BarChart3 className="size-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Filter pengalaman</span>
              <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className={filterSelectClass}
              >
                <option value="">Pengalaman</option>
                {EXPERIENCE_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
            </label>
            <label className="flex min-h-[46px] items-center gap-1.5 rounded-[13px] border-[1.5px] border-primary px-2.5 text-xs font-extrabold text-primary sm:min-h-[54px] sm:gap-2 sm:px-3 sm:text-[13px]">
              <Layers className="size-4 shrink-0" aria-hidden="true" />
              <span className="sr-only">Filter sumber</span>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className={filterSelectClass}
              >
                <option value="">Sumber</option>
                {sourceCounts.map(([name]) => (
                  <option key={name} value={name.toLowerCase()}>
                    {name}
                  </option>
                ))}
              </select>
              <ChevronDown className="size-4 shrink-0" aria-hidden="true" />
            </label>
          </form>
          {experienceFilter && (
            <p className="mt-3 text-xs font-semibold text-primary/80">
              Filter pengalaman dicocokkan dari teks lowongan (perkiraan, bukan data resmi sumber).
            </p>
          )}
        </div>
      </section>

      {/* Seksi hasil ala mockup: latar biru, kartu putih. */}
      <section className="bg-primary py-7 text-white lg:py-10">
        <div className="mx-auto max-w-[1440px] px-4">
          {jobs !== null && baseId !== null && (!baseDoc || !bestMatch) && (
            <div className="mb-6 rounded-2xl bg-brand-accent p-5 text-primary">
              {!baseDoc ? (
                <div className="flex flex-wrap items-center gap-4">
                  <p className="flex-1 text-sm font-bold leading-relaxed">
                    Lengkapi profil dan CV untuk melihat kecocokan pekerjaan.
                  </p>
                  <a
                    href="/editor?new=1"
                    className="rounded-[13px] bg-primary px-4 py-2.5 text-sm font-extrabold text-white"
                  >
                    Buat CV
                  </a>
                </div>
              ) : (
                <p className="text-sm font-bold leading-relaxed">
                  Belum ada kata kunci lowongan yang dikenali dari CV dasarmu. Tempel deskripsi lengkap di editor untuk
                  skor Job Match penuh.
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Sidebar ala mockup: di mobile jadi baris horizontal. */}
            <aside aria-label="Navigasi portal" className="min-w-0 lg:sticky lg:top-[90px]">
              <nav className="flex gap-1 overflow-x-auto scrollbar-hide max-lg:fade-x lg:flex-col lg:overflow-visible">
                <button
                  type="button"
                  ref={(el) => {
                    portalNavButtons.current.all = el;
                  }}
                  onClick={() => setView('all')}
                  aria-current={view === 'all' ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-[12px] px-3 py-3 text-sm font-bold ${
                    view === 'all' ? 'bg-brand-accent text-primary' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Search className="size-5 shrink-0" aria-hidden="true" />
                  Jelajahi Lowongan
                </button>
                <button
                  type="button"
                  ref={(el) => {
                    portalNavButtons.current.recommended = el;
                  }}
                  onClick={() => setView('recommended')}
                  aria-current={view === 'recommended' ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-[12px] px-3 py-3 text-sm font-bold ${
                    view === 'recommended' ? 'bg-brand-accent text-primary' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Sparkles className="size-5 shrink-0" aria-hidden="true" />
                  Rekomendasi untukmu
                </button>
                <button
                  type="button"
                  ref={(el) => {
                    portalNavButtons.current.saved = el;
                  }}
                  onClick={() => setView('saved')}
                  aria-current={view === 'saved' ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-[12px] px-3 py-3 text-sm font-bold ${
                    view === 'saved' ? 'bg-brand-accent text-primary' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Bookmark className="size-5 shrink-0" aria-hidden="true" />
                  Tersimpan
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[11px] text-white">{saved.size}</span>
                </button>
                <button
                  type="button"
                  ref={(el) => {
                    portalNavButtons.current.applications = el;
                  }}
                  onClick={() => setView('applications')}
                  aria-current={view === 'applications' ? 'page' : undefined}
                  className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-[12px] px-3 py-3 text-sm font-bold ${
                    view === 'applications' ? 'bg-brand-accent text-primary' : 'text-white hover:bg-white/10'
                  }`}
                >
                  <Briefcase className="size-5 shrink-0" aria-hidden="true" />
                  Lamaran Saya
                </button>
              </nav>
              <div className="mt-4 hidden lg:block">
                <div className="mx-2 h-px bg-white/30" />
                <p className="px-2.5 pb-2 pt-4 text-xs font-black uppercase tracking-[0.08em] text-white/80">
                  Sumber Lowongan
                </p>
                {sourceCounts.map(([name, count]) => {
                  const active = sourceFilter === name.toLowerCase();
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setSourceFilter(active ? '' : name.toLowerCase())}
                      aria-pressed={active}
                      className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-semibold text-white hover:bg-white/10"
                    >
                      <span
                        className={`grid size-[17px] shrink-0 place-items-center rounded-[5px] border-[1.5px] text-[12px] font-black ${
                          active ? 'border-brand-accent bg-brand-accent text-primary' : 'border-white text-transparent'
                        }`}
                      >
                        ✓
                      </span>
                      {name}
                      <span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[11px] text-white">
                        {count}
                      </span>
                    </button>
                  );
                })}
                <p className="px-2.5 pt-3 text-xs leading-relaxed text-white/70">
                  Jumlah dihitung dari lowongan yang benar-benar ada di feed saat ini.
                </p>
                <p className="px-2.5 pt-2 text-xs leading-relaxed text-white/70">
                  Lowongan tersimpan hanya ada di perangkat ini. Masuk tidak diperlukan, dan keluar tidak menghapusnya.
                </p>
              </div>
            </aside>

            <section aria-label="Hasil lowongan">
              {/* Tab + sortir ala mockup. */}
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/30">
                <div role="tablist" aria-label="Kategori lowongan" className="flex gap-6 overflow-x-auto scrollbar-hide max-lg:fade-x">
                  {TAB_LABELS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
                      ref={(el) => {
                        tabButtons.current[t.id] = el;
                      }}
                      aria-selected={tab === t.id}
                      onClick={() => setTab(t.id)}
                      className={`relative whitespace-nowrap pb-[13px] text-[13px] font-extrabold ${
                        tab === t.id ? 'text-brand-accent' : 'text-white/85'
                      }`}
                    >
                      {t.label} <strong className="font-semibold opacity-80">({tabCounts[t.id]})</strong>
                      {tab === t.id && (
                        <span className="absolute -bottom-px left-0 right-0 h-1 rounded bg-brand-accent" />
                      )}
                    </button>
                  ))}
                </div>
                <label className="mb-2.5 flex items-center gap-2 whitespace-nowrap text-[13px] font-extrabold text-white">
                  Urutkan:
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as Sort)}
                    className="bg-transparent outline-none [&>option]:bg-white [&>option]:text-foreground"
                  >
                    <option value="relevant">Paling relevan</option>
                    <option value="newest">Terbaru</option>
                    <option value="title">Nama posisi</option>
                  </select>
                </label>
              </div>

              {jobs === null ? (
                feedState === 'loading' ? (
                  <div aria-busy="true" className="mt-6 grid gap-[13px]" aria-label="Memuat lowongan">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="animate-pulse rounded-2xl border border-white/20 bg-white/10 p-[18px]">
                        <div className="h-5 w-2/3 rounded bg-white/20" />
                        <div className="mt-3 h-4 w-1/3 rounded bg-white/20" />
                        <div className="mt-4 h-9 w-40 rounded bg-white/20" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl border border-dashed border-white/40 p-10 text-center text-white">
                    <FileText className="mx-auto size-10 text-white/70" aria-hidden="true" />
                    <h2 className="mt-4 text-lg font-extrabold">Feed otomatis hunter tidak bisa dijangkau</h2>
                    <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
                      Sebagai fallback, impor file jobs.json hasil hunter secara manual. Daftar ini tidak dikirim ke
                      server mana pun.
                    </p>
                    <div className="mt-5 flex justify-center gap-2">
                      <button type="button" onClick={() => fileInput.current?.click()} className={btnWhite}>
                        <Upload aria-hidden="true" />
                        Impor jobs.json
                      </button>
                      <button type="button" onClick={loadFeed} className={btnGhostLight}>
                        Coba lagi
                      </button>
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
              ) : view === 'applications' ? (
                <div className="mt-6 rounded-2xl bg-white p-8 text-center text-muted-foreground">
                  <h2 className="text-lg font-bold text-foreground">Lamaran Saya belum tersedia</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm">
                    Pelacakan lamaran belum termasuk dalam portal ini. Lowongan yang kamu simpan ada di Tersimpan.
                  </p>
                  <button type="button" onClick={() => setView('saved')} className={`${btnPrimary} mt-5`}>
                    Lihat Tersimpan
                  </button>
                </div>
              ) : (
                <>
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <p className="text-[13px] text-white/80" aria-live="polite">
                      <strong className="text-white">
                        Menampilkan {shownJobs.length} dari {visibleJobs.length} lowongan
                      </strong>
                      {skipped > 0 ? `, ${skipped} entri tidak valid dilewati` : ''}
                      {feedSource === 'otomatis'
                        ? ' — dimuat otomatis dari hunter (diperbarui tiap pagi).'
                        : ' — dari file yang kamu impor.'}
                    </p>
                    {feedSource === 'manual' && (
                      <button type="button" onClick={loadFeed} className={btnGhostLight}>
                        Kembali ke feed otomatis
                      </button>
                    )}
                    {filtersActive && (
                      <button type="button" onClick={resetFilters} className={btnGhostLight}>
                        Reset filter
                      </button>
                    )}
                    {bases.length > 0 && (
                      <label className="flex w-full min-w-0 items-center gap-2 text-sm text-white/80 sm:ml-auto sm:w-auto">
                        <span className="shrink-0 whitespace-nowrap">CV dasar</span>
                        <select
                          value={baseId ?? ''}
                          onChange={(e) => setBaseId(e.target.value)}
                          className="min-w-0 flex-1 truncate rounded-lg border border-white/40 bg-transparent px-2 py-1.5 text-white sm:flex-none sm:max-w-[300px] [&>option]:bg-white [&>option]:text-foreground"
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

                  {shownJobs.length === 0 ? (
                    <div className="mt-6 rounded-2xl bg-white p-[42px_18px] text-center text-muted-foreground">
                      <h2 className="text-lg font-bold text-foreground">
                        {view === 'saved'
                          ? 'Belum ada lowongan tersimpan'
                          : view === 'recommended'
                            ? 'Belum ada rekomendasi'
                            : 'Belum ada lowongan yang cocok.'}
                      </h2>
                      <p className="mx-auto mt-2 max-w-md text-sm">
                        {view === 'saved'
                          ? 'Ketuk ikon bookmark di kartu lowongan untuk menyimpannya di perangkat ini.'
                          : view === 'recommended' && !baseDoc
                            ? 'Lengkapi profil dan CV untuk melihat kecocokan pekerjaan.'
                            : view === 'recommended'
                              ? 'Belum ada kata kunci lowongan yang dikenali dari CV dasarmu. Tempel deskripsi lengkap di editor untuk skor Job Match penuh.'
                              : 'Coba ubah kata kunci atau hapus beberapa filter.'}
                      </p>
                      <div className="mt-5 flex justify-center">
                        {view === 'saved' ? (
                          <button type="button" onClick={() => setView('all')} className={btnPrimary}>
                            Jelajahi lowongan
                          </button>
                        ) : view === 'recommended' && !baseDoc ? (
                          <a href="/editor?new=1" className={btnPrimary}>
                            Buat CV
                          </a>
                        ) : (
                          <button type="button" onClick={resetFilters} className={btnPrimary}>
                            {view === 'recommended' ? 'Tampilkan semua lowongan' : 'Hapus filter'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <ul className="mt-4 grid gap-[11px]" aria-live="polite">
                        {shownJobs.map((job) => (
                            <JobCard
                              key={job.jobUrl}
                              job={job}
                              score={scores.get(job.jobUrl)?.score}
                              onCreateCv={createCv}
                              saved={{ isSaved: saved.has(job.jobUrl), onToggle: () => toggleSaved(job.jobUrl) }}
                            />
                        ))}
                      </ul>
                      {visibleJobs.length > shownJobs.length && (
                        <div className="mt-5 flex justify-center">
                          <button
                            type="button"
                            onClick={() => setLimit((n) => n + 4)}
                            className="rounded-[13px] bg-brand-accent px-5 py-2.5 text-sm font-extrabold text-primary transition hover:brightness-105"
                          >
                            Muat lebih banyak
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
