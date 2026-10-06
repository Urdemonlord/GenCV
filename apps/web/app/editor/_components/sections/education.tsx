'use client';

import { Field, Input } from '@/components/ds';
import { newId, type Education } from '@/lib/cv/schema';
import { MonthYearInput } from '../fields/month-year-input';
import { AddButton, FieldLabel, ItemPanel, SectionIntro, patchItem, removeItem, type SectionProps } from './shared';

const blank = (): Education => ({
  id: newId('edu'),
  institution: '',
  degree: '',
  field: '',
  location: '',
  startDate: '',
  endDate: '',
  gpa: '',
  honors: '',
});

export function EducationSection({ cv, update }: SectionProps) {
  const patch = (id: string, value: Partial<Education>) => patchItem(update, 'education', id, value);

  return (
    <div className="space-y-4">
      <SectionIntro title="Pendidikan" description="Pendidikan tertinggi dulu. Tulis IPK hanya kalau mendukung (umumnya ≥ 3.0)." />

      {cv.education.map((edu) => (
        <ItemPanel
          key={edu.id}
          title={edu.institution || edu.degree || 'Pendidikan baru'}
          removeLabel={`Hapus ${edu.institution || 'pendidikan'}`}
          onRemove={() => removeItem(update, 'education', edu.id)}
        >
          <Field label="Institusi *" className="sm:col-span-2">
            {(c) => <Input {...c} value={edu.institution} placeholder="Universitas Indonesia" onChange={(e) => patch(edu.id, { institution: e.target.value })} />}
          </Field>
          <Field label="Gelar">
            {(c) => <Input {...c} value={edu.degree} placeholder="Bachelor of Science / S.Kom" onChange={(e) => patch(edu.id, { degree: e.target.value })} />}
          </Field>
          <Field label="Jurusan">
            {(c) => <Input {...c} value={edu.field} placeholder="Informatika" onChange={(e) => patch(edu.id, { field: e.target.value })} />}
          </Field>
          <div>
            <FieldLabel>Mulai</FieldLabel>
            <MonthYearInput label="Mulai" value={edu.startDate} onChange={(startDate) => patch(edu.id, { startDate })} />
          </div>
          <div>
            <FieldLabel>Selesai (atau perkiraan)</FieldLabel>
            <MonthYearInput label="Selesai" value={edu.endDate} onChange={(endDate) => patch(edu.id, { endDate })} />
          </div>
          <Field label="IPK (opsional)">
            {(c) => <Input {...c} value={edu.gpa} placeholder="3.70/4.00" onChange={(e) => patch(edu.id, { gpa: e.target.value })} />}
          </Field>
          <Field label="Lokasi (opsional)">
            {(c) => <Input {...c} value={edu.location} placeholder="Depok, Indonesia" onChange={(e) => patch(edu.id, { location: e.target.value })} />}
          </Field>
          <Field label="Predikat / penghargaan (opsional)" className="sm:col-span-2">
            {(c) => <Input {...c} value={edu.honors} placeholder="Cum laude" onChange={(e) => patch(edu.id, { honors: e.target.value })} />}
          </Field>
        </ItemPanel>
      ))}

      <AddButton label="Tambah pendidikan" onClick={() => update((p) => ({ ...p, education: [...p.education, blank()] }))} />
    </div>
  );
}
