'use client';

import Link from 'next/link';
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
  { href: '/masuk', label: 'Masuk' },
];

/**
 * Header memakai sesi dari client: halaman-halaman di sini ada yang statis,
 * jadi komponen server tidak bisa tahu siapa yang masuk. Selama sesi masih
 * diperiksa, tampilkan versi belum masuk (sama dengan hasil prerender) supaya
 * tidak ada kedip hydration; begitu sesi ketemu, ganti ke versi masuk.
 */
export function SiteHeader() {
  const { data: session } = authClient.useSession();

  // Sudah masuk: jangan tawarkan Masuk/Daftar lagi, cukup satu tombol Profil.
  const nav = session ? NAV.filter((item) => item.href !== '/masuk') : NAV;

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
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="transition-colors hover:text-foreground">
                  {item.label}
                </Link>
              </li>
            ))}
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
                <Link href="/masuk?mode=daftar">Daftar</Link>
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
