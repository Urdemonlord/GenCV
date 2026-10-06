import type { Metadata } from 'next';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { CvList } from './cv-list';

export const metadata: Metadata = {
  title: 'CV saya · GenCV',
  robots: { index: false },
};

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
