'use client';

import type { ReactNode } from 'react';
import { Loader2, Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button, Panel } from '@/components/ds';
import type { CV } from '@/lib/cv/schema';
import type { CvUpdate } from '@/lib/cv/use-cv-document';

export interface SectionProps {
  cv: CV;
  update: (next: CvUpdate) => void;
}

export function SectionIntro({ title, description }: { title: string; description: string }) {
  return (
    <header className="mb-5">
      <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </header>
  );
}

export function ItemPanel({
  title,
  onRemove,
  removeLabel,
  children,
}: {
  title: string;
  onRemove: () => void;
  removeLabel: string;
  children: ReactNode;
}) {
  return (
    <Panel className="p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
        <Button variant="ghost" size="sm" aria-label={removeLabel} onClick={onRemove}>
          <Trash2 aria-hidden="true" />
        </Button>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Panel>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <Button variant="outline" className="w-full border-dashed" onClick={onClick}>
      <Plus aria-hidden="true" />
      {label}
    </Button>
  );
}

export function AiButton({ busy, disabled, onClick, children }: { busy: boolean; disabled?: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} disabled={busy || disabled}>
      {busy ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
      {busy ? 'Memproses…' : children}
    </Button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <span className="mb-1.5 block text-sm font-medium text-foreground/90">{children}</span>;
}

/** Replaces one item of a list section by id. */
export function patchItem<K extends 'experience' | 'education' | 'projects' | 'certifications' | 'languages' | 'additional'>(
  update: SectionProps['update'],
  key: K,
  id: string,
  patch: Partial<CV[K][number]>
) {
  update((previous) => ({
    ...previous,
    [key]: (previous[key] as CV[K][number][]).map((item) => (item.id === id ? { ...item, ...patch } : item)),
  }));
}

export function removeItem(update: SectionProps['update'], key: keyof Pick<CV, 'experience' | 'education' | 'projects' | 'certifications' | 'languages' | 'additional'>, id: string) {
  update((previous) => ({ ...previous, [key]: (previous[key] as { id: string }[]).filter((item) => item.id !== id) }));
}
