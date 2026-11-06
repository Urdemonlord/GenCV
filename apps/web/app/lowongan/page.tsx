import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { isSyncConfigured } from '@/lib/sync/config';
import { fetchHunterFeed } from '@/lib/cv/hunter-feed';
import { JobList } from './job-list';

export const metadata: Metadata = pageMetadata({
  title: 'Lowongan Kerja Terbaru',
  description:
    'Lowongan kerja terbaru dari LinkedIn, Indeed, dan Glassdoor, diperbarui tiap hari. Cek kecocokan dengan CV-mu dan buat CV khusus untuk tiap lowongan.',
  path: '/lowongan',
});

// Per request, seperti /masuk: apakah login tersedia adalah properti deployment,
// dan JobList membutuhkannya untuk memutuskan apakah pembuatan CV harus login.
export const dynamic = 'force-dynamic';

// Tema mockup sekarang global (globals.css), jadi pembungkus lokal di sini
// tidak diperlukan lagi.
export default async function LowonganPage() {
  // Lowongan dirender di server supaya ada di HTML (terindeks, tampil tanpa
  // menunggu JS). Feed di-cache satu jam; lihat fetchHunterFeed.
  const initialFeed = await fetchHunterFeed();
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <JobList syncConfigured={isSyncConfigured()} initialFeed={initialFeed} />
      </main>
      <SiteFooter />
    </>
  );
}
