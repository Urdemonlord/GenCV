import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { MobileCta } from '../../components/landing/mobile-cta';
import { SiteFooter } from '../../components/landing/sections';
import { SiteHeader } from '../../components/landing/site-header';
import { allPosts, getPost, readingMinutes } from '@/lib/blog/posts';
import { pageMetadata, postStructuredData } from '@/lib/seo';

type Params = Promise<{ slug: string }>;

// Fully static: every post is known at build time, so no runtime data fetching is needed.
export function generateStaticParams() {
  return allPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) {
    return pageMetadata({ title: 'Artikel tidak ditemukan', description: '', path: `/artikel/${slug}`, index: false });
  }
  return pageMetadata({ title: post.title, description: post.description, path: `/artikel/${post.slug}` });
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export default async function PostPage({ params }: { params: Params }) {
  const { slug } = await params;
  const post = getPost(slug);
  // `return` here (not a bare call) so control flow provably stops and `post` narrows below.
  if (!post) return notFound();

  const others = allPosts().filter((p) => p.slug !== post.slug);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            postStructuredData({
              title: post.title,
              description: post.description,
              slug: post.slug,
              datePublished: post.datePublished,
              keywords: post.keywords,
            }),
          ),
        }}
      />
      <SiteHeader />
      <main className="mx-auto max-w-3xl px-4 py-12">
        <Link href="/artikel" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Semua artikel
        </Link>

        <article className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{post.title}</h1>
          <p className="mt-3 text-lg text-muted-foreground">{post.description}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            <time dateTime={post.datePublished}>{formatDate(post.datePublished)}</time>
            {' · '}
            {readingMinutes(post)} menit baca
          </p>

          <div className="mt-10 space-y-10">
            {post.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph} className="mt-4 leading-relaxed text-foreground/90">
                    {paragraph}
                  </p>
                ))}
                {section.bullets && (
                  <ul className="mt-4 space-y-2">
                    {section.bullets.map((bullet) => (
                      <li key={bullet} className="flex gap-2.5 text-foreground/90">
                        <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-primary-soft" />
                        <span>{bullet}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        </article>

        <aside className="mt-14 rounded-xl border border-border bg-surface p-6">
          <h2 className="text-lg font-semibold">Susun CV-nya sekarang</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Gratis, tanpa daftar akun, dan data tersimpan di perangkatmu. Analisis ATS menunjukkan bagian mana yang masih
            perlu diperbaiki.
          </p>
          <Link
            href="/editor"
            className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Buka editor
          </Link>
        </aside>

        {others.length > 0 && (
          <section className="mt-12">
            <h2 className="text-lg font-semibold">Artikel lain</h2>
            <ul className="mt-4 space-y-3">
              {others.map((other) => (
                <li key={other.slug}>
                  <Link href={`/artikel/${other.slug}`} className="text-primary-soft hover:underline">
                    {other.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
      <SiteFooter />
      <MobileCta />
    </>
  );
}
