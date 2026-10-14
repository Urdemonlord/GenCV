import { buildFeed } from '@/lib/blog/feed';

/**
 * Served from a route handler so the body is a plain XML string with an explicit content type.
 * A `feed.xml` static file would need regenerating by hand on every publish.
 */
export const dynamic = 'force-static';

export function GET() {
  return new Response(buildFeed(), {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      // Long cache with revalidation: a new post should appear within the hour, not on next deploy.
      'Cache-Control': 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
