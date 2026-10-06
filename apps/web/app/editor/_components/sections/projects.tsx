'use client';

import { useState } from 'react';
import { Field, Input } from '@/components/ds';
import { parseList } from '@/lib/cv/normalize';
import { newId, type Project } from '@/lib/cv/schema';
import { BulletAssist } from '../ai/bullet-assist';
import { BulletEditor } from '../fields/bullet-editor';
import { MonthYearInput } from '../fields/month-year-input';
import { AddButton, FieldLabel, ItemPanel, SectionIntro, patchItem, removeItem, type SectionProps } from './shared';

const blank = (): Project => ({
  id: newId('proj'),
  name: '',
  role: '',
  link: '',
  technologies: [],
  startDate: '',
  endDate: '',
  bullets: [''],
});

export function ProjectsSection({ cv, update }: SectionProps) {
  // Raw text of the technologies field while editing, so typing ", " is not swallowed.
  const [techDrafts, setTechDrafts] = useState<Record<string, string>>({});
  const patch = (id: string, value: Partial<Project>) => patchItem(update, 'projects', id, value);

  return (
    <div className="space-y-4">
      <SectionIntro title="Proyek" description="Proyek pribadi, kuliah, open source, atau freelance yang relevan." />

      {cv.projects.map((project) => (
        <ItemPanel
          key={project.id}
          title={project.name || 'Proyek baru'}
          removeLabel={`Hapus ${project.name || 'proyek'}`}
          onRemove={() => removeItem(update, 'projects', project.id)}
        >
          <Field label="Nama proyek *">
            {(c) => <Input {...c} value={project.name} placeholder="Churn Prediction Model" onChange={(e) => patch(project.id, { name: e.target.value })} />}
          </Field>
          <Field label="Peran (opsional)">
            {(c) => <Input {...c} value={project.role} placeholder="Lead developer" onChange={(e) => patch(project.id, { role: e.target.value })} />}
          </Field>
          <Field label="Teknologi" hint="Pisahkan dengan koma.">
            {(c) => (
              <Input
                {...c}
                value={techDrafts[project.id] ?? project.technologies.join(', ')}
                placeholder="Python, scikit-learn"
                onChange={(e) => {
                  setTechDrafts((d) => ({ ...d, [project.id]: e.target.value }));
                  patch(project.id, { technologies: parseList(e.target.value) });
                }}
                onBlur={() => setTechDrafts(({ [project.id]: _done, ...rest }) => rest)}
              />
            )}
          </Field>
          <Field label="Link (opsional)">
            {(c) => <Input {...c} value={project.link} placeholder="github.com/user/proyek" onChange={(e) => patch(project.id, { link: e.target.value })} />}
          </Field>
          <div>
            <FieldLabel>Mulai</FieldLabel>
            <MonthYearInput label="Mulai" value={project.startDate} onChange={(startDate) => patch(project.id, { startDate })} />
          </div>
          <div>
            <FieldLabel>Selesai</FieldLabel>
            <MonthYearInput label="Selesai" value={project.endDate} onChange={(endDate) => patch(project.id, { endDate })} />
          </div>
          <div className="space-y-3 sm:col-span-2">
            <BulletEditor
              label="Sorotan"
              bullets={project.bullets}
              onChange={(bullets) => patch(project.id, { bullets })}
              placeholder="Apa yang dibuat, peranmu, dan hasilnya"
            />
            <BulletAssist cv={cv} update={update} section="projects" itemId={project.id} hint="Apa yang kamu bangun, peranmu, dan hasilnya." />
          </div>
        </ItemPanel>
      ))}

      <AddButton label="Tambah proyek" onClick={() => update((p) => ({ ...p, projects: [...p.projects, blank()] }))} />
    </div>
  );
}
