import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ds';
import { SiteFooter } from './components/landing/sections';
import { SiteHeader } from './components/landing/site-header';

export const metadata: Metadata = {
  title: 'Halaman tidak ditemukan',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-brand-accent px-4 py-16 text-center">
        <p className="font-display text-7xl font-black leading-none tracking-[-0.03em] text-primary sm:text-8xl">404</p>
        <h1 className="mt-4 font-display text-3xl font-black uppercase tracking-[-0.02em] sm:text-4xl">
          <span className="inline-block -rotate-1 bg-primary px-3 pb-1 text-brand-accent">Halaman tidak ditemukan</span>
        </h1>
        <p className="mt-5 max-w-xl font-medium text-foreground-soft">
          Alamatnya mungkin salah ketik atau halamannya sudah dipindah. CV kamu tetap aman, karena tersimpan di perangkat ini.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild variant="primary">
            <Link href="/editor">Buka editor</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/dashboard">CV saya</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href="/">Beranda</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
