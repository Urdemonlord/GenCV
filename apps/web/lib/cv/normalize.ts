import { splitDescription } from './format';
import {
  ADDITIONAL_KINDS,
  CV_LANGUAGES,
  CV_REGIONS,
  EXPERIENCE_LEVELS,
  LANGUAGE_LEVELS,
  SKILL_CATEGORIES,
  SKILL_LEVELS,
  newId,
  type AdditionalItem,
  type Certification,
  type CV,
  type CvSettings,
  type Education,
  type Experience,
  type LanguageItem,
  type PersonalInfo,
  type Project,
  type Skill,
} from './model';
import { toTemplateId } from './templates';

/**
 * Coerces untrusted input (localStorage drafts, imported JSON, v1 data) into a complete v2
 * CV so the UI and exporters never see missing fields.
 *
 * This is hand-written rather than `cvSchema.parse` on purpose: the client runs it on every
 * load, and importing the zod schema here would pull zod (≈15 kB gzip) into the `/editor` and
 * `/dashboard` bundles. `coerceCV` is the exact twin of `cvSchema.parse` — every `catch` in the
 * schema has a matching fallback below — and `normalize.test.ts` asserts the two agree.
 */

type Rec = Record<string, unknown>;

const asRecord = (value: unknown): Rec =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Rec) : {};
const isPlainObject = (value: unknown): value is Rec =>
  typeof value === 'object' && value !== null && !Array.isArray(value);
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

/** `z.string().catch('')`. */
const text = (value: unknown): string => asString(value);
/** `z.boolean().catch(false)`. */
const bool = (value: unknown): boolean => (typeof value === 'boolean' ? value : false);
/** `z.array(z.string()).catch([])`: as in zod, one non-string element empties the whole list. */
const textList = (value: unknown): string[] =>
  Array.isArray(value) && value.every((item): item is string => typeof item === 'string') ? value : [];
/** `z.enum(allowed).catch(fallback)`. */
const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === 'string' && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
/** `z.string().min(1).catch(() => newId(prefix))`. */
const idOr = (value: unknown, prefix: string): string =>
  typeof value === 'string' && value.length > 0 ? value : newId(prefix);
/** `z.array(itemSchema).catch([])`: as in zod, one non-object element empties the whole list. */
const objectList = <T>(value: unknown, coerce: (item: Rec) => T): T[] =>
  Array.isArray(value) && value.every(isPlainObject) ? value.map(coerce) : [];

function coerceSettings(value: unknown): CvSettings {
  const r = asRecord(value);
  return {
    language: oneOf(r.language, CV_LANGUAGES, 'en'),
    region: oneOf(r.region, CV_REGIONS, 'id'),
    showPhoto: bool(r.showPhoto),
    template: toTemplateId(r.template),
  };
}

function coercePersonalInfo(value: unknown): PersonalInfo {
  const r = asRecord(value);
  return {
    fullName: text(r.fullName),
    headline: text(r.headline),
    email: text(r.email),
    phone: text(r.phone),
    location: text(r.location),
    linkedIn: text(r.linkedIn),
    website: text(r.website),
    github: text(r.github),
    photo: text(r.photo),
  };
}

const coerceExperience = (r: Rec): Experience => ({
  id: idOr(r.id, 'exp'),
  company: text(r.company),
  position: text(r.position),
  location: text(r.location),
  startDate: text(r.startDate),
  endDate: text(r.endDate),
  current: bool(r.current),
  bullets: textList(r.bullets),
});

const coerceEducation = (r: Rec): Education => ({
  id: idOr(r.id, 'edu'),
  institution: text(r.institution),
  degree: text(r.degree),
  field: text(r.field),
  location: text(r.location),
  startDate: text(r.startDate),
  endDate: text(r.endDate),
  gpa: text(r.gpa),
  honors: text(r.honors),
});

const coerceSkill = (r: Rec): Skill => ({
  id: idOr(r.id, 'skill'),
  name: text(r.name),
  level: oneOf(r.level, SKILL_LEVELS, 'Intermediate'),
  category: oneOf(r.category, SKILL_CATEGORIES, 'Technical'),
});

const coerceProject = (r: Rec): Project => ({
  id: idOr(r.id, 'proj'),
  name: text(r.name),
  role: text(r.role),
  link: text(r.link),
  technologies: textList(r.technologies),
  startDate: text(r.startDate),
  endDate: text(r.endDate),
  bullets: textList(r.bullets),
});

const coerceCertification = (r: Rec): Certification => ({
  id: idOr(r.id, 'cert'),
  name: text(r.name),
  issuer: text(r.issuer),
  date: text(r.date),
  url: text(r.url),
});

const coerceLanguage = (r: Rec): LanguageItem => ({
  id: idOr(r.id, 'lang'),
  name: text(r.name),
  level: oneOf(r.level, LANGUAGE_LEVELS, 'B2'),
});

const coerceAdditional = (r: Rec): AdditionalItem => ({
  id: idOr(r.id, 'add'),
  kind: oneOf(r.kind, ADDITIONAL_KINDS, 'award'),
  title: text(r.title),
  organization: text(r.organization),
  date: text(r.date),
  description: text(r.description),
});

