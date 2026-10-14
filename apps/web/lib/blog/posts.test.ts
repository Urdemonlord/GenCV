import { describe, expect, it } from 'vitest';
import { allPosts, getPost, readingMinutes } from './posts';

describe('blog posts', () => {
  it('has unique, URL-safe slugs', () => {
    const slugs = allPosts().map((post) => post.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) expect(slug).toMatch(/^[a-z0-9-]+$/);
  });

  it('orders posts newest first', () => {
    const dates = allPosts().map((post) => post.datePublished);
    expect([...dates].sort((a, b) => b.localeCompare(a))).toEqual(dates);
  });

  it('keeps every date in ISO form so structured data stays valid', () => {
    for (const post of allPosts()) expect(post.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('gives every post a description long enough to serve as a meta description', () => {
    for (const post of allPosts()) {
      expect(post.description.length).toBeGreaterThanOrEqual(70);
      expect(post.description.length).toBeLessThanOrEqual(165);
    }
  });

  it('resolves a post by slug and returns undefined otherwise', () => {
    const first = allPosts()[0];
    expect(getPost(first.slug)).toBe(first);
    expect(getPost('tidak-ada')).toBeUndefined();
  });

  it('derives reading time from the content instead of storing it', () => {
    for (const post of allPosts()) {
      expect(readingMinutes(post)).toBeGreaterThanOrEqual(1);
      expect(readingMinutes(post)).toBeLessThanOrEqual(30);
    }
  });

  // The product rule is that no number may appear without real data behind it. A CV tool is
  // most tempted to invent an ATS pass rate or a user count, so check the shape of such a
  // claim (a figure next to the promise) rather than the words alone: the posts legitimately
  // say "no one can guarantee an ATS pass", which must stay allowed.
  it('never promises a measurable ATS outcome or invents social proof', () => {
    const text = allPosts()
      .flatMap((post) => [
        post.title,
        post.description,
        ...post.sections.flatMap((s) => [s.heading, ...s.paragraphs, ...(s.bullets ?? [])]),
      ])
      .join(' ')
      .toLowerCase();

    // e.g. "95% lolos", "100% pasti lolos", "tingkat kelulusan 90%"
    expect(text).not.toMatch(/\d+\s*%\s*(pasti\s*)?lolos/);
    expect(text).not.toMatch(/(tingkat|persentase)\s+kelulusan\s*\d/);
    expect(text).not.toMatch(/\d[\d.,]*\s*(kandidat|pengguna|pengguna aktif|klien)/);
    expect(text).not.toMatch(/(rating|bintang)\s*[\d.]+/);
  });
});
