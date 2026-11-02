'use client';

import Link from 'next/link';
import { User } from 'lucide-react';
import { Button, Panel } from '@/components/ds';
import { authClient } from '@/lib/sync/auth-client';

/**
 * Kartu identitas akun di halaman profil. Sesi dibaca dari client, sama seperti
 * panel sinkron: halaman ini tidak memaksa login, tapi tanpa sesi tidak ada
 * profil yang bisa ditampilkan — jadi tawarkan masuk, bukan halaman kosong.
 */
export function ProfilAkun() {
  const { data: session, isPending, error } = authClient.useSession();

  const sessionFailed = Boolean(error) && !session;

  return (
    <Panel className="p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <User className="size-4 text-primary-soft" aria-hidden="true" />
        Akun
      </h2>

      {isPending ? (
        <p className="mt-3 text-sm text-muted-foreground">Memeriksa status masuk…</p>
      ) : sessionFailed ? (
        <p className="mt-3 text-sm text-destructive">Status masuk tidak bisa diperiksa. Muat ulang halaman ini.</p>
      ) : session ? (
        <dl className="mt-3 space-y-2 text-sm">
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted-foreground">Nama</dt>
            <dd className="font-medium">{session.user.name}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-16 shrink-0 text-muted-foreground">Email</dt>
            <dd className="break-all font-medium">{session.user.email}</dd>
          </div>
        </dl>
      ) : (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            Kamu belum masuk, jadi tidak ada profil yang bisa ditampilkan. CV tetap ada di perangkat ini.
          </p>
          <div className="mt-4">
            <Button asChild variant="primary" size="sm">
              <Link href="/masuk">Masuk</Link>
            </Button>
          </div>
        </>
      )}
    </Panel>
  );
}
