import { Features } from './components/landing/features';
import { Hero } from './components/landing/hero';
import { Faq, FinalCta, HowItWorks, SiteFooter, TemplatesShowcase } from './components/landing/sections';
import { SiteHeader } from './components/landing/site-header';

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
    </>
  );
}
