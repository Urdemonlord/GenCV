import type {
  AdditionalItem,
  Certification,
  CvSettings,
  CV,
  Education,
  Experience,
  LanguageItem,
  PersonalInfo,
  Project,
  Skill,
} from './schema';

/**
 * Zod-free home for everything the browser needs at runtime: the CV type aliases, the
 * option lists the editor renders, and the blank document.
 *
 * Keeping these out of `schema.ts` is what keeps zod (≈15 kB gzip) out of the `/editor`
 * and `/dashboard` bundles: client components only ever need values from here, so
 * `schema.ts` ends up imported by tests alone. There it acts as the oracle that
 * `normalize.test.ts` checks the hand-written coercion in `normalize.ts` against.
 *
 * The `import type` above is erased at compile time, so at runtime this module has no
 * dependency on zod (or on `schema.ts` at all).
 */

export const CV_LANGUAGES = ['en', 'id'] as const;
export const CV_REGIONS = ['id', 'us', 'uk', 'eu'] as const;
export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
export const SKILL_CATEGORIES = ['Technical', 'Soft'] as const;
export const LANGUAGE_LEVELS = ['Native', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const;
export const ADDITIONAL_KINDS = ['award', 'organization', 'volunteer', 'publication'] as const;
export const EXPERIENCE_LEVELS = ['fresh', 'professional'] as const;

export type CvLanguage = (typeof CV_LANGUAGES)[number];
export type CvRegion = (typeof CV_REGIONS)[number];
export type AdditionalKind = (typeof ADDITIONAL_KINDS)[number];
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

let idCounter = 0;
export const newId = (prefix = 'item') => `${prefix}_${Date.now().toString(36)}_${(++idCounter).toString(36)}`;

/** The blank document. `normalize.test.ts` asserts it equals `cvSchema.parse({})`. */
export const emptyCV = (): CV => ({
  version: 2,
  title: '',
  settings: { language: 'en', region: 'id', showPhoto: false, template: 'professional' },
  experienceLevel: 'professional',
  personalInfo: {
    fullName: '',
    headline: '',
    email: '',
    phone: '',
    location: '',
    linkedIn: '',
    website: '',
    github: '',
    photo: '',
  },
  professionalSummary: '',
  jobDescription: '',
  confirmedKeywords: [],
  experience: [],
  education: [],
  skills: [],
  projects: [],
  certifications: [],
  languages: [],
  additional: [],
});

export type {
  AdditionalItem,
  Certification,
  CvSettings,
  CV,
  Education,
  Experience,
  LanguageItem,
  PersonalInfo,
  Project,
  Skill,
};
