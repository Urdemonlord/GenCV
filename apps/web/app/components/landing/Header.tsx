import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import { Button } from '@cv-generator/ui';

export default function Header() {
  return (
    <header className="flex items-center justify-between px-6 py-4 border-b">
      <Link href="/" className="text-xl font-bold">
        AutoCV
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/templates" className="text-sm">
          Templates
        </Link>
        <Button asChild size="sm">
          <Link href="/builder">Get Started</Link>
        </Button>
        <ThemeToggle />
      </nav>
    </header>
  );
}
