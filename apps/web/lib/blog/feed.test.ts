import { describe, expect, it } from 'vitest';
import { buildFeed, escapeXml, FEED_PATH, rssDate } from './feed';
import { allPosts, type Post } from './posts';
import { SITE_URL } from '../seo';

const post = (over: Partial<Post> = {}): Post => ({
  slug: 'contoh',
  title: 'Judul',
  description: 'Deskripsi yang cukup panjang untuk dipakai sebagai meta description di feed.',
  datePublished: '2026-10-14',
  keywords: ['cv'],
  sections: [{ heading: 'Bagian', paragraphs: ['Isi.'] }],
  ...over,
});

describe('escapeXml', () => {
  it('escapes the five XML entities', () => {
    expect(escapeXml('&<>"\'')).toBe('&amp;&lt;&gt;&quot;&apos;');
  });

  // A second pass over the output would turn `&amp;` into `&amp;amp;` and show up literally.
  it('does not double-escape an existing entity', () => {
    expect(escapeXml('&amp;')).toBe('&amp;amp;');
    expect(escapeXml(escapeXml('a & b'))).toBe('a &amp;amp; b');
  });

  it('leaves ordinary text and Indonesian punctuation alone', () => {
    expect(escapeXml('CV ramah ATS — panduan praktis')).toBe('CV ramah ATS — panduan praktis');
  });
});

describe('rssDate', () => {
  it('emits RFC 822, which is what RSS requires', () => {
    expect(rssDate('2026-10-14')).toBe('Wed, 14 Oct 2026 00:00:00 GMT');
  });

  it('falls back to the epoch instead of emitting "Invalid Date"', () => {
    expect(rssDate('bukan-tanggal')).toBe('Thu, 01 Jan 1970 00:00:00 GMT');
  });
});

describe('buildFeed', () => {
  const feed = buildFeed([post()]);

  it('is a well-formed XML document with the RSS version', () => {
    expect(feed.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(feed).toContain('<rss version="2.0"');
    expect(feed.trimEnd().endsWith('</rss>')).toBe(true);
  });

  it('advertises itself with an atom:link so readers can find the canonical URL', () => {
    expect(feed).toContain(`<atom:link href="${SITE_URL}${FEED_PATH}" rel="self"`);
  });

  it('carries the channel-level fields a reader needs', () => {
    for (const tag of ['<title>', '<link>', '<description>', '<language>id-ID</language>']) {
      expect(feed).toContain(tag);
    }
  });

  it('gives every item a title, link, guid, description and RFC 822 pubDate', () => {
    expect(feed).toContain('<guid isPermaLink="true">');
    expect(feed).toContain('<pubDate>Wed, 14 Oct 2026 00:00:00 GMT</pubDate>');
    expect(feed).toContain('/artikel/contoh');
  });

  it('uses the post keywords as categories', () => {
    expect(feed).toContain('<category>cv</category>');
  });

  it('escapes a title containing XML metacharacters', () => {
    const risky = buildFeed([post({ title: 'CV & "ATS" <panduan>' })]);
    expect(risky).toContain('<title>CV &amp; &quot;ATS&quot; &lt;panduan&gt;</title>');
    // The raw form must not survive, or the document will not parse.
    expect(risky).not.toContain('<title>CV & "ATS"');
  });

  it('rejects a post count that would make the document unparseable', () => {
    const escaped = buildFeed([post({ title: 'A & B' })]);
    // Every raw ampersand must belong to an entity.
    const rawAmpersands = escaped.match(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)/gi);
    expect(rawAmpersands).toBeNull();
  });

  it('omits lastBuildDate when there are no posts rather than emitting an invalid date', () => {
    const empty = buildFeed([]);
    expect(empty).not.toContain('<lastBuildDate>');
    expect(empty).toContain('<channel>');
  });

  // The real feed must satisfy the same contract as the fixture.
  it('produces a parseable feed for every real post', () => {
    const real = buildFeed(allPosts());
    for (const p of allPosts()) {
      expect(real).toContain(`/artikel/${p.slug}`);
      expect(real).toContain(`<title>${escapeXml(p.title)}</title>`);
    }
    expect(real.match(/<item>/g)?.length).toBe(allPosts().length);
    expect(real).not.toContain('Invalid Date');
    expect(real).not.toContain('undefined');
  });
});