/** Zod-free twin of `cvSchema.parse`. Kept in sync by `normalize.test.ts`. */
export function coerceCV(value: unknown): CV {
  const r = asRecord(value);
  return {
    version: 2,
    title: text(r.title),
    settings: coerceSettings(r.settings),
    experienceLevel: oneOf(r.experienceLevel, EXPERIENCE_LEVELS, 'professional'),
    personalInfo: coercePersonalInfo(r.personalInfo),
    professionalSummary: text(r.professionalSummary),
    jobDescription: text(r.jobDescription),
    confirmedKeywords: textList(r.confirmedKeywords),
    experience: objectList(r.experience, coerceExperience),
    education: objectList(r.education, coerceEducation),
    skills: objectList(r.skills, coerceSkill),
    projects: objectList(r.projects, coerceProject),
    certifications: objectList(r.certifications, coerceCertification),
    languages: objectList(r.languages, coerceLanguage),
    additional: objectList(r.additional, coerceAdditional),
  };
}

/**
 * Dates are stored as "YYYY-MM" (or "YYYY"). Older drafts used full "YYYY-MM-DD"
 * values from <input type="date">, which are trimmed to month precision here.
 * Anything else (free text) is kept as typed.
 */
export function normalizeMonth(value: unknown): string {
  const value2 = asString(value).trim();
  const match = value2.match(/^(\d{4})-(\d{2})(?:-\d{2})?$/);
  return match ? `${match[1]}-${match[2]}` : value2;
}

export function parseList(value: string): string[] {
  return value
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);
}

/** v1 stored one free-text description; v2 stores bullet lines. */
function toBullets(item: Rec): string[] {
  if (Array.isArray(item.bullets)) return item.bullets.filter((b): b is string => typeof b === 'string');
  const { intro, bullets } = splitDescription(asString(item.description));
  return intro ? [intro, ...bullets] : bullets;
}

const LANGUAGE_LEVEL_FROM_V1: Record<string, string> = {
  Beginner: 'A2',
  Intermediate: 'B1',
  Advanced: 'C1',
  Expert: 'C2',
};

/** Rewrites a v1 draft (or anything else) into the v2 shape before coercion. */
function migrate(raw: unknown): Rec {
  const data = asRecord(raw);
  const skills = asArray(data.skills).map((skill) => (typeof skill === 'string' ? { name: skill } : asRecord(skill)));
  const isLanguage = (skill: Rec) => skill.category === 'Language';

  return {
    ...data,
    version: 2,
    personalInfo: asRecord(data.personalInfo),
    experience: asArray(data.experience).map((value) => {
      const item = asRecord(value);
      const current = item.current === true;
      return {
        ...item,
        startDate: normalizeMonth(item.startDate),
        endDate: current ? '' : normalizeMonth(item.endDate),
        bullets: toBullets(item),
      };
    }),
    education: asArray(data.education).map((value) => {
      const item = asRecord(value);
      return { ...item, startDate: normalizeMonth(item.startDate), endDate: normalizeMonth(item.endDate) };
    }),
    skills: skills.filter((skill) => !isLanguage(skill) && asString(skill.name).trim()),
    languages: [
      ...asArray(data.languages),
      ...skills
        .filter((skill) => isLanguage(skill) && asString(skill.name).trim())
        .map((skill) => ({ id: skill.id, name: skill.name, level: LANGUAGE_LEVEL_FROM_V1[asString(skill.level)] })),
    ],
    projects: asArray(data.projects).map((value) => {
      const item = asRecord(value);
      return {
        ...item,
        technologies:
          typeof item.technologies === 'string'
            ? parseList(item.technologies)
            : asArray(item.technologies)
                .filter((t): t is string => typeof t === 'string')
                .map((t) => t.trim())
                .filter(Boolean),
        startDate: normalizeMonth(item.startDate),
        endDate: normalizeMonth(item.endDate),
        bullets: toBullets(item),
      };
    }),
    certifications: asArray(data.certifications).map((value) => {
      const item = asRecord(value);
      return { ...item, date: normalizeMonth(item.date) };
    }),
    additional: asArray(data.additional).map((value) => {
      const item = asRecord(value);
      return { ...item, date: normalizeMonth(item.date) };
    }),
  };
}

export function normalizeCV(raw: unknown): CV {
  const cv = coerceCV(migrate(raw));
  // Trim empty bullets left over from editing.
  for (const entry of [...cv.experience, ...cv.projects]) entry.bullets = entry.bullets.map((b) => b.trim()).filter(Boolean);
  return cv;
}

const PERSONAL_FIELDS = ['fullName', 'email', 'phone', 'location', 'headline', 'linkedIn', 'website', 'github'];

/** An import must contain at least one recognised personal field, so unrelated JSON never replaces the CV. */
export function isCvLike(raw: unknown): boolean {
  const info = asRecord(asRecord(raw).personalInfo);
  return PERSONAL_FIELDS.some((field) => asString(info[field]).trim() !== '');
}
