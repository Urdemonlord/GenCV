'use client';

import Image from 'next/image';
import { FileText } from 'lucide-react';
import { Chip, Tabs } from '@/components/ds';
import { cn } from '@/lib/cn';
import type { CvAnalysis } from '@/lib/cv/analysis/analyze';
import { buildCvView } from '@/lib/cv/format';
import type { CV } from '@/lib/cv/schema';
import { recommendTemplate, TEMPLATE_IDS, TEMPLATE_INFO } from '@/lib/cv/templates';
import type { CvUpdate } from '@/lib/cv/use-cv-document';
import { AnalysisPanel } from './analysis-panel';
import { PdfPreview } from './pdf-preview';

export type PreviewTab = 'preview' | 'analysis' | 'template';


interface PreviewPanelProps {
  cv: CV;
  update: (next: CvUpdate) => void;
  analysis: CvAnalysis;
  tab: PreviewTab;
  onTabChange: (tab: PreviewTab) => void;
  onOpenJobMatch: () => void;
}

export function PreviewPanel({ cv, update, analysis, tab, onTabChange, onOpenJobMatch }: PreviewPanelProps) {
  const view = buildCvView(cv);
  const hasContent = view.name !== '' || view.sections.length > 0;
  const panelId = 'preview-panel-content';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-3 sm:px-4">
        <Tabs
          label="Panel pratinjau"
          panelId={panelId}
          value={tab}
          onChange={onTabChange}
          tabs={[
            { value: 'preview', label: 'Pratinjau' },
            { value: 'analysis', label: `Analisis · ${analysis.overall}` },
            { value: 'template', label: 'Template' },
          ]}
        />
        <span className="hidden text-xs text-muted-foreground sm:inline">{TEMPLATE_INFO[cv.settings.template].name}</span>
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
          </div>
        ) : tab === 'analysis' ? (
          <AnalysisPanel analysis={analysis} onOpenJobMatch={onOpenJobMatch} />
        ) : (
          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm text-muted-foreground">
              Semua template satu kolom dengan teks asli, jadi tetap terbaca ATS. Bedanya hanya tampilan.
            </legend>
            {TEMPLATE_IDS.map((id) => {
              const recommended = recommendTemplate(cv.personalInfo.headline, cv.experienceLevel);
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
                  <Image src={`/previews/${id}.webp`} alt="" width={60} height={85} sizes="60px" className="h-[85px] w-[60px] shrink-0 rounded-sm bg-white object-cover object-top ring-1 ring-border" />
                  <span>
                    <span className="flex flex-wrap items-center gap-2 font-semibold text-foreground">
                      {TEMPLATE_INFO[id].name}
                      {id === recommended && <Chip tone="primary">Direkomendasikan</Chip>}
                    </span>
                    <span className="block text-sm text-muted-foreground">{TEMPLATE_INFO[id].description}</span>
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
