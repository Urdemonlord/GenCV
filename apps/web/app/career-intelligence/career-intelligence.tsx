'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, MapPin } from 'lucide-react';
import { HeroArt } from '../components/landing/hero-art';
import { PageHero } from '../components/landing/page-hero';
import { CompanyLogo, experienceText, relativePosted, siteName } from '../lowongan/job-list';
import { Button, Chip, Panel, ProgressBar, ScoreRing } from '@/components/ds';
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/sync/auth-client';
import { runSyncRound } from '@/lib/sync/client';
import { analyzeCv, scoreLabel, type Severity } from '@/lib/cv/analysis/analyze';
import { matchKeywords, type KeywordMatch } from '@/lib/cv/analysis/keywords';
import { HUNTER_FEED_URL, HUNTER_PORTALS, cvTitleForJob, parseHunterJobs, type HunterJob } from '@/lib/cv/hunter';
import { emptyCV, type CV } from '@/lib/cv/model';
import {
  createDocument,
  duplicateDocument,
  listDocuments,
  loadDocument,
  saveDocument,
  type CvSummary,
} from '@/lib/cv/storage';

/**
 * Career Intelligence — semua angka di halaman ini dihitung di browser dari
 * data nyata, bukan dari angka demo:
 * - Kesiapan ATS: analyzeCv pada CV dasar (aturan yang bisa dilihat).
 * - Lowongan paling cocok: matchKeywords CV dasar vs feed live, sama seperti
 *   Job Match di /lowongan (deskripsi bila ada, judul bila tidak).
 * - Skill gap: keyword yang muncul di teks lowongan teratas tapi belum ada
 *   di CV dasar.
 * Yang tidak ada di sini, sengaja tidak ditampilkan: gaji, data pasar, dan
 * angka lain yang tidak bisa dihitung dari CV + feed.
 */

const TOP_JOBS = 6;

const SEVERITY_LABEL: Record<Severity, string> = {
  good: 'Baik',
  warn: 'Perlu dicek',
  issue: 'Belum ada',
};

const SEVERITY_TONE: Record<Severity, 'success' | 'warning' | 'danger'> = {
  good: 'success',
  warn: 'warning',
  issue: 'danger',
};

