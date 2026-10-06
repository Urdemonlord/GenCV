'use client';

import { useState } from 'react';
import { Field, Input } from '@/components/ds';
import { requestAi } from '@/lib/ai-client';
import { toBulletList } from '@/lib/cv/format';
import { newId, type Experience } from '@/lib/cv/schema';
import { BulletEditor } from '../fields/bullet-editor';
import { MonthYearInput } from '../fields/month-year-input';
import { AddButton, AiButton, FieldLabel, ItemPanel, SectionIntro, patchItem, removeItem, type SectionProps } from './shared';

const blank = (): Experience => ({
  id: newId('exp'),
  company: '',
  position: '',
  location: '',
  startDate: '',
  endDate: '',
  current: false,
  bullets: [''],
});

export function ExperienceSection({ cv, update }: SectionProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const patch = (id: string, value: Partial<Experience>) => patchItem(update, 'experience', id, value);

  const enhance = async (exp: Experience) => {
    setBusyId(exp.id);
    setErrors((e) => ({ ...e, [exp.id]: '' }));
    try {
      const text = await requestAi({
        type: 'experience',
        role: exp.position,
        company: exp.company,
        text: exp.bullets.filter((b) => b.trim()).map((b) => `- ${b}`).join('\n'),
      });
      patch(exp.id, { bullets: toBulletList(text) });
    } catch (err) {
      setErrors((e) => ({ ...e, [exp.id]: err instanceof Error ? err.message : 'Gagal memperbaiki deskripsi.' }));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <SectionIntro
        title="Pengalaman kerja"
        description="Termasuk magang dan freelance. Urutan di CV otomatis dari yang terbaru."
      />

      {cv.experience.map((exp) => (
        <ItemPanel
          key={exp.id}
          title={exp.position || exp.company || 'Pengalaman baru'}
          removeLabel={`Hapus ${exp.position || 'pengalaman'}`}
          onRemove={() => removeItem(update, 'experience', exp.id)}
        >
          <Field label="Posisi *">
            {(c) => <Input {...c} value={exp.position} placeholder="Software Engineer" onChange={(e) => patch(exp.id, { position: e.target.value })} />}
          </Field>
          <Field label="Perusahaan *">
            {(c) => <Input {...c} value={exp.company} placeholder="PT Maju Jaya" onChange={(e) => patch(exp.id, { company: e.target.value })} />}
          </Field>
          <Field label="Lokasi" className="sm:col-span-2">
            {(c) => <Input {...c} value={exp.location} placeholder="Kota, Negara (atau Remote)" onChange={(e) => patch(exp.id, { location: e.target.value })} />}
          </Field>
          <div>
            <FieldLabel>Mulai</FieldLabel>
            <MonthYearInput label="Mulai" value={exp.startDate} onChange={(startDate) => patch(exp.id, { startDate })} />
          </div>
          <div>
            <FieldLabel>Selesai</FieldLabel>
            {exp.current ? (
              <div className="flex h-10 items-center rounded-lg border border-input bg-surface-raised px-3 text-sm text-muted-foreground">
                Sekarang
              </div>
            ) : (
              <MonthYearInput label="Selesai" value={exp.endDate} onChange={(endDate) => patch(exp.id, { endDate })} />
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted-foreground sm:col-span-2">
            <input
              type="checkbox"
              checked={exp.current}
              // One update for both fields; two separate updates would overwrite each other.
              onChange={(e) => patch(exp.id, { current: e.target.checked, endDate: e.target.checked ? '' : exp.endDate })}
            />
            Saya masih bekerja di sini
          </label>
          <div className="space-y-3 sm:col-span-2">
            <BulletEditor
              label="Pencapaian"
              bullets={exp.bullets}
              onChange={(bullets) => patch(exp.id, { bullets })}
              placeholder="Mis. Memangkas waktu laporan 30% dengan otomasi Python"
            />
            <div className="flex flex-wrap items-center gap-3">
              <AiButton busy={busyId === exp.id} disabled={!exp.bullets.some((b) => b.trim())} onClick={() => enhance(exp)}>
                Perbaiki dengan AI
              </AiButton>
              <span className="text-xs text-muted-foreground">Satu pencapaian per poin, diawali kata kerja aktif.</span>
            </div>
            {errors[exp.id] && <p className="text-sm text-destructive">{errors[exp.id]}</p>}
          </div>
        </ItemPanel>
      ))}

      <AddButton label="Tambah pengalaman" onClick={() => update((p) => ({ ...p, experience: [...p.experience, blank()] }))} />
    </div>
  );
}
