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
      <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 py-16 text-center">
        <p className="text-sm font-semibold text-primary-soft">404</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Halaman tidak ditemukan</h1>
        <p className="mt-3 text-muted-foreground">
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
