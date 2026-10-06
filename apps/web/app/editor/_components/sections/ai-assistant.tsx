'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CheckCheck, ShieldCheck } from 'lucide-react';
import { Button, Panel } from '@/components/ds';
import { aiContext, requestAi } from '@/lib/ai-client';
import { isStale, summarySuggestion, type BulletSection, type Suggestion } from '@/lib/ai/suggestions';
import { matchKeywords } from '@/lib/cv/analysis/keywords';
import { aiErrorMessage, requestBulletSuggestions, SuggestionList, useSuggestions } from '../ai/suggestions';
import { AiButton, SectionIntro, type SectionProps } from './shared';

const LANGUAGE_LABELS = { 'en-US': 'English (US)', 'en-GB': 'English (UK)', id: 'Bahasa Indonesia' } as const;

/** Stays under the per-minute limit of the AI route. */
const MAX_REQUESTS = 8;

export function AiAssistantSection({ cv, update }: SectionProps) {
  const suggestions = useSuggestions(update);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [error, setError] = useState('');
  const [reviewed, setReviewed] = useState(false);
  const context = aiContext(cv);

  const jobKeywords = useMemo(() => matchKeywords(cv, cv.jobDescription), [cv]);
  const confirmable = useMemo(
    () => Array.from(new Set([...jobKeywords.missing, ...cv.confirmedKeywords])),
    [jobKeywords.missing, cv.confirmedKeywords]
  );
  const isConfirmed = (keyword: string) => cv.confirmedKeywords.some((k) => k.toLowerCase() === keyword.toLowerCase());
  const toggle = (keyword: string) =>
    update((p) => ({
      ...p,
      confirmedKeywords: p.confirmedKeywords.some((k) => k.toLowerCase() === keyword.toLowerCase())
        ? p.confirmedKeywords.filter((k) => k.toLowerCase() !== keyword.toLowerCase())
        : [...p.confirmedKeywords, keyword],
    }));

  const jobs: { label: string; run: () => Promise<Suggestion[]> }[] = [
    ...(cv.professionalSummary.trim() || cv.experience.length
      ? [
          {
            label: 'Ringkasan',
            run: async () => {
              const output = await requestAi('summary', {
                ...context,
                summary: cv.professionalSummary,
                experience: cv.experience.slice(0, 8).map((e) => ({ position: e.position, organization: e.company })),
                skills: cv.skills.slice(0, 40).map((s) => s.name),
              });
              return [summarySuggestion(cv.professionalSummary, output)];
            },
          },
        ]
      : []),
    ...(['experience', 'projects'] as BulletSection[]).flatMap((section) =>
      cv[section]
        .filter((item) => item.bullets.some((b) => b.trim()))
        .map((item) => ({
          label: 'position' in item ? item.position : item.name,
          run: () => requestBulletSuggestions(cv, section, item.id),
        }))
    ),
  ].slice(0, MAX_REQUESTS);

  const review = async () => {
    setError('');
    setReviewed(false);
    suggestions.clear();
    setProgress({ done: 0, total: jobs.length });
    const failures: string[] = [];
    for (const [i, job] of jobs.entries()) {
      try {
        suggestions.add(await job.run());
      } catch (err) {
        failures.push(`${job.label || 'Entri'}: ${aiErrorMessage(err)}`);
      }
      setProgress({ done: i + 1, total: jobs.length });
    }
    if (failures.length) setError(failures.join(' '));
    setProgress(null);
    setReviewed(true);
  };

  const acceptAll = () => suggestions.items.filter((s) => !isStale(cv, s)).forEach(suggestions.accept);

  return (
    <div className="space-y-5">
      <SectionIntro
        title="AI Assistant"
        description="Saran untuk merapikan teks CV kamu. AI hanya menulis ulang yang sudah ada dan tidak mengarang angka; tidak ada yang berubah sebelum kamu menerima sarannya."
      />

      <Panel className="space-y-3 p-4 text-sm">
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-muted-foreground">Peran yang dituju</dt>
            <dd className="font-medium">{context.role || <span className="text-warning">Isi headline di Informasi pribadi</span>}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Bahasa saran</dt>
            <dd className="font-medium">
              {LANGUAGE_LABELS[context.language]} <span className="font-normal text-muted-foreground">· ikut bahasa CV di Pengaturan</span>
            </dd>
          </div>
        </dl>
      </Panel>

      <Panel className="space-y-3 p-4">
        <h2 className="text-sm font-semibold">Keyword dari lowongan</h2>
        {!cv.jobDescription.trim() ? (
          <p className="text-sm text-muted-foreground">Tempel deskripsi lowongan di Job Match supaya AI tahu keyword yang dicari.</p>
        ) : confirmable.length === 0 ? (
          <p className="text-sm text-muted-foreground">Semua keyword yang dikenali di lowongan sudah ada di CV kamu.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Pilih keyword yang <strong className="text-foreground">benar-benar pernah kamu pakai</strong>. Hanya keyword yang dipilih
              yang boleh dimasukkan AI ke poin-poinmu.
            </p>
            <ul className="flex flex-wrap gap-2" aria-label="Keyword yang bisa dikonfirmasi">
              {confirmable.map((keyword) => {
                const on = isConfirmed(keyword);
                return (
                  <li key={keyword}>
                    <Button variant={on ? 'secondary' : 'outline'} size="sm" aria-pressed={on} onClick={() => toggle(keyword)}>
                      {on ? '✓ ' : '+ '}
                      {keyword}
                    </Button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Panel>

      <div className="flex flex-wrap items-center gap-3">
        <AiButton busy={progress !== null} disabled={jobs.length === 0} onClick={review}>
          Tinjau seluruh CV
        </AiButton>
        <span className="text-xs text-muted-foreground" role="status">
          {progress
            ? `Meninjau ${progress.done + 1} dari ${progress.total}…`
            : jobs.length === 0
              ? 'Tulis ringkasan atau poin pengalaman dulu.'
              : `${jobs.length} bagian akan ditinjau (ringkasan, pengalaman, proyek).`}
        </span>
      </div>
      {error && (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
      {reviewed && suggestions.items.length === 0 && !error && (
        <p className="text-sm text-muted-foreground">AI tidak punya saran; teks CV kamu sudah cukup kuat.</p>
      )}

      {suggestions.items.length > 1 && (
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={acceptAll}>
            <CheckCheck aria-hidden="true" />
            Terima semua ({suggestions.items.length})
          </Button>
        </div>
      )}
      <SuggestionList cv={cv} suggestions={suggestions.items} onAccept={suggestions.accept} onReject={suggestions.dismiss} />

      <p className="flex gap-2 border-t border-border pt-4 text-xs text-muted-foreground">
        <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
        <span>
          Teks yang ditinjau dikirim ke Google Gemini melalui server GenCV untuk diproses, dan tidak disimpan oleh GenCV.{' '}
          <Link href="/privasi" className="underline hover:text-foreground">
            Kebijakan privasi
          </Link>
        </span>
      </p>
    </div>
  );
}
