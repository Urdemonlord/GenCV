import type { Metadata } from 'next';
import Link from 'next/link';
import { MobileCta } from '../components/landing/mobile-cta';
import { PageHero } from '../components/landing/page-hero';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { allPosts, readingMinutes } from '@/lib/blog/posts';
import { blogStructuredData, pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Artikel & panduan CV',
  description:
    'Panduan praktis menyusun CV: format ramah ATS, aturan lamaran ke luar negeri, dan cara menulis pengalaman tanpa mengarang angka.',
  path: '/artikel',
});

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export default function ArtikelPage() {
  const posts = allPosts();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            blogStructuredData(posts.map(({ title, slug, datePublished }) => ({ title, slug, datePublished }))),
          ),
        }}
      />
      <SiteHeader />
      <main>
        <PageHero
          eyebrow="Artikel & panduan"
          title="Artikel & panduan CV"
          lead="Ditulis dari aturan yang benar-benar dipakai produk ini, bukan dari daftar tips umum."
        />
        <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
          <ul className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => (
              <li key={post.slug}>
                <article className="rounded-xl border border-border bg-white p-6">
                  <h2 className="text-xl font-semibold">
                    <Link href={`/artikel/${post.slug}`} className="hover:underline">
                      {post.title}
                    </Link>
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground">{post.description}</p>
                  <p className="mt-3 text-xs text-muted-foreground">
                    <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
                    {' · '}
                    {readingMinutes(post)} menit baca
                  </p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <SiteFooter />
      <MobileCta />
    </>
  );
}
