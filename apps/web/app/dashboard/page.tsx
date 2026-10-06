import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { CvList } from './cv-list';

export const metadata: Metadata = pageMetadata({
  title: 'CV saya',
  description: 'Daftar CV yang tersimpan di perangkat ini: buka, duplikat untuk lowongan lain, ganti nama, atau hapus.',
  path: '/dashboard',
  index: false,
});

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <CvList />
      </main>
      <SiteFooter />
    </>
  );
}
