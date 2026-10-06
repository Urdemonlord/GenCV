import { describe, expect, it } from 'vitest';
import { buildCvView, type SectionView } from './format';
import { normalizeCV } from './normalize';

const base = {
  personalInfo: {
    fullName: 'Rina',
    email: 'rina@example.com',
    linkedIn: 'linkedin.com/in/rina',
    github: 'github.com/rina',
    location: 'Jakarta',
    photo: 'data:image/jpeg;base64,AAAA',
  },
  experience: [{ position: 'Analyst', company: 'PT Maju', startDate: '2021-03', current: true, bullets: ['Built A', 'Shipped B'] }],
  skills: [{ name: 'SQL', category: 'Technical' }],
  languages: [
    { name: 'Indonesian', level: 'Native' },
    { name: 'English', level: 'C1' },
  ],
  certifications: [{ name: 'AWS Cloud Practitioner', issuer: 'AWS', date: '2023-05', url: 'credly.com/x' }],
  additional: [{ kind: 'award', title: 'Best Paper', organization: 'IEEE', date: '2022-11' }],
};

const section = (sections: SectionView[], id: string) => sections.find((s) => s.id === id);

describe('buildCvView (v2)', () => {
  it('renders new sections in English with CEFR levels', () => {
    const view = buildCvView(normalizeCV(base));
    expect(view.sections.map((s) => s.title)).toEqual([
      'Work Experience',
      'Skills',
      'Certifications',
      'Languages',
      'Awards',
    ]);
    expect(section(view.sections, 'languages')).toMatchObject({
      kind: 'lines',
      lines: [{ items: ['Indonesian (Native)', 'English (C1)'] }],
    });
    expect(view.contacts.map((c) => c.href)).toContain('https://github.com/rina');
  });

  it('localises headings and dates for Indonesian CVs', () => {
    const view = buildCvView(normalizeCV({ ...base, settings: { language: 'id' } }));
    expect(view.sections[0].title).toBe('Pengalaman Kerja');
    expect(section(view.sections, 'experience')).toMatchObject({ entries: [{ dates: 'Mar 2021 – Sekarang' }] });
    expect(section(view.sections, 'languages')).toMatchObject({ lines: [{ items: ['Indonesian (Bahasa ibu)', 'English (C1)'] }] });
    expect(view.language).toBe('id');
  });

  it('uses Letter paper and never a photo for US applications', () => {
    const us = buildCvView(normalizeCV({ ...base, settings: { region: 'us', showPhoto: true } }));
    expect(us.paper).toBe('LETTER');
    expect(us.photo).toBe('');

    const id = buildCvView(normalizeCV({ ...base, settings: { region: 'id', showPhoto: true } }));
    expect(id.paper).toBe('A4');
    expect(id.photo).toMatch(/^data:image\/jpeg/);
  });

  it('puts education first for fresh graduates', () => {
    const view = buildCvView(normalizeCV({ ...base, experienceLevel: 'fresh', education: [{ institution: 'UI', degree: 'BSc' }] }));
    expect(view.sections[0].id).toBe('education');
  });
});

describe('v1 → v2 migration', () => {
  it('splits descriptions into bullets and moves language skills', () => {
    const cv = normalizeCV({
      personalInfo: { fullName: 'A' },
      experience: [{ position: 'Dev', description: '- Built A\n- Shipped B' }],
      projects: [{ name: 'P', description: 'Single line summary.' }],
      skills: [
        { name: 'Go', category: 'Technical', level: 'Advanced' },
        { name: 'English', category: 'Language', level: 'Expert' },
      ],
    });
    expect(cv.version).toBe(2);
    expect(cv.experience[0].bullets).toEqual(['Built A', 'Shipped B']);
    expect(cv.projects[0].bullets).toEqual(['Single line summary.']);
    expect(cv.skills.map((s) => s.name)).toEqual(['Go']);
    expect(cv.languages).toMatchObject([{ name: 'English', level: 'C2' }]);
    expect(cv.settings).toEqual({ language: 'en', region: 'id', showPhoto: false, template: 'professional' });
  });
});
