import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { isSyncConfigured } from '@/lib/sync/config';
import { SyncPanel } from '../dashboard/sync-panel';
import { ProfilAkun } from './profil-akun';

export const metadata: Metadata = pageMetadata({
  title: 'Profil',
  description: 'Akun dan sinkronisasi cloud GenCV: nama, email, salinan CV di server, dan keluar.',
  path: '/profil',
  index: false,
});

// Per request: `isSyncConfigured()` membaca env runtime, sama alasannya dengan dashboard.
export const dynamic = 'force-dynamic';

export default function ProfilPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Profil</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Akun yang dipakai di perangkat ini, dan salinan CV yang tersimpan di server.
          </p>
          <div className="mt-6">
            <ProfilAkun />
          </div>
          <SyncPanel configured={isSyncConfigured()} />
          <p className="mt-6 text-sm">
            <Link href="/dashboard" className="text-primary-soft underline underline-offset-4">
              Lihat CV saya
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
