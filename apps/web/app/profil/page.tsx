import type { Metadata } from 'next';
import Link from 'next/link';
import { pageMetadata } from '@/lib/seo';
import { PageHero } from '../components/landing/page-hero';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { isSyncConfigured } from '@/lib/sync/config';
import { SyncPanel } from '../dashboard/sync-panel';
import { ProfilAkun } from './profil-akun';

export const metadata: Metadata = pageMetadata({
  title: 'Profil',
  description: 'Akun dan sinkronisasi cloud Ayo Kerja: nama, email, salinan CV di server, dan keluar.',
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
        <PageHero
          eyebrow="Profil"
          title="Profil"
          lead="Akun yang dipakai di perangkat ini, dan salinan CV yang tersimpan di server."
        />
        <div className="mx-auto w-full max-w-[1440px] px-4 py-10 sm:py-14">
          <div>
            <ProfilAkun />
          </div>
          <SyncPanel configured={isSyncConfigured()} />
          <p className="mt-6 text-sm">
            <Link href="/dashboard" className="text-primary underline underline-offset-4">
              Lihat CV saya
            </Link>
          </p>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
