import type { Metadata } from 'next';
import { pageMetadata } from '@/lib/seo';
import { SiteFooter } from '../components/landing/sections';
import { SiteHeader } from '../components/landing/site-header';
import { isSyncConfigured } from '@/lib/sync/config';
import { AuthForm } from './auth-form';

export const metadata: Metadata = pageMetadata({
  title: 'Masuk',
  description: 'Masuk untuk menyimpan salinan CV di server, supaya bisa dibuka dari perangkat lain.',
  path: '/masuk',
  // A sign-in page has nothing to offer a search result, and indexing one invites
  // password-reset pages into the index too.
  index: false,
});

// Rendered per request, not prerendered: the answer depends on runtime env, and a static build
// bakes in whatever `DATABASE_URL` happened to be set *at build time*. A deployment where the
// variable is runtime-only would then serve "belum tersedia" forever while the API worked fine.
export const dynamic = 'force-dynamic';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function MasukPage({ searchParams }: { searchParams: SearchParams }) {
  // Read on the server so the page can explain itself instead of failing on submit. Without a
  // database the API answers 503, and that is a fact of this deployment, not a user error.
  const configured = isSyncConfigured();
  // ?mode=daftar preselects the sign-up form, so the header can offer
  // "Masuk" and "Daftar" as two real entry points to the same form.
  // ?callbackURL= membawa user kembali ke halaman yang mengharuskan login
  // (misalnya /lowongan); divalidasi di AuthForm sebelum dipakai.
  const params = await searchParams;
  const initialMode = first(params.mode) === 'daftar' ? 'daftar' : 'masuk';
  const callbackURL = first(params.callbackURL);

  return (
    <>
      <SiteHeader />
      <main className="min-h-[60vh]">
        {configured ? (
          <AuthForm initialMode={initialMode} callbackURL={callbackURL} />
        ) : (
          <div className="mx-auto w-full max-w-md px-4 py-16">
            <h1 className="text-3xl font-bold tracking-tight">Masuk belum tersedia</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Sinkronisasi cloud belum diaktifkan di server ini. Semua fitur lain tetap berjalan normal dan CV kamu tetap
              tersimpan di perangkat ini.
            </p>
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
