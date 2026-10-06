'use client';

import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface TabsProps<T extends string> {
  tabs: { value: T; label: ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  /**
   * Id of the element whose content the tabs switch. With it the component is a real
   * tablist (tabs reference the panel); without it, it is a segmented control of toggle
   * buttons, which is the right semantics when the selection only changes a setting.
   */
  panelId?: string;
  className?: string;
}

export function Tabs<T extends string>({ tabs, value, onChange, label, panelId, className }: TabsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const isTablist = Boolean(panelId);

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!delta) return;
    event.preventDefault();
    const next = (index + delta + tabs.length) % tabs.length;
    onChange(tabs[next].value);
    refs.current[next]?.focus();
  };

  return (
    <div
      role={isTablist ? 'tablist' : 'group'}
      aria-label={label}
      className={cn('inline-flex gap-1 rounded-lg bg-background/60 p-1', className)}
    >
      {tabs.map((tab, index) => {
        const selected = tab.value === value;
        return (
          <button
            key={tab.value}
            ref={(node) => {
              refs.current[index] = node;
            }}
            type="button"
            {...(isTablist
              ? { role: 'tab', 'aria-selected': selected, 'aria-controls': panelId, tabIndex: selected ? 0 : -1 }
              : { 'aria-pressed': selected })}
            onClick={() => onChange(tab.value)}
            onKeyDown={isTablist ? (event) => onKeyDown(event, index) : undefined}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              selected ? 'bg-surface-raised text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
