'use client';

import { GraduationCap, Briefcase } from 'lucide-react';
import type { CvLanguage, CvRegion, CvSettings } from '@/lib/cv/schema';
import { Button, Card, CardContent } from '@cv-generator/ui';
import { Field, Select } from '@/components/ds';
import { StepProps } from '../types';

export function ExperienceLevelStep({ cvData, onDataChange, onNext }: StepProps) {
  const updateSettings = (patch: Partial<CvSettings>) =>
    onDataChange((previous) => ({ ...previous, settings: { ...previous.settings, ...patch } }));

  const handleLevelSelect = (level: 'fresh' | 'professional') => {
    onDataChange({
      ...cvData,
      experienceLevel: level,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">What&apos;s your experience level?</h2>
        <p className="text-muted-foreground">
          This helps us customize the form and provide better AI suggestions.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            cvData.experienceLevel === 'fresh' 
              ? 'ring-2 ring-primary bg-primary/10 ' 
              : 'hover:bg-accent '
          }`}
          onClick={() => handleLevelSelect('fresh')}
        >
          <CardContent className="p-6 text-center">
            <GraduationCap className="w-12 h-12 mx-auto mb-4 text-primary-soft" />
            <h3 className="text-lg font-semibold mb-2">Fresh Graduate</h3>
            <p className="text-sm text-muted-foreground">
              Recent graduate or entry-level professional with limited work experience
            </p>
          </CardContent>
        </Card>

        <Card 
          className={`cursor-pointer transition-all hover:shadow-lg ${
            cvData.experienceLevel === 'professional' 
              ? 'ring-2 ring-primary bg-primary/10 ' 
              : 'hover:bg-accent '
          }`}
          onClick={() => handleLevelSelect('professional')}
        >
          <CardContent className="p-6 text-center">
            <Briefcase className="w-12 h-12 mx-auto mb-4 text-primary-soft" />
            <h3 className="text-lg font-semibold mb-2">Professional</h3>
            <p className="text-sm text-muted-foreground">
              Experienced professional with work history and achievements
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="CV language" hint="Section headings and dates follow this language.">
          {(control) => (
            <Select
              {...control}
              value={cvData.settings.language}
              onChange={(event) => updateSettings({ language: event.target.value as CvLanguage })}
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </Select>
          )}
        </Field>
        <Field
          label="Applying in"
          hint={
            cvData.settings.region === 'us'
              ? 'US Letter paper, aim for 1 page, no photo.'
              : 'A4 paper; a photo is optional for local applications.'
          }
        >
          {(control) => (
            <Select
              {...control}
              value={cvData.settings.region}
              onChange={(event) => {
                const region = event.target.value as CvRegion;
                // Keep the photo preference: the exporters already leave photos off US CVs.
                updateSettings({ region });
              }}
            >
              <option value="id">Indonesia</option>
              <option value="us">United States</option>
            </Select>
          )}
        </Field>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={onNext}
          disabled={!cvData.experienceLevel}
          className="min-w-[100px]"
        >
          Next
        </Button>
      </div>
    </div>
  );
}