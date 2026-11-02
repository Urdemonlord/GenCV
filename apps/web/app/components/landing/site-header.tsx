'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FileText, User } from 'lucide-react';
import { Button } from '@/components/ds';
import { authClient } from '@/lib/sync/auth-client';

const NAV = [
  { href: '/', label: 'Beranda' },
  { href: '/templates', label: 'Template' },
  { href: '/artikel', label: 'Artikel' },
  { href: '/lowongan', label: 'Lowongan' },
  { href: '/#fitur', label: 'Fitur' },
  { href: '/#faq', label: 'FAQ' },
  { href: '/dashboard', label: 'CV saya' },
];

/**
 * Header memakai sesi dari client: halaman-halaman di sini ada yang statis,
 * jadi komponen server tidak bisa tahu siapa yang masuk. Selama sesi masih
 * diperiksa, tampilkan versi belum masuk (sama dengan hasil prerender) supaya
 * tidak ada kedip hydration; begitu sesi ketemu, ganti ke versi masuk.
 */
export function SiteHeader() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
        <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
          <FileText className="size-5 text-brand-accent" aria-hidden="true" />
          <span>
            Gen<span className="text-brand-accent">CV</span>
          </span>
        </Link>
        <nav aria-label="Utama" className="hidden md:block">
          <ul className="flex items-center gap-1 text-sm text-muted-foreground">
            {NAV.map((item) => {
              // Halaman aktif memakai pil hijau seperti mockup; tautan jangkar
              // (/#fitur, /#faq) tidak pernah cocok dengan pathname.
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={
                      active
                        ? 'rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-foreground'
                        : 'rounded-full px-3 py-1.5 transition-colors hover:text-foreground'
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          {session ? (
            // Sengaja pendek: email yang panjang membuat header kepanjangan.
            // Identitas, sinkron, dan keluar pindah ke halaman /profil.
            <Button asChild variant="outline" size="sm">
              <Link href="/profil">
                <User aria-hidden="true" />
                Profil
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/masuk">Masuk</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link href="/editor">Mulai gratis</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
