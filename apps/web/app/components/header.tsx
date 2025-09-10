import Link from 'next/link';
import { Button } from '@cv-generator/ui';

export default function Header() {
  return (
    <header className="flex items-center justify-between p-4 border-b">
      <h1 className="text-xl font-bold">GenCV</h1>
      <nav className="flex items-center gap-4">
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

