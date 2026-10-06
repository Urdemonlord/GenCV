'use client';

import { useState } from 'react';
import { validateEmail, validatePhone } from '@cv-generator/utils';
import { Field, Input } from '@/components/ds';
import type { CV } from '@/lib/cv/schema';
import { PhotoInput } from '../fields/photo-input';
import { SectionIntro, type SectionProps } from './shared';

type InfoKey = Exclude<keyof CV['personalInfo'], 'photo'>;

const FIELDS: { key: InfoKey; label: string; placeholder: string; type?: string; required?: boolean; wide?: boolean }[] = [
  { key: 'fullName', label: 'Nama lengkap', placeholder: 'Arya Afendi', required: true },
  { key: 'headline', label: 'Profesi / jabatan', placeholder: 'Software Engineer' },
  { key: 'location', label: 'Lokasi', placeholder: 'Semarang, Indonesia', required: true },
  { key: 'email', label: 'Email', placeholder: 'arya@email.com', type: 'email', required: true },
  { key: 'phone', label: 'No. telepon', placeholder: '+62 812 3456 7890', type: 'tel', required: true },
  { key: 'linkedIn', label: 'LinkedIn', placeholder: 'linkedin.com/in/arya' },
  { key: 'github', label: 'GitHub / portfolio (opsional)', placeholder: 'github.com/arya' },
  { key: 'website', label: 'Website (opsional)', placeholder: 'arya.dev' },
];

function errorFor(key: InfoKey, value: string, required?: boolean): string | undefined {
  if (required && !value.trim()) return 'Wajib diisi.';
  if (key === 'email' && value.trim() && !validateEmail(value.trim())) return 'Format email belum benar.';
  if (key === 'phone' && value.trim() && !validatePhone(value)) return 'Nomor belum valid, contoh: +62 812 3456 7890.';
  return undefined;
}

export function PersonalSection({ cv, update }: SectionProps) {
  const [touched, setTouched] = useState<Partial<Record<InfoKey, boolean>>>({});
  const info = cv.personalInfo;
  const set = (key: keyof CV['personalInfo'], value: string) =>
    update((p) => ({ ...p, personalInfo: { ...p.personalInfo, [key]: value } }));

  return (
    <div className="space-y-6">
      <SectionIntro title="Informasi pribadi" description="Mulai dengan informasi dasar tentang diri kamu." />

      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map(({ key, label, placeholder, type, required }) => {
          const value = info[key];
          const hint =
            key === 'phone' && value.trim() && !value.trim().startsWith('+')
              ? 'Tambahkan kode negara (mis. +62) agar recruiter luar negeri bisa menghubungi.'
              : undefined;
          return (
            <Field key={key} label={required ? `${label} *` : label} error={touched[key] ? errorFor(key, value, required) : undefined} hint={hint}>
              {(control) => (
                <Input
                  {...control}
                  type={type}
                  value={value}
                  placeholder={placeholder}
                  autoComplete={key === 'fullName' ? 'name' : key === 'email' ? 'email' : key === 'phone' ? 'tel' : undefined}
                  onChange={(e) => set(key, e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, [key]: true }))}
                />
              )}
            </Field>
          );
        })}
      </div>

      <div className="border-t border-border pt-5">
        <PhotoInput
          photo={info.photo}
          showPhoto={cv.settings.showPhoto}
          disabledReason={cv.settings.region === 'us' ? 'Foto tidak dicantumkan untuk lamaran ke Amerika Serikat.' : undefined}
          onChange={({ photo, showPhoto }) =>
            update((p) => ({
              ...p,
              personalInfo: photo === undefined ? p.personalInfo : { ...p.personalInfo, photo },
              settings: showPhoto === undefined ? p.settings : { ...p.settings, showPhoto },
            }))
          }
        />
      </div>
    </div>
  );
}
