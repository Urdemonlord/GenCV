import { allPosts, type Post } from './posts';
import { SITE_DESCRIPTION, SITE_URL } from '../seo';

/**
 * RSS 2.0 feed for the blog.
 *
 * Kept as a pure string builder rather than inlined in the route handler so the escaping and
 * the date format can be tested without standing up a server. XML has no forgiving mode: one
 * unescaped `&` in a title makes the whole document unparseable, and feed readers report it as
 * an empty feed rather than an error.
 */

const XML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&apos;',
};

/** Single pass, so an escaped `&` is never re-escaped into `&amp;amp;`. */
export function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => XML_ESCAPES[char]);
}

/** RSS requires RFC 822, not ISO 8601. `toUTCString()` emits exactly that shape. */
export function rssDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00Z`);
  return Number.isNaN(date.getTime()) ? new Date(0).toUTCString() : date.toUTCString();
}

export const FEED_PATH = '/feed.xml';

function item(post: Post): string {
  const url = `${SITE_URL}/artikel/${post.slug}`;
  return [
    '    <item>',
    `      <title>${escapeXml(post.title)}</title>`,
    `      <link>${escapeXml(url)}</link>`,
    `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
    `      <description>${escapeXml(post.description)}</description>`,
    `      <pubDate>${rssDate(post.datePublished)}</pubDate>`,
    ...post.keywords.map((keyword) => `      <category>${escapeXml(keyword)}</category>`),
    '    </item>',
  ].join('\n');
}

export function buildFeed(posts: Post[] = allPosts()): string {
  const feedUrl = `${SITE_URL}${FEED_PATH}`;
  const newest = posts[0]?.datePublished;

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    '    <title>GenCV · Artikel</title>',
    `    <link>${escapeXml(SITE_URL)}</link>`,
    `    <description>${escapeXml(SITE_DESCRIPTION)}</description>`,
    '    <language>id-ID</language>',
    `    <atom:link href="${escapeXml(feedUrl)}" rel="self" type="application/rss+xml"/>`,
    ...(newest ? [`    <lastBuildDate>${rssDate(newest)}</lastBuildDate>`] : []),
    ...posts.map(item),
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}
