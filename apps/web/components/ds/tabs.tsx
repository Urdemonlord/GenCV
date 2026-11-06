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
      className={cn('inline-flex max-w-full gap-1 overflow-x-auto rounded-full bg-surface p-1 scrollbar-hide', className)}
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
              // Pil aktif biru, seperti navigasi header Ayo Kerja.
              'shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-bold transition-colors',
              selected ? 'bg-primary text-primary-foreground' : 'text-foreground-soft hover:text-primary'
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
