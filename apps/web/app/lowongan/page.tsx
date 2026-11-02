import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { JobList } from './job-list';

export const metadata: Metadata = pageMetadata({
  title: 'Lowongan hunter',
  description: 'Impor daftar lowongan dari hunter VPS dan buat satu CV per lowongan.',
  path: '/lowongan',
  index: false,
});

export default function LowonganPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <JobList />
      </main>
      <SiteFooter />
    </>
  );
}
