/**
 * Hunter feed parsing (dipakai server untuk render /lowongan dan browser untuk impor manual).
 *
 * The VPS hunter writes `jobs.json`: an array of job postings found by JobSpy
 * (LinkedIn / Indeed / Glassdoor). This module only validates and de-duplicates
 * that file so the /lowongan page can list it. It never fetches a job board,
 * never applies, and never invents a description: a job without a `description`
 * keeps an empty job description, and the user pastes the full ad in the editor.
 */

export interface HunterJob {
  site: string;
  title: string;
  company: string;
  /** URL logo perusahaan bila feed membawanya; '' bila tidak ada. */
  companyLogo: string;
  location: string;
  datePosted: string;
  jobType: string;
  isRemote: boolean;
  jobUrl: string;
  description: string;
  flagDemoLike: boolean;
}

export interface HunterParseResult {
  jobs: HunterJob[];
  /** Entries dropped because they lacked a title, company, or job link. */
  skipped: number;
}

/** A job ad is long, but a pasted-in feed file should not be unbounded. */
const MAX_DESCRIPTION_CHARS = 50_000;

const asText = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

/**
 * Logo hanya diterima dari URL http(s) absolut. Nilai lain (relatif,
 * javascript:, data:) dibuang supaya kartu tidak pernah me-render sumber
 * tak terpercaya dari file feed.
 */
const asHttpUrl = (value: unknown): string => {
  const url = asText(value);
  return url.startsWith('https://') || url.startsWith('http://') ? url : '';
};

export function parseHunterJobs(parsed: unknown): HunterParseResult {
  if (!Array.isArray(parsed)) return { jobs: [], skipped: 0 };
  const seen = new Set<string>();
  const jobs: HunterJob[] = [];
  let skipped = 0;
  for (const entry of parsed) {
    if (typeof entry !== 'object' || entry === null) {
      skipped += 1;
      continue;
    }
    const record = entry as Record<string, unknown>;
    const title = asText(record.title);
    const company = asText(record.company);
    const jobUrl = asText(record.job_url ?? record.jobUrl);
    if (!title || !company || !jobUrl) {
      skipped += 1;
      continue;
    }
    // Same posting listed by two boards under different URLs is kept twice:
    // the URL is the only stable identity the feed guarantees.
    if (seen.has(jobUrl)) continue;
    seen.add(jobUrl);
    jobs.push({
      site: asText(record.site),
      title,
      company,
      companyLogo: asHttpUrl(record.company_logo ?? record.companyLogo),
      location: asText(record.location),
      datePosted: asText(record.date_posted ?? record.datePosted),
      jobType: asText(record.job_type ?? record.jobType),
      isRemote: record.is_remote === true || record.isRemote === true,
      jobUrl,
      description: asText(record.description).slice(0, MAX_DESCRIPTION_CHARS),
      flagDemoLike: record.flag_demo_like === true || record.flagDemoLike === true,
    });
  }
  return { jobs, skipped };
}

/**
 * Feed publik hunter: jobs.json yang ditulis cron harian VPS ke repo data
 * publik dan dibaca halaman /lowongan langsung. Isinya hanya lowongan publik
 * (judul, perusahaan, link), tanpa data pribadi, jadi aman dipublikasikan.
 */
export const HUNTER_FEED_URL =
  'https://raw.githubusercontent.com/Urdemonlord/gencv-hunter-feed/main/jobs.json';

/** Title for the CV created from a hunter job. */
export function cvTitleForJob(job: HunterJob): string {
  return `CV ${job.title} \u2013 ${job.company}`;
}

/**
 * Job boards, as honestly as the hunter can claim them.
 *
 * `aktif` boards are the ones the daily VPS cron actually searches.
 * `didukung` boards are ones JobSpy can search but the daily cron does not
 * run yet, so they must not be presented as covered. `belum` boards are the
 * ones users keep asking about (JobStreet, Glints): no public search API and
 * no JobSpy board, so the only honest route there is a manual search plus
 * pasting the ad into the editor.
 */
export type HunterPortalStatus = 'aktif' | 'didukung' | 'belum';

export interface HunterPortal {
  name: string;
  status: HunterPortalStatus;
  note: string;
}

export const HUNTER_PORTALS: HunterPortal[] = [
  { name: 'LinkedIn', status: 'aktif', note: 'Dicari hunter harian.' },
  { name: 'Indeed', status: 'aktif', note: 'Dicari hunter harian.' },
  { name: 'Glassdoor', status: 'aktif', note: 'Dicari hunter harian.' },
  { name: 'ZipRecruiter', status: 'aktif', note: 'Dicari hunter harian.' },
  { name: 'Bayt', status: 'aktif', note: 'Dicari hunter harian.' },
  { name: 'Naukri', status: 'aktif', note: 'Dicari hunter harian.' },
  { name: 'BDJobs', status: 'aktif', note: 'Dicari hunter harian.' },
  { name: 'HelloWork', status: 'aktif', note: 'Dicari hunter harian.' },
  { name: 'Google Jobs', status: 'aktif', note: 'Dicari hunter harian.' },
  { name: 'JobStreet', status: 'belum', note: 'Tidak ada API publik / board JobSpy — cari manual, tempel deskripsi di editor.' },
  { name: 'Glints', status: 'belum', note: 'Tidak ada API publik / board JobSpy — cari manual, tempel deskripsi di editor.' },
];
