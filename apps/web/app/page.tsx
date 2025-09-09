import Link from 'next/link';
import { Button } from '@cv-generator/ui';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold">AutoCV</h1>
        <nav className="flex items-center gap-4">
          <Link href="/templates" className="text-sm">Templates</Link>
          <Button asChild size="sm">
            <Link href="/builder">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center px-4 py-20">
        <h2 className="text-3xl sm:text-5xl font-bold max-w-2xl mx-auto">
          Create Professional CVs in <span className="text-purple-500">Minutes</span>
        </h2>
        <p className="mt-4 text-sm sm:text-lg text-muted-foreground max-w-2xl">
          Build, customize, and export professional CVs with AI-powered content improvement and job-specific tailoring. Stand out from the crowd with ATS-friendly templates.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg">
            <Link href="/builder">Start Creating CV</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/templates">View Templates</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
