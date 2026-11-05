import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { isSyncConfigured } from '@/lib/sync/config';
import { CareerIntelligence } from './career-intelligence';

export const metadata: Metadata = pageMetadata({
  title: 'Career Intelligence',
  description:
    'Kesiapan ATS, lowongan paling cocok, dan skill yang belum ada di CV — dihitung dari CV dan feed lowonganmu, bukan dari angka demo.',
  path: '/career-intelligence',
  // Halaman alat personal (isinya CV dan feed user), bukan konten untuk diindeks.
  index: false,
});

// Per request, seperti /lowongan: apakah login tersedia adalah properti
// deployment, dan komponen ini membutuhkannya untuk memutuskan apakah
// pembuatan CV dari lowongan harus login.
export const dynamic = 'force-dynamic';

export default function CareerIntelligencePage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <CareerIntelligence syncConfigured={isSyncConfigured()} />
      </main>
      <SiteFooter />
    </>
  );
}
