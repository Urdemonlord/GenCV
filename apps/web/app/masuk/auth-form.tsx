'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { Button, Field, Input } from '@/components/ds';
import { authClient } from '@/lib/sync/auth-client';
import { authErrorMessage, type AuthMode } from '@/lib/sync/messages';

/**
 * Sign-in / sign-up form.
 *
 * One form for both actions: the fields are identical and only the wording and the call differ,
 * so a second page would be a copy with two strings changed. The mode lives in state rather
 * than the URL because it is not worth a navigation, and losing form contents to a route change
 * would be worse than losing the mode.
 */
export function AuthForm({ initialMode = 'masuk' }: { initialMode?: AuthMode }) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const email = String(data.get('email') ?? '').trim();
    const password = String(data.get('password') ?? '');
    const name = String(data.get('name') ?? '').trim();

    setBusy(true);
    setError(null);
    try {
      // `name` is only sent when creating an account: Better Auth rejects it on sign-in, and
      // requiring it there would block every existing user.
      const result =
        mode === 'daftar'
          ? await authClient.signUp.email({ email, password, name: name || email })
          : await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(authErrorMessage(result.error, mode));
        return;
      }
      // A full navigation, not `router.push`: the session arrives in a Set-Cookie header, and
      // the server components on the dashboard render from that cookie.
      window.location.assign('/dashboard');
    } catch {
      setError('Tidak bisa menghubungi server. Periksa koneksi lalu coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const isSignUp = mode === 'daftar';

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight">{isSignUp ? 'Buat akun' : 'Masuk'}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {isSignUp
          ? 'Opsional. CV tetap bisa dipakai tanpa akun — akun hanya menambahkan salinan di server.'
          : 'Masuk supaya CV di perangkat ini ikut tersimpan di server dan bisa dibuka dari perangkat lain.'}
      </p>

      <form onSubmit={submit} className="mt-8 space-y-4" noValidate>
        {isSignUp && (
          <Field label="Nama" hint="Dipakai untuk menyapa kamu. Boleh dikosongkan.">
            {(control) => (
              <Input {...control} name="name" autoComplete="name" placeholder="Nama kamu" disabled={busy} />
            )}
          </Field>
        )}

        <Field label="Email">
          {(control) => (
            <Input
              {...control}
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="nama@contoh.com"
              disabled={busy}
            />
          )}
        </Field>

        <Field label="Password" hint={isSignUp ? 'Minimal 8 karakter.' : undefined}>
          {(control) => (
            <Input
              {...control}
              name="password"
              type="password"
              required
              minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              disabled={busy}
            />
          )}
        </Field>

        {error && (
          <p role="alert" className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full" disabled={busy}>
          {busy && <Loader2 className="animate-spin" aria-hidden="true" />}
          {busy ? 'Memproses…' : isSignUp ? 'Buat akun' : 'Masuk'}
        </Button>
      </form>

      <div className="mt-6 text-sm">
        <button
          type="button"
          className="text-primary-soft hover:underline"
          disabled={busy}
          onClick={() => {
            setMode(isSignUp ? 'masuk' : 'daftar');
            setError(null);
          }}
        >
          {isSignUp ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Buat akun'}
        </button>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">
        <Link href="/dashboard" className="hover:underline">
          Lanjut tanpa akun
        </Link>{' '}
        — CV kamu tetap tersimpan di perangkat ini.
      </p>
    </div>
  );
}
