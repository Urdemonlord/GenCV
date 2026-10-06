'use client';

import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { Chip, ProgressBar, ScoreRing } from '@/components/ds';
import { scoreLabel, type CvAnalysis, type Severity } from '@/lib/cv/analysis/analyze';

const ICONS: Record<Severity, typeof CheckCircle2> = { good: CheckCircle2, warn: AlertTriangle, issue: XCircle };
const ICON_COLORS: Record<Severity, string> = { good: 'text-success', warn: 'text-warning', issue: 'text-destructive' };

export function AnalysisPanel({ analysis, onOpenJobMatch }: { analysis: CvAnalysis; onOpenJobMatch: () => void }) {
  const { overall, components, keywords } = analysis;

  return (
    <div className="space-y-5">
      <section className="flex items-center gap-4 rounded-xl border border-border p-4">
        <ScoreRing value={overall} size={88} label="Skor kesiapan ATS" caption="/ 100" />
        <div>
          <h2 className="text-base font-semibold text-foreground">Skor kesiapan ATS</h2>
          <p className="text-sm font-medium text-success">{scoreLabel(overall)}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Estimasi GenCV dari aturan yang bisa kamu lihat di bawah, bukan jaminan lolos ATS tertentu.
          </p>
        </div>
      </section>

      <section className="rounded-xl border border-border p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Job Match</h2>
          {keywords.score !== null && <span className="text-sm font-semibold text-foreground">{keywords.score}%</span>}
        </div>
        {keywords.score === null ? (
          <p className="text-sm text-muted-foreground">
            Tempel deskripsi lowongan untuk melihat keyword keahlian yang sudah dan belum ada di CV.{' '}
            <button type="button" className="font-medium text-primary-soft underline-offset-2 hover:underline" onClick={onOpenJobMatch}>
              Buka Job Match
            </button>
          </p>
        ) : (
          <div className="space-y-3">
            <ProgressBar value={keywords.score} label="Kecocokan keyword" tone="success" />
            <ul className="flex flex-wrap gap-1.5" aria-label="Keyword yang cocok">
              {keywords.matched.map((k) => (
                <li key={k}>
                  <Chip tone="success">✓ {k}</Chip>
                </li>
              ))}
            </ul>
            {keywords.missing.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs text-muted-foreground">Belum ada di CV</p>
                <ul className="flex flex-wrap gap-1.5" aria-label="Keyword yang belum ada">
                  {keywords.missing.map((k) => (
                    <li key={k}>
                      <Chip tone="danger">{k}</Chip>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </section>

      {components.map((component) => (
        <details key={component.id} className="group rounded-xl border border-border p-4" open={component.score < 70}>
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
            <span className="text-sm font-semibold text-foreground">{component.label}</span>
            <span className="text-sm font-semibold text-foreground">{component.score}%</span>
          </summary>
          <ProgressBar className="mt-2" value={component.score} label={component.label} />
          <ul className="mt-3 space-y-2">
            {component.findings.map((finding, index) => {
              const Icon = ICONS[finding.severity];
              return (
                <li key={index} className="flex gap-2 text-sm text-foreground/90">
                  <Icon className={`mt-0.5 size-4 shrink-0 ${ICON_COLORS[finding.severity]}`} aria-hidden="true" />
                  <span>{finding.message}</span>
                </li>
              );
            })}
          </ul>
        </details>
      ))}
    </div>
  );
}
