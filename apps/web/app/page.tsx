import type { Metadata } from 'next';
import { Features } from './components/landing/features';
import { Hero } from './components/landing/hero';
import { MobileCta } from './components/landing/mobile-cta';
import { Faq, FinalCta, HowItWorks, SiteFooter, TemplatesShowcase } from './components/landing/sections';
import { SiteHeader } from './components/landing/site-header';
import { landingStructuredData } from '@/lib/seo';

// Title and description come from the layout defaults.
export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        // The object is built from our own constants, so there is nothing user-supplied to escape.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(landingStructuredData()) }}
      />
      <SiteHeader />
      <main>
        <Hero />
        <Features />
        <TemplatesShowcase />
        <HowItWorks />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
      <MobileCta />
    </>
  );
}
