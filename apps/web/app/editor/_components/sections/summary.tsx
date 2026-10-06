'use client';

import { useState } from 'react';
import { Field, Textarea } from '@/components/ds';
import { requestAi } from '@/lib/ai-client';
import { cleanText } from '@/lib/cv/format';
import { AiButton, SectionIntro, type SectionProps } from './shared';

export function SummarySection({ cv, update }: SectionProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const summary = cv.professionalSummary;
  const words = summary.trim() ? summary.trim().split(/\s+/).length : 0;

  const generate = async () => {
    setBusy(true);
    setError('');
    try {
      const role = cv.personalInfo.headline || cv.experience[0]?.position || '';
      const skills = cv.skills.map((s) => s.name).join(', ');
      const text = await requestAi({
        type: 'summary',
        text: [summary, role && `Role: ${role}`, skills && `Skills: ${skills}`].filter(Boolean).join('\n'),
      });
      update((p) => ({ ...p, professionalSummary: cleanText(text) }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat ringkasan.');
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
      <AiButton busy={busy} onClick={generate}>
        {summary.trim() ? 'Perbaiki dengan AI' : 'Buat draf dengan AI'}
      </AiButton>
    </div>
  );
}
