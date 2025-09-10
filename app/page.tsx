import Header from '../components/Header';
import Hero from '../components/Hero';
import CTA from '../components/CTA';
import Footer from '../components/Footer';

export default function Home() {
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
