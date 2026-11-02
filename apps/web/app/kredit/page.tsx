import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { CreditStore } from './credit-store';

export const metadata: Metadata = pageMetadata({
  title: 'Kredit AI',
  description: 'Beli kredit AI GenCV lewat QRIS: perbaiki ringkasan, bullet pengalaman, dan keahlian dengan AI setelah kuota gratis harian habis.',
  path: '/kredit',
  index: false,
});

export default function CreditPage() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[60vh] w-full max-w-3xl px-4 py-10 sm:py-14">
        <CreditStore />
      </main>
      <SiteFooter />
    </>
  );
}
