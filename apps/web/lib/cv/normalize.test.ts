import { describe, expect, it } from 'vitest';
import { coerceCV, isCvLike, normalizeCV, normalizeMonth } from './normalize';
import { cvSchema } from './schema';
import { emptyCV } from './model';

describe('normalizeMonth', () => {
  it('trims legacy full dates to month precision', () => {
    expect(normalizeMonth('2021-03-15')).toBe('2021-03');
    expect(normalizeMonth('2021-03')).toBe('2021-03');
    expect(normalizeMonth('Spring 2020')).toBe('Spring 2020');
    expect(normalizeMonth(undefined)).toBe('');
  });
});

describe('normalizeCV', () => {
  it('fills a complete object from partial input', () => {
    const data = normalizeCV({ personalInfo: { fullName: 'Rina' } });
    expect(data.personalInfo.email).toBe('');
    expect(data.experience).toEqual([]);
    expect(data.experienceLevel).toBe('professional');
  });

  it('migrates legacy shapes', () => {
    const data = normalizeCV({
      personalInfo: {},
      experience: [{ position: 'Dev', startDate: '2020-01-10', endDate: '2021-01-01', current: true }],
      skills: ['SQL', { name: '' }, { name: 'Go', level: 'Guru', category: 'Weird' }],
      projects: [{ name: 'X', technologies: 'React, Node' }],
    });
    expect(data.experience[0]).toMatchObject({ startDate: '2020-01', endDate: '', current: true });
    expect(data.skills.map((s) => [s.name, s.level, s.category])).toEqual([
      ['SQL', 'Intermediate', 'Technical'],
      ['Go', 'Intermediate', 'Technical'],
    ]);
    expect(data.projects[0].technologies).toEqual(['React', 'Node']);
    expect(data.experience[0].id).toBeTruthy();
  });

  it('rejects non-CV JSON', () => {
    expect(isCvLike({ foo: 1 })).toBe(false);
    expect(isCvLike({ personalInfo: { fullName: 'A' } })).toBe(true);
  });
});

/**
 * `normalize.ts` hand-writes the coercion that `schema.ts` expresses in zod, so the browser
 * never bundles zod. These tests are what keep the two from drifting: for any input, the
 * hand-written result must equal `cvSchema.parse`.
 *
 * The comparison is made on post-migration shapes (plain objects), because `migrate()` in
 * `normalize.ts` runs first in real use and turns anything else into `{}` — `cvSchema.parse`
 * itself would throw on `null`/`42`/`'nope'`, which is exactly why the coercion exists.
 */
describe('coerceCV matches the zod schema (the oracle)', () => {
  it('produces an empty CV identical to the schema default', () => {
    expect(cvSchema.parse({})).toEqual(emptyCV());
    expect(coerceCV({})).toEqual(emptyCV());
  });

  it('agrees with the schema on garbage and partial input', () => {
    const cases: unknown[] = [
      {},
      { personalInfo: null, settings: 'bad', experienceLevel: 'weird', version: 99 },
      { personalInfo: { fullName: 42, email: null }, confirmedKeywords: 'not-an-array' },
      { experience: 'not-an-array', education: [null], skills: [{ level: 'Nope', category: 'Nope' }] },
      { experience: [{ bullets: ['a', 5] }], projects: [{ technologies: [1, 2] }] },
      { settings: { region: 'mars', language: 'fr', showPhoto: 'yes', template: 'classic' } },
      { title: ['array'], jobDescription: { nested: true }, professionalSummary: 123 },
      { experience: [{ id: '', position: 'Dev' }] },
      { additional: [{ kind: 'nope' }], languages: [{ level: 'nope' }] },
      { certifications: [{ date: '2020-05-01' }], confirmedKeywords: [] },
    ];

    for (const input of cases) {
      const viaSchema = cvSchema.parse(input);
      const viaHand = coerceCV(input);

      // Ids are generated independently on each side; compare everything else exactly, and
      // check the id shape (prefix + truthy) rather than the generated value.
      const stripIds = (cv: typeof viaSchema) => ({
        ...cv,
        experience: cv.experience.map(({ id, ...rest }) => ({ ...rest, hasId: Boolean(id) })),
        education: cv.education.map(({ id, ...rest }) => ({ ...rest, hasId: Boolean(id) })),
        skills: cv.skills.map(({ id, ...rest }) => ({ ...rest, hasId: Boolean(id) })),
        projects: cv.projects.map(({ id, ...rest }) => ({ ...rest, hasId: Boolean(id) })),
        certifications: cv.certifications.map(({ id, ...rest }) => ({ ...rest, hasId: Boolean(id) })),
        languages: cv.languages.map(({ id, ...rest }) => ({ ...rest, hasId: Boolean(id) })),
        additional: cv.additional.map(({ id, ...rest }) => ({ ...rest, hasId: Boolean(id) })),
      });

      expect(stripIds(viaHand), `input: ${JSON.stringify(input)}`).toEqual(stripIds(viaSchema));
    }
  });

  it('treats a partially-invalid array the same way zod does', () => {
    // zod's .catch([]) on the array drops the whole list when any element fails.
    const input = { experience: [{ position: 'Ok' }, 'not-an-object'] };
    expect(coerceCV(input).experience).toEqual(cvSchema.parse(input).experience);
    expect(coerceCV(input).experience).toEqual([]);
  });

  it('survives non-object input that the raw schema would reject', () => {
    // In real use `migrate()` runs first, so these never reach the schema. The hand-written
    // coercion must produce the same blank CV rather than throw.
    for (const raw of [null, undefined, 42, 'nope', [], true]) {
      expect(() => normalizeCV(raw)).not.toThrow();
      expect(normalizeCV(raw)).toEqual(emptyCV());
    }
  });
});
