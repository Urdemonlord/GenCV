import Header from './components/header';
import Hero from './components/hero';
import Features from './components/features';
import Process from './components/process';
import CTA from './components/cta';
import Footer from './components/footer';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Hero />
        <Features />
        <Process />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
