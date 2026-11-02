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

// Palet mockup (design.md) diterapkan ke seluruh halaman ini lewat override
// variabel tema — header/footer ikut gelap-neon, komponen lain tidak berubah.
const MOCKUP_THEME = {
  '--background': '225 43% 5%',
  '--foreground': '230 37% 97%',
  '--surface': '223 40% 10%',
  '--surface-raised': '222 36% 14%',
  '--card': '223 40% 10%',
  '--card-foreground': '230 37% 97%',
  '--popover': '222 36% 14%',
  '--muted-foreground': '221 19% 70%',
  '--primary': '111 100% 54%',
  '--primary-foreground': '114 45% 4%',
  '--primary-soft': '111 100% 72%',
  '--accent': '222 36% 14%',
  '--border': '224 22% 24%',
  '--input': '224 22% 24%',
  '--ring': '111 100% 54%',
} as React.CSSProperties;

export default function LowonganPage() {
  return (
    <div style={MOCKUP_THEME} className="bg-background text-foreground">
      <SiteHeader />
      <main className="min-h-[60vh]">
        <JobList syncConfigured={isSyncConfigured()} />
      </main>
      <SiteFooter />
    </div>
  );
}
