import type { ReactNode } from 'react';
import { CONTACT_EMAIL, OPERATOR } from '@/lib/seo';
import { PageHero } from './landing/page-hero';
import { SiteFooter } from './landing/sections';
import { SiteHeader } from './landing/site-header';

export interface LegalSection {
  title: string;
  body: ReactNode;
}

/** Shared layout for the privacy policy and terms: numbered sections plus a contact block. */
export function LegalPage({
  eyebrow,
  title,
  updated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  updated: string;
  intro: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <>
      <SiteHeader />
      <main>
        <PageHero eyebrow={eyebrow} title={title} lead={intro} />
        <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:py-14">
          <p className="text-sm text-muted-foreground">Terakhir diperbarui {updated}</p>
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
                Ayo Kerja dikelola oleh {OPERATOR}. Pertanyaan, permintaan, atau laporan bisa dikirim ke{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-foreground underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
