'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button, Tabs } from '@/components/ds';
import { TEMPLATE_IDS, TEMPLATE_INFO, type TemplateAudience } from '@/lib/cv/templates';
import { TemplateCard } from '../components/landing/sections';
import { PageHero } from '../components/landing/page-hero';

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
    <>
      <PageHero
        eyebrow="Template CV"
        title="Template CV"
        lead="Semua template satu kolom dengan teks asli dan judul section standar, jadi tetap terbaca ATS. Pilih sesuai bidang; kamu bisa ganti kapan saja di editor tanpa mengetik ulang."
      />
      <section className="section-brand py-10 sm:py-14">
        <div className="mx-auto max-w-[1440px] px-4">
          <Tabs label="Filter bidang" panelId={panelId} value={filter} onChange={setFilter} tabs={FILTERS} />
          <ul id={panelId} role="tabpanel" className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {ids.map((id) => (
              <li key={id} className="card-brand flex flex-col p-4">
                <TemplateCard id={id} />
                <Button asChild variant="accent" size="sm" className="mt-4 self-start">
                  <Link href={`/editor?new=1&template=${id}`}>Pakai template ini</Link>
                </Button>
              </li>
            ))}
          </ul>
          <div className="mt-12 text-center">
            <Button asChild variant="accent" size="lg">
              <Link href="/editor">Buka editor</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
