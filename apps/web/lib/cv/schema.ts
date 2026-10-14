import { z } from 'zod';
import {
  ADDITIONAL_KINDS,
  CV_LANGUAGES,
  CV_REGIONS,
  EXPERIENCE_LEVELS,
  LANGUAGE_LEVELS,
  SKILL_CATEGORIES,
  SKILL_LEVELS,
  newId,
} from './model';
import { toTemplateId } from './templates';

/**
 * CV data model v2 as zod schemas.
 *
 * This module is the *oracle*, not the runtime. The browser never imports it: the editor
 * gets its values and types from `model.ts`, and the untrusted-input coercion the client
 * actually runs is hand-written in `normalize.ts`. Keeping zod out of the client bundle is
 * worth ≈15 kB gzip on `/editor` and `/dashboard`.
 *
 * `normalize.test.ts` asserts that `normalizeCV` produces exactly what `cvSchema.parse`
 * would, so the schema and the hand-written coercion cannot drift apart.
 */

const text = z.string().catch('');
const list = z.array(z.string()).catch([]);
const id = (prefix: string) => z.string().min(1).catch(() => newId(prefix));
const items = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).catch([]);

export const settingsSchema = z.object({
  language: z.enum(CV_LANGUAGES).catch('en'),
  region: z.enum(CV_REGIONS).catch('id'),
  /** Photos are common in Indonesia but avoided for US applications and ignored by ATS. */
  showPhoto: z.boolean().catch(false),
  // Maps the old 'modern'/'classic' ids and anything unknown to a current template.
  template: z.unknown().transform(toTemplateId),
});

export const personalInfoSchema = z.object({
  fullName: text,
  headline: text,
  email: text,
  phone: text,
  location: text,
  linkedIn: text,
  website: text,
  github: text,
  /** Resized JPEG data URL, or empty. */
  photo: text,
});

export const experienceSchema = z.object({
  id: id('exp'),
  company: text,
  position: text,
  location: text,
  startDate: text,
  endDate: text,
  current: z.boolean().catch(false),
  bullets: list,
});

export const educationSchema = z.object({
  id: id('edu'),
  institution: text,
  degree: text,
  field: text,
  location: text,
  startDate: text,
  endDate: text,
  gpa: text,
  honors: text,
});

export const skillSchema = z.object({
  id: id('skill'),
  name: text,
  level: z.enum(SKILL_LEVELS).catch('Intermediate'),
  category: z.enum(SKILL_CATEGORIES).catch('Technical'),
});

export const projectSchema = z.object({
  id: id('proj'),
  name: text,
  role: text,
  link: text,
  technologies: list,
  startDate: text,
  endDate: text,
  bullets: list,
});

export const certificationSchema = z.object({
  id: id('cert'),
  name: text,
  issuer: text,
  date: text,
  url: text,
});

export const languageSchema = z.object({
  id: id('lang'),
  name: text,
  level: z.enum(LANGUAGE_LEVELS).catch('B2'),
});

export const additionalSchema = z.object({
  id: id('add'),
  kind: z.enum(ADDITIONAL_KINDS).catch('award'),
  title: text,
  organization: text,
  date: text,
  description: text,
});

export const cvSchema = z.object({
  version: z.literal(2).catch(2),
  /** Document name shown in the editor (e.g. "CV Data Analyst – Tokopedia"); not printed on the CV. */
  title: text,
  settings: settingsSchema.catch(() => settingsSchema.parse({})),
  experienceLevel: z.enum(EXPERIENCE_LEVELS).catch('professional'),
  personalInfo: personalInfoSchema.catch(() => personalInfoSchema.parse({})),
  professionalSummary: text,
  /** Pasted job ad this CV is tailored to; drives the keyword match. Never exported. */
  jobDescription: text,
  /** Job-ad keywords the user confirmed real experience with; the only new terms AI may use. */
  confirmedKeywords: list,
  experience: items(experienceSchema),
  education: items(educationSchema),
  skills: items(skillSchema),
  projects: items(projectSchema),
  certifications: items(certificationSchema),
  languages: items(languageSchema),
  additional: items(additionalSchema),
});

export type CV = z.infer<typeof cvSchema>;
export type CvSettings = CV['settings'];
export type PersonalInfo = CV['personalInfo'];
export type Experience = CV['experience'][number];
export type Education = CV['education'][number];
export type Skill = CV['skills'][number];
export type Project = CV['projects'][number];
export type Certification = CV['certifications'][number];
export type LanguageItem = CV['languages'][number];
export type AdditionalItem = CV['additional'][number];
