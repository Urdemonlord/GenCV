'use client';

import { useState } from 'react';
import { FileText } from 'lucide-react';
import { ProgressBar, Tabs } from '@/components/ds';
import { cn } from '@/lib/cn';
import { calculateCompleteness } from '@/lib/cv/completeness';
import { buildCvView } from '@/lib/cv/format';
import type { CV } from '@/lib/cv/schema';
import { TEMPLATE_IDS, type TemplateId } from '@/lib/cv/templates';
import type { CvUpdate } from '@/lib/cv/use-cv-document';
import { PdfPreview } from './pdf-preview';

const TEMPLATE_INFO: Record<TemplateId, { name: string; text: string; swatch: string }> = {
  modern: { name: 'Modern', text: 'Sans-serif, aksen biru. Cocok untuk sebagian besar posisi.', swatch: 'border-t-4 border-t-blue-700' },
  classic: { name: 'Classic', text: 'Serif, rata tengah. Formal untuk korporat, hukum, akademik.', swatch: 'border-t-2 border-t-gray-900' },
  creative: { name: 'Creative', text: 'Header berwarna. Untuk desain, marketing, startup.', swatch: 'border-t-[18px] border-t-violet-700' },
};

export function PreviewPanel({ cv, update }: { cv: CV; update: (next: CvUpdate) => void }) {
  const [tab, setTab] = useState<'preview' | 'template'>('preview');
  const view = buildCvView(cv);
  const hasContent = view.name !== '' || view.sections.length > 0;
  const completeness = calculateCompleteness(cv);
  const panelId = 'preview-panel-content';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
        <Tabs
          label="Panel pratinjau"
          panelId={panelId}
          value={tab}
          onChange={setTab}
          tabs={[
            { value: 'preview', label: 'Pratinjau' },
            { value: 'template', label: 'Template' },
          ]}
        />
        <span className="text-xs text-muted-foreground">{TEMPLATE_INFO[cv.settings.template].name}</span>
      </div>

      <div id={panelId} role="tabpanel" className="min-h-0 flex-1 overflow-y-auto p-4">
        {tab === 'preview' ? (
          <div className="space-y-4">
            {hasContent ? (
              <PdfPreview data={cv} template={cv.settings.template} />
            ) : (
              <div className="flex min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
                <FileText className="mb-3 size-10 opacity-50" aria-hidden="true" />
                Isi data kamu, pratinjau CV muncul di sini.
              </div>
            )}
            <section className="rounded-xl border border-border p-4">
              <div className="mb-2 flex items-center justify-between text-sm">
                <h2 className="font-medium text-foreground">Kelengkapan</h2>
                <span className="font-semibold text-foreground">{completeness.overall}%</span>
              </div>
              <ProgressBar value={completeness.overall} label="Kelengkapan CV" />
              {completeness.suggestions.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                  {completeness.suggestions.map((s) => (
                    <li key={s}>• {s}</li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        ) : (
          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm text-muted-foreground">
              Semua template satu kolom dengan teks asli, jadi tetap terbaca ATS. Bedanya hanya tampilan.
            </legend>
            {TEMPLATE_IDS.map((id) => {
              const selected = cv.settings.template === id;
              return (
                <label
                  key={id}
                  className={cn(
                    'flex cursor-pointer items-center gap-4 rounded-xl border p-3 transition-colors',
                    selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                  )}
                >
                  <input
                    type="radio"
                    name="template"
                    className="sr-only"
                    checked={selected}
                    onChange={() => update((p) => ({ ...p, settings: { ...p.settings, template: id } }))}
                  />
                  <span aria-hidden="true" className={cn('h-16 w-12 shrink-0 rounded-sm border border-border bg-white', TEMPLATE_INFO[id].swatch)} />
                  <span>
                    <span className="block font-semibold text-foreground">{TEMPLATE_INFO[id].name}</span>
                    <span className="block text-sm text-muted-foreground">{TEMPLATE_INFO[id].text}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        )}
      </div>
    </div>
  );
}
