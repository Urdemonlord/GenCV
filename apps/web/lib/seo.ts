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
export const PUBLIC_PATHS = ['/', '/templates', '/artikel', '/privasi', '/syarat'] as const;

/** The one-line promise, reused by the layout metadata and the structured data below. */
export const SITE_DESCRIPTION =
  'Workspace CV gratis: template ramah ATS, analisis ATS yang bisa dijelaskan, Job Match per lowongan, dan ekspor PDF/DOCX. Data tersimpan di perangkatmu.';

/** Public feature list. Only claims the product can actually make: no ATS pass rate, no user counts. */
export const SITE_FEATURES = [
  'Enam template ramah ATS, semuanya satu kolom dengan teks asli',
  'Analisis ATS dari aturan yang bisa dijelaskan, lengkap dengan alasan tiap temuan',
  'Job Match: bandingkan CV dengan deskripsi lowongan dan lihat keyword yang belum ada',
  'Asisten AI yang tidak menambahkan angka atau pengalaman yang tidak kamu berikan',
  'Ekspor PDF dan DOCX, keduanya dibuat di browser',
  'Ukuran kertas A4 atau US Letter, dengan aturan berbeda untuk lamaran ke Amerika Serikat',
  'Data CV tersimpan di perangkatmu, tanpa akun',
] as const;

/**
 * Structured data for the landing page.
 *
 * Deliberately absent: `aggregateRating` and `review`. There is no collected rating behind them,
 * and the product's own rule is that every number shown must come from real user data.
 * `FAQPage` is also left out: Google deprecated FAQ rich results on 2026-05-07, so that markup
 * would no longer change how the page appears in Search.
 */
export function landingStructuredData() {
  const organization = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'GenCV',
    url: SITE_URL,
    parentOrganization: { '@type': 'Organization', name: OPERATOR, url: 'https://www.meowlabs.id' },
    email: CONTACT_EMAIL,
  };

  const application = {
    '@type': 'SoftwareApplication',
    '@id': `${SITE_URL}/#application`,
    name: 'GenCV',
    url: SITE_URL,
    description: SITE_DESCRIPTION,
    applicationCategory: 'BusinessApplication',
    applicationSubCategory: 'Resume builder',
    operatingSystem: 'Web browser',
    inLanguage: 'id-ID',
    isAccessibleForFree: true,
    featureList: SITE_FEATURES,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'IDR' },
    publisher: { '@id': `${SITE_URL}/#organization` },
  };

  const howTo = {
    '@type': 'HowTo',
    '@id': `${SITE_URL}/#howto`,
    name: 'Cara membuat CV ramah ATS dengan GenCV',
    description:
      'Tiga langkah: susun isi CV per bagian, perbaiki temuan Analisis ATS dan tutup keyword yang kurang, lalu unduh PDF atau DOCX.',
    step: [
      {
        '@type': 'HowToStep',
        position: 1,
        name: 'Susun',
        text: 'Isi data per bagian: pengalaman sebagai poin pencapaian, pendidikan, keahlian, sertifikasi, dan bahasa.',
      },
      {
        '@type': 'HowToStep',
        position: 2,
        name: 'Optimalkan',
        text: 'Perbaiki temuan dari Analisis ATS dan tutup keyword yang kurang lewat Job Match, sesuai yang memang kamu kuasai.',
      },
      {
        '@type': 'HowToStep',
        position: 3,
        name: 'Lamar',
        text: 'Unduh PDF atau DOCX dengan ukuran kertas yang sesuai (A4 atau US Letter) dan kirim lamaranmu.',
      },
    ],
  };

  return { '@context': 'https://schema.org', '@graph': [organization, application, howTo] };
}

/**
 * Structured data for one blog post. Google still supports `Article` / `BlogPosting`
 * (unlike `FAQPage`, which was deprecated on 2026-05-07).
 */
export function postStructuredData({
  title,
  description,
  slug,
  datePublished,
  keywords,
}: {
  title: string;
  description: string;
  slug: string;
  datePublished: string;
  keywords: string[];
}) {
  const url = `${SITE_URL}/artikel/${slug}`;
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}/#post`,
    headline: title,
    description,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    datePublished,
    dateModified: datePublished,
    inLanguage: 'id-ID',
    keywords: keywords.join(', '),
    // The author is the product team, not a named person: inventing a byline would be a fake claim.
    author: { '@type': 'Organization', name: 'GenCV', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'GenCV', url: SITE_URL },
  };
}

/**
 * Structured data for the blog index: the list itself plus a `Blog` node.
 */
export function blogStructuredData(
  posts: { title: string; slug: string; datePublished: string }[],
) {
  const blogUrl = `${SITE_URL}/artikel`;
  return {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${blogUrl}/#blog`,
    name: 'Artikel GenCV',
    description:
      'Panduan praktis menyusun CV: format ramah ATS, aturan lamaran luar negeri, dan cara menulis pengalaman.',
    url: blogUrl,
    inLanguage: 'id-ID',
    publisher: { '@type': 'Organization', name: 'GenCV', url: SITE_URL },
    blogPost: posts.map((post) => ({
      '@type': 'BlogPosting',
      headline: post.title,
      url: `${blogUrl}/${post.slug}`,
      datePublished: post.datePublished,
    })),
  };
}

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
