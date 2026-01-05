import Link from 'next/link';
import { Button } from '@cv-generator/ui';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-bold">GenCV</h1>
      <nav className="flex items-center gap-4" aria-label="Primary">
        <Link href="/#features" className="text-sm">
          Features
        </Link>
        <Link href="/#how-it-works" className="text-sm">
          How It Works
        </Link>
        <Link href="/#cta" className="text-sm">
          Get Started
        </Link>
        <Link href="/templates" className="text-sm">
          Templates
        </Link>
        <Button asChild size="sm">
          <Link href="/builder">Get Started</Link>
        </Button>
      </nav>
    </header>
  );
}
