/**
 * Hunter feed import (client-side, no server call).
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

/** Title for the CV created from a hunter job. */
export function cvTitleForJob(job: HunterJob): string {
  return `CV ${job.title} \u2013 ${job.company}`;
}
