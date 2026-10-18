'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CloudOff, Loader2, RefreshCw } from 'lucide-react';
import { Button, Panel } from '@/components/ds';
import { useToast } from '@/hooks/use-toast';
import { authClient } from '@/lib/sync/auth-client';
import { runSyncRound, type SyncResult } from '@/lib/sync/client';
import { clearTombstones } from '@/lib/sync/local';
import { syncStatusLabel } from '@/lib/sync/messages';

/**
 * Sync panel for the dashboard.
 *
 * The `configured` check sits here, above the session hook, on purpose: `useSession` fires a
 * request unconditionally, so on a deployment with sync switched off every dashboard load would
 * pay for a call that is guaranteed to answer 503.
 */
export function SyncPanel({ configured }: { configured: boolean }) {
  return (
    <Panel className="mt-8 p-5">
      <h2 className="flex items-center gap-2 font-semibold">
        <RefreshCw className="size-4 text-primary-soft" aria-hidden="true" />
        Sinkronisasi cloud
      </h2>
      <p className="mt-1 max-w-xl text-sm text-muted-foreground">
        CV tetap tersimpan di perangkat ini. Dengan masuk, salinannya juga disimpan di server supaya bisa dibuka dari
        perangkat lain.
      </p>

      {configured ? (
        <SyncControls />
      ) : (
        <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <CloudOff className="size-4" aria-hidden="true" />
          Belum diaktifkan di server ini. Semua fitur lain tetap berjalan normal.
        </p>
      )}
    </Panel>
  );
}

/** The signed-in / signed-out half. Mounted only when sync is actually configured. */
function SyncControls() {
  const { toast } = useToast();
  const { data: session, isPending, error } = authClient.useSession();
  const [running, setRunning] = useState(false);
  /** The last failure, kept so the recovery button survives the toast closing. */
  const [failure, setFailure] = useState<Extract<SyncResult, { ok: false }> | null>(null);

  const sync = async () => {
    setRunning(true);
    setFailure(null);
    try {
      const result = await runSyncRound();
      if (result.ok) {
        toast({ title: 'Sinkronisasi selesai', description: syncStatusLabel(result) });
        return;
      }
      setFailure(result);
      toast({ variant: 'destructive', title: 'Sinkronisasi gagal', description: syncStatusLabel(result) });
    } catch {
      // `runSyncRound` reports its failures as values, but reading local storage can still throw
      // (private mode, exhausted quota). Without this the button would stop with no explanation.
      toast({
        variant: 'destructive',
        title: 'Sinkronisasi gagal',
        description: 'Penyimpanan perangkat menolak diakses. Coba lagi setelah memeriksa ruang penyimpanan.',
      });
    } finally {
      setRunning(false);
    }
  };

  const signOut = async () => {
    try {
      const result = await authClient.signOut();
      if (result?.error) throw new Error();
      setFailure(null);
      toast({ title: 'Sudah keluar', description: 'CV tetap ada di perangkat ini.' });
    } catch {
      // Announcing "sudah keluar" while the session is still live would be a lie the user acts on.
      toast({
        variant: 'destructive',
        title: 'Gagal keluar',
        description: 'Sesi masih aktif. Periksa koneksi lalu coba lagi.',
      });
    }
  };

  // A failed session lookup is not the same as "not signed in": the user may well have a
  // session, and telling them they are signed out would send them to sign in again for nothing.
  // Checked before the `!session` branch so it is never misreported.
  const sessionFailed = Boolean(error) && !session;

  return (
    <>
      <div className="mt-3">
        {isPending ? (
          <p className="text-sm text-muted-foreground">Memeriksa status masuk…</p>
        ) : sessionFailed ? (
          <p className="text-sm text-destructive">Status masuk tidak bisa diperiksa. Muat ulang halaman ini.</p>
        ) : session ? (
          <p className="text-sm">
            Masuk sebagai <span className="font-medium">{session.user.email}</span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">Belum masuk. CV hanya ada di perangkat ini.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {!isPending && !sessionFailed && !session && (
          <Button asChild variant="primary" size="sm">
            <Link href="/masuk">Masuk</Link>
          </Button>
        )}
        {session && (
          <>
            <Button variant="secondary" size="sm" onClick={sync} disabled={running}>
              {running ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
              {running ? 'Menyinkronkan…' : 'Sinkronkan sekarang'}
            </Button>
            <Button variant="ghost" size="sm" onClick={signOut} disabled={running}>
              Keluar
            </Button>
          </>
        )}
      </div>

      {/*
        Unreadable local metadata needs an action only the user can take: the round refuses to
        run because it cannot tell "never knew about a deletion" from "the deletion is missing".
        Offering the way out here, rather than telling them to clear site data by hand, is the
        difference between a dead end and a fix.
      */}
      {failure?.reason === 'local-data-unreadable' && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/40 bg-destructive/5 p-3">
          <AlertTriangle className="size-4 text-destructive" aria-hidden="true" />
          <p className="mr-auto text-sm">{syncStatusLabel(failure)}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              clearTombstones();
              setFailure(null);
              toast({
                title: 'Catatan penghapusan direset',
                description: 'Sinkronisasi bisa dilanjutkan. CV yang dihapus di perangkat lain mungkin muncul lagi.',
              });
            }}
          >
            Pulihkan
          </Button>
        </div>
      )}
    </>
  );
}
