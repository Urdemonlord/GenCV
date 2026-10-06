import type { CV } from '@/lib/cv/schema';
import type { AiOutput } from './tasks';

/**
 * AI output as reviewable suggestions. Nothing is applied until the user accepts it, and a
 * suggestion whose original text has since been edited is never applied.
 */

export type BulletSection = 'experience' | 'projects';

export type SuggestionTarget =
  | { kind: 'summary' }
  | { kind: 'bullet'; section: BulletSection; itemId: string; index: number };

export interface Suggestion {
  key: string;
  target: SuggestionTarget;
  /** What the suggestion is about, e.g. "Software Engineer · poin 2". */
  label: string;
  before: string;
  after: string;
  reason: string;
}

const PLACEHOLDER = /\[[^\]\n]{1,24}\]/;

/** True when the text still contains a placeholder such as [X%] the user has to fill in. */
export const hasPlaceholder = (text: string) => PLACEHOLDER.test(text);

export function currentText(cv: CV, target: SuggestionTarget): string | undefined {
  if (target.kind === 'summary') return cv.professionalSummary;
  const item = (cv[target.section] as { id: string; bullets: string[] }[]).find((i) => i.id === target.itemId);
  return item?.bullets[target.index];
}

export const isStale = (cv: CV, s: Suggestion) => currentText(cv, s.target)?.trim() !== s.before.trim();

/** The CV with the suggestion applied, or null when its original text has changed meanwhile. */
export function applySuggestion(cv: CV, s: Suggestion): CV | null {
  if (isStale(cv, s)) return null;
  const { target } = s;
  if (target.kind === 'summary') return { ...cv, professionalSummary: s.after };
  return {
    ...cv,
    [target.section]: (cv[target.section] as { id: string; bullets: string[] }[]).map((item) =>
      item.id === target.itemId ? { ...item, bullets: item.bullets.map((b, i) => (i === target.index ? s.after : b)) } : item
    ),
  };
}

export function bulletSuggestions(
  section: BulletSection,
  item: { id: string; title: string },
  sent: { index: number; text: string }[],
  output: AiOutput<'bullets'>
): Suggestion[] {
  return output.suggestions.flatMap((s) => {
    const original = sent[s.index];
    if (!original) return [];
    return [
      {
        key: `${section}:${item.id}:${original.index}`,
        target: { kind: 'bullet', section, itemId: item.id, index: original.index },
        label: `${item.title || 'Entri'} · poin ${original.index + 1}`,
        before: original.text,
        after: s.improved,
        reason: s.reason,
      } satisfies Suggestion,
    ];
  });
}

export function summarySuggestion(before: string, output: AiOutput<'summary'>): Suggestion {
  return { key: 'summary', target: { kind: 'summary' }, label: 'Ringkasan', before, after: output.summary, reason: output.reason };
}
