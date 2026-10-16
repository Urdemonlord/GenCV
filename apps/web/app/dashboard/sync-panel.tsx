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
 * Sync is optional, so the panel has three states and says which one it is in rather than
 * hiding: switched off on the server, signed out, or signed in. The CVs live on the device
 * either way — signing in only adds a copy on the server, which is why the copy says so.
 */
export function SyncPanel({ configured }: { configured: boolean }) {
  const { toast } = useToast();
  const { data: session, isPending } = authClient.useSession();
  const [running, setRunning] = useState(false);
  /** The last failure, kept so the recovery button survives the toast closing. */
  const [failure, setFailure] = useState<Extract<SyncResult, { ok: false }> | null>(null);

  const sync = async () => {
    setRunning(true);
    setFailure(null);
    try {
      const result = await runSyncRound();
      if (result.ok) {
        setFailure(null);
        toast({ title: 'Sinkronisasi selesai', description: syncStatusLabel(result) });
        return;
      }
      setFailure(result);
      toast({ variant: 'destructive', title: 'Sinkronisasi gagal', description: syncStatusLabel(result) });
    } finally {
      setRunning(false);
    }
  };

  return (
    <Panel className="mt-8 p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <RefreshCw className="size-4 text-primary-soft" aria-hidden="true" />
            Sinkronisasi cloud
          </h2>
          <p className="mt-1 max-w-xl text-sm text-muted-foreground">
            CV tetap tersimpan di perangkat ini. Dengan masuk, salinannya juga disimpan di server supaya bisa dibuka dari
            perangkat lain.
          </p>

          {!configured ? (
            <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
              <CloudOff className="size-4" aria-hidden="true" />
              Belum diaktifkan di server ini. Semua fitur lain tetap berjalan normal.
            </p>
          ) : isPending ? (
            <p className="mt-3 text-sm text-muted-foreground">Memeriksa status masuk…</p>
          ) : session ? (
            <p className="mt-3 text-sm">
              Masuk sebagai <span className="font-medium">{session.user.email}</span>
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">Belum masuk. CV hanya ada di perangkat ini.</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {configured && !isPending && !session && (
            <Button asChild variant="primary" size="sm">
              <Link href="/masuk">Masuk</Link>
            </Button>
          )}
          {configured && session && (
            <>
              <Button variant="secondary" size="sm" onClick={sync} disabled={running}>
                {running ? <Loader2 className="animate-spin" aria-hidden="true" /> : <RefreshCw aria-hidden="true" />}
                {running ? 'Menyinkronkan…' : 'Sinkronkan sekarang'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={async () => {
                  await authClient.signOut();
                  setFailure(null);
                  toast({ title: 'Sudah keluar', description: 'CV tetap ada di perangkat ini.' });
                }}
              >
                Keluar
              </Button>
            </>
          )}
        </div>
      </div>

      {/*
        Unreadable local metadata needs an action only the user can take: the round refuses to
        run because it cannot tell "never knew about a deletion" from "the deletion is missing".
        Offering the way out here, rather than telling them to clear site data by hand, is the
        difference between a dead end and a fix.
      */}
      {failure?.reason === 'local-data-unreadable' && session && (
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
    </Panel>
  );
}
