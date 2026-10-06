import type { AdditionalKind, CV, CvLanguage } from './schema';

const MONTHS: Record<CvLanguage, string[]> = {
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  id: ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'],
};
const PRESENT: Record<CvLanguage, string> = { en: 'Present', id: 'Sekarang' };

/** "2021-03" -> "Mar 2021", "2021" -> "2021"; free text is returned as typed. */
export function formatMonth(value: string, language: CvLanguage = 'en'): string {
  const text = value.trim();
  const match = text.match(/^(\d{4})-(\d{2})$/);
  if (!match) return text;
  const month = MONTHS[language][Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : match[1];
}

export function formatDateRange(start: string, end: string, current = false, language: CvLanguage = 'en'): string {
  const from = formatMonth(start, language);
  const to = current ? PRESENT[language] : formatMonth(end, language);
  if (from && to) return from === to ? from : `${from} – ${to}`;
  return from || to;
}

const SORTABLE_DATE = /^\d{4}(-\d{2})?$/;

function recencyKey(start: string, end: string, current: boolean): string {
  if (current) return '9999-99';
  if (SORTABLE_DATE.test(end)) return end;
  if (SORTABLE_DATE.test(start)) return start;
  return '';
}

/** Reverse-chronological order; undated entries keep their order at the end. */
export function sortByRecency<T>(items: T[], range: (item: T) => { start: string; end: string; current?: boolean }): T[] {
  return items
    .map((item, index) => {
      const { start, end, current = false } = range(item);
      return { item, index, key: recencyKey(start, end, current), start: SORTABLE_DATE.test(start) ? start : '' };
    })
    .sort((a, b) => {
      if (!a.key || !b.key) return a.key ? -1 : b.key ? 1 : a.index - b.index;
      if (a.key !== b.key) return a.key < b.key ? 1 : -1;
      if (a.start !== b.start) return a.start < b.start ? 1 : -1;
      return a.index - b.index;
    })
    .map(({ item }) => item);
}

const BULLET_MARKER = /^(?:[-*•·▪◦‣–—]|\d+[.)])\s+/;
// Chatty lead-ins that AI rewrites sometimes prepend ("Here are the key achievements:").
const AI_PREAMBLE = /^(?:here(?:'s| is| are)|sure\b|certainly\b|below (?:is|are))[^\n]*:$/i;

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

/**
 * Turns free text (typed or AI-generated, possibly with markdown) into an optional intro
 * line plus bullet points. A single unmarked line stays a paragraph.
 */
export function splitDescription(text: string): { intro: string; bullets: string[] } {
  const lines = text
    .split(/\r?\n/)
    .map((line) => stripMarkdown(line).trim())
    .filter((line) => line && !AI_PREAMBLE.test(line));
  const hasMarkers = lines.some((line) => BULLET_MARKER.test(line));

  if (!hasMarkers) {
    return lines.length <= 1 ? { intro: lines[0] ?? '', bullets: [] } : { intro: '', bullets: lines };
  }

  const firstMarked = lines.findIndex((line) => BULLET_MARKER.test(line));
  return {
    intro: lines.slice(0, firstMarked).join(' '),
    bullets: lines.slice(firstMarked).map((line) => line.replace(BULLET_MARKER, '').trim()).filter(Boolean),
  };
}

/** Free text (typed or AI output) as a list of bullet lines. */
export function toBulletList(text: string): string[] {
  const { intro, bullets } = splitDescription(text);
  return intro ? [intro, ...bullets] : bullets;
}

export function cleanText(text: string): string {
  return stripMarkdown(text).replace(/\s*\r?\n\s*/g, ' ').trim();
}

/** Only http(s), mailto and tel links are emitted; anything else is treated as a bare domain. */
export function toHref(url: string): string {
  const value = url.trim();
  if (!value) return '';
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  return `https://${value.replace(/^[a-z][a-z0-9+-]*:\/*/i, '')}`;
}

export function displayUrl(url: string): string {
  return url
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/+$/, '');
}

export function cvFileBaseName(data: CV): string {
  const name = data.personalInfo.fullName
    .trim()
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-');
  return name ? `${name}-CV` : 'CV';
}


export type SectionId =
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'projects'
  | 'certifications'
  | 'languages'
  | AdditionalKind;

// Standard headings that ATS parsers recognise, in both CV languages.
export const SECTION_TITLES: Record<CvLanguage, Record<SectionId, string>> = {
  en: {
    summary: 'Summary',
    experience: 'Work Experience',
    education: 'Education',
    skills: 'Skills',
    projects: 'Projects',
    certifications: 'Certifications',
    languages: 'Languages',
    award: 'Awards',
    organization: 'Organizations',
    volunteer: 'Volunteering',
    publication: 'Publications',
  },
  id: {
    summary: 'Ringkasan',
    experience: 'Pengalaman Kerja',
    education: 'Pendidikan',
    skills: 'Keahlian',
    projects: 'Proyek',
    certifications: 'Sertifikasi',
    languages: 'Bahasa',
    award: 'Penghargaan',
    organization: 'Organisasi',
    volunteer: 'Kegiatan Sukarela',
    publication: 'Publikasi',
  },
};

const SKILL_GROUP_LABELS: Record<CvLanguage, Record<'Technical' | 'Soft', string>> = {
  en: { Technical: 'Technical', Soft: 'Soft Skills' },
  id: { Technical: 'Teknis', Soft: 'Soft Skills' },
};

const NATIVE: Record<CvLanguage, string> = { en: 'Native', id: 'Bahasa ibu' };

export interface ContactItem {
  text: string;
  href?: string;
}

export interface EntryView {
  title: string;
  subtitle: string;
  dates: string;
  intro: string;
  bullets: string[];
  link?: { text: string; href: string };
  details: string[];
}

export interface LineGroupView {
  label: string;
  items: string[];
}

export type SectionView =
  | { id: SectionId; title: string; kind: 'text'; text: string }
  | { id: SectionId; title: string; kind: 'lines'; lines: LineGroupView[] }
  | { id: SectionId; title: string; kind: 'entries'; entries: EntryView[] };

export interface CvView {
  language: CvLanguage;
  /** US applications use Letter; everywhere else A4. */
  paper: 'A4' | 'LETTER';
  name: string;
  headline: string;
  photo: string;
  contacts: ContactItem[];
  sections: SectionView[];
  meta: { title: string; author: string; subject: string; keywords: string };
}

const SECTION_ORDER: Record<CV['experienceLevel'], SectionId[]> = {
  professional: [
    'summary',
    'experience',
    'education',
    'skills',
    'projects',
    'certifications',
    'languages',
    'award',
    'organization',
    'volunteer',
    'publication',
  ],
  fresh: [
    'summary',
    'education',
    'projects',
    'experience',
    'organization',
    'skills',
    'certifications',
    'languages',
    'award',
    'volunteer',
    'publication',
  ],
};

const linkOf = (url: string) => (url.trim() ? { text: displayUrl(toHref(url)), href: toHref(url) } : undefined);
const joinParts = (...parts: string[]) =>
  parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' · ');

