'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { Plus, Trash2 } from 'lucide-react';
import { Button, Field, Input, Panel, Select, Textarea } from '@/components/ds';
import {
  ADDITIONAL_KINDS,
  LANGUAGE_LEVELS,
  newId,
  type AdditionalItem,
  type AdditionalKind,
  type CV,
  type Certification,
  type LanguageItem,
} from '@/lib/cv/schema';
import { MonthYearInput } from '../month-year-input';
import type { StepProps } from '../types';

type ListKey = 'certifications' | 'languages' | 'additional';
type ItemOf<K extends ListKey> = CV[K][number];

/** Shared add/update/remove helpers for the simple list sections. */
function useList<K extends ListKey>(key: K, { onDataChange }: StepProps) {
  const update = (id: string, patch: Partial<ItemOf<K>>) =>
    onDataChange((previous) => ({
      ...previous,
      [key]: (previous[key] as ItemOf<K>[]).map((item) => (item.id === id ? { ...item, ...patch } : item)),
    }));
  const remove = (id: string) =>
    onDataChange((previous) => ({ ...previous, [key]: (previous[key] as ItemOf<K>[]).filter((item) => item.id !== id) }));
  const add = (item: ItemOf<K>) => onDataChange((previous) => ({ ...previous, [key]: [...previous[key], item] }));
  return { update, remove, add };
}

function StepFrame({
  title,
  description,
  children,
  addLabel,
  onAdd,
  props,
}: {
  title: string;
  description: string;
  children: ReactNode;
  addLabel: string;
  onAdd: () => void;
  props: StepProps;
}) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{description}</p>
      </div>
      <div className="space-y-4">{children}</div>
      <Button variant="outline" className="w-full border-dashed" onClick={onAdd}>
        <Plus aria-hidden="true" />
        {addLabel}
      </Button>
      <div className="flex justify-between">
        {!props.isFirst && (
          <Button variant="outline" onClick={props.onPrevious}>
            Previous
          </Button>
        )}
        {props.isLast ? (
          <Button variant="primary" className="ml-auto" asChild>
            <Link href="/result">Finish &amp; view CV</Link>
          </Button>
        ) : (
          <Button variant="primary" className="ml-auto" onClick={props.onNext}>
            Next
          </Button>
        )}
      </div>
    </div>
  );
}

function ItemCard({ onRemove, label, children }: { onRemove: () => void; label: string; children: ReactNode }) {
  return (
    <Panel className="space-y-4 p-4">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" aria-label={`Delete ${label}`} onClick={onRemove}>
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">{children}</div>
    </Panel>
  );
}

export function CertificationsStep(props: StepProps) {
  const { update, remove, add } = useList('certifications', props);
  const blank = (): Certification => ({ id: newId('cert'), name: '', issuer: '', date: '', url: '' });

  return (
    <StepFrame
      title="Certifications"
      description="Licenses and certificates that matter for the roles you target."
      addLabel="Add certification"
      onAdd={() => add(blank())}
      props={props}
    >
      {props.cvData.certifications.map((cert) => (
        <ItemCard key={cert.id} label={cert.name || 'certification'} onRemove={() => remove(cert.id)}>
          <Field label="Name">
            {(control) => (
              <Input {...control} value={cert.name} onChange={(e) => update(cert.id, { name: e.target.value })} placeholder="AWS Certified Cloud Practitioner" />
            )}
          </Field>
          <Field label="Issuer">
            {(control) => (
              <Input {...control} value={cert.issuer} onChange={(e) => update(cert.id, { issuer: e.target.value })} placeholder="Amazon Web Services" />
            )}
          </Field>
          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-foreground/90">Date</span>
            <MonthYearInput label="Certification date" value={cert.date} onChange={(date) => update(cert.id, { date })} />
          </div>
          <Field label="Credential URL (optional)">
            {(control) => (
              <Input {...control} value={cert.url} onChange={(e) => update(cert.id, { url: e.target.value })} placeholder="credly.com/badges/…" />
            )}
          </Field>
        </ItemCard>
      ))}
    </StepFrame>
  );
}

const LEVEL_LABELS: Record<LanguageItem['level'], string> = {
  Native: 'Native',
  C2: 'C2 – Proficient',
  C1: 'C1 – Advanced',
  B2: 'B2 – Upper intermediate',
  B1: 'B1 – Intermediate',
  A2: 'A2 – Elementary',
  A1: 'A1 – Beginner',
};

export function LanguagesStep(props: StepProps) {
  const { update, remove, add } = useList('languages', props);

  return (
    <StepFrame
      title="Languages"
      description="Levels use the CEFR scale (A1–C2), the international standard recruiters recognise."
      addLabel="Add language"
      onAdd={() => add({ id: newId('lang'), name: '', level: 'B2' })}
      props={props}
    >
      {props.cvData.languages.map((lang) => (
        <ItemCard key={lang.id} label={lang.name || 'language'} onRemove={() => remove(lang.id)}>
          <Field label="Language">
            {(control) => (
              <Input {...control} value={lang.name} onChange={(e) => update(lang.id, { name: e.target.value })} placeholder="English" />
            )}
          </Field>
          <Field label="Level">
            {(control) => (
              <Select
                {...control}
                value={lang.level}
                onChange={(e) => update(lang.id, { level: e.target.value as LanguageItem['level'] })}
              >
                {LANGUAGE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {LEVEL_LABELS[level]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </ItemCard>
      ))}
    </StepFrame>
  );
}

const KIND_LABELS: Record<AdditionalKind, string> = {
  award: 'Award',
  organization: 'Organization',
  volunteer: 'Volunteering',
  publication: 'Publication',
};

export function AdditionalStep(props: StepProps) {
  const { update, remove, add } = useList('additional', props);
  const blank = (): AdditionalItem => ({ id: newId('add'), kind: 'award', title: '', organization: '', date: '', description: '' });

  return (
    <StepFrame
      title="Additional"
      description="Awards, organizations, volunteering and publications."
      addLabel="Add item"
      onAdd={() => add(blank())}
      props={props}
    >
      {props.cvData.additional.map((item) => (
        <ItemCard key={item.id} label={item.title || 'item'} onRemove={() => remove(item.id)}>
          <Field label="Type">
            {(control) => (
              <Select {...control} value={item.kind} onChange={(e) => update(item.id, { kind: e.target.value as AdditionalKind })}>
                {ADDITIONAL_KINDS.map((kind) => (
                  <option key={kind} value={kind}>
                    {KIND_LABELS[kind]}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Title / role">
            {(control) => (
              <Input {...control} value={item.title} onChange={(e) => update(item.id, { title: e.target.value })} placeholder="Best Paper Award" />
            )}
          </Field>
          <Field label="Organization">
            {(control) => (
              <Input
                {...control}
                value={item.organization}
                onChange={(e) => update(item.id, { organization: e.target.value })}
                placeholder="IEEE Indonesia"
              />
            )}
          </Field>
          <div className="space-y-1.5">
            <span className="block text-sm font-medium text-foreground/90">Date</span>
            <MonthYearInput label="Date" value={item.date} onChange={(date) => update(item.id, { date })} />
          </div>
          <Field label="Description (optional)" className="md:col-span-2">
            {(control) => (
              <Textarea
                {...control}
                value={item.description}
                onChange={(e) => update(item.id, { description: e.target.value })}
                className="min-h-[72px]"
              />
            )}
          </Field>
        </ItemCard>
      ))}
    </StepFrame>
  );
}
