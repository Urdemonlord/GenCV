import Link from 'next/link';
import { Button } from '@cv-generator/ui';

export default function CTA() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900 text-center">
      <h2 className="text-2xl font-semibold mb-4">Ready to create your CV?</h2>
      <Button asChild size="lg">
        <Link href="/builder">Get Started</Link>
      </Button>
    </section>
  );
}
