import { describe, expect, it } from 'vitest';
import { AiOutputRejected, postprocess } from './postprocess';
import { aiRequestSchema, type AiInput } from './tasks';

const bulletsInput = aiRequestSchema.parse({
  task: 'bullets',
  input: {
    language: 'en-US',
    role: 'Backend Engineer',
    section: 'experience',
    title: 'Software Engineer',
    organization: 'Tokopedia',
    bullets: ['made the checkout api faster', 'wrote python scripts for 3 teams'],
  },
}).input as AiInput<'bullets'>;

describe('postprocess', () => {
  it('keeps only safe bullet rewrites and turns invented numbers into placeholders', () => {
    const out = postprocess('bullets', bulletsInput, {
      suggestions: [
        { index: 0, improved: '- Optimized the checkout API, cutting latency by 45%', reason: 'Lebih spesifik' },
        { index: 1, improved: 'Automated reporting with Python and Airflow for 3 teams', reason: '' },
        { index: 7, improved: 'Out of range', reason: '' },
      ],
    });
    expect(out.suggestions).toEqual([{ index: 0, improved: 'Optimized the checkout API, cutting latency by [X%]', reason: 'Lebih spesifik' }]);
  });

  it('allows skills the CV already lists', () => {
    const out = postprocess('bullets', { ...bulletsInput, skills: ['Airflow'] }, {
      suggestions: [{ index: 1, improved: 'Automated reporting with Python and Airflow for 3 teams', reason: '' }],
    });
    expect(out.suggestions).toHaveLength(1);
  });

  it('allows confirmed keywords', () => {
    const out = postprocess('bullets', { ...bulletsInput, confirmedKeywords: ['Airflow'] }, {
      suggestions: [{ index: 1, improved: 'Automated reporting with Python and Airflow for 3 teams', reason: '' }],
    });
    expect(out.suggestions).toHaveLength(1);
  });

  it('rejects a summary that claims skills the CV does not mention', () => {
    const input = { language: 'en-US', role: 'Data Analyst', level: 'professional', confirmedKeywords: [], summary: '', experience: [], skills: ['SQL'] } as AiInput<'summary'>;
    expect(() => postprocess('summary', input, { summary: 'Data analyst skilled in SQL and Tableau.', reason: '' })).toThrow(AiOutputRejected);
    expect(postprocess('summary', input, { summary: 'Data analyst with 5 years of SQL work.', reason: '' }).summary).toBe(
      'Data analyst with [X] years of SQL work.'
    );
  });

  it('rejects requests over the field limits', () => {
    expect(aiRequestSchema.safeParse({ task: 'bullets', input: { ...bulletsInput, bullets: ['x'.repeat(401)] } }).success).toBe(false);
    expect(aiRequestSchema.safeParse({ task: 'bullets', input: { ...bulletsInput, bullets: [] } }).success).toBe(false);
  });
});
