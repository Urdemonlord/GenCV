'use client';

import { Field, Input, Select, Textarea } from '@/components/ds';
import {
  ADDITIONAL_KINDS,
  LANGUAGE_LEVELS,
  newId,
  type AdditionalItem,
  type AdditionalKind,
  type Certification,
  type LanguageItem,
} from '@/lib/cv/schema';
import { MonthYearInput } from '../fields/month-year-input';
import { AddButton, FieldLabel, ItemPanel, SectionIntro, patchItem, removeItem, type SectionProps } from './shared';

export function CertificationsSection({ cv, update }: SectionProps) {
  const patch = (id: string, value: Partial<Certification>) => patchItem(update, 'certifications', id, value);
  const blank = (): Certification => ({ id: newId('cert'), name: '', issuer: '', date: '', url: '' });

  return (
    <div className="space-y-4">
      <SectionIntro title="Sertifikasi" description="Lisensi dan sertifikat yang relevan dengan posisi yang kamu incar." />
      {cv.certifications.map((cert) => (
        <ItemPanel
          key={cert.id}
          title={cert.name || 'Sertifikasi baru'}
          removeLabel={`Hapus ${cert.name || 'sertifikasi'}`}
          onRemove={() => removeItem(update, 'certifications', cert.id)}
        >
          <Field label="Nama *">
            {(c) => <Input {...c} value={cert.name} placeholder="AWS Certified Cloud Practitioner" onChange={(e) => patch(cert.id, { name: e.target.value })} />}
          </Field>
          <Field label="Penerbit">
            {(c) => <Input {...c} value={cert.issuer} placeholder="Amazon Web Services" onChange={(e) => patch(cert.id, { issuer: e.target.value })} />}
          </Field>
          <div>
            <FieldLabel>Tanggal terbit</FieldLabel>
            <MonthYearInput label="Tanggal terbit" value={cert.date} onChange={(date) => patch(cert.id, { date })} />
          </div>
          <Field label="URL kredensial (opsional)">
            {(c) => <Input {...c} value={cert.url} placeholder="credly.com/badges/…" onChange={(e) => patch(cert.id, { url: e.target.value })} />}
          </Field>
        </ItemPanel>
      ))}
      <AddButton label="Tambah sertifikasi" onClick={() => update((p) => ({ ...p, certifications: [...p.certifications, blank()] }))} />
    </div>
  );
}

const LEVEL_LABELS: Record<LanguageItem['level'], string> = {
  Native: 'Bahasa ibu (native)',
  C2: 'C2 – Mahir',
  C1: 'C1 – Lanjut',
  B2: 'B2 – Menengah atas',
  B1: 'B1 – Menengah',
  A2: 'A2 – Dasar',
  A1: 'A1 – Pemula',
};

export function LanguagesSection({ cv, update }: SectionProps) {
  const patch = (id: string, value: Partial<LanguageItem>) => patchItem(update, 'languages', id, value);

  return (
    <div className="space-y-4">
      <SectionIntro
        title="Bahasa"
        description="Level memakai skala CEFR (A1–C2), standar internasional yang dikenali recruiter. Skor TOEFL/IELTS bisa ditaruh di Sertifikasi."
      />
      {cv.languages.map((lang) => (
        <ItemPanel
          key={lang.id}
          title={lang.name || 'Bahasa baru'}
          removeLabel={`Hapus ${lang.name || 'bahasa'}`}
          onRemove={() => removeItem(update, 'languages', lang.id)}
        >
          <Field label="Bahasa *">
            {(c) => <Input {...c} value={lang.name} placeholder="English" onChange={(e) => patch(lang.id, { name: e.target.value })} />}
          </Field>
          <Field label="Level">
            {(c) => (
              <Select {...c} value={lang.level} onChange={(e) => patch(lang.id, { level: e.target.value as LanguageItem['level'] })}>
                {LANGUAGE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {LEVEL_LABELS[level]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </ItemPanel>
      ))}
      <AddButton
        label="Tambah bahasa"
        onClick={() => update((p) => ({ ...p, languages: [...p.languages, { id: newId('lang'), name: '', level: 'B2' }] }))}
      />
    </div>
  );
}

const KIND_LABELS: Record<AdditionalKind, string> = {
  award: 'Penghargaan',
  organization: 'Organisasi',
  volunteer: 'Kegiatan sukarela',
  publication: 'Publikasi',
};

export function AdditionalSection({ cv, update }: SectionProps) {
  const patch = (id: string, value: Partial<AdditionalItem>) => patchItem(update, 'additional', id, value);
  const blank = (): AdditionalItem => ({ id: newId('add'), kind: 'award', title: '', organization: '', date: '', description: '' });

  return (
    <div className="space-y-4">
      <SectionIntro title="Tambahan" description="Penghargaan, organisasi, kegiatan sukarela, dan publikasi." />
      {cv.additional.map((item) => (
        <ItemPanel
          key={item.id}
          title={item.title || KIND_LABELS[item.kind]}
          removeLabel={`Hapus ${item.title || 'item'}`}
          onRemove={() => removeItem(update, 'additional', item.id)}
        >
          <Field label="Jenis">
            {(c) => (
              <Select {...c} value={item.kind} onChange={(e) => patch(item.id, { kind: e.target.value as AdditionalKind })}>
                {ADDITIONAL_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Judul / peran *">
            {(c) => <Input {...c} value={item.title} placeholder="Ketua Himpunan Mahasiswa" onChange={(e) => patch(item.id, { title: e.target.value })} />}
          </Field>
          <Field label="Organisasi / penyelenggara">
            {(c) => <Input {...c} value={item.organization} placeholder="HIMA Informatika" onChange={(e) => patch(item.id, { organization: e.target.value })} />}
          </Field>
          <div>
            <FieldLabel>Tanggal</FieldLabel>
            <MonthYearInput label="Tanggal" value={item.date} onChange={(date) => patch(item.id, { date })} />
          </div>
          <Field label="Keterangan (opsional)" className="sm:col-span-2">
            {(c) => (
              <Textarea {...c} value={item.description} className="min-h-[72px]" onChange={(e) => patch(item.id, { description: e.target.value })} />
            )}
          </Field>
        </ItemPanel>
      ))}
      <AddButton label="Tambah item" onClick={() => update((p) => ({ ...p, additional: [...p.additional, blank()] }))} />
    </div>
  );
}
