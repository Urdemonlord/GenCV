import Header from './components/header';
import Hero from './components/hero';
import SocialProof from './components/social-proof';
import Features from './components/features';
import Process from './components/process';
import FAQ from './components/faq';
import CTA from './components/cta';
import Footer from './components/footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <Features />
        <Process />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
