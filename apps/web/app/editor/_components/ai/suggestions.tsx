'use client';

import { Fragment, useCallback, useState } from 'react';
import { Check, X } from 'lucide-react';
import { Button } from '@/components/ds';
import { AiError, aiContext, requestAi } from '@/lib/ai-client';
import { applySuggestion, bulletSuggestions, hasPlaceholder, isStale, type BulletSection, type Suggestion } from '@/lib/ai/suggestions';
import type { CV } from '@/lib/cv/schema';
import type { SectionProps } from '../sections/shared';

/** Pending suggestions for one part of the editor. */
export function useSuggestions(update: SectionProps['update']) {
  const [items, setItems] = useState<Suggestion[]>([]);

  const add = useCallback((next: Suggestion[]) => {
    // A newer suggestion for the same text replaces the older one.
    setItems((current) => [...current.filter((s) => !next.some((n) => n.key === s.key)), ...next]);
  }, []);
  const dismiss = useCallback((key: string) => setItems((current) => current.filter((s) => s.key !== key)), []);
  const accept = useCallback(
    (suggestion: Suggestion) => {
      update((cv) => applySuggestion(cv, suggestion) ?? cv);
      dismiss(suggestion.key);
    },
    [dismiss, update]
  );

  return { items, add, accept, dismiss, clear: () => setItems([]) };
}

/** Requests rewrites for the non-empty bullets of one experience or project entry. */
export async function requestBulletSuggestions(cv: CV, section: BulletSection, itemId: string): Promise<Suggestion[]> {
  const item = cv[section].find((i) => i.id === itemId);
  if (!item) return [];
  const sent = item.bullets.flatMap((text, index) => (text.trim() ? [{ index, text }] : []));
  if (sent.length === 0) return [];
  const title = 'position' in item ? item.position : item.name;
  const output = await requestAi('bullets', {
    ...aiContext(cv),
    section,
    title,
    organization: 'company' in item ? item.company : item.role,
    technologies: 'technologies' in item ? item.technologies : [],
    skills: cv.skills.slice(0, 60).map((s) => s.name),
    bullets: sent.map((b) => b.text),
  });
  return bulletSuggestions(section, { id: item.id, title }, sent, output);
}

export const aiErrorMessage = (error: unknown) => (error instanceof AiError ? error.message : 'Layanan AI sedang tidak tersedia.');

/** Text with [placeholders] highlighted, so missing figures stand out. */
function WithPlaceholders({ text }: { text: string }) {
  return (
    <>
      {text.split(/(\[[^\]\n]{1,24}\])/).map((part, i) =>
        /^\[.*\]$/.test(part) ? (
          <mark key={i} className="rounded bg-warning/20 px-0.5 text-warning">
            {part}
          </mark>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

export function SuggestionCard({
  suggestion,
  stale,
  onAccept,
  onReject,
}: {
  suggestion: Suggestion;
  stale: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  return (
    <li className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
      <p className="text-xs font-semibold text-primary-soft">{suggestion.label}</p>
      <dl className="mt-2 space-y-2">
        <div>
          <dt className="text-xs text-muted-foreground">Sebelum</dt>
          <dd className="text-muted-foreground line-through decoration-muted-foreground/50">{suggestion.before || '(kosong)'}</dd>
        </div>
        <div>
          <dt className="text-xs text-muted-foreground">Sesudah</dt>
          <dd className="text-foreground">
            <WithPlaceholders text={suggestion.after} />
          </dd>
        </div>
      </dl>
      {suggestion.reason && <p className="mt-2 text-xs text-muted-foreground">{suggestion.reason}</p>}
      {hasPlaceholder(suggestion.after) && !stale && (
        <p className="mt-2 text-xs text-warning">Ganti bagian dalam [kurung] dengan angka asli, atau hapus jika tidak ada datanya.</p>
      )}
      {stale && <p className="mt-2 text-xs text-warning">Teks aslinya sudah kamu ubah, jadi saran ini tidak bisa dipakai lagi.</p>}
      <div className="mt-3 flex gap-2">
        {!stale && (
          <Button variant="secondary" size="sm" onClick={onAccept}>
            <Check aria-hidden="true" />
            Terima
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={onReject}>
          <X aria-hidden="true" />
          {stale ? 'Tutup' : 'Tolak'}
        </Button>
      </div>
    </li>
  );
}

export function SuggestionList({
  cv,
  suggestions,
  onAccept,
  onReject,
  label = 'Saran AI',
}: {
  cv: CV;
  suggestions: Suggestion[];
  onAccept: (s: Suggestion) => void;
  onReject: (key: string) => void;
  label?: string;
}) {
  if (suggestions.length === 0) return null;
  return (
    <ul className="space-y-2" aria-label={label} aria-live="polite">
      {suggestions.map((s) => (
        <SuggestionCard key={s.key} suggestion={s} stale={isStale(cv, s)} onAccept={() => onAccept(s)} onReject={() => onReject(s.key)} />
      ))}
    </ul>
  );
}
