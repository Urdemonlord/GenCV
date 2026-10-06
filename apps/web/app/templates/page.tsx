import type { Metadata } from 'next';
import { SiteFooter, TemplatesShowcase } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';

export const metadata: Metadata = {
  title: 'Template CV ramah ATS · GenCV',
  description: 'Template CV satu kolom yang terbaca ATS, dengan contoh hasil ekspor asli.',
};

export default function TemplatesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <TemplatesShowcase />
      </main>
      <SiteFooter />
    </>
  );
}
