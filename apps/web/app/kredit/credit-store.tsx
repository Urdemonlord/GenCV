'use client';

import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { CheckCircle2, Loader2, QrCode, Sparkles } from 'lucide-react';
import { Button, Field, Input, Panel, PanelHeader, Skeleton } from '@/components/ds';
import { authClient } from '@/lib/billing/auth-client';
import { formatRupiah, type CreditPack } from '@/lib/billing/packs';

interface Payment {
  id: string;
  packId: string;
  credits: number;
  price: number;
  amount: number;
  discount: number;
  status: 'pending' | 'paid' | 'expired' | 'cancelled' | 'reversed';
  expiresAt: string;
  paidAt: string | null;
  qrSvg?: string;
}

interface Overview {
  enabled: boolean;
  signedIn: boolean;
  balance: number;
  freePerDay: number;
  packs: CreditPack[];
  payments: Payment[];
}

const POLL_MS = 4000;
const STORAGE_KEY = 'gencv-credit-checkout';

const remember = (id: string | null) => {
  try {
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Without storage the QR is only lost on reload.
  }
};
const remembered = () => {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
};

const statusLabel: Record<Payment['status'], string> = {
  pending: 'Menunggu',
  paid: 'Lunas',
  expired: 'Kedaluwarsa',
  cancelled: 'Dibatalkan',
  reversed: 'Dibatalkan bank',
};

