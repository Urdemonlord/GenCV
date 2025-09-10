import Link from 'next/link';
import { Button } from '@cv-generator/ui';

export default function Hero() {
  return (
    <section className="text-center py-24 px-6">
      <h1 className="text-4xl md:text-5xl font-bold mb-4">
        Create Professional CVs in <span className="text-purple-500">Minutes</span>
      </h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
        Build, customize, and export professional CVs with AI-powered content improvement and job-specific tailoring.
      </p>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button asChild size="lg">
          <Link href="/builder">Start Creating CV</Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/templates">View Templates</Link>
        </Button>
      </div>
    </section>
  );
}
