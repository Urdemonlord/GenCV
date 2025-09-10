import Header from './components/landing/Header';
import Hero from './components/landing/Hero';
import CTA from './components/landing/CTA';
import Footer from './components/landing/Footer';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Hero />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
