import { containsTerm, normalizeText } from '@/lib/cv/analysis/keywords';
import { SKILL_TERMS } from '@/lib/cv/analysis/lexicon';

/**
 * Deterministic checks on AI output, on top of the prompt rules: the model is told not to
 * invent facts, and these catch the cases where it does anyway.
 */

// A number not glued to letters (so "S3", "ES6", "Web3" are names, not metrics), with its unit.
const NUMBER = /(?<![\p{L}\d])\d+(?:[.,]\d+)*(?:\s?(?:%|x|k|K|M|rb|jt|ribu|juta))?\+?(?![\p{L}\d])/gu;

const digitsOf = (token: string) => token.replace(/[^\d]/g, '');

/** Replaces every number the source text does not contain with a placeholder the user fills in. */
export function replaceInventedNumbers(output: string, source: string): string {
  const known = new Set(Array.from(source.matchAll(NUMBER), (m) => digitsOf(m[0])));
  return output.replace(NUMBER, (token) => {
    if (known.has(digitsOf(token))) return token;
    return token.trim().endsWith('%') ? '[X%]' : '[X]';
  });
}

/** Skill terms (tools, languages, methods) the output names but the source and confirmed keywords do not. */
export function inventedSkills(output: string, source: string, allowed: string[] = []): string[] {
  const out = normalizeText(output);
  const known = normalizeText([source, ...allowed].join(' \n '));
  return SKILL_TERMS.filter((term) => containsTerm(out, term) && !containsTerm(known, term));
}

/** Applies both checks: numbers become placeholders, and output naming new skills is rejected (null). */
export function guardText(output: string, source: string, allowed: string[] = []): string | null {
  if (inventedSkills(output, source, allowed).length > 0) return null;
  return replaceInventedNumbers(output, source);
}
