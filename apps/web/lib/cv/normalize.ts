import type { CVData, Education, Experience, Project, Skill } from '@cv-generator/types';

const SKILL_LEVELS: readonly Skill['level'][] = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const SKILL_CATEGORIES: readonly Skill['category'][] = ['Technical', 'Soft', 'Language'];

export const emptyCVData: CVData = {
  personalInfo: {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    website: '',
  },
  professionalSummary: '',
  experience: [],
  education: [],
  skills: [],
  projects: [],
  experienceLevel: 'professional',
};

type Rec = Record<string, unknown>;

const asRecord = (value: unknown): Rec =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Rec) : {};
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

let fallbackCounter = 0;
const asId = (value: unknown, prefix: string): string =>
  typeof value === 'string' && value ? value : `${prefix}_${Date.now()}_${++fallbackCounter}`;

/**
 * Dates are stored as "YYYY-MM" (or "YYYY"). Older drafts used full "YYYY-MM-DD"
 * values from <input type="date">, which are trimmed to month precision here.
 * Anything else (free text) is kept as typed.
 */
export function normalizeMonth(value: unknown): string {
  const text = asString(value).trim();
  const match = text.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  return match ? `${match[1]}-${match[2]}` : text;
}

function normalizeExperience(value: unknown): Experience {
  const item = asRecord(value);
  const current = item.current === true;
  return {
    id: asId(item.id, 'exp'),
    company: asString(item.company),
    position: asString(item.position),
    location: asString(item.location),
    startDate: normalizeMonth(item.startDate),
    endDate: current ? '' : normalizeMonth(item.endDate),
    current,
    description: asString(item.description),
  };
}

function normalizeEducation(value: unknown): Education {
  const item = asRecord(value);
  return {
    id: asId(item.id, 'edu'),
    institution: asString(item.institution),
    degree: asString(item.degree),
    field: asString(item.field),
    startDate: normalizeMonth(item.startDate),
    endDate: normalizeMonth(item.endDate),
    gpa: asString(item.gpa),
  };
}

function normalizeSkill(value: unknown): Skill | null {
  const item = typeof value === 'string' ? { name: value } : asRecord(value);
  const name = asString(item.name).trim();
  if (!name) return null;
  const level = SKILL_LEVELS.find((l) => l === item.level) ?? 'Intermediate';
  const category = SKILL_CATEGORIES.find((c) => c === item.category) ?? 'Technical';
  return { id: asId(item.id, 'skill'), name, level, category };
}

export function parseList(text: string): string[] {
  return text
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeProject(value: unknown): Project {
  const item = asRecord(value);
  const technologies =
    typeof item.technologies === 'string'
      ? parseList(item.technologies)
      : asArray(item.technologies).filter((t): t is string => typeof t === 'string' && t.trim() !== '');
  return {
    id: asId(item.id, 'proj'),
    name: asString(item.name),
    description: asString(item.description),
    technologies,
    link: asString(item.link),
  };
}

/**
 * Coerces untrusted input (localStorage drafts, imported JSON files) into a complete
 * CVData object so the UI and exporters never see missing fields.
 */
export function normalizeCVData(raw: unknown): CVData {
  const data = asRecord(raw);
  const info = asRecord(data.personalInfo);
  return {
    personalInfo: {
      fullName: asString(info.fullName),
      headline: asString(info.headline),
      email: asString(info.email),
      phone: asString(info.phone),
      location: asString(info.location),
      linkedIn: asString(info.linkedIn),
      website: asString(info.website),
    },
    professionalSummary: asString(data.professionalSummary),
    experience: asArray(data.experience).map(normalizeExperience),
    education: asArray(data.education).map(normalizeEducation),
    skills: asArray(data.skills)
      .map(normalizeSkill)
      .filter((skill): skill is Skill => skill !== null),
    projects: asArray(data.projects).map(normalizeProject),
    experienceLevel: data.experienceLevel === 'fresh' ? 'fresh' : 'professional',
  };
}

export function isCVDataLike(raw: unknown): boolean {
  return Object.keys(asRecord(asRecord(raw).personalInfo)).length > 0;
}
