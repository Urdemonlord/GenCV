/* eslint-disable @next/next/no-page-custom-font */
import './globals.css';
import type { Metadata } from 'next';
import { ThemeProvider } from './providers/theme-provider';
import { Toaster } from './components/ui/toaster';

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

// Viewport export must be separate from metadata in Next.js 14+
export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
