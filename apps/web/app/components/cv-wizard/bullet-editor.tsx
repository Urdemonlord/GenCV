'use client';

import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Button, Textarea } from '@/components/ds';

interface BulletEditorProps {
  label: string;
  bullets: string[];
  onChange: (bullets: string[]) => void;
  placeholder?: string;
}

/** One achievement per line; ATS and recruiters scan bullets, not paragraphs. */
export function BulletEditor({ label, bullets, onChange, placeholder }: BulletEditorProps) {
  const update = (index: number, value: string) => onChange(bullets.map((b, i) => (i === index ? value : b)));
  const remove = (index: number) => onChange(bullets.filter((_, i) => i !== index));
  const move = (index: number, delta: number) => {
    const next = [...bullets];
    const [item] = next.splice(index, 1);
    next.splice(index + delta, 0, item);
    onChange(next);
  };

  return (
    <fieldset className="space-y-2">
      <legend className="mb-1 text-sm font-medium text-foreground/90">{label}</legend>
      {bullets.map((bullet, index) => (
        <div key={index} className="flex items-start gap-2">
          <span aria-hidden="true" className="mt-2.5 text-muted-foreground">
            •
          </span>
          <Textarea
            aria-label={`${label} ${index + 1}`}
            value={bullet}
            onChange={(event) => update(index, event.target.value.replace(/\r?\n/g, ' '))}
            placeholder={placeholder}
            className="min-h-[60px] flex-1"
            rows={2}
          />
          <div className="flex flex-col">
            <Button variant="ghost" size="icon" className="size-7" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
              <ArrowUp />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-7"
              aria-label="Move down"
              disabled={index === bullets.length - 1}
              onClick={() => move(index, 1)}
            >
              <ArrowDown />
            </Button>
            <Button variant="ghost" size="icon" className="size-7" aria-label="Delete bullet" onClick={() => remove(index)}>
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={() => onChange([...bullets, ''])}>
        <Plus aria-hidden="true" />
        Add bullet
      </Button>
    </fieldset>
  );
}
