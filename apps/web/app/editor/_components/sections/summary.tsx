'use client';

import { useState } from 'react';
import { Field, Textarea } from '@/components/ds';
import { aiContext, requestAi } from '@/lib/ai-client';
import { summarySuggestion } from '@/lib/ai/suggestions';
import { aiErrorMessage, SuggestionList, useSuggestions } from '../ai/suggestions';
import { AiButton, SectionIntro, type SectionProps } from './shared';

export function SummarySection({ cv, update }: SectionProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const suggestions = useSuggestions(update);
  const summary = cv.professionalSummary;
  const words = summary.trim() ? summary.trim().split(/\s+/).length : 0;
  const context = aiContext(cv);
  // The AI writes only from what is already in the CV.
  const hasMaterial = Boolean(summary.trim() || context.role || cv.experience.length || cv.skills.length);

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const output = await requestAi('summary', {
        ...context,
        summary,
        experience: cv.experience.slice(0, 8).map((e) => ({ position: e.position, organization: e.company })),
        skills: cv.skills.slice(0, 40).map((s) => s.name),
      });
      suggestions.add([summarySuggestion(summary, output)]);
    } catch (err) {
      setError(aiErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5">
      <SectionIntro
        title="Ringkasan profesional"
        description="2–3 kalimat: siapa kamu, keahlian utama, dan nilai yang kamu bawa. Tanpa kata ganti “saya”/“I”."
      />
      <Field
        label="Ringkasan"
        hint={`${words} kata${words > 80 ? ' · terlalu panjang, idealnya 40–80 kata' : ''}`}
        error={error || undefined}
      >
        {(control) => (
          <Textarea
            {...control}
            value={summary}
            className="min-h-[160px]"
            placeholder="Data analyst with 4 years of experience turning retail data into decisions…"
            onChange={(e) => update((p) => ({ ...p, professionalSummary: e.target.value }))}
          />
        )}
      </Field>
      <div className="flex flex-wrap items-center gap-3">
        <AiButton busy={busy} disabled={!hasMaterial} onClick={generate}>
          {summary.trim() ? 'Perbaiki dengan AI' : 'Buat draf dengan AI'}
        </AiButton>
        {!hasMaterial && <span className="text-xs text-muted-foreground">Isi headline, pengalaman, atau keahlian dulu.</span>}
      </div>
      <SuggestionList cv={cv} suggestions={suggestions.items} onAccept={suggestions.accept} onReject={suggestions.dismiss} />
    </div>
  );
}
