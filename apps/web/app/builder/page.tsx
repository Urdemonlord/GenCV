'use client';

import { useState, useEffect, useCallback } from 'react';
import { FileText, Sparkles, Download, Upload } from 'lucide-react';
import { Button, Panel, Tabs } from '@/components/ds';
import { toTemplateId } from '@/lib/cv/templates';
import { CVWizard } from '../components/cv-wizard';
import type { CVDataUpdate } from '../components/cv-wizard/types';
import { CVPreview } from '../components/cv-preview';
import { CV } from '@/lib/cv/schema';
import { loadFromLocalStorage, saveToLocalStorage } from '@cv-generator/utils';
import { useToast } from '@/hooks/use-toast';
import { downloadCvJson } from '@/lib/cv/download';
import { isCvLike, normalizeCV } from '@/lib/cv/normalize';
import { emptyCV } from '@/lib/cv/schema';
import Link from 'next/link';

export default function BuilderPage() {
  const [cvData, setCVData] = useState<CV>(emptyCV);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState('modern');
  const [mounted, setMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Load data from localStorage only after mounting to prevent hydration mismatch
    const savedData = loadFromLocalStorage('cv-data');
    if (savedData) {
      setCVData(normalizeCV(savedData));
    }
    setMounted(true);
  }, []);

  // Persist only after the saved draft has been loaded, so it is never overwritten by the empty form.
  useEffect(() => {
    if (mounted) saveToLocalStorage('cv-data', cvData);
  }, [cvData, mounted]);

  const handleDataChange = useCallback((update: CVDataUpdate) => {
    setCVData((previous) => (typeof update === 'function' ? update(previous) : update));
  }, []);

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed: unknown = JSON.parse(String(e.target?.result ?? ''));
        if (!isCvLike(parsed)) throw new Error('missing personalInfo');
        handleDataChange(normalizeCV(parsed));
      } catch {
        toast({
          variant: 'destructive',
          title: 'Invalid file',
          description: 'Please select a CV data JSON file exported from GenCV.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 rounded-md text-xl font-bold tracking-tight">
            <FileText className="size-5 text-primary" aria-hidden="true" />
            <span>
              Gen<span className="text-gradient">CV</span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <input type="file" accept=".json" onChange={handleImport} className="hidden" id="import-cv" />
            <Button variant="outline" size="sm" onClick={() => document.getElementById('import-cv')?.click()}>
              <Upload aria-hidden="true" />
              <span className="hidden sm:inline">Import</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadCvJson(cvData)}>
              <Download aria-hidden="true" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-3 py-4 sm:px-4 sm:py-8">
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
          <Panel className="p-4 sm:p-6">
            <div className="mb-3 flex items-center gap-2 sm:mb-4">
              <Sparkles className="size-5 text-primary" aria-hidden="true" />
              <h2 className="text-lg font-semibold sm:text-xl">Create Your Professional CV</h2>
            </div>
            <p className="mb-4 text-sm text-muted-foreground sm:mb-6 sm:text-base">
              Fill in each step; the preview shows exactly the PDF you will download.
            </p>
            <CVWizard
              cvData={cvData}
              onDataChange={handleDataChange}
              currentStep={currentStep}
              onStepChange={setCurrentStep}
            />
          </Panel>

          <Panel className="p-4 sm:p-6">
            <div className="mb-3 flex flex-col justify-between gap-2 sm:mb-4 sm:flex-row sm:items-center">
              <h2 className="text-lg font-semibold sm:text-xl">Live Preview</h2>
              <Tabs
                label="Template"
                value={toTemplateId(selectedTemplate)}
                onChange={setSelectedTemplate}
                tabs={[
                  { value: 'modern', label: 'Modern' },
                  { value: 'classic', label: 'Classic' },
                  { value: 'creative', label: 'Creative' },
                ]}
              />
            </div>
            <CVPreview cvData={cvData} template={selectedTemplate} />
          </Panel>
        </div>
      </main>
    </div>
  );
}
