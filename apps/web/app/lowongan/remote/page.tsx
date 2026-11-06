import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '../../components/landing/sections';
import { SiteHeader } from '../../components/landing/site-header';
import { fetchHunterFeed } from '@/lib/cv/hunter-feed';
import { isSyncConfigured } from '@/lib/sync/config';
import { JobList } from '../job-list';

export const metadata: Metadata = pageMetadata({
  title: 'Lowongan Kerja Remote Terbaru',
  description:
    'Lowongan kerja remote (WFH) terbaru dari LinkedIn, Indeed, dan Glassdoor, diperbarui tiap hari. Cek kecocokan dengan CV-mu dan buat CV khusus untuk tiap lowongan.',
  path: '/lowongan/remote',
});

// Sama seperti /lowongan: status login dibaca per request.
export const dynamic = 'force-dynamic';

/** Portal yang sama dengan /lowongan, dibuka di tab Remote dengan judul dan meta sendiri. */
export default async function LowonganRemotePage() {
  const initialFeed = await fetchHunterFeed();
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <JobList syncConfigured={isSyncConfigured()} initialFeed={initialFeed} variant="remote" />
      </main>
      <SiteFooter />
    </>
  );
}
