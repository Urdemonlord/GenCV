import type { CVData, Skill } from '@cv-generator/types';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2021-03" -> "Mar 2021", "2021" -> "2021"; free text is returned as typed. */
export function formatMonth(value: string): string {
  const text = value.trim();
  const match = text.match(/^(\d{4})-(\d{2})$/);
  if (!match) return text;
  const month = MONTHS[Number(match[2]) - 1];
  return month ? `${month} ${match[1]}` : match[1];
}

export function formatDateRange(start: string, end: string, current = false): string {
  const from = formatMonth(start);
  const to = current ? 'Present' : formatMonth(end);
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

export function cvFileBaseName(data: CVData): string {
  const name = data.personalInfo.fullName
    .trim()
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, '')
    .replace(/\s+/g, '-');
  return name ? `${name}-CV` : 'CV';
}

export type SectionId = 'summary' | 'experience' | 'education' | 'skills' | 'projects';

// Standard headings that ATS parsers recognise.
export const SECTION_TITLES: Record<SectionId, string> = {
  summary: 'Summary',
  experience: 'Work Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
};

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

export interface SkillGroupView {
  label: string;
  items: string[];
}

export interface CvView {
  name: string;
  headline: string;
  contacts: ContactItem[];
  summary: string;
  experience: EntryView[];
  education: EntryView[];
  projects: EntryView[];
  skills: SkillGroupView[];
  sectionOrder: SectionId[];
  meta: { title: string; author: string; subject: string; keywords: string };
}

const SECTION_ORDER: Record<CVData['experienceLevel'], SectionId[]> = {
  professional: ['summary', 'experience', 'education', 'skills', 'projects'],
  fresh: ['summary', 'education', 'projects', 'experience', 'skills'],
};

const SKILL_GROUPS: { category: Skill['category']; label: string }[] = [
  { category: 'Technical', label: 'Technical' },
  { category: 'Soft', label: 'Soft Skills' },
  { category: 'Language', label: 'Languages' },
];

const LANGUAGE_LEVEL: Record<Skill['level'], string> = {
  Beginner: 'Basic',
  Intermediate: 'Intermediate',
  Advanced: 'Advanced',
  Expert: 'Fluent',
};

/** Single source of truth for what every exporter (PDF, DOCX) prints. */
export function buildCvView(data: CVData): CvView {
  const info = data.personalInfo;
  const name = info.fullName.trim();
  const headline = (info.headline ?? '').trim();

  const contacts: ContactItem[] = [];
  if (info.location.trim()) contacts.push({ text: info.location.trim() });
  if (info.phone.trim()) contacts.push({ text: info.phone.trim(), href: `tel:${info.phone.replace(/[^\d+]/g, '')}` });
  if (info.email.trim()) contacts.push({ text: info.email.trim(), href: `mailto:${info.email.trim()}` });
  for (const url of [info.linkedIn ?? '', info.website ?? '']) {
    if (url.trim()) contacts.push({ text: displayUrl(toHref(url)), href: toHref(url) });
  }

  const experience = sortByRecency(
    data.experience.filter((exp) => exp.position.trim() || exp.company.trim()),
    (exp) => ({ start: exp.startDate, end: exp.endDate, current: exp.current })
  ).map((exp) => ({
    title: exp.position.trim() || exp.company.trim(),
    subtitle: [exp.position.trim() ? exp.company.trim() : '', exp.location.trim()].filter(Boolean).join(' · '),
    dates: formatDateRange(exp.startDate, exp.endDate, exp.current),
    ...splitDescription(exp.description),
    details: [],
  }));

  const education = sortByRecency(
    data.education.filter((edu) => edu.institution.trim() || edu.degree.trim() || edu.field.trim()),
    (edu) => ({ start: edu.startDate, end: edu.endDate })
  ).map((edu) => {
    const degree = edu.degree.trim();
    const field = edu.field.trim();
    const title = degree && field ? `${degree} in ${field}` : degree || field || edu.institution.trim();
    return {
      title,
      subtitle: degree || field ? edu.institution.trim() : '',
      dates: formatDateRange(edu.startDate, edu.endDate),
      intro: '',
      bullets: [],
      details: edu.gpa?.trim() ? [`GPA: ${edu.gpa.trim()}`] : [],
    };
  });

  const projects = data.projects
    .filter((project) => project.name.trim())
    .map((project) => ({
      title: project.name.trim(),
      subtitle: project.technologies.length ? `Technologies: ${project.technologies.join(', ')}` : '',
      dates: '',
      ...splitDescription(project.description),
      link: project.link?.trim() ? { text: displayUrl(toHref(project.link)), href: toHref(project.link) } : undefined,
      details: [],
    }));

  const skills = SKILL_GROUPS.map(({ category, label }) => ({
    label,
    items: data.skills
      .filter((skill) => skill.category === category && skill.name.trim())
      .map((skill) => (category === 'Language' ? `${skill.name.trim()} (${LANGUAGE_LEVEL[skill.level]})` : skill.name.trim())),
  })).filter((group) => group.items.length > 0);

  return {
    name,
    headline,
    contacts,
    summary: cleanText(data.professionalSummary),
    experience,
    education,
    projects,
    skills,
    sectionOrder: SECTION_ORDER[data.experienceLevel] ?? SECTION_ORDER.professional,
    meta: {
      title: name ? `${name} – CV` : 'CV',
      author: name,
      subject: headline,
      keywords: data.skills.map((skill) => skill.name.trim()).filter(Boolean).slice(0, 20).join(', '),
    },
  };
}
