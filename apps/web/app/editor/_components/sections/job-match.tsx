'use client';

import { useDeferredValue, useMemo } from 'react';
import { Chip, Field, ProgressBar, Textarea } from '@/components/ds';
import { matchKeywords } from '@/lib/cv/analysis/keywords';
import { SectionIntro, type SectionProps } from './shared';

export function JobMatchSection({ cv, update }: SectionProps) {
  const deferredCv = useDeferredValue(cv);
  const result = useMemo(() => matchKeywords(deferredCv, deferredCv.jobDescription), [deferredCv]);

  return (
    <div className="space-y-5">
      <SectionIntro
        title="Job Match"
        description="Tempel deskripsi lowongan. GenCV mencari keyword keahlian di lowongan itu dan mengecek mana yang sudah ada di CV kamu."
      />
      <Field label="Deskripsi lowongan" hint="Disimpan bersama CV ini dan tidak ikut dicetak.">
        {(control) => (
          <Textarea
            {...control}
            value={cv.jobDescription}
            className="min-h-[200px]"
            placeholder="Tempel teks lowongan di sini…"
            onChange={(e) => update((p) => ({ ...p, jobDescription: e.target.value }))}
          />
        )}
      </Field>

      {cv.jobDescription.trim() && (
        <section className="space-y-4 rounded-xl border border-border p-4" aria-live="polite">
          {result.score === null ? (
            <p className="text-sm text-muted-foreground">
              Belum ada keyword keahlian yang dikenali di teks ini. Pastikan yang ditempel adalah bagian persyaratan lowongan.
            </p>
          ) : (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-foreground">
                  {result.matched.length} dari {result.keywords.length} keyword ada di CV
                </span>
                <span className="font-semibold text-foreground">{result.score}%</span>
              </div>
              <ProgressBar value={result.score} label="Kecocokan keyword" tone="success" />
              <ul className="flex flex-wrap gap-1.5" aria-label="Keyword yang cocok">
                {result.matched.map((k) => (
                  <li key={k}>
                    <Chip tone="success">✓ {k}</Chip>
                  </li>
                ))}
              </ul>
              {result.missing.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Belum ada di CV</p>
                  <ul className="flex flex-wrap gap-1.5" aria-label="Keyword yang belum ada">
                    {result.missing.map((k) => (
                      <li key={k}>
                        <Chip tone="danger">{k}</Chip>
                      </li>
                    ))}
                  </ul>
                  <p className="text-xs text-muted-foreground">
                    Tambahkan ke keahlian atau poin pengalaman <strong>hanya jika memang kamu kuasai</strong>. Recruiter akan
                    menanyakannya saat interview.
                  </p>
                </div>
              )}
            </>
          )}
        </section>
      )}
    </div>
  );
}
