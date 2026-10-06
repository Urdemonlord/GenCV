import { z } from 'zod';

/**
 * Contract between the editor and `/api/ai`, shared by both sides. Every field has a length cap:
 * it bounds AI cost and keeps a single request from carrying a whole document.
 */

export const AI_LANGUAGES = ['en-US', 'en-GB', 'id'] as const;
export type AiLanguage = (typeof AI_LANGUAGES)[number];

const line = (max = 300) => z.string().trim().max(max);
const keywords = z.array(line(60)).max(30).default([]);

const context = {
  language: z.enum(AI_LANGUAGES),
  /** Target role, taken from the CV headline. */
  role: line(120).default(''),
  level: z.enum(['fresh', 'professional']).default('professional'),
  /** Job-ad keywords the user confirmed they really have; the only new terms the AI may use. */
  confirmedKeywords: keywords,
};

export const bulletsInput = z.object({
  ...context,
  section: z.enum(['experience', 'projects']),
  title: line(120).default(''),
  organization: line(120).default(''),
  technologies: z.array(line(60)).max(30).default([]),
  /** Skills the CV already lists: facts the user stated, so the AI may name them where they fit. */
  skills: z.array(line(60)).max(60).default([]),
  bullets: z.array(line(400)).min(1).max(12),
});

export const summaryInput = z.object({
  ...context,
  summary: line(1200).default(''),
  experience: z.array(z.object({ position: line(120), organization: line(120) })).max(8).default([]),
  skills: z.array(line(60)).max(40).default([]),
});

export const skillsInput = z.object({
  ...context,
  skills: z.array(line(60)).max(60).default([]),
  /** Positions and project names, so suggestions fit what the user actually did. */
  background: z.array(line(160)).max(12).default([]),
});

export const aiRequestSchema = z.discriminatedUnion('task', [
  z.object({ task: z.literal('bullets'), input: bulletsInput }),
  z.object({ task: z.literal('summary'), input: summaryInput }),
  z.object({ task: z.literal('skills'), input: skillsInput }),
]);

export type AiRequest = z.input<typeof aiRequestSchema>;
export type AiTask = AiRequest['task'];
export type AiInput<T extends AiTask> = Extract<z.infer<typeof aiRequestSchema>, { task: T }>['input'];

export const bulletsOutput = z.object({
  suggestions: z
    .array(z.object({ index: z.number().int().min(0), improved: z.string().trim().min(1).max(400), reason: z.string().trim().max(240).default('') }))
    .max(12),
});

export const summaryOutput = z.object({
  summary: z.string().trim().min(1).max(1200),
  reason: z.string().trim().max(240).default(''),
});

export const skillsOutput = z.object({
  skills: z.array(z.object({ name: z.string().trim().min(1).max(60), category: z.enum(['Technical', 'Soft']) })).max(15),
});

export const AI_OUTPUTS = { bullets: bulletsOutput, summary: summaryOutput, skills: skillsOutput } as const;
export type AiOutput<T extends AiTask> = z.infer<(typeof AI_OUTPUTS)[T]>;
