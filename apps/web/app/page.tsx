import type { Metadata } from 'next';
import { Features } from './components/landing/features';
import { Hero } from './components/landing/hero';
import { MobileCta } from './components/landing/mobile-cta';
import { Faq, FinalCta, HowItWorks, SiteFooter, TemplatesShowcase } from './components/landing/sections';
import { SiteHeader } from './components/landing/site-header';

// Title and description come from the layout defaults.
export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function LandingPage() {
  return (
    <>
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
