import type { Metadata } from 'next';

/** Canonical origin: explicit setting, else the Vercel production domain, else local dev. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL?.trim() ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '') ||
  'http://localhost:3000'
).replace(/\/$/, '');

export const CONTACT_EMAIL = 'admin@meowlabs.id';
export const OPERATOR = 'Meowlabs';

/** Public pages listed in the sitemap; private workspace pages are never indexed. */
export const PUBLIC_PATHS = ['/', '/templates', '/privasi', '/syarat'] as const;

/**
 * Per-page title, description, canonical URL and social cards. `title` goes through the
 * layout's "%s · GenCV" template; social cards need the full title themselves.
 */
export function pageMetadata({
  title,
  description,
  path,
  index = true,
}: {
  title: string;
  description: string;
  path: string;
  index?: boolean;
}): Metadata {
  const fullTitle = `${title} · GenCV`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: { title: fullTitle, description, url: path, type: 'website', locale: 'id_ID', siteName: 'GenCV' },
    twitter: { card: 'summary_large_image', title: fullTitle, description },
    robots: index ? undefined : { index: false, follow: false },
  };
}