function bulletsView(bullets: string[]): Pick<EntryView, 'intro' | 'bullets'> {
  const lines = bullets.map(cleanText).filter(Boolean);
  // A single line reads better as a sentence than as a lone bullet.
  return lines.length === 1 ? { intro: lines[0], bullets: [] } : { intro: '', bullets: lines };
}

/** Single source of truth for what every exporter (PDF, DOCX) prints. */
export function buildCvView(cv: CV): CvView {
  const { language, region, showPhoto } = cv.settings;
  const info = cv.personalInfo;
  const name = info.fullName.trim();
  const headline = info.headline.trim();
  const range = (start: string, end: string, current = false) => formatDateRange(start, end, current, language);

  const contacts: ContactItem[] = [];
  if (info.location.trim()) contacts.push({ text: info.location.trim() });
  if (info.phone.trim()) contacts.push({ text: info.phone.trim(), href: `tel:${info.phone.replace(/[^\d+]/g, '')}` });
  if (info.email.trim()) contacts.push({ text: info.email.trim(), href: `mailto:${info.email.trim()}` });
  for (const url of [info.linkedIn, info.github, info.website]) {
    const link = linkOf(url);
    if (link) contacts.push(link);
  }

  const experience = sortByRecency(
    cv.experience.filter((exp) => exp.position.trim() || exp.company.trim()),
    (exp) => ({ start: exp.startDate, end: exp.endDate, current: exp.current })
  ).map<EntryView>((exp) => ({
    title: exp.position.trim() || exp.company.trim(),
    subtitle: joinParts(exp.position.trim() ? exp.company : '', exp.location),
    dates: range(exp.startDate, exp.endDate, exp.current),
    ...bulletsView(exp.bullets),
    details: [],
  }));

  const education = sortByRecency(
    cv.education.filter((edu) => edu.institution.trim() || edu.degree.trim() || edu.field.trim()),
    (edu) => ({ start: edu.startDate, end: edu.endDate })
  ).map<EntryView>((edu) => {
    const degree = edu.degree.trim();
    const field = edu.field.trim();
    const connector = language === 'id' ? ' ' : ' in ';
    return {
      title: degree && field ? `${degree}${connector}${field}` : degree || field || edu.institution.trim(),
      subtitle: joinParts(degree || field ? edu.institution : '', edu.location),
      dates: range(edu.startDate, edu.endDate),
      intro: '',
      bullets: [],
      details: [edu.gpa.trim() ? `${language === 'id' ? 'IPK' : 'GPA'}: ${edu.gpa.trim()}` : '', edu.honors.trim()].filter(
        Boolean
      ),
    };
  });

  const projects = sortByRecency(
    cv.projects.filter((project) => project.name.trim()),
    (project) => ({ start: project.startDate, end: project.endDate })
  ).map<EntryView>((project) => ({
    title: project.name.trim(),
    subtitle: joinParts(
      project.role,
      project.technologies.length
        ? `${language === 'id' ? 'Teknologi' : 'Technologies'}: ${project.technologies.join(', ')}`
        : ''
    ),
    dates: range(project.startDate, project.endDate),
    ...bulletsView(project.bullets),
    link: linkOf(project.link),
    details: [],
  }));

  const certifications = sortByRecency(
    cv.certifications.filter((cert) => cert.name.trim()),
    (cert) => ({ start: cert.date, end: cert.date })
  ).map<EntryView>((cert) => ({
    title: cert.name.trim(),
    subtitle: cert.issuer.trim(),
    dates: range(cert.date, ''),
    intro: '',
    bullets: [],
    link: linkOf(cert.url),
    details: [],
  }));

  const additional = (kind: AdditionalKind) =>
    sortByRecency(
      cv.additional.filter((item) => item.kind === kind && item.title.trim()),
      (item) => ({ start: item.date, end: item.date })
    ).map<EntryView>((item) => ({
      title: item.title.trim(),
      subtitle: item.organization.trim(),
      dates: range(item.date, ''),
      intro: cleanText(item.description),
      bullets: [],
      details: [],
    }));

  const skills = (['Technical', 'Soft'] as const)
    .map((category) => ({
      label: SKILL_GROUP_LABELS[language][category],
      items: cv.skills
        .filter((skill) => skill.category === category && skill.name.trim())
        .map((skill) => skill.name.trim()),
    }))
    .filter((group) => group.items.length > 0);

  const languages = cv.languages
    .filter((lang) => lang.name.trim())
    .map((lang) => `${lang.name.trim()} (${lang.level === 'Native' ? NATIVE[language] : lang.level})`);

  const entriesFor: Record<string, () => EntryView[]> = {
    experience: () => experience,
    education: () => education,
    projects: () => projects,
    certifications: () => certifications,
  };

  const titles = SECTION_TITLES[language];
  const sectionFor = (id: SectionId): SectionView | null => {
    const title = titles[id];
    if (id === 'summary') {
      const text = cleanText(cv.professionalSummary);
      return text ? { id, title, kind: 'text', text } : null;
    }
    if (id === 'skills') return skills.length ? { id, title, kind: 'lines', lines: skills } : null;
    if (id === 'languages') {
      return languages.length ? { id, title, kind: 'lines', lines: [{ label: '', items: languages }] } : null;
    }
    const entries = entriesFor[id] ? entriesFor[id]() : additional(id as AdditionalKind);
    return entries.length ? { id, title, kind: 'entries', entries } : null;
  };

  return {
    language,
    paper: region === 'us' ? 'LETTER' : 'A4',
    name,
    headline,
    // Photos are discouraged for US applications, so the setting is ignored there.
    photo: showPhoto && region !== 'us' ? info.photo : '',
    contacts,
    sections: SECTION_ORDER[cv.experienceLevel]
      .map(sectionFor)
      .filter((section): section is SectionView => section !== null),
    meta: {
      title: name ? `${name} – CV` : 'CV',
      author: name,
      subject: headline,
      keywords: cv.skills
        .map((skill) => skill.name.trim())
        .filter(Boolean)
        .slice(0, 20)
        .join(', '),
    },
  };
}
