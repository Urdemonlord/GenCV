import type { MetadataRoute } from 'next';
import { allPosts } from '@/lib/blog/posts';
import { PUBLIC_PATHS, SITE_URL } from '@/lib/seo';

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = PUBLIC_PATHS.map((path) => ({
    url: `${SITE_URL}${path === '/' ? '' : path}`,
    changeFrequency: 'monthly',
    priority: path === '/' ? 1 : path === '/templates' ? 0.8 : path === '/artikel' ? 0.7 : 0.3,
  }));

  // Posts are newer and more specific than the index, so they get their own lastModified.
  const posts: MetadataRoute.Sitemap = allPosts().map((post) => ({
    url: `${SITE_URL}/artikel/${post.slug}`,
    lastModified: post.datePublished,
    changeFrequency: 'yearly',
    priority: 0.6,
  }));

  return [...pages, ...posts];
}
