import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Archivo, Plus_Jakarta_Sans } from 'next/font/google';
import { BRAND } from '@/lib/brand';
import { FEED_ALTERNATES, SITE_DESCRIPTION, SITE_URL } from '@/lib/seo';
import { Analytics } from './components/analytics';
import { Toaster } from './components/ui/toaster';

// Self-hosted at build time by next/font (no runtime request to Google).
const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-jakarta',
  display: 'swap',
});

// Heavy poster face for headlines and sticker labels (Ayo Kerja mockup). Variable
// weight + width: wide black for the hero, condensed italic for stickers.
const fontDisplay = Archivo({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
});

const title = 'Ayo Kerja · Buat CV profesional yang ramah ATS';
/** Shown on every page that has no description of its own. */
const description = SITE_DESCRIPTION;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: title, template: '%s · Ayo Kerja' },
  description,
  applicationName: 'Ayo Kerja',
  keywords: ['CV ATS', 'buat CV', 'CV generator', 'resume builder', 'contoh CV', 'Job Match', 'CV bahasa Inggris'],
  // Lets feed readers and browsers discover the feed. Pages that set `canonical` must spread
  // FEED_ALTERNATES too, because Next.js replaces the object rather than merging it.
  alternates: { ...FEED_ALTERNATES },
  openGraph: { title, description, type: 'website', url: '/', locale: 'id_ID', siteName: 'Ayo Kerja' },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: BRAND.yellow,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="min-h-screen font-sans">
        {children}
        <Toaster />
        <Analytics />
      </body>
    </html>
  );
}
