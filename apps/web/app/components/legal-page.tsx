import type { ReactNode } from 'react';
import { CONTACT_EMAIL, OPERATOR } from '@/lib/seo';
import { SiteFooter } from './landing/sections';
import { SiteHeader } from './landing/site-header';

export interface LegalSection {
  title: string;
  body: ReactNode;
}

/** Shared layout for the privacy policy and terms: numbered sections plus a contact block. */
export function LegalPage({ title, updated, intro, sections }: { title: string; updated: string; intro: ReactNode; sections: LegalSection[] }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">Terakhir diperbarui {updated}</p>
        <div className="mt-6 leading-relaxed text-muted-foreground">{intro}</div>
        <div className="mt-8 space-y-10">
          {sections.map((section, index) => (
            <section key={section.title}>
              <h2 className="text-xl font-semibold">
                {index + 1}. {section.title}
              </h2>
              <div className="mt-3 space-y-3 leading-relaxed text-muted-foreground">{section.body}</div>
            </section>
          ))}
          <section>
            <h2 className="text-xl font-semibold">Kontak</h2>
            <p className="mt-3 leading-relaxed text-muted-foreground">
              GenCV dikelola oleh {OPERATOR}. Pertanyaan, permintaan, atau laporan bisa dikirim ke{' '}
              <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline">
                {CONTACT_EMAIL}
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
