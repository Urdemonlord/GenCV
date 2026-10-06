import { inventedSkills, replaceInventedNumbers } from './guard';
import type { AiInput, AiOutput, AiTask } from './tasks';

export class AiOutputRejected extends Error {}

/** Strips list markers and wrapping quotes the model sometimes adds despite the rules. */
export const tidy = (text: string) =>
  text
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/, '')
    .replace(/^["“']([\s\S]*)["”']$/, '$1')
    .replace(/\s+/g, ' ')
    .trim();

const join = (...parts: (string | string[])[]) => parts.flat().join('\n');

function bullets(input: AiInput<'bullets'>, output: AiOutput<'bullets'>): AiOutput<'bullets'> {
  const context = join(input.title, input.organization, input.role, input.technologies, input.bullets);
  const allowed = [...input.confirmedKeywords, ...input.technologies, ...input.skills];
  const seen = new Set<number>();
  const suggestions = output.suggestions.flatMap((s) => {
    const original = input.bullets[s.index];
    if (original === undefined || seen.has(s.index)) return [];
    const improved = tidy(s.improved);
    // A new tool or language is a new claim about the user: drop the suggestion entirely.
    if (!improved || inventedSkills(improved, context, allowed).length > 0) return [];
    // Numbers must come from this very bullet, not from another one.
    const safe = replaceInventedNumbers(improved, join(original, input.title, input.organization));
    if (safe === original.trim()) return [];
    seen.add(s.index);
    return [{ index: s.index, improved: safe, reason: s.reason }];
  });
  return { suggestions };
}

function summary(input: AiInput<'summary'>, output: AiOutput<'summary'>): AiOutput<'summary'> {
  const source = join(
    input.summary,
    input.role,
    input.skills,
    input.experience.flatMap((e) => [e.position, e.organization])
  );
  const text = tidy(output.summary);
  if (inventedSkills(text, source, input.confirmedKeywords).length > 0) {
    throw new AiOutputRejected('Saran AI menyebut keahlian yang tidak ada di CV kamu, jadi tidak ditampilkan. Coba lagi.');
  }
  return { summary: replaceInventedNumbers(text, source), reason: output.reason };
}

function skills(input: AiInput<'skills'>, output: AiOutput<'skills'>): AiOutput<'skills'> {
  const have = new Set(input.skills.map((s) => s.toLowerCase()));
  return {
    skills: output.skills.filter((s) => {
      const key = s.name.trim().toLowerCase();
      if (have.has(key)) return false;
      have.add(key);
      return true;
    }),
  };
}

/** Validated model output → what the editor may show. */
export function postprocess<T extends AiTask>(task: T, input: AiInput<T>, output: AiOutput<T>): AiOutput<T> {
  switch (task) {
    case 'bullets':
      return bullets(input as AiInput<'bullets'>, output as AiOutput<'bullets'>) as AiOutput<T>;
    case 'summary':
      return summary(input as AiInput<'summary'>, output as AiOutput<'summary'>) as AiOutput<T>;
    default:
      return skills(input as AiInput<'skills'>, output as AiOutput<'skills'>) as AiOutput<T>;
  }
}
