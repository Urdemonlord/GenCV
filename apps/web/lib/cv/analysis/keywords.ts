import type { CV } from '../schema';
import { SKILL_TERMS, SYNONYMS } from './lexicon';

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Lower-cases and folds synonyms ("k8s" → "kubernetes") so both sides compare equally. */
export function normalizeText(text: string): string {
  let result = ` ${text.toLowerCase().replace(/\s+/g, ' ')} `;
  // Longest synonyms first so "restful apis" wins over "rest apis".
  for (const [from, to] of Object.entries(SYNONYMS).sort((a, b) => b[0].length - a[0].length)) {
    result = result.replace(new RegExp(`(?<![\\w.#+/-])${escape(from)}(?![\\w#+/-])`, 'g'), to);
  }
  return result;
}

/** Whole-term match that also works for terms with symbols (c++, ci/cd, .net, node.js). */
export function containsTerm(normalized: string, term: string): boolean {
  return new RegExp(`(?<![\\w.#+/-])${escape(term)}(?![\\w#+/-])`).test(normalized);
}

/** Every piece of CV text an ATS would read. */
export function cvText(cv: CV): string {
  return [
    cv.personalInfo.headline,
    cv.professionalSummary,
    ...cv.experience.flatMap((e) => [e.position, e.company, ...e.bullets]),
    ...cv.education.flatMap((e) => [e.degree, e.field, e.honors]),
    ...cv.skills.map((s) => s.name),
    ...cv.projects.flatMap((p) => [p.name, p.role, ...p.technologies, ...p.bullets]),
    ...cv.certifications.flatMap((c) => [c.name, c.issuer]),
    ...cv.languages.map((l) => l.name),
    ...cv.additional.flatMap((a) => [a.title, a.description]),
  ].join(' \n ');
}

export interface KeywordMatch {
  keywords: string[];
  matched: string[];
  missing: string[];
  /** 0–100, or null when no job description was provided. */
  score: number | null;
}

/**
 * Skills from a job ad that the CV does or does not mention. Only known skill terms are
 * extracted, so the result stays explainable (no fuzzy "relevance" numbers).
 */
export function matchKeywords(cv: CV, jobDescription: string): KeywordMatch {
  const ad = normalizeText(jobDescription);
  if (!jobDescription.trim()) return { keywords: [], matched: [], missing: [], score: null };

  const keywords = SKILL_TERMS.filter((term) => containsTerm(ad, term))
    // Prefer the specific phrase: drop "design" style terms already covered by a longer match.
    .filter((term, _, all) => !all.some((other) => other !== term && other.includes(term) && containsTerm(ad, other)));

  const cvNormalized = normalizeText(cvText(cv));
  const matched = keywords.filter((term) => containsTerm(cvNormalized, term));
  const missing = keywords.filter((term) => !matched.includes(term));
  return {
    keywords,
    matched,
    missing,
    score: keywords.length ? Math.round((matched.length / keywords.length) * 100) : null,
  };
}
