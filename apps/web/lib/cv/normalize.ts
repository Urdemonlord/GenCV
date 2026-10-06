import { splitDescription } from './format';
import { cvSchema, type CV } from './schema';

type Rec = Record<string, unknown>;

const asRecord = (value: unknown): Rec =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Rec) : {};
const asArray = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const asString = (value: unknown): string => (typeof value === 'string' ? value : '');

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

export function parseList(text: string): string[] {
  return text
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

/** Rewrites a v1 draft (or anything else) into the v2 shape before schema parsing. */
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

/**
 * Coerces untrusted input (localStorage drafts, imported JSON, v1 data) into a complete
 * v2 CV so the UI and exporters never see missing fields.
 */
export function normalizeCV(raw: unknown): CV {
  const cv = cvSchema.parse(migrate(raw));
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
