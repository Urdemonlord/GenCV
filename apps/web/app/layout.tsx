import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from './components/ui/toaster';

// Self-hosted at build time by next/font (no runtime request to Google).
const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin', 'latin-ext', 'vietnamese'],
  variable: '--font-sans',
  display: 'swap',
});

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  'http://localhost:3000';

const title = 'GenCV · Buat CV profesional yang ramah ATS';
const description =
  'Workspace CV gratis: template ramah ATS, analisis ATS yang bisa dijelaskan, Job Match per lowongan, dan ekspor PDF/DOCX. Data tersimpan di perangkatmu.';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title,
  description,
  keywords: ['CV ATS', 'buat CV', 'CV generator', 'resume builder', 'contoh CV', 'Job Match', 'CV bahasa Inggris'],
  openGraph: { title, description, type: 'website', url: '/', locale: 'id_ID', siteName: 'GenCV' },
  twitter: { card: 'summary_large_image', title, description },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0B1020',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={fontSans.variable}>
      <body className="min-h-screen font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
