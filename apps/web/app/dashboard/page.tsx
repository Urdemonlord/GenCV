import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { isSyncConfigured } from '@/lib/sync/config';
import { CvList } from './cv-list';
import { SyncPanel } from './sync-panel';

export const metadata: Metadata = pageMetadata({
  title: 'CV saya',
  description: 'Daftar CV yang tersimpan di perangkat ini: buka, duplikat untuk lowongan lain, ganti nama, atau hapus.',
  path: '/dashboard',
  index: false,
});

// Per request: `isSyncConfigured()` reads runtime env, and a prerendered page would freeze the
// build-time answer into HTML — showing "belum diaktifkan" even once sync is switched on.
export const dynamic = 'force-dynamic';

export default function DashboardPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        <CvList />
        {/* Read on the server: whether sync exists is a property of this deployment, not of the
            user's browser, and the panel should not flash "belum masuk" while it finds out. */}
        <div className="mx-auto max-w-5xl px-4 pb-12">
          <SyncPanel configured={isSyncConfigured()} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
