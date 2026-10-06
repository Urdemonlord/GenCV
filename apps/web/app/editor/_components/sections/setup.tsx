'use client';

import { Briefcase, GraduationCap } from 'lucide-react';
import { Field, Input, Select } from '@/components/ds';
import { cn } from '@/lib/cn';
import type { CvLanguage, CvRegion, CvSettings } from '@/lib/cv/schema';
import { SectionIntro, type SectionProps } from './shared';

const LEVELS = [
  { value: 'fresh', icon: GraduationCap, title: 'Fresh graduate', text: 'Baru lulus atau pengalaman kerja masih sedikit. Pendidikan dan proyek ditaruh di atas.' },
  { value: 'professional', icon: Briefcase, title: 'Profesional', text: 'Sudah punya riwayat kerja. Pengalaman kerja ditaruh di atas.' },
] as const;

export function SetupSection({ cv, update }: SectionProps) {
  const updateSettings = (patch: Partial<CvSettings>) =>
    update((previous) => ({ ...previous, settings: { ...previous.settings, ...patch } }));

  return (
    <div className="space-y-6">
      <SectionIntro title="Pengaturan CV" description="Tentukan untuk lowongan apa CV ini dibuat. Semua bisa diubah kapan saja." />

      <Field label="Nama dokumen" hint="Hanya untuk kamu, tidak dicetak di CV. Contoh: CV Data Analyst – Tokopedia">
        {(control) => (
          <Input {...control} value={cv.title} placeholder="CV Saya" onChange={(e) => update((p) => ({ ...p, title: e.target.value }))} />
        )}
      </Field>

      <fieldset>
        <legend className="mb-2 text-sm font-medium text-foreground/90">Tahap karier</legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {LEVELS.map(({ value, icon: Icon, title, text }) => {
            const selected = cv.experienceLevel === value;
            return (
              <label
                key={value}
                className={cn(
                  'flex cursor-pointer gap-3 rounded-xl border p-4 transition-colors',
                  selected ? 'border-primary bg-primary/10' : 'border-border hover:bg-accent'
                )}
              >
                <input
                  type="radio"
                  name="experience-level"
                  value={value}
                  checked={selected}
                  onChange={() => update((p) => ({ ...p, experienceLevel: value }))}
                  className="sr-only"
                />
                <Icon className="mt-0.5 size-5 shrink-0 text-primary-soft" aria-hidden="true" />
                <span>
                  <span className="block font-semibold text-foreground">{title}</span>
                  <span className="mt-1 block text-sm text-muted-foreground">{text}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bahasa isi CV" hint="Judul section dan tanggal mengikuti bahasa ini.">
          {(control) => (
            <Select {...control} value={cv.settings.language} onChange={(e) => updateSettings({ language: e.target.value as CvLanguage })}>
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </Select>
          )}
        </Field>
        <Field
          label="Melamar ke"
          hint={
            cv.settings.region === 'us'
              ? 'Kertas US Letter, usahakan 1 halaman, tanpa foto.'
              : 'Kertas A4; foto opsional untuk lamaran lokal.'
          }
        >
          {(control) => (
            <Select {...control} value={cv.settings.region} onChange={(e) => updateSettings({ region: e.target.value as CvRegion })}>
              <option value="id">Indonesia</option>
              <option value="us">Amerika Serikat</option>
            </Select>
          )}
        </Field>
      </div>
    </div>
  );
}
