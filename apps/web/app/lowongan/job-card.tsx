'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BarChart3, Bookmark, Briefcase, MapPin } from 'lucide-react';
import { buttonVariants } from '@/components/ds';
import type { HunterJob } from '@/lib/cv/hunter';
import { cn } from '@/lib/cn';

/**
 * Kartu lowongan Ayo Kerja (mockup: kartu putih di seksi biru) dan helper
 * tampilannya. Dipakai /lowongan dan /career-intelligence supaya kedua
 * halaman selalu menampilkan kartu yang sama.
 */

const SITE_NAMES: Record<string, string> = {
  linkedin: 'LinkedIn',
  indeed: 'Indeed',
  glassdoor: 'Glassdoor',
  zip_recruiter: 'ZipRecruiter',
  hellowork: 'HelloWork',
  bdjobs: 'BDJobs',
  naukri: 'Naukri',
  bayt: 'Bayt',
  google: 'Google',
  jobstreet: 'JobStreet',
  glints: 'Glints',
};

/** Tile monogram perusahaan ala mockup: kuning, biru, atau biru-muda. */
const TILE_COLORS = [
  'bg-brand-accent text-primary',
  'bg-primary text-primary-foreground',
  'bg-surface text-primary',
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
export function CompanyLogo({ job }: { job: HunterJob }) {
  const [failed, setFailed] = useState(false);
  const tile = tileFor(job.company);
  if (!job.companyLogo || failed) {
    return (
      <span
        aria-hidden="true"
        className={`grid size-12 shrink-0 place-items-center rounded-[11px] font-display text-[24px] font-black ${tile}`}
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

export function siteName(site: string) {
  const key = site.toLowerCase();
  if (SITE_NAMES[key]) return SITE_NAMES[key];
  if (!site) return 'Lainnya';
  // Site baru yang belum dipetakan: "zip_recruiter" -> "Zip Recruiter".
  return site
    .split(/[_-]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/** jobType feed adalah teks bebas JobSpy ("fulltime", "parttime, contract", …). */
export type JobType = 'full-time' | 'part-time' | 'internship' | 'contract';

export function normalizedType(job: HunterJob): JobType | null {
  const raw = job.jobType.toLowerCase();
  if (raw.includes('full')) return 'full-time';
  if (raw.includes('part')) return 'part-time';
  if (raw.includes('intern')) return 'internship';
  if (raw.includes('contract')) return 'contract';
  return null;
}

const TYPE_LABEL: Record<JobType, string> = {
  'full-time': 'Full-time',
  'part-time': 'Part-time',
  contract: 'Contract',
  internship: 'Magang',
};

/**
 * Pengalaman untuk ditampilkan di kartu — HANYA string literal dari teks
 * iklan (judul + deskripsi), bukan hasil perkiraan experienceBand: rentang
 * "X–Y tahun" tampil apa adanya, "X+ tahun" tetap "X+ tahun", "minimal X
 * tahun" jadi "X+ tahun", "senior" jadi "Senior", entry/junior/fresh
 * graduate jadi "Entry level". Null bila iklan tidak menyebutkannya.
 */
export function experienceText(job: HunterJob): string | null {
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
export function relativePosted(datePosted: string): string | null {
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

export function isRemoteJob(job: HunterJob): boolean {
  return job.isRemote || /remote|jarak jauh/i.test(job.location ?? '');
}

// Aksi kartu: Button variant accent / brand-outline, versi ringkas.
const btnCardAccent = cn(buttonVariants({ variant: 'accent', size: null }), 'rounded-xl px-3 py-2.5 text-xs');
const btnCardOutline = cn(buttonVariants({ variant: 'brand-outline', size: null }), 'rounded-xl px-3 py-2.5 text-xs');

const META = 'inline-flex items-center gap-1.5';
const META_ICON = 'size-[15px] text-primary';
const PILL = 'whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-black text-primary';

/**
 * Satu kartu lowongan.
 * - `score`: % Job Match dari CV dasar; `null` bila tak ada kata kunci yang
 *   cocok, `undefined` bila belum ada CV dasar.
 * - `saved`: tombol simpan; tidak dirender bila tidak diberikan.
 * - `headingLevel`: h2 di /lowongan, h3 di halaman yang kartunya ada di
 *   bawah judul seksi (career-intelligence).
 */
export function JobCard({
  job,
  score,
  onCreateCv,
  saved,
  headingLevel: Heading = 'h2',
}: {
  job: HunterJob;
  score: number | null | undefined;
  onCreateCv: (job: HunterJob) => void;
  saved?: { isSaved: boolean; onToggle: () => void };
  headingLevel?: 'h2' | 'h3';
}) {
  const type = normalizedType(job);
  const exp = experienceText(job);
  const posted = relativePosted(job.datePosted);
  const notes = [
    job.flagDemoLike ? 'Perlu dicek — mirip lowongan demo' : null,
    !job.description ? 'Deskripsi belum ada — tempel di editor' : null,
  ].filter(Boolean);

  return (
    <li className="grid grid-cols-[48px_minmax(0,1fr)] gap-[15px] rounded-2xl bg-white p-[15px_17px] text-foreground shadow-[0_3px_0_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_20px_rgba(0,0,0,0.16)] lg:grid-cols-[48px_minmax(0,1fr)_auto]">
      <CompanyLogo job={job} />
      <div className="min-w-0">
        <Heading className="text-[17px] font-black leading-[1.2] tracking-[-0.025em]">
          <a href={job.jobUrl} target="_blank" rel="noreferrer" className="hover:underline">
            {job.title}
          </a>
        </Heading>
        <p className="mt-1 text-[13px] font-bold text-foreground-soft">{job.company}</p>
        <div className="mt-2 flex flex-wrap gap-x-[15px] gap-y-1 text-xs font-semibold text-foreground-soft">
          {job.location ? (
            <span className={META}>
              <MapPin className={META_ICON} aria-hidden="true" />
              {job.location}
            </span>
          ) : isRemoteJob(job) ? (
            <span className={META}>
              <MapPin className={META_ICON} aria-hidden="true" />
              Remote
            </span>
          ) : null}
          {type && (
            <span className={META}>
              <Briefcase className={META_ICON} aria-hidden="true" />
              {TYPE_LABEL[type]}
            </span>
          )}
          {exp && (
            <span className={META}>
              <BarChart3 className={META_ICON} aria-hidden="true" />
              {exp}
            </span>
          )}
        </div>
        {/* Waktu relatif dihitung dari jam server lalu jam browser; boleh beda sedikit. */}
        <p className="mt-1.5 text-[10px] text-muted-foreground" suppressHydrationWarning>
          Sumber: {siteName(job.site)}
          {posted ? ` · ${posted}` : ''}
        </p>
        {notes.length > 0 && <p className="mt-1 text-xs text-muted-foreground/80">{notes.join(' · ')}</p>}
      </div>
      <div className="col-span-2 flex flex-wrap items-center gap-3.5 border-t border-border pt-2.5 lg:col-span-1 lg:border-0 lg:pt-0">
        {score === undefined ? (
          <span className={cn(PILL, 'bg-surface')}>Lengkapi profil untuk Job Match</span>
        ) : score === null ? (
          <span className={cn(PILL, 'bg-surface')}>Belum ada kata kunci yang cocok</span>
        ) : (
          <span className={cn(PILL, 'bg-brand-accent')}>✦ {score}% cocok</span>
        )}
        {posted && (
          <span className="whitespace-nowrap text-[11px] font-semibold text-muted-foreground" suppressHydrationWarning>
            {posted}
          </span>
        )}
        {saved && (
          <button
            type="button"
            onClick={saved.onToggle}
            aria-pressed={saved.isSaved}
            aria-label={saved.isSaved ? 'Hapus dari tersimpan' : 'Simpan lowongan'}
            title={saved.isSaved ? 'Tersimpan' : 'Simpan'}
            className={cn(
              'grid size-[38px] shrink-0 place-items-center rounded-[9px] text-primary transition hover:bg-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
              saved.isSaved && 'bg-surface'
            )}
          >
            <Bookmark className="size-[21px]" fill={saved.isSaved ? 'currentColor' : 'none'} aria-hidden="true" />
          </button>
        )}
        <div className="flex w-full flex-wrap gap-2 lg:w-auto">
          <button
            type="button"
            onClick={() => onCreateCv(job)}
            className={cn(btnCardAccent, 'flex-1 lg:min-w-[145px] lg:flex-none')}
          >
            Buat CV &amp; Lamar ↗
          </button>
          <a href={job.jobUrl} target="_blank" rel="noreferrer" className={cn(btnCardOutline, 'flex-1 lg:flex-none')}>
            Lihat Detail
          </a>
        </div>
      </div>
    </li>
  );
}
