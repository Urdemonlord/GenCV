'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Bookmark, Briefcase, FileText, MapPin, Search, Upload } from 'lucide-react';
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
 * Portal lowongan GenCV — dibuat semirip mungkin dengan mockup design.md /
 * index.html (neon editorial: bg #080B14, hijau #39FF14, magenta #FF00FF,
 * hero + panel Job Match miring, sidebar sumber, tab berjumlah, kartu
 * dengan badge cocok). Palet mockup diterapkan ke seluruh halaman lewat
 * override variabel tema di page.tsx, jadi header/footer ikut gelap-neon.
 *
 * Yang tetap jujur dan TIDAK meniru angka mockup:
 * - Jumlah tab dan sumber dihitung dari feed yang nyata. Angka mockup
 *   (27.842, 12,4k, dst.) tidak pernah dipakai.
 * - Badge % cocok dihitung sungguhan dari kata kunci teks lowongan
 *   (deskripsi bila ada, judul bila tidak) vs CV dasar, pakai matchKeywords
 *   yang sama dengan Job Match editor. Bila tidak ada CV dasar, atau teks
 *   lowongan tidak mengandung kata kunci yang dikenali, badge tidak tampil.
 *   Keterangannya tertulis di bawah hero — skor judul saja itu sinyal lemah,
 *   skor penuh tetap dari deskripsi yang ditempel di editor.
 * - Tidak ada verifikasi perusahaan, gaji, atau tahun pengalaman: feed tidak
 *   membawa data itu, jadi tidak ditampilkan (filter Pengalaman mockup pun
 *   tidak dibuat karena tidak ada yang bisa difilter).
 * - Tombol utama tetap "Buat CV dari lowongan ini", bukan "Buat CV & Lamar":
 *   GenCV tidak mengirim lamaran, tombol itu membuat CV.
 * - Kartu tetap tanpa label sumber (seperti mockup); sumber hanya terlihat
 *   di faset sidebar dan dropdown filter — ini sengaja membalik sebagian
 *   keputusan PR #70 atas permintaan eksplisit "persis mockup".
 *
 * "Tersimpan" disimpan di perangkat ini (localStorage), seperti CV — bukan
 * di akun, jadi tidak butuh login dan tidak hilang saat keluar.
 */

type Tab = 'all' | 'remote' | 'full-time' | 'part-time' | 'internship';
type Sort = 'relevant' | 'newest' | 'title';
type View = 'all' | 'saved';

const SAVED_KEY = 'gencv:saved-jobs';

const GREEN = 'hsl(var(--primary))';
const MAGENTA = 'hsl(var(--brand-accent))';
const GREEN_INK = 'hsl(var(--primary-foreground))';

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

/** Tile monogram perusahaan ala mockup: warna tetap dari hash nama. */
const TILE_COLORS = [
  { bg: MAGENTA, fg: '#071A4A' },
  { bg: GREEN, fg: '#FFFFFF' },
  { bg: '#DFE7FF', fg: '#3455E8' },
  { bg: '#002B91', fg: '#FFFFFF' },
];

function tileFor(company: string) {
  let hash = 0;
  for (let i = 0; i < company.length; i += 1) hash = (hash + company.charCodeAt(i)) % 997;
  return TILE_COLORS[hash % TILE_COLORS.length];
}

/**
 * Logo perusahaan bila feed membawanya, monogram bila tidak ada atau
 * logonya gagal dimuat. Logo dirender di kotak yang sama persis dengan
 * monogram (56px) supaya tata letak kartu tidak berubah.
 */
