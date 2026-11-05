'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { BarChart3, Bookmark, Briefcase, FileText, MapPin, Search, Sparkles, Upload } from 'lucide-react';
import { HeroArt } from '../components/landing/hero-art';
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
} from '@/lib/cv/hunter';

/**
 * Portal lowongan Ayo Kerja — dibuat semirip mungkin dengan mockup design.md /
 * index.html (kuning #F4E11B + biru royal #0035AD: hero kuning, seksi hasil
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

const BLUE = 'hsl(var(--primary))';
const YELLOW = 'hsl(var(--brand-accent))';

const TAB_LABELS: { id: Tab; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'remote', label: 'Remote' },
  { id: 'full-time', label: 'Full-time' },
  { id: 'part-time', label: 'Part-time' },
  { id: 'internship', label: 'Magang' },
];

const SITE_NAMES: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  glassdoor: 'Glassdoor',
};

/** Tile monogram perusahaan ala mockup: kuning, biru, atau biru-muda. */
const TILE_COLORS = [
  { bg: YELLOW, fg: '#0035AD' },
  { bg: BLUE, fg: '#FFFFFF' },
  { bg: '#EAF0FF', fg: '#0035AD' },
];

function tileFor(company: string) {
  let hash = 0;
  for (let i = 0; i < company.length; i += 1) hash = (hash + company.charCodeAt(i)) % 997;
  return TILE_COLORS[hash % TILE_COLORS.length];
}

/**
 * Logo perusahaan bila feed membawanya, monogram bila tidak ada atau
 * logonya gagal dimuat. Logo dirender di kotak yang sama persis dengan
 * monogram (48px) supaya tata letak kartu tidak berubah.
 */
