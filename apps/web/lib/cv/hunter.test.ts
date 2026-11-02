import { describe, expect, it } from 'vitest';
import { cvTitleForJob, parseHunterJobs } from './hunter';

const job = (overrides: Record<string, unknown> = {}) => ({
  site: 'linkedin',
  title: 'Golang Developer',
  company: 'Contoh Corp',
  location: 'Remote',
  date_posted: '2026-11-02',
  job_url: 'https://example.com/jobs/1',
  ...overrides,
});

describe('parseHunterJobs', () => {
  it('keeps valid jobs and drops entries without title, company, or link', () => {
    const { jobs, skipped } = parseHunterJobs([
      job(),
      job({ title: '' }),
      job({ job_url: '' }),
      'not-an-object',
    ]);
    expect(jobs).toHaveLength(1);
    expect(skipped).toBe(3);
    expect(jobs[0].title).toBe('Golang Developer');
    expect(jobs[0].datePosted).toBe('2026-11-02');
  });

  it('de-duplicates by job URL, keeping the first listing', () => {
    const { jobs } = parseHunterJobs([job(), job({ site: 'indeed' })]);
    expect(jobs).toHaveLength(1);
    expect(jobs[0].site).toBe('linkedin');
  });

  it('keeps a description when the feed already carries one, capped', () => {
    const { jobs } = parseHunterJobs([job({ description: 'x'.repeat(60_000) })]);
    expect(jobs[0].description).toHaveLength(50_000);
  });

  it('rejects a non-array feed without throwing', () => {
    expect(parseHunterJobs({})).toEqual({ jobs: [], skipped: 0 });
  });

  it('builds a per-company CV title', () => {
    const { jobs } = parseHunterJobs([job()]);
    expect(cvTitleForJob(jobs[0])).toBe('CV Golang Developer \u2013 Contoh Corp');
  });
});