function CompanyLogo({ job }: { job: HunterJob }) {
  const [failed, setFailed] = useState(false);
  const tile = tileFor(job.company);
  if (!job.companyLogo || failed) {
    return (
      <span
        aria-hidden="true"
        className="grid size-14 shrink-0 place-items-center rounded-[13px] text-[26px] font-black"
        style={{ background: tile.bg, color: tile.fg }}
      >
        {job.company.charAt(0).toUpperCase()}
      </span>
    );
  }
  return (
    <span className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-[13px] bg-white">
      {/* unoptimized: logo berasal dari banyak host (CDN LinkedIn, Glassdoor,
          dsb.) yang tidak bisa di-whitelist di remotePatterns, dan optimasi
          Next tidak diinginkan untuk logo pihak ketiga. */}
      <Image
        src={job.companyLogo}
        alt=""
        aria-hidden="true"
        width={56}
        height={56}
        unoptimized
        referrerPolicy="no-referrer"
        className="size-14 object-contain p-1"
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
const btnGhost =
  'inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-surface-raised hover:text-foreground focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2';

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
  const [baseDoc, setBaseDoc] = useState<CV | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [tab, setTab] = useState<Tab>('all');
  const [sort, setSort] = useState<Sort>('relevant');
  const [view, setView] = useState<View>('all');

  useEffect(() => {
    const docs = listDocuments();
    setBases(docs);
    setBaseId((prev) => prev ?? (docs[0]?.id ?? ''));
    setSaved(loadSaved());
  }, []);

  useEffect(() => {
    setBaseDoc(baseId ? loadDocument(baseId) : null);
  }, [baseId]);

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
    setSourceFilter('');
    setTab('all');
    setSort('relevant');
  };

  const filtersActive =
    query !== '' || locationFilter !== '' || typeFilter !== '' || sourceFilter !== '' || tab !== 'all' || sort !== 'relevant';

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
      if (view === 'saved' && !saved.has(job.jobUrl)) return false;
      if (q && !(job.title + ' ' + job.company + ' ' + job.location).toLowerCase().includes(q)) return false;
      if (locationFilter === 'remote' && !isRemoteJob(job)) return false;
      if (locationFilter === 'indonesia' && !job.location.toLowerCase().includes('indonesia')) return false;
      const type = normalizedType(job);
      if (typeFilter === 'full-time' && type !== 'full-time') return false;
      if (typeFilter === 'part-time' && type !== 'part-time') return false;
      if (typeFilter === 'contract' && type !== 'contract') return false;
      if (typeFilter === 'internship' && type !== 'internship') return false;
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
  }, [jobs, view, saved, query, locationFilter, typeFilter, sourceFilter, tab, sort, scores]);

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
    'w-full appearance-none bg-transparent py-3.5 text-sm text-foreground outline-none [&>option]:bg-surface [&>option]:text-foreground';

  return (
    <div className="mx-auto max-w-[1500px] px-4 py-10 md:px-[4.5%]">
      {/* Hero ala mockup: headline + panel Job Match miring di kanan. */}
      <section>
        <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
          <div className="max-w-[760px]">
            <p className="flex items-center gap-2.5 text-[13px] tracking-wide text-muted-foreground">
              <span className="inline-block size-2.5 rounded-full bg-primary shadow-[0_0_18px_hsl(var(--primary)/0.4)]" />
              Job Portal by GenCV
            </p>
            <h1 className="mt-4 text-[clamp(34px,4.2vw,60px)] font-extrabold leading-[1.04] tracking-[-0.055em]">
              Temukan peluang kerja yang <span className="italic text-brand-accent">sesuai dengan profilmu.</span>
            </h1>
            <p className="mt-4 max-w-[690px] text-[17px] leading-[1.65] text-muted-foreground">
              Jelajahi lowongan dari berbagai sumber, simpan yang menarik, dan cek kecocokan dengan CV-mu.
            </p>
          </div>

          <aside
            aria-label="Ringkasan Job Match"
            className="w-full max-w-[370px] shrink-0 rounded-[18px] border border-border bg-surface p-[22px] shadow-[6px_6px_0_hsl(var(--brand-accent)/0.65)] lg:w-[370px] lg:min-w-[310px] lg:rotate-[-2deg] lg:shadow-[12px_12px_0_hsl(var(--brand-accent)/0.75)]"
          >
            <h2 className="text-[15px] font-bold">Job Match dengan profilmu</h2>
            {bestMatch ? (
              <div className="mt-4 flex items-center gap-[18px]">
                <div className="shrink-0">
                  <div
                    className="relative grid size-[88px] place-items-center rounded-full"
                    style={{
                      background: `conic-gradient(${GREEN} 0 ${bestMatch.score}%, hsl(var(--border)) ${bestMatch.score}% 100%)`,
                    }}
                  >
                    <span className="absolute inset-[9px] rounded-full bg-surface" />
                    <strong className="relative text-[25px]">{bestMatch.score}%</strong>
                  </div>
                  <p className="mt-2 text-center text-xs font-extrabold text-primary">
                    {bestMatch.score >= 90 ? 'Sangat cocok' : bestMatch.score >= 50 ? 'Cocok' : 'Perlu dicek'}
                  </p>
                </div>
                <ul className="grid gap-2 text-xs text-foreground">
                  {bestMatch.result.matched.slice(0, 3).map((term) => (
                    <li key={term} className="flex items-center gap-2">
                      <span className="grid size-[17px] shrink-0 place-items-center rounded-full bg-primary text-[11px] font-black text-primary-foreground">
                        ✓
                      </span>
                      {term}
                    </li>
                  ))}
                  {bestMatch.result.matched.length === 0 && <li>Belum ada kata kunci yang cocok.</li>}
                  <li className="text-muted-foreground">{bestMatch.job.title}</li>
                </ul>
              </div>
            ) : baseDoc ? (
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                Belum ada kata kunci lowongan yang dikenali dari CV dasarmu. Tempel deskripsi lengkap di editor untuk
                skor Job Match penuh.
              </p>
            ) : (
              <>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Buat atau pilih CV dasar untuk melihat kecocokanmu dengan lowongan di bawah.
                </p>
                <a href="/editor?new=1" className={`${btnGreen} mt-4`}>
                  Buat CV
                </a>
              </>
            )}
          </aside>
        </div>
        <p className="mt-6 max-w-[760px] text-xs leading-relaxed text-muted-foreground/70">
          Skor dihitung dari kata kunci deskripsi lowongan — atau judulnya bila deskripsi belum ada — dibandingkan
          dengan CV dasarmu. Bukan angka contoh: lowongan tanpa kata kunci yang dikenali tidak menampilkan badge.
        </p>
      </section>

      {/* Search + filter ala mockup. */}
      <form
        className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-3 lg:grid-cols-[minmax(260px,1.5fr)_repeat(3,minmax(125px,0.5fr))]"
        onSubmit={(e) => e.preventDefault()}
      >
        <label className="flex min-w-0 items-center gap-2 rounded-[14px] border border-border bg-surface py-1.5 pl-4 pr-1.5">
          <Search className="size-[22px] shrink-0 text-foreground" aria-hidden="true" />
          <span className="sr-only">Cari posisi, perusahaan, atau lokasi</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari posisi, perusahaan, atau skill…"
            className="w-full min-w-0 bg-transparent px-2 py-3 text-[15px] text-foreground outline-none placeholder:text-muted-foreground"
          />
          <button type="submit" className={`${btnGreen} h-11 shrink-0 px-6`}>
            Cari
          </button>
        </label>
        <label className="relative flex items-center justify-between gap-2 rounded-[13px] border border-border bg-surface px-3">
          <span className="sr-only">Filter lokasi</span>
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className={filterSelectClass}
          >
            <option value="">⌖ Lokasi</option>
            <option value="remote">Remote</option>
            <option value="indonesia">Indonesia</option>
          </select>
          <span aria-hidden="true">⌄</span>
        </label>
        <label className="relative flex items-center justify-between gap-2 rounded-[13px] border border-border bg-surface px-3">
          <span className="sr-only">Filter tipe kerja</span>
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className={filterSelectClass}>
            <option value="">▣ Tipe kerja</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Magang</option>
          </select>
          <span aria-hidden="true">⌄</span>
        </label>
        <label className="relative flex items-center justify-between gap-2 rounded-[13px] border border-border bg-surface px-3">
          <span className="sr-only">Filter sumber</span>
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={filterSelectClass}>
            <option value="">▱ Sumber</option>
            {sourceCounts.map(([name]) => (
              <option key={name} value={name.toLowerCase()}>
                {name}
              </option>
            ))}
          </select>
          <span aria-hidden="true">⌄</span>
        </label>
      </form>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] items-start gap-7 lg:grid-cols-[250px_minmax(0,1fr)]">
        {/* Sidebar ala mockup: di mobile jadi baris horizontal. */}
        <aside
          aria-label="Navigasi lowongan"
          className="rounded-[17px] border border-border bg-surface p-[15px] lg:sticky lg:top-4"
        >
          <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
            <button
              type="button"
              onClick={() => setView('all')}
              aria-current={view === 'all' ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-[11px] px-3 py-3 text-sm font-semibold ${
                view === 'all' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-surface-raised'
              }`}
            >
              <Search className="size-[19px] shrink-0" aria-hidden="true" />
              Jelajahi Lowongan
            </button>
            <button
              type="button"
              onClick={() => setView('saved')}
              aria-current={view === 'saved' ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 whitespace-nowrap rounded-[11px] px-3 py-3 text-sm font-semibold ${
                view === 'saved' ? 'bg-primary text-primary-foreground' : 'text-foreground hover:bg-surface-raised'
              }`}
            >
              <Bookmark className="size-[19px] shrink-0" aria-hidden="true" />
              Tersimpan
              <span className="rounded-full bg-surface-raised px-2 py-0.5 text-[11px] text-muted-foreground">{saved.size}</span>
            </button>
          </nav>
          <div className="mt-4 hidden lg:block">
            <div className="mx-2 h-px bg-border" />
            <p className="px-2.5 pb-2 pt-4 text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
              Sumber lowongan
            </p>
            {sourceCounts.map(([name, count]) => (
              <div key={name} className="flex items-center gap-2.5 px-2.5 py-2 text-[13px] text-foreground">
                <span className="size-2 rounded-full bg-brand-accent" />
                {name}
                <span className="ml-auto rounded-full bg-surface-raised px-2 py-0.5 text-[11px] text-muted-foreground">{count}</span>
              </div>
            ))}
            <p className="px-2.5 pt-3 text-xs leading-relaxed text-muted-foreground/70">
              Jumlah dihitung dari lowongan yang benar-benar ada di feed saat ini.
            </p>
            <p className="px-2.5 pt-2 text-xs leading-relaxed text-muted-foreground/70">
              Lowongan tersimpan hanya ada di perangkat ini. Masuk tidak diperlukan, dan keluar tidak menghapusnya.
            </p>
          </div>
        </aside>

        <section aria-label="Hasil lowongan">
          {/* Tab + sortir ala mockup. */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border">
            <div role="tablist" aria-label="Kategori lowongan" className="flex gap-6 overflow-x-auto">
              {TAB_LABELS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  role="tab"
                  aria-selected={tab === t.id}
                  onClick={() => setTab(t.id)}
                  className={`relative whitespace-nowrap pb-[15px] text-sm ${
                    tab === t.id ? 'font-extrabold text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {t.label} <strong>({tabCounts[t.id]})</strong>
                  {tab === t.id && <span className="absolute -bottom-px left-0 right-0 h-[3px] rounded bg-primary" />}
                </button>
              ))}
            </div>
            <label className="mb-2.5 flex items-center gap-2 whitespace-nowrap rounded-[11px] border border-border bg-surface px-3 py-2.5 text-sm">
              <span className="text-xs text-muted-foreground">Urutkan:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as Sort)}
                className="bg-transparent text-foreground outline-none [&>option]:bg-surface"
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
                  <div key={i} className="animate-pulse rounded-2xl border border-border bg-surface p-[18px]">
                    <div className="h-5 w-2/3 rounded bg-surface-raised" />
                    <div className="mt-3 h-4 w-1/3 rounded bg-surface-raised" />
                    <div className="mt-4 h-9 w-40 rounded bg-surface-raised" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-2xl border border-dashed border-border p-10 text-center">
                <FileText className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
                <h2 className="mt-4 text-lg font-semibold">Feed otomatis hunter tidak bisa dijangkau</h2>
                <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                  Sebagai fallback, impor file jobs.json hasil hunter secara manual. Daftar ini tidak dikirim ke server
                  mana pun.
                </p>
                <div className="mt-5 flex justify-center gap-2">
                  <button type="button" onClick={() => fileInput.current?.click()} className={btnOutline}>
                    <Upload aria-hidden="true" />
                    Impor jobs.json
                  </button>
                  <button type="button" onClick={loadFeed} className={btnGhost}>
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
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <p className="text-[13px] text-muted-foreground" aria-live="polite">
                  <strong className="text-foreground">{visibleJobs.length} lowongan</strong>
                  {skipped > 0 ? `, ${skipped} entri tidak valid dilewati` : ''}
                  {feedSource === 'otomatis'
                    ? ' — dimuat otomatis dari hunter (diperbarui tiap pagi).'
                    : ' — dari file yang kamu impor.'}
                </p>
                {feedSource === 'manual' && (
                  <button type="button" onClick={loadFeed} className={btnGhost}>
                    Kembali ke feed otomatis
                  </button>
                )}
                {filtersActive && (
                  <button type="button" onClick={resetFilters} className={btnGhost}>
                    Reset filter
                  </button>
                )}
                {bases.length > 0 && (
                  <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
                    CV dasar
                    <select
                      value={baseId ?? ''}
                      onChange={(e) => setBaseId(e.target.value)}
                      className="rounded-lg border border-border bg-surface px-2 py-1.5 text-foreground"
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
                <div className="mt-6 rounded-2xl border border-dashed border-border p-[50px_20px] text-center text-muted-foreground">
                  <h2 className="text-lg font-semibold text-foreground">
                    {view === 'saved' ? 'Belum ada lowongan tersimpan' : 'Tidak ada lowongan yang cocok'}
                  </h2>
                  <p className="mx-auto mt-2 max-w-md text-sm">
                    {view === 'saved'
                      ? 'Ketuk ikon bookmark di kartu lowongan untuk menyimpannya di perangkat ini.'
                      : 'Coba ubah kata kunci, hapus filter, atau pindah ke tab Semua.'}
                  </p>
                  <div className="mt-5 flex justify-center">
                    {view === 'saved' ? (
                      <button type="button" onClick={() => setView('all')} className={btnOutline}>
                        Jelajahi lowongan
                      </button>
                    ) : (
                      <button type="button" onClick={resetFilters} className={btnOutline}>
                        Tampilkan semua lowongan
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <ul className="mt-4 grid gap-[13px]" aria-live="polite">
                  {visibleJobs.map((job) => {
                    const type = normalizedType(job);
                    const score = scores.get(job.jobUrl)?.score;
                    const isSaved = saved.has(job.jobUrl);
                    return (
                      <li
                        key={job.jobUrl}
                        className="grid grid-cols-[56px_minmax(0,1fr)] gap-4 rounded-2xl border border-border bg-surface p-[18px] transition hover:-translate-y-px hover:border-muted-foreground/60 lg:grid-cols-[56px_minmax(0,1fr)_auto]"
                      >
                        <CompanyLogo job={job} />
                        <div className="min-w-0">
                          <h2 className="text-[18px] font-extrabold leading-[1.3] tracking-[-0.025em]">
                            <a href={job.jobUrl} target="_blank" rel="noreferrer" className="hover:underline">
                              {job.title}
                            </a>
                          </h2>
                          <p className="mt-1 text-sm text-muted-foreground">{job.company}</p>
                          <div className="mt-2.5 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                            {job.location && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="size-[15px] text-foreground" aria-hidden="true" />
                                {job.location}
                              </span>
                            )}
                            {type && (
                              <span className="inline-flex items-center gap-1.5">
                                <Briefcase className="size-[15px] text-foreground" aria-hidden="true" />
                                {TYPE_LABEL[type]}
                              </span>
                            )}
                            {isRemoteJob(job) && !job.location && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="size-[15px] text-foreground" aria-hidden="true" />
                                Remote
                              </span>
                            )}
                          </div>
                          {(job.flagDemoLike || !job.description) && (
                            <p className="mt-2 text-xs text-muted-foreground/70">
                              {[
                                job.flagDemoLike ? 'Perlu dicek — mirip lowongan demo' : null,
                                !job.description ? 'Deskripsi belum ada — tempel di editor' : null,
                              ]
                                .filter(Boolean)
                                .join(' · ')}
                            </p>
                          )}
                        </div>
                        <div className="col-span-2 flex flex-wrap items-center gap-3 lg:col-span-1 lg:justify-end">
                          {score !== null && score !== undefined && (
                            <span
                              className={`whitespace-nowrap rounded-full border px-2.5 py-1.5 text-xs font-extrabold ${
                                score < 93
                                  ? 'border-brand-accent text-brand-accent'
                                  : 'border-primary text-primary'
                              }`}
                            >
                              ✧ {score}% cocok
                            </span>
                          )}
                          {job.datePosted && (
                            <span className="whitespace-nowrap text-center text-xs text-muted-foreground">{job.datePosted}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => toggleSaved(job.jobUrl)}
                            aria-pressed={isSaved}
                            aria-label={isSaved ? 'Hapus dari tersimpan' : 'Simpan lowongan'}
                            title={isSaved ? 'Tersimpan' : 'Simpan'}
                            className={`grid size-[38px] shrink-0 place-items-center rounded-lg transition hover:bg-[hsl(var(--brand-accent)/0.08)] hover:text-brand-accent focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                              isSaved ? 'bg-[hsl(var(--brand-accent)/0.08)] text-brand-accent' : 'text-foreground'
                            }`}
                          >
                            <Bookmark className="size-[22px]" fill={isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
                          </button>
                          <div className="flex w-full flex-wrap gap-2 lg:w-auto">
                            <a
                              href={job.jobUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`${btnOutline} flex-1 px-3 py-2.5 text-xs lg:flex-none`}
                            >
                              Lihat lowongan
                            </a>
                            <button
                              type="button"
                              onClick={() => createCv(job)}
                              className={`${btnGreen} flex-1 px-3 py-2.5 text-xs lg:min-w-[145px] lg:flex-none`}
                            >
                              Buat CV dari lowongan ini
                            </button>
                          </div>
                        </div>
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
