import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Button } from '@/components/ds';

const NAV = [
  { href: '/', label: 'Beranda' },
  { href: '/templates', label: 'Template' },
  { href: '/#fitur', label: 'Fitur' },
  { href: '/#faq', label: 'FAQ' },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <FileText className="size-5 text-primary-soft" aria-hidden="true" />
          <span>
            Gen<span className="text-gradient">CV</span>
          </span>
        </Link>
        <nav aria-label="Utama" className="hidden md:block">
          <ul className="flex gap-6 text-sm text-muted-foreground">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <Button asChild variant="primary" size="sm" className="ml-auto">
          <Link href="/editor">Mulai gratis</Link>
        </Button>
      </div>
    </header>
  );
}
