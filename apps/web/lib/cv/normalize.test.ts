import { describe, expect, it } from 'vitest';
import { isCvLike, normalizeCV, normalizeMonth } from './normalize';

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