function CompanyLogo({ job }: { job: HunterJob }) {
  const [failed, setFailed] = useState(false);
  const tile = tileFor(job.company);
  if (!job.companyLogo || failed) {
    return (
      <span
        aria-hidden="true"
        className="grid size-12 shrink-0 place-items-center rounded-[11px] text-[22px] font-black"
        style={{ background: tile.bg, color: tile.fg }}
      >
        {job.company.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-[11px] bg-white">
      {/* unoptimized: logo berasal dari banyak host (CDN LinkedIn, Glassdoor,
          dsb.) yang tidak bisa di-whitelist di remotePatterns, dan optimasi
          Next tidak diinginkan untuk logo pihak ketiga. */}
      <Image
        src={job.companyLogo}
        alt=""
        aria-hidden="true"
        width={48}
        height={48}
        unoptimized
        referrerPolicy="no-referrer"
        className="size-12 object-contain p-1"
        onError={() => setFailed(true)}
      />
    </span>
  );
}

function siteName(site: string) {
  const key = site.toLowerCase();
  return SITE_NAMES[key] ?? (site ? site.charAt(0).toUpperCase() + site.slice(1) : 'Lainnya');
}

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

/**
 * Pengalaman untuk ditampilkan di kartu — HANYA string literal dari teks
 * iklan (judul + deskripsi), bukan hasil perkiraan experienceBand: rentang
 * "X–Y tahun" tampil apa adanya, "X+ tahun" tetap "X+ tahun", "minimal X
 * tahun" jadi "X+ tahun", "senior" jadi "Senior", entry/junior/fresh
 * graduate jadi "Entry level". Null bila iklan tidak menyebutkannya.
 */
function experienceText(job: HunterJob): string | null {
  const text = `${job.title} ${job.description ?? ''}`;
  const unit = (raw: string) => (/tahun/i.test(raw) ? 'tahun' : 'years');
  const range = text.match(/(\d+)\s*[-–]\s*(\d+)\s*(tahun|years?)\b/i);
  if (range) return `${range[1]}–${range[2]} ${unit(range[3])}`;
  const plus = text.match(/(\d+)\s*\+\s*(tahun|years?)\b/i);
  if (plus) return `${plus[1]}+ ${unit(plus[2])}`;
  const min = text.match(/\b(minimal|minimum|at least)\s*(\d+)\s*(tahun|years?)\b/i);
  if (min) return `${min[2]}+ ${unit(min[3])}`;
  if (/\bsenior\b/i.test(text)) return 'Senior';
  if (/\b(entry level|fresh graduate|junior)\b/i.test(text)) return 'Entry level';
  return null;
}

/**
 * Waktu posting relatif dari ISO date vs sekarang ("X jam lalu" /
 * "X hari lalu" / "X minggu lalu"). Null bila tanggal kosong, tak terurai,
 * atau di masa depan — elemennya lalu disembunyikan, bukan menampilkan
 * tanggal mentah.
 */
function relativePosted(datePosted: string): string | null {
  const time = Date.parse(datePosted);
  if (Number.isNaN(time)) return null;
  const diffMs = Date.now() - time;
  if (diffMs < 0) return null;
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return 'Baru saja';
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return `${Math.floor(days / 7)} minggu lalu`;
}

function isRemoteJob(job: HunterJob): boolean {
  return job.isRemote || /remote|jarak jauh/i.test(job.location ?? '');
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

const btnGreen =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50';
const btnOutline =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold transition hover:border-muted-foreground/60 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 disabled:opacity-50';
const btnWhite =
  'inline-flex items-center justify-center gap-2 rounded-[13px] bg-white px-4 py-2.5 text-sm font-extrabold text-primary transition hover:bg-white/90 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2 disabled:opacity-50';
const btnGhostLight =
  'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-white/90 transition hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2';

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
    'w-full appearance-none bg-transparent py-3.5 text-sm font-extrabold text-primary outline-none [&>option]:bg-white [&>option]:text-[#071A4A]';

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
              <h1 className="mt-4 max-w-[760px] text-[clamp(2.5rem,4.5vw,4.35rem)] font-black uppercase leading-[0.98] tracking-[-0.06em]">
                <span className="block">Temukan peluang kerja yang sesuai</span>
                <span className="mt-1 inline-block bg-primary px-2.5 pb-1 text-brand-accent">dengan profilmu.</span>
              </h1>
              <p className="mt-4 max-w-[620px] text-base font-medium leading-[1.55] text-[#10265A]">
                Jelajahi lowongan dari berbagai sumber, dapatkan rekomendasi yang relevan, dan persiapkan CV untuk
                langkah karier berikutnya.
              </p>
            </div>
            <HeroArt />
          </div>

          {/* Search + filter di dalam hero, seperti mockup. */}
          <form
            className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(250px,1.65fr)_repeat(4,minmax(120px,auto))]"
            onSubmit={(e) => e.preventDefault()}
          >
            <label className="flex min-w-0 items-center gap-2.5 rounded-[14px] border-[1.5px] border-primary bg-white py-1.5 pl-4 pr-1.5 sm:col-span-2 lg:col-span-1">
              <Search className="size-5 shrink-0 text-primary" aria-hidden="true" />
              <span className="sr-only">Cari posisi, perusahaan, atau skill</span>
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari posisi, perusahaan, atau skill..."
                className="w-full min-w-0 bg-transparent px-1 py-3 text-sm text-foreground outline-none placeholder:text-[#62708D]"
              />
              <button
                type="submit"
                className="h-11 shrink-0 rounded-[13px] bg-primary px-5 text-sm font-extrabold text-white transition hover:bg-[#002B91]"
              >
                Cari
              </button>
            </label>
            <label className="flex min-h-[54px] items-center gap-2 rounded-[13px] border-[1.5px] border-primary px-3 text-[13px] font-extrabold text-primary">
              <span aria-hidden="true">⌖</span>
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
              <span aria-hidden="true">⌄</span>
            </label>
            <label className="flex min-h-[54px] items-center gap-2 rounded-[13px] border-[1.5px] border-primary px-3 text-[13px] font-extrabold text-primary">
              <span aria-hidden="true">▣</span>
              <span className="sr-only">Filter tipe kerja</span>
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={filterSelectClass}>
                <option value="">Tipe Kerja</option>
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Magang</option>
              </select>
              <span aria-hidden="true">⌄</span>
            </label>
            <label className="flex min-h-[54px] items-center gap-2 rounded-[13px] border-[1.5px] border-primary px-3 text-[13px] font-extrabold text-primary">
              <span aria-hidden="true">▥</span>
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
              <span aria-hidden="true">⌄</span>
            </label>
            <label className="flex min-h-[54px] items-center gap-2 rounded-[13px] border-[1.5px] border-primary px-3 text-[13px] font-extrabold text-primary">
              <span aria-hidden="true">▱</span>
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
              <span aria-hidden="true">⌄</span>
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

          <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
            {/* Sidebar ala mockup: di mobile jadi baris horizontal. */}
            <aside aria-label="Navigasi portal" className="lg:sticky lg:top-[90px]">
              <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
                <button
                  type="button"
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
                <div role="tablist" aria-label="Kategori lowongan" className="flex gap-6 overflow-x-auto">
                  {TAB_LABELS.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="tab"
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
                    className="bg-transparent outline-none [&>option]:bg-white [&>option]:text-[#071A4A]"
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
                    <h2 className="mt-4 text-lg font-semibold">Feed otomatis hunter tidak bisa dijangkau</h2>
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
                <div className="mt-6 rounded-2xl bg-white p-8 text-center text-[#5E6B88]">
                  <h2 className="text-lg font-bold text-[#071A4A]">Lamaran Saya belum tersedia</h2>
                  <p className="mx-auto mt-2 max-w-md text-sm">
                    Pelacakan lamaran belum termasuk dalam portal ini. Lowongan yang kamu simpan ada di Tersimpan.
                  </p>
                  <button type="button" onClick={() => setView('saved')} className={`${btnGreen} mt-5`}>
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
                      <label className="ml-auto flex items-center gap-2 text-sm text-white/80">
                        CV dasar
                        <select
                          value={baseId ?? ''}
                          onChange={(e) => setBaseId(e.target.value)}
                          className="rounded-lg border border-white/40 bg-transparent px-2 py-1.5 text-white [&>option]:bg-white [&>option]:text-[#071A4A]"
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
                    <div className="mt-6 rounded-2xl bg-white p-[42px_18px] text-center text-[#5E6B88]">
                      <h2 className="text-lg font-bold text-[#071A4A]">
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
                          <button type="button" onClick={() => setView('all')} className={btnGreen}>
                            Jelajahi lowongan
                          </button>
                        ) : view === 'recommended' && !baseDoc ? (
                          <a href="/editor?new=1" className={btnGreen}>
                            Buat CV
                          </a>
                        ) : (
                          <button type="button" onClick={resetFilters} className={btnGreen}>
                            {view === 'recommended' ? 'Tampilkan semua lowongan' : 'Hapus filter'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      <ul className="mt-4 grid gap-[11px]" aria-live="polite">
                        {shownJobs.map((job) => {
                          const type = normalizedType(job);
                          const score = scores.get(job.jobUrl)?.score;
                          const isSaved = saved.has(job.jobUrl);
                          const exp = experienceText(job);
                          const posted = relativePosted(job.datePosted);
                          return (
                            <li
                              key={job.jobUrl}
                              className="grid grid-cols-[48px_minmax(0,1fr)] gap-[15px] rounded-2xl bg-white p-[15px_17px] text-[#071A4A] shadow-[0_3px_0_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.16)] lg:grid-cols-[48px_minmax(0,1fr)_auto]"
                            >
                              <CompanyLogo job={job} />
                              <div className="min-w-0">
                                <h2 className="text-[17px] font-black leading-[1.2] tracking-[-0.025em]">
                                  <a href={job.jobUrl} target="_blank" rel="noreferrer" className="hover:underline">
                                    {job.title}
                                  </a>
                                </h2>
                                <p className="mt-1 text-[13px] font-bold text-[#34466E]">{job.company}</p>
                                <div className="mt-2 flex flex-wrap gap-x-[15px] gap-y-1 text-xs font-semibold text-[#263B6A]">
                                  {job.location && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <MapPin className="size-[15px] text-primary" aria-hidden="true" />
                                      {job.location}
                                    </span>
                                  )}
                                  {type && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <Briefcase className="size-[15px] text-primary" aria-hidden="true" />
                                      {TYPE_LABEL[type]}
                                    </span>
                                  )}
                                  {exp && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <BarChart3 className="size-[15px] text-primary" aria-hidden="true" />
                                      {exp}
                                    </span>
                                  )}
                                  {isRemoteJob(job) && !job.location && (
                                    <span className="inline-flex items-center gap-1.5">
                                      <MapPin className="size-[15px] text-primary" aria-hidden="true" />
                                      Remote
                                    </span>
                                  )}
                                </div>
                                <p className="mt-1.5 text-[10px] text-[#75809A]">Sumber: {siteName(job.site)}</p>
                                {(job.flagDemoLike || !job.description) && (
                                  <p className="mt-1 text-xs text-[#5E6B88]/80">
                                    {[
                                      job.flagDemoLike ? 'Perlu dicek — mirip lowongan demo' : null,
                                      !job.description ? 'Deskripsi belum ada — tempel di editor' : null,
                                    ]
                                      .filter(Boolean)
                                      .join(' · ')}
                                  </p>
                                )}
                              </div>
                              <div className="col-span-2 flex flex-wrap items-center gap-3.5 border-t border-[#D9E1F2] pt-2.5 lg:col-span-1 lg:border-0 lg:pt-0">
                                {score === undefined ? (
                                  <span className="whitespace-nowrap rounded-full bg-[#EAF0FF] px-2.5 py-1.5 text-xs font-black text-primary">
                                    Lengkapi profil untuk Job Match
                                  </span>
                                ) : score === null ? (
                                  <span className="whitespace-nowrap rounded-full bg-[#EAF0FF] px-2.5 py-1.5 text-xs font-black text-primary">
                                    Belum ada kata kunci yang cocok
                                  </span>
                                ) : (
                                  <span className="whitespace-nowrap rounded-full bg-brand-accent px-2.5 py-1.5 text-xs font-black text-primary">
                                    ✦ {score}% cocok
                                  </span>
                                )}
                                {posted && (
                                  <span className="whitespace-nowrap text-[11px] font-semibold text-[#64718C]">
                                    {posted}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  onClick={() => toggleSaved(job.jobUrl)}
                                  aria-pressed={isSaved}
                                  aria-label={isSaved ? 'Hapus dari tersimpan' : 'Simpan lowongan'}
                                  title={isSaved ? 'Tersimpan' : 'Simpan'}
                                  className={`grid size-[38px] shrink-0 place-items-center rounded-[9px] text-primary transition hover:bg-[#EAF0FF] focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                                    isSaved ? 'bg-[#EAF0FF]' : ''
                                  }`}
                                >
                                  <Bookmark
                                    className="size-[21px]"
                                    fill={isSaved ? 'currentColor' : 'none'}
                                    aria-hidden="true"
                                  />
                                </button>
                                <div className="flex w-full flex-wrap gap-2 lg:w-auto">
                                  <button
                                    type="button"
                                    onClick={() => createCv(job)}
                                    className={`${btnGreen} flex-1 px-3 py-2.5 text-xs lg:min-w-[145px] lg:flex-none`}
                                  >
                                    Buat CV &amp; Lamar ↗
                                  </button>
                                  <a
                                    href={job.jobUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className={`${btnOutline} flex-1 px-3 py-2.5 text-xs lg:flex-none`}
                                  >
                                    Lihat Detail
                                  </a>
                                </div>
                              </div>
                            </li>
                          );
                        })}
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
