import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { MobileCta } from '../components/landing/mobile-cta';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { TemplateGallery } from './template-gallery';

export const metadata: Metadata = pageMetadata({
  title: 'Template CV ramah ATS',
  description: 'Enam template CV satu kolom yang terbaca ATS: Professional, Minimal, Executive, Tech, Academic, Creative. Contoh hasil ekspor asli.',
  path: '/templates',
});

export default function TemplatesPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <TemplateGallery />
      </main>
      <SiteFooter />
      <MobileCta />
    </>
  );
}
