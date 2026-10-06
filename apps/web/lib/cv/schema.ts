import { z } from 'zod';
import { TEMPLATE_IDS } from './templates';

/**
 * CV data model v2: the single source of truth for the editor and every exporter.
 * Every field has a fallback (`catch`) so partial or older data never throws; the
 * v1 → v2 migration lives in normalize.ts.
 */

export const CV_LANGUAGES = ['en', 'id'] as const;
export const CV_REGIONS = ['id', 'us'] as const;
export const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;
export const SKILL_CATEGORIES = ['Technical', 'Soft'] as const;
export const LANGUAGE_LEVELS = ['Native', 'C2', 'C1', 'B2', 'B1', 'A2', 'A1'] as const;
export const ADDITIONAL_KINDS = ['award', 'organization', 'volunteer', 'publication'] as const;

export type CvLanguage = (typeof CV_LANGUAGES)[number];
export type CvRegion = (typeof CV_REGIONS)[number];
export type AdditionalKind = (typeof ADDITIONAL_KINDS)[number];

let idCounter = 0;
export const newId = (prefix = 'item') => `${prefix}_${Date.now().toString(36)}_${(++idCounter).toString(36)}`;

const text = z.string().catch('');
const list = z.array(z.string()).catch([]);
const id = (prefix: string) => z.string().min(1).catch(() => newId(prefix));
const items = <T extends z.ZodTypeAny>(schema: T) => z.array(schema).catch([]);

export const settingsSchema = z.object({
  language: z.enum(CV_LANGUAGES).catch('en'),
  region: z.enum(CV_REGIONS).catch('id'),
  /** Photos are common in Indonesia but avoided for US applications and ignored by ATS. */
  showPhoto: z.boolean().catch(false),
  template: z.enum(TEMPLATE_IDS).catch('modern'),
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
  experienceLevel: z.enum(['fresh', 'professional']).catch('professional'),
  personalInfo: personalInfoSchema.catch(() => personalInfoSchema.parse({})),
  professionalSummary: text,
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
export type Experience = CV['experience'][number];
export type Education = CV['education'][number];
export type Skill = CV['skills'][number];
export type Project = CV['projects'][number];
export type Certification = CV['certifications'][number];
export type LanguageItem = CV['languages'][number];
export type AdditionalItem = CV['additional'][number];

export const emptyCV = (): CV => cvSchema.parse({});