export function CareerIntelligence({ syncConfigured }: { syncConfigured: boolean }) {
  const router = useRouter();
  const { toast } = useToast();
  const { data: session, isPending: sessionPending, error: sessionError } = authClient.useSession();
  const [bases, setBases] = useState<CvSummary[]>([]);
  const [baseId, setBaseId] = useState<string | null>(null);
  const [baseDoc, setBaseDoc] = useState<CV | null>(null);
  const [jobs, setJobs] = useState<HunterJob[] | null>(null);
  const [feedState, setFeedState] = useState<'loading' | 'loaded' | 'failed'>('loading');

  useEffect(() => {
    const docs = listDocuments();
    setBases(docs);
    // Default CV terbaru (yang terakhir diisi/diubah), sama seperti /lowongan.
    setBaseId((prev) => prev ?? (docs[0]?.id ?? ''));
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
        const { jobs: feedJobs } = parseHunterJobs(parsed);
        if (feedJobs.length === 0) throw new Error();
        setJobs(feedJobs);
        setFeedState('loaded');
      })
      .catch(() => setFeedState('failed'));
  };

  useEffect(loadFeed, []);

  const analysis = useMemo(() => (baseDoc ? analyzeCv(baseDoc) : null), [baseDoc]);

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

  const topJobs = useMemo(() => {
    if (!jobs) return [];
    return jobs
      .map((job) => ({ job, score: scores.get(job.jobUrl)?.score ?? null }))
      .filter((entry): entry is { job: HunterJob; score: number } => typeof entry.score === 'number')
      .sort((a, b) => b.score - a.score)
      .slice(0, TOP_JOBS);
  }, [jobs, scores]);

  /** Keyword yang muncul di lowongan teratas tapi belum ada di CV dasar. */
  const skillGaps = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { job } of topJobs) {
      for (const term of scores.get(job.jobUrl)?.missing ?? []) {
        counts.set(term, (counts.get(term) ?? 0) + 1);
      }
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [topJobs, scores]);

  const sourceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const job of jobs ?? []) {
      const name = siteName(job.site);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [jobs]);

  /**
   * Alur yang sama dengan "Buat CV & Lamar" di /lowongan: wajib login kalau
   * login tersedia di deployment ini, duplikat CV dasar (atau CV kosong),
   * isi judul + deskripsi lowongan, sinkron best-effort, lalu buka editor.
   */
  const createCv = async (job: HunterJob) => {
    if (syncConfigured && sessionPending) {
      toast({ title: 'Memeriksa status masuk…', description: 'Tunggu sebentar lalu coba lagi.' });
      return;
    }
    if (syncConfigured && !sessionError && !session) {
      router.push(`/masuk?callbackURL=${encodeURIComponent('/career-intelligence')}`);
      return;
    }
    try {
      let id: string;
      if (baseId) {
        const copyId = duplicateDocument(baseId);
        if (!copyId) throw new Error();
        const copy = loadDocument(copyId);
        if (!copy) throw new Error();
        saveDocument(copyId, { ...copy, title: cvTitleForJob(job), jobDescription: job.description });
        id = copyId;
      } else {
        const cv = emptyCV();
        cv.title = cvTitleForJob(job);
        cv.jobDescription = job.description;
        id = createDocument(cv);
      }
      if (syncConfigured && session) {
        try {
          await runSyncRound();
        } catch {
          // Best-effort: salinan lokal tetap ada, panel dashboard bisa mencoba lagi.
        }
      }
      const needsDescription = !job.description?.trim();
      const target = `/editor?id=${encodeURIComponent(id)}${needsDescription ? `&fromJob=1&jobTitle=${encodeURIComponent(job.title)}&jobUrl=${encodeURIComponent(job.jobUrl)}` : ''}`;
      router.push(target);
    } catch {
      toast({ variant: 'destructive', title: 'Gagal membuat CV', description: 'Penyimpanan perangkat mungkin penuh.' });
    }
  };

  const baseTitle = (doc: CvSummary) => doc.title || doc.headline || doc.name || 'CV tanpa judul';

  return (
    <>
      <PageHero
        eyebrow="Career Intelligence"
        title={
          <>
            <span className="block">Seberapa siap CV-mu</span>
            <span className="mt-1 inline-block bg-primary px-2.5 pb-1 text-brand-accent">untuk melamar?</span>
          </>
        }
        lead="Skor ATS, lowongan paling cocok, dan skill yang belum ada di CV — semuanya dihitung dari CV dan feed lowongan yang kamu punya, bukan dari angka demo."
        art={<HeroArt />}
        size="display"
      />

      {!baseDoc ? (
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
          <Panel className="p-6 text-center sm:p-10">
            <h2 className="text-xl font-bold">Belum ada CV di perangkat ini</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Halaman ini menghitung kesiapan ATS, kecocokan lowongan, dan skill gap dari CV dasarmu. Buat CV dulu,
              lalu kembali ke sini untuk melihat hasilnya.
            </p>
            <Button asChild variant="primary" className="mt-6">
              <Link href="/editor?new=1">Buat CV pertama</Link>
            </Button>
          </Panel>
        </div>
      ) : (
        <>
          {/* CV dasar yang dipakai semua perhitungan di halaman ini. */}
          <div className="mx-auto w-full max-w-6xl px-4 pt-10 sm:pt-14">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="ci-base-cv" className="text-sm font-semibold text-muted-foreground">
                CV dasar
              </label>
              <select
                id="ci-base-cv"
                value={baseId ?? ''}
                onChange={(e) => setBaseId(e.target.value)}
                className="w-full min-w-0 flex-1 truncate rounded-lg border border-border bg-white px-3 py-2 text-sm font-semibold sm:w-auto sm:flex-none sm:max-w-[320px]"
              >
                {bases.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {baseTitle(doc)}
                  </option>
                ))}
              </select>
              <Button asChild variant="outline" size="sm">
                <Link href={`/editor?id=${encodeURIComponent(baseId ?? '')}`}>Buka di editor</Link>
              </Button>
            </div>
          </div>

          {/* Kesiapan ATS — dari analyzeCv, tidak butuh feed. */}
          <section aria-label="Kesiapan ATS" className="mx-auto w-full max-w-6xl px-4 py-10">
            <h2 className="text-2xl font-black tracking-tight">Kesiapan ATS</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Estimasi dari aturan yang bisa dilihat — bukan ramalan apakah kamu lolos di perusahaan tertentu.
            </p>
            {analysis ? (
              <div className="mt-6 grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
                <Panel className="flex flex-col items-center p-6 text-center">
                  <ScoreRing value={analysis.overall} size={120} label="Skor kesiapan ATS" />
                  <p className="mt-3 text-lg font-bold text-success">{scoreLabel(analysis.overall)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">Skor keseluruhan {analysis.overall} dari 100</p>
                </Panel>
                <ul className="space-y-4">
                  {analysis.components.map((component) => (
                    <li key={component.id}>
                      <Panel className="p-5">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <h3 className="font-semibold">{component.label}</h3>
                          <span className="text-sm font-bold">{component.score}%</span>
                        </div>
                        <ProgressBar className="mt-3" value={component.score} label={`Skor ${component.label}`} />
                        <ul className="mt-4 space-y-2">
                          {component.findings.map((finding, index) => (
                            <li key={index} className="flex flex-wrap items-start gap-2 text-sm">
                              <Chip tone={SEVERITY_TONE[finding.severity]}>{SEVERITY_LABEL[finding.severity]}</Chip>
                              <span className="min-w-0 flex-1">{finding.message}</span>
                            </li>
                          ))}
                        </ul>
                      </Panel>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-6 text-sm text-muted-foreground">Memuat analisis…</p>
            )}
          </section>

          {/* Lowongan paling cocok — seksi biru seperti hasil /lowongan. */}
          <section aria-label="Lowongan paling cocok" className="bg-primary py-7 text-white lg:py-10">
            <div className="mx-auto max-w-[1440px] px-4">
              <h2 className="text-2xl font-black tracking-tight">Lowongan paling cocok</h2>
              <p className="mt-1 max-w-2xl text-sm text-white/80">
                {topJobs.length > 0
                  ? `${topJobs.length} lowongan dengan skor tertinggi dari CV dasarmu. Skor dihitung dari deskripsi lowongan bila ada, judul bila tidak — sama seperti Job Match di /lowongan.`
                  : 'Skor dihitung dari deskripsi lowongan bila ada, judul bila tidak — sama seperti Job Match di /lowongan.'}
              </p>

              {feedState === 'loading' ? (
                <div aria-busy="true" className="mt-6 grid gap-[13px]" aria-label="Memuat lowongan">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="animate-pulse rounded-2xl border border-white/20 bg-white/10 p-[18px]">
                      <div className="h-5 w-2/3 rounded bg-white/20" />
                      <div className="mt-3 h-4 w-1/3 rounded bg-white/20" />
                    </div>
                  ))}
                </div>
              ) : feedState === 'failed' ? (
                <div className="mt-6 rounded-2xl border border-dashed border-white/40 p-10 text-center text-white">
                  <h3 className="text-lg font-semibold">Feed lowongan tidak bisa dijangkau</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-white/80">
                    Bagian kesiapan ATS di atas tetap tampil, karena tidak butuh feed. Coba muat ulang feed, atau
                    buka /lowongan untuk impor manual.
                  </p>
                  <div className="mt-5 flex justify-center gap-2">
                    <Button variant="secondary" onClick={loadFeed}>
                      Coba lagi
                    </Button>
                    <Button asChild variant="outline" className="border-white/60 text-white hover:bg-white/10">
                      <Link href="/lowongan">Buka /lowongan</Link>
                    </Button>
                  </div>
                </div>
              ) : topJobs.length === 0 ? (
                <div className="mt-6 rounded-2xl bg-white p-[42px_18px] text-center text-[#5E6B88]">
                  <h3 className="text-lg font-bold text-[#071A4A]">Belum ada kata kunci yang cocok</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm">
                    Tidak ada kata kunci keahlian yang dikenali dari lowongan di feed saat ini bila dibandingkan
                    dengan CV dasarmu. Tempel deskripsi lengkap di editor untuk skor Job Match penuh.
                  </p>
                  <Button asChild variant="primary" className="mt-5">
                    <Link href="/lowongan">Jelajahi semua lowongan</Link>
                  </Button>
                </div>
              ) : (
                <ul className="mt-6 grid gap-[11px]" aria-live="polite">
                  {topJobs.map(({ job, score }) => {
                    const exp = experienceText(job);
                    const posted = relativePosted(job.datePosted);
                    return (
                      <li
                        key={job.jobUrl}
                        className="grid grid-cols-[48px_minmax(0,1fr)] gap-[15px] rounded-2xl bg-white p-[15px_17px] text-[#071A4A] shadow-[0_3px_0_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.16)] lg:grid-cols-[48px_minmax(0,1fr)_auto]"
                      >
                        <CompanyLogo job={job} />
                        <div className="min-w-0">
                          <h3 className="text-[17px] font-black leading-[1.2] tracking-[-0.025em]">
                            <a href={job.jobUrl} target="_blank" rel="noreferrer" className="hover:underline">
                              {job.title}
                            </a>
                          </h3>
                          <p className="mt-1 text-[13px] font-bold text-[#34466E]">{job.company}</p>
                          <div className="mt-2 flex flex-wrap gap-x-[15px] gap-y-1 text-xs font-semibold text-[#263B6A]">
                            {job.location && (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin className="size-[15px] text-primary" aria-hidden="true" />
                                {job.location}
                              </span>
                            )}
                            {exp && (
                              <span className="inline-flex items-center gap-1.5">
                                <BarChart3 className="size-[15px] text-primary" aria-hidden="true" />
                                {exp}
                              </span>
                            )}
                          </div>
                          <p className="mt-1.5 text-[10px] text-[#75809A]">
                            Sumber: {siteName(job.site)}
                            {posted ? ` · ${posted}` : ''}
                          </p>
                        </div>
                        <div className="col-span-2 flex flex-wrap items-center gap-3.5 border-t border-[#D9E1F2] pt-2.5 lg:col-span-1 lg:border-0 lg:pt-0">
                          <span className="whitespace-nowrap rounded-full bg-brand-accent px-2.5 py-1.5 text-xs font-black text-primary">
                            ✦ {score}% cocok
                          </span>
                          <div className="flex w-full flex-wrap gap-2 lg:w-auto">
                            <Button variant="primary" size="sm" className="flex-1 lg:flex-none" onClick={() => createCv(job)}>
                              Buat CV &amp; Lamar ↗
                            </Button>
                            <Button asChild variant="outline" size="sm" className="flex-1 lg:flex-none">
                              <a href={job.jobUrl} target="_blank" rel="noreferrer">
                                Lihat Detail
                              </a>
                            </Button>
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>

          {/* Skill gap — dari teks lowongan teratas vs CV dasar. */}
          <section aria-label="Skill yang belum ada di CV" className="mx-auto w-full max-w-6xl px-4 py-10">
            <h2 className="text-2xl font-black tracking-tight">Skill yang belum ada di CV</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Keyword ini muncul di teks lowongan teratas, tapi belum disebut di CV dasarmu. Tambahkan hanya jika
              memang kamu kuasai.
            </p>
            {feedState === 'loading' ? (
              <p className="mt-6 text-sm text-muted-foreground">Memuat lowongan…</p>
            ) : feedState === 'failed' ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Tidak bisa dihitung — feed lowongan tidak terjangkau. Coba lagi dari bagian lowongan di atas.
              </p>
            ) : topJobs.length === 0 ? (
              <p className="mt-6 text-sm text-muted-foreground">
                Tidak ada lowongan yang bisa dibandingkan, jadi tidak ada skill gap yang bisa dihitung.
              </p>
            ) : skillGaps.length === 0 ? (
              <Panel className="mt-6 p-5">
                <p className="text-sm">
                  Semua keyword keahlian dari {topJobs.length} lowongan teratas sudah muncul di CV dasarmu.
                </p>
              </Panel>
            ) : (
              <ul className="mt-6 flex flex-wrap gap-2">
                {skillGaps.map(([term, count]) => (
                  <li key={term}>
                    <Chip tone="warning">
                      {term} · disebut di {count} dari {topJobs.length} lowongan teratas
                    </Chip>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Dari mana data ini — cakupan feed dan board hunter. */}
          <section aria-label="Dari mana data ini" className="mx-auto w-full max-w-6xl px-4 pb-14">
            <Panel className="p-5">
              <h2 className="font-semibold">Dari mana data ini</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {jobs
                  ? `Feed saat ini berisi ${jobs.length} lowongan${sourceCounts.length ? ` dari ${sourceCounts.map(([name, count]) => `${name} (${count})`).join(', ')}` : ''} — dihitung dari feed yang dimuat halaman ini.`
                  : 'Feed lowongan belum dimuat.'}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {HUNTER_PORTALS.map((portal) => (
                  <Chip key={portal.name} tone={portal.status === 'aktif' ? 'primary' : 'neutral'} title={portal.note}>
                    {portal.name} · {portal.status === 'aktif' ? 'dicari hunter harian' : 'belum dicari'}
                  </Chip>
                ))}
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Hunter harian mencari 9 board, tapi tidak semua board selalu mengembalikan lowongan — isi feed yang
                tampil di atas adalah yang benar-benar ada. JobStreet dan Glints belum bisa dicari otomatis: tidak ada
                API publik / board JobSpy, jadi cari manual dan tempel deskripsinya di editor.
              </p>
            </Panel>
          </section>
        </>
      )}
    </>
  );
}
