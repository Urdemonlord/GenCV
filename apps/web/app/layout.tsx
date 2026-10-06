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

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: 'Create Professional CVs in Minutes',
  description:
    'Create professional CVs in minutes with AI-powered enhancements and ATS-friendly templates.',
  keywords:
    'CV generator, resume builder, AI resume, professional CV, job application',
  openGraph: {
    title: 'Create Professional CVs in Minutes',
    description:
      'Create professional CVs in minutes with AI-powered enhancements and ATS-friendly templates.',
    type: 'website',
    url: '/',
  },
  twitter: {
    card: 'summary',
    title: 'Create Professional CVs in Minutes',
    description:
      'Create professional CVs in minutes with AI-powered enhancements and ATS-friendly templates.',
  },
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
    <html lang="en" className={fontSans.variable}>
      <body className="min-h-screen font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
