import Link from 'next/link';
import { Button } from '@cv-generator/ui';

export default function CTA() {
  return (
    <section className="py-20 bg-gradient-brand text-white">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold">Ready to build your CV?</h2>
        <p className="mt-4 text-lg">
          Start creating a professional, job-winning CV in minutes.
        </p>
        <Button
          asChild
          size="lg"
          className="mt-8 bg-surface text-brand-accent hover:bg-accent"
        >
          <Link href="/builder">Get Started</Link>
        </Button>
      </div>
    </section>
  );
}

