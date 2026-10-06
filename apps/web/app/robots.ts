import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  return {
    // The editor and dashboard only hold data from the visitor's own device.
    rules: { userAgent: '*', allow: '/', disallow: ['/editor', '/dashboard', '/api/'] },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
