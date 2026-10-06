import { describe, expect, it } from 'vitest';
import { normalizeCV } from '../normalize';
import { analyzeCv } from './analyze';
import { matchKeywords, normalizeText } from './keywords';

const strong = normalizeCV({
  personalInfo: { fullName: 'Rina', headline: 'Backend Engineer', email: 'r@x.co', phone: '+62 812 3456 7890', location: 'Jakarta' },
  professionalSummary: 'Backend engineer with 5 years building Go and PostgreSQL services for fintech products in Indonesia.',
  experience: [
    {
      position: 'Backend Engineer',
      company: 'PT Bayar',
      startDate: '2021-01',
      current: true,
      bullets: [
        'Reduced payment API latency by 40% by caching hot paths in Redis',
        'Migrated 12 services to Kubernetes, cutting infrastructure cost by 25%',
      ],
    },
  ],
  education: [{ institution: 'ITB', degree: 'S.T.', field: 'Informatika' }],
  skills: ['Golang', 'PostgreSQL', 'Docker', 'Kubernetes', 'Redis'].map((name) => ({ name })),
});

describe('analyzeCv', () => {
  it('scores a well-written CV highly', () => {
    const result = analyzeCv(strong);
    expect(result.overall).toBeGreaterThanOrEqual(85);
    expect(result.components.map((c) => c.id)).toEqual(['completeness', 'format', 'readability', 'content']);
  });

  it('treats unfilled AI placeholders as an issue, not a metric', () => {
    const cv = normalizeCV({ ...strong, experience: [{ position: 'Dev', company: 'A', bullets: ['Reduced load time by [X%] for 2 apps'] }] });
    const content = analyzeCv(cv).components.find((c) => c.id === 'content')!;
    expect(content.findings[0]).toMatchObject({ severity: 'issue' });
    expect(content.findings[0].message).toContain('placeholder');
  });

  it('flags duty-style bullets, pronouns, missing metrics and buzzwords', () => {
    const weak = normalizeCV({
      ...strong,
      professionalSummary: 'I am a passionate team player.',
      experience: [{ ...strong.experience[0], bullets: ['Responsible for maintaining the backend services of the company', 'I helped the team'] }],
    });
    const result = analyzeCv(weak);
    const messages = result.components.flatMap((c) => c.findings.map((f) => f.message)).join('\n');
    expect(messages).toContain('responsible for');
    expect(messages).toContain('kata ganti');
    expect(messages).toContain('angka nyata');
    expect(messages).toContain('passionate');
    expect(result.overall).toBeLessThan(analyzeCv(strong).overall);
  });

  it('reports missing essentials', () => {
    const result = analyzeCv(normalizeCV({ personalInfo: { fullName: 'A' } }));
    const completeness = result.components.find((c) => c.id === 'completeness')!;
    expect(completeness.score).toBeLessThan(30);
    expect(completeness.findings.map((f) => f.message)).toContain('Belum ada: Email.');
  });

  it('never returns NaN for an empty CV', () => {
    expect(Number.isFinite(analyzeCv(normalizeCV({})).overall)).toBe(true);
  });
});

describe('matchKeywords', () => {
  const ad =
    'We are hiring a Backend Engineer. Requirements: Golang, PostgreSQL, Docker, K8s, CI/CD pipelines and REST APIs. Nice to have: Kafka.';

  it('extracts known skills, folds synonyms and splits matched/missing', () => {
    const result = matchKeywords(strong, ad);
    expect(result.keywords).toEqual(expect.arrayContaining(['golang', 'postgresql', 'docker', 'kubernetes', 'ci/cd', 'rest api', 'kafka']));
    expect(result.matched).toEqual(expect.arrayContaining(['golang', 'postgresql', 'docker', 'kubernetes']));
    expect(result.missing).toEqual(expect.arrayContaining(['ci/cd', 'rest api', 'kafka']));
    expect(result.score).toBe(Math.round((result.matched.length / result.keywords.length) * 100));
  });

  it('does not match words inside other words', () => {
    expect(matchKeywords(strong, 'Experience with javascript').keywords).toEqual(['javascript']);
    expect(normalizeText('Node and node.js')).toContain('node.js and node.js');
  });

  it('adds a keyword component only when a job description is set', () => {
    expect(analyzeCv(strong).keywords.score).toBeNull();
    const withAd = analyzeCv(normalizeCV({ ...strong, jobDescription: ad }));
    expect(withAd.components.at(-1)?.id).toBe('keywords');
  });
});
