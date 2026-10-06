'use client';

import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { Button, Chip, Field, Input, Select } from '@/components/ds';
import { requestAi } from '@/lib/ai-client';
import { parseList } from '@/lib/cv/normalize';
import { newId, SKILL_CATEGORIES, type Skill } from '@/lib/cv/schema';
import { AiButton, SectionIntro, type SectionProps } from './shared';

const CATEGORY_LABELS: Record<Skill['category'], string> = { Technical: 'Teknis', Soft: 'Soft skill' };

export function SkillsSection({ cv, update }: SectionProps) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Skill['category']>('Technical');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const has = (skillName: string) => cv.skills.some((s) => s.name.toLowerCase() === skillName.toLowerCase());

  const add = (skillName: string, skillCategory: Skill['category'] = category) => {
    const trimmed = skillName.trim();
    if (!trimmed) return;
    update((p) =>
      p.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())
        ? p
        : { ...p, skills: [...p.skills, { id: newId('skill'), name: trimmed, level: 'Intermediate', category: skillCategory }] }
    );
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    // Allow pasting a comma-separated list.
    parseList(name).forEach((n) => add(n));
    setName('');
  };

  const suggest = async () => {
    setBusy(true);
    setError('');
    try {
      const role = cv.personalInfo.headline || cv.experience[0]?.position;
      if (!role) throw new Error('Isi profesi/jabatan di Informasi Pribadi dulu supaya saran relevan.');
      const text = await requestAi({ type: 'skills', role, experienceLevel: cv.experienceLevel });
      setSuggestions(parseList(text.replace(/\n/g, ',')).filter((s) => !has(s)).slice(0, 12));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengambil saran.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <SectionIntro
        title="Keahlian"
        description="Tulis keahlian yang memang kamu kuasai dan relevan dengan lowongan. Bahasa punya section sendiri."
      />

      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <Field label="Keahlian">
          {(c) => <Input {...c} value={name} placeholder="SQL, Python, Power BI" onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label="Kategori">
          {(c) => (
            <Select {...c} value={category} onChange={(e) => setCategory(e.target.value as Skill['category'])}>
              {SKILL_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {CATEGORY_LABELS[cat]}
                </option>
              ))}
            </Select>
          )}
        </Field>
        <Button type="submit" variant="secondary" disabled={!name.trim()}>
          Tambah
        </Button>
      </form>

      {SKILL_CATEGORIES.map((cat) => {
        const skills = cv.skills.filter((s) => s.category === cat);
        if (!skills.length) return null;
        return (
          <section key={cat}>
            <h2 className="mb-2 text-sm font-medium text-foreground/90">{CATEGORY_LABELS[cat]}</h2>
            <ul className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <li key={skill.id}>
                  <Chip className="py-1 pl-2.5 pr-1 text-sm">
                    {skill.name}
                    <button
                      type="button"
                      aria-label={`Hapus ${skill.name}`}
                      className="rounded p-0.5 text-muted-foreground hover:text-destructive"
                      onClick={() => update((p) => ({ ...p, skills: p.skills.filter((s) => s.id !== skill.id) }))}
                    >
                      <X aria-hidden="true" />
                    </button>
                  </Chip>
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      <section className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-muted-foreground">Saran AI berdasarkan profesi kamu. Pilih hanya yang benar-benar kamu kuasai.</p>
          <AiButton busy={busy} onClick={suggest}>
            Sarankan keahlian
          </AiButton>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {suggestions.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label="Saran keahlian">
            {suggestions.map((s) => (
              <li key={s}>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    add(s, 'Technical');
                    setSuggestions((list) => list.filter((x) => x !== s));
                  }}
                >
                  + {s}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
