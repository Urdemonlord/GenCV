'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Tabs } from '@/components/ds';
import { TEMPLATE_IDS, TEMPLATE_INFO, type TemplateAudience } from '@/lib/cv/templates';
import { TemplateCard } from '../components/landing/sections';

const FILTERS: { value: 'all' | TemplateAudience; label: string }[] = [
  { value: 'all', label: 'Semua' },
  { value: 'tech', label: 'Teknologi' },
  { value: 'business', label: 'Bisnis & korporat' },
  { value: 'creative', label: 'Kreatif' },
  { value: 'academic', label: 'Akademik' },
];

export function TemplateGallery() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['value']>('all');
  const panelId = 'template-gallery-results';
  const ids = TEMPLATE_IDS.filter((id) => filter === 'all' || TEMPLATE_INFO[id].audiences.includes(filter));

  return (
    <section className="py-16">
      <div className="mx-auto max-w-6xl px-4">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Template CV</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Semua template satu kolom dengan teks asli dan judul section standar, jadi tetap terbaca ATS. Pilih sesuai bidang;
          kamu bisa ganti kapan saja di editor tanpa mengetik ulang.
        </p>
        <Tabs className="mt-8 flex-wrap" label="Filter bidang" panelId={panelId} value={filter} onChange={setFilter} tabs={FILTERS} />
        <ul id={panelId} role="tabpanel" className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {ids.map((id) => (
            <li key={id}>
              <TemplateCard id={id} />
            </li>
          ))}
        </ul>
        <div className="mt-12 text-center">
          <Button asChild variant="primary" size="lg">
            <Link href="/editor">Mulai dengan template ini di editor</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
