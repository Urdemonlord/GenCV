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
        <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:py-14">
        <div className="max-w-3xl">
          <p className="text-sm text-muted-foreground">Terakhir diperbarui {updated}</p>
          <div className="mt-8 space-y-10">
            {sections.map((section, index) => (
              <section key={section.title}>
                <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">
                  {index + 1}. {section.title}
                </h2>
                <div className="mt-3 space-y-3 leading-relaxed text-foreground-soft [&_a]:font-semibold [&_a]:text-primary">{section.body}</div>
              </section>
            ))}
            <section>
              <h2 className="font-display text-xl font-extrabold tracking-[-0.02em]">Kontak</h2>
              <p className="mt-3 leading-relaxed text-foreground-soft">
                Ayo Kerja dikelola oleh {OPERATOR}. Pertanyaan, permintaan, atau laporan bisa dikirim ke{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-primary underline">
                  {CONTACT_EMAIL}
                </a>
                .
              </p>
            </section>
          </div>
        </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
