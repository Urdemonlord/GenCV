'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, User, X } from 'lucide-react';
import { Button } from '@/components/ds';
import { authClient } from '@/lib/sync/auth-client';

/** Navigasi global desain Ayo Kerja (design.md §3). */
const NAV = [
  { href: '/', label: 'Beranda' },
  { href: '/editor', label: 'CV Workspace' },
  { href: '/lowongan', label: 'Lowongan' },
  { href: '/#fitur', label: 'Career Intelligence' },
  { href: '/templates', label: 'Template' },
  { href: '/artikel', label: 'Artikel' },
];

/** Lockup "AK" dari mockup index.html (brand-mark). */
function BrandMark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" aria-hidden="true">
      <path d="M3 33 13 6h10l-9 27H3Zm13 0L26 6h11L27 33H16Z" fill="currentColor" />
      <path d="m12 21 8-8 7 8" stroke="currentColor" strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}

/**
 * Header memakai sesi dari client: halaman-halaman di sini ada yang statis,
 * jadi komponen server tidak bisa tahu siapa yang masuk. Selama sesi masih
 * diperiksa, tampilkan versi belum masuk (sama dengan hasil prerender) supaya
 * tidak ada kedip hydration; begitu sesi ketemu, ganti ke versi masuk.
 */
export function SiteHeader() {
  const { data: session } = authClient.useSession();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-primary/15 bg-brand-accent">
      <div className="mx-auto flex h-[70px] max-w-[1440px] items-center gap-6 px-4">
        <Link href="/" className="flex items-center gap-2.5 text-2xl font-black tracking-tight text-foreground" aria-label="Ayo Kerja Beranda">
          <BrandMark className="size-[34px] text-primary" />
          <span>Ayo Kerja</span>
        </Link>
        <nav aria-label="Utama" className="hidden md:block">
          <ul className="flex items-center gap-1 text-sm text-foreground">
            {NAV.map((item) => {
              // Halaman aktif memakai pil biru seperti mockup; tautan jangkar
              // (/#fitur) tidak pernah cocok dengan pathname.
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={
                      active
                        ? 'rounded-full bg-primary px-3.5 py-2 font-extrabold text-white'
                        : 'rounded-full px-3.5 py-2 font-extrabold transition-colors hover:bg-primary/10'
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
            <Button asChild variant="outline" size="sm" className="border-primary text-primary hover:bg-primary/10">
              <Link href="/profil">
                <User aria-hidden="true" />
                Profil
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline" size="sm" className="hidden border-primary text-primary hover:bg-primary/10 sm:inline-flex">
                <Link href="/masuk">Masuk</Link>
              </Button>
              <Button asChild variant="primary" size="sm">
                <Link href="/editor">Mulai gratis ↗</Link>
              </Button>
            </>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary/10 md:hidden"
            aria-label={menuOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>
      {menuOpen && (
        <nav aria-label="Menu" className="border-t border-primary/15 bg-brand-accent px-4 py-3 md:hidden">
          <ul className="flex flex-col gap-1">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    onClick={() => setMenuOpen(false)}
                    className={
                      active
                        ? 'block rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-white'
                        : 'block rounded-xl px-4 py-3 text-sm font-extrabold text-foreground hover:bg-primary/10'
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {!session && (
              <li>
                <Link
                  href="/masuk"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-xl px-4 py-3 text-sm font-extrabold text-foreground hover:bg-primary/10 sm:hidden"
                >
                  Masuk
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
}