export function CreditStore() {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [busyPack, setBusyPack] = useState<string | null>(null);
  const [payment, setPayment] = useState<Payment | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch('/api/credits', { cache: 'no-store' });
      setData(await res.json());
    } catch {
      setError('Tidak bisa memuat data kredit. Periksa koneksi lalu muat ulang.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Resume a QR that was open before a reload.
  useEffect(() => {
    if (!data?.signedIn) return;
    const id = remembered();
    if (id && !payment) {
      void fetch(`/api/credits/payments/${encodeURIComponent(id)}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((r) => (r?.payment ? setPayment(r.payment) : remember(null)));
    }
  }, [data?.signedIn, payment]);

  const buy = async (packId: string) => {
    setBusyPack(packId);
    setError('');
    try {
      const res = await fetch('/api/credits/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packId }),
      });
      const body = await res.json();
      if (!res.ok || !body.payment) throw new Error(body.error || 'Gagal membuat pembayaran.');
      remember(body.payment.id);
      setPayment(body.payment);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat pembayaran.');
    } finally {
      setBusyPack(null);
    }
  };

  if (!data) {
    return (
      <div className="space-y-4" aria-busy="true">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Kredit AI</h1>
        <p className="text-muted-foreground">
          Setiap hari kamu dapat {data.freePerDay} permintaan AI gratis. Setelah itu, satu permintaan (perbaiki ringkasan,
          bullet, atau keahlian) memakai 1 kredit. Kredit tidak kedaluwarsa dan tidak dipotong jika AI gagal.
        </p>
      </header>

      {!data.enabled ? (
        <Panel className="p-5 text-sm text-muted-foreground">Pembelian kredit belum dibuka. Kuota AI gratis tetap bisa dipakai.</Panel>
      ) : !data.signedIn ? (
        <AuthForm onSignedIn={load} />
      ) : (
        <>
          <Panel className="flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-sm text-muted-foreground">Saldo kredit</p>
              <p className="text-3xl font-bold" data-testid="credit-balance">
                {data.balance}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await authClient.signOut();
                remember(null);
                setPayment(null);
                await load();
              }}
            >
              Keluar
            </Button>
          </Panel>

          {payment ? (
            <Checkout
              payment={payment}
              onChange={(p) => {
                setPayment(p);
                if (p.status !== 'pending') {
                  remember(null);
                  void load();
                }
              }}
              onClose={() => {
                remember(null);
                setPayment(null);
              }}
            />
          ) : (
            <ul className="grid gap-4 sm:grid-cols-3">
              {data.packs.map((pack) => (
                <li key={pack.id}>
                  <Panel className="flex h-full flex-col gap-2 p-5">
                    <h2 className="font-semibold">{pack.name}</h2>
                    <p className="text-2xl font-bold">{pack.credits} kredit</p>
                    <p className="text-sm text-muted-foreground">
                      {formatRupiah(pack.price)} · {formatRupiah(Math.round(pack.price / pack.credits))}/kredit
                    </p>
                    <Button className="mt-auto" variant="primary" disabled={busyPack !== null} onClick={() => buy(pack.id)}>
                      {busyPack === pack.id ? <Loader2 className="animate-spin" /> : <QrCode />}
                      Beli dengan QRIS
                    </Button>
                  </Panel>
                </li>
              ))}
            </ul>
          )}

          {data.payments.length > 0 && (
            <Panel>
              <PanelHeader title="Riwayat pembelian" />
              <ul className="divide-y divide-border px-5 pb-3 text-sm">
                {data.payments.map((p) => (
                  <li key={p.id} className="flex flex-wrap justify-between gap-2 py-2">
                    <span>
                      {p.credits} kredit · {formatRupiah(p.amount)}
                    </span>
                    <span className="text-muted-foreground">{statusLabel[p.status]}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

function Checkout({ payment, onChange, onClose }: { payment: Payment; onChange: (p: Payment) => void; onClose: () => void }) {
  const [now, setNow] = useState(() => Date.now());
  const latest = useRef(onChange);
  latest.current = onChange;

  useEffect(() => {
    if (payment.status !== 'pending') return;
    const tick = setInterval(() => setNow(Date.now()), 1000);
    const poll = setInterval(async () => {
      try {
        const res = await fetch(`/api/credits/payments/${encodeURIComponent(payment.id)}`, { cache: 'no-store' });
        const body = await res.json();
        if (res.ok && body.payment && body.payment.status !== 'pending') latest.current(body.payment);
      } catch {
        // A network blip: the next poll tries again.
      }
    }, POLL_MS);
    return () => {
      clearInterval(tick);
      clearInterval(poll);
    };
  }, [payment.id, payment.status]);

  if (payment.status === 'paid') {
    return (
      <Panel className="space-y-3 p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-emerald-500" />
        <p className="text-lg font-semibold">Pembayaran {formatRupiah(payment.amount)} diterima.</p>
        <p className="text-muted-foreground">{payment.credits} kredit sudah masuk ke saldo kamu.</p>
        <div className="flex justify-center gap-2">
          <Button variant="primary" asChild>
            <a href="/editor">
              <Sparkles /> Kembali ke editor
            </a>
          </Button>
          <Button onClick={onClose}>Beli lagi</Button>
        </div>
      </Panel>
    );
  }

  if (payment.status !== 'pending') {
    return (
      <Panel className="space-y-3 p-6">
        <p className="font-semibold">{payment.status === 'expired' ? 'Waktu pembayaran habis.' : 'Pembayaran dibatalkan.'}</p>
        <p className="text-sm text-muted-foreground">Jika kamu sudah terlanjur membayar, kredit tetap masuk otomatis. Jika belum, pilih paket lagi.</p>
        <Button onClick={onClose}>Pilih paket</Button>
      </Panel>
    );
  }

  const left = Math.max(0, Math.floor((Date.parse(payment.expiresAt) - now) / 1000));
  return (
    <Panel className="space-y-3 p-6 text-center">
      <p className="font-semibold">Scan dengan aplikasi bank atau e-wallet apa pun</p>
      {payment.qrSvg && (
        // eslint-disable-next-line @next/next/no-img-element -- an inline SVG data URL, nothing to optimise
        <img
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(payment.qrSvg)}`}
          alt={`QRIS pembayaran ${formatRupiah(payment.amount)}`}
          width={260}
          height={260}
          className="mx-auto rounded-lg bg-white p-2"
        />
      )}
      <p className="text-lg">
        Bayar tepat <strong className="text-2xl">{formatRupiah(payment.amount)}</strong>
      </p>
      {payment.discount > 0 && (
        <p className="text-sm text-muted-foreground">
          Potongan {formatRupiah(payment.discount)} dari harga {formatRupiah(payment.price)}.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Berlaku {Math.floor(left / 60)}:{String(left % 60).padStart(2, '0')} lagi · menunggu pembayaran…
      </p>
      <p className="font-mono text-xs text-muted-foreground">{payment.id}</p>
      <Button variant="ghost" size="sm" onClick={onClose}>
        Pilih paket lain
      </Button>
    </Panel>
  );
}

function AuthForm({ onSignedIn }: { onSignedIn: () => Promise<void> }) {
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');
    const name = String(form.get('name') ?? '').trim() || email.split('@')[0];
    setBusy(true);
    setError('');
    const { error: authError } =
      mode === 'in' ? await authClient.signIn.email({ email, password }) : await authClient.signUp.email({ email, password, name });
    setBusy(false);
    if (authError) {
      setError(mode === 'in' ? 'Email atau kata sandi salah.' : authError.message || 'Gagal membuat akun.');
      return;
    }
    await onSignedIn();
  };

  return (
    <Panel className="p-5">
      <form onSubmit={submit} className="space-y-4" noValidate>
        <p className="text-sm text-muted-foreground">
          {mode === 'in' ? 'Masuk agar kredit tersimpan di akunmu.' : 'Buat akun agar kredit tersimpan dan bisa dipakai di perangkat lain.'}
        </p>
        {mode === 'up' && <Field label="Nama">{(c) => <Input {...c} name="name" autoComplete="name" />}</Field>}
        <Field label="Email">{(c) => <Input {...c} name="email" type="email" autoComplete="email" required />}</Field>
        <Field label="Kata sandi" hint={mode === 'up' ? 'Minimal 8 karakter.' : undefined}>
          {(c) => (
            <Input {...c} name="password" type="password" minLength={8} autoComplete={mode === 'in' ? 'current-password' : 'new-password'} required />
          )}
        </Field>
        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="submit" variant="primary" disabled={busy}>
            {busy && <Loader2 className="animate-spin" />}
            {mode === 'in' ? 'Masuk' : 'Buat akun'}
          </Button>
          <Button variant="ghost" onClick={() => setMode(mode === 'in' ? 'up' : 'in')}>
            {mode === 'in' ? 'Belum punya akun? Daftar' : 'Sudah punya akun? Masuk'}
          </Button>
        </div>
      </form>
    </Panel>
  );
}
