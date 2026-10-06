'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Check, FileText, Pencil } from 'lucide-react';
import { Button, NavItem, Select, Tabs } from '@/components/ds';
import { cn } from '@/lib/cn';
import { useCvDocument } from '@/lib/cv/use-cv-document';
import { ExportMenu } from './export-menu';
import { PreviewPanel } from './preview-panel';
import { EDITOR_SECTIONS } from './sections';

const relativeTime = new Intl.RelativeTimeFormat('id', { numeric: 'auto' });

function savedLabel(savedAt: number | null, now: number): string {
  if (!savedAt) return 'Belum tersimpan';
  const minutes = Math.round((savedAt - now) / 60_000);
  return `Tersimpan di perangkat ini · ${minutes === 0 ? 'baru saja' : relativeTime.format(minutes, 'minute')}`;
}

export function EditorShell() {
  const { cv, update, ready, savedAt, saveError } = useCvDocument();
  const [sectionIndex, setSectionIndex] = useState(0);
  const [mobileView, setMobileView] = useState<'form' | 'preview'>('form');
  const [now, setNow] = useState(() => Date.now());
  const section = EDITOR_SECTIONS[sectionIndex];
  const Section = section.component;

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => {
    setSectionIndex(index);
    document.getElementById('editor-form')?.scrollTo({ top: 0 });
  };

  return (
    <div className="flex h-dvh flex-col">
      <header className="flex flex-wrap items-center gap-3 border-b border-border bg-background/95 px-4 py-2.5">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold" aria-label="GenCV beranda">
          <FileText className="size-5 text-primary-soft" aria-hidden="true" />
          <span>
            Gen<span className="text-gradient">CV</span>
          </span>
        </Link>

        <div className="hidden min-w-0 items-center gap-2 border-l border-border pl-3 sm:flex">
          <label htmlFor="cv-title" className="sr-only">
            Nama dokumen
          </label>
          <input
            id="cv-title"
            value={cv.title}
            placeholder="CV Saya"
            onChange={(e) => update((p) => ({ ...p, title: e.target.value }))}
            className="w-48 min-w-0 truncate rounded-md bg-transparent px-1 py-0.5 text-sm font-semibold text-foreground placeholder:text-foreground hover:bg-accent"
          />
          <Pencil className="size-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
          <span className={cn('hidden text-xs md:inline', saveError ? 'text-warning' : 'text-muted-foreground')} aria-live="polite">
            {saveError ? 'Gagal menyimpan di perangkat (penyimpanan penuh?)' : ready ? savedLabel(savedAt, now) : ''}
          </span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Tabs
            className="lg:hidden"
            label="Tampilan"
            value={mobileView}
            onChange={setMobileView}
            tabs={[
              { value: 'form', label: 'Form' },
              { value: 'preview', label: 'Pratinjau' },
            ]}
          />
          <ExportMenu cv={cv} update={update} />
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <nav aria-label="Bagian CV" className="hidden w-60 shrink-0 overflow-y-auto border-r border-border p-3 lg:block">
          <p className="px-3 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Editor CV</p>
          <ul className="space-y-0.5">
            {EDITOR_SECTIONS.map((item, index) => {
              const complete = ready && item.isComplete(cv);
              return (
                <li key={item.id}>
                  <NavItem
                    icon={<item.icon />}
                    active={index === sectionIndex}
                    onClick={() => goTo(index)}
                    trailing={
                      complete ? (
                        <Check className="size-4 text-success" aria-label="lengkap" />
                      ) : item.optional ? (
                        <span className="text-[10px] text-muted-foreground">opsional</span>
                      ) : null
                    }
                  >
                    {item.label}
                  </NavItem>
                </li>
              );
            })}
          </ul>
        </nav>

        <main
          id="editor-form"
          className={cn('min-w-0 flex-1 overflow-y-auto', mobileView === 'preview' && 'hidden lg:block')}
        >
          <div className="mx-auto max-w-2xl p-4 sm:p-6">
            <div className="mb-5 lg:hidden">
              <label htmlFor="section-picker" className="sr-only">
                Pilih bagian
              </label>
              <Select id="section-picker" value={sectionIndex} onChange={(e) => goTo(Number(e.target.value))}>
                {EDITOR_SECTIONS.map((item, index) => (
                  <option key={item.id} value={index}>
                    {index + 1}. {item.label}
                  </option>
                ))}
              </Select>
            </div>

            {ready ? <Section cv={cv} update={update} /> : <p className="text-sm text-muted-foreground">Memuat draf…</p>}

            <div className="mt-8 flex justify-between gap-3 border-t border-border pt-5">
              <Button variant="outline" disabled={sectionIndex === 0} onClick={() => goTo(sectionIndex - 1)}>
                <ArrowLeft aria-hidden="true" />
                Sebelumnya
              </Button>
              {sectionIndex < EDITOR_SECTIONS.length - 1 ? (
                <Button variant="primary" onClick={() => goTo(sectionIndex + 1)}>
                  Selanjutnya
                  <ArrowRight aria-hidden="true" />
                </Button>
              ) : (
                <Button variant="primary" className="lg:hidden" onClick={() => setMobileView('preview')}>
                  Lihat pratinjau
                </Button>
              )}
            </div>
          </div>
        </main>

        <aside
          aria-label="Pratinjau CV"
          className={cn(
            'w-full shrink-0 border-l border-border bg-surface/40 lg:block lg:w-[440px] xl:w-[520px]',
            mobileView === 'form' && 'hidden'
          )}
        >
          {ready && <PreviewPanel cv={cv} update={update} />}
        </aside>
      </div>
    </div>
  );
}
