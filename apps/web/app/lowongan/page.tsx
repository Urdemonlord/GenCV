import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { isSyncConfigured } from '@/lib/sync/config';
import { JobList } from './job-list';

export const metadata: Metadata = pageMetadata({
  title: 'Lowongan',
  description: 'Jelajahi lowongan dari hunter, simpan yang menarik, dan buat satu CV per lowongan.',
  path: '/lowongan',
  index: false,
});

// Per request, seperti /masuk: apakah login tersedia adalah properti deployment,
// dan JobList membutuhkannya untuk memutuskan apakah pembuatan CV harus login.
export const dynamic = 'force-dynamic';

// Tema mockup sekarang global (globals.css), jadi pembungkus lokal di sini
// tidak diperlukan lagi.
export default function LowonganPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <JobList syncConfigured={isSyncConfigured()} />
      </main>
      <SiteFooter />
    </>
  );
}
