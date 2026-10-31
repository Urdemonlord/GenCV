import { isBillingConfigured } from '@/lib/billing/config';
import { checkPayment, getBalance, panelFromEnv } from '@/lib/billing/server';
import { sessionUserId } from '@/lib/billing/session';
import { getDb } from '@/lib/sync/db';

export const runtime = 'nodejs';

const fail = (status: number, error: string) => Response.json({ success: false, error }, { status });

/** Polled by the checkout page while the QR is shown. */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const db = getDb();
  if (!isBillingConfigured() || !db) return fail(503, 'Pembelian kredit belum dibuka.');
  const userId = await sessionUserId(request.headers);
  if (!userId) return fail(401, 'Masuk dulu.');
  const { id } = await params;
  if (!/^[A-Za-z0-9_-]{4,80}$/.test(id)) return fail(404, 'Pembayaran tidak ditemukan.');
  try {
    const payment = await checkPayment(db, panelFromEnv(), userId, id);
    if (!payment) return fail(404, 'Pembayaran tidak ditemukan.');
    return Response.json({ success: true, payment, balance: await getBalance(db, userId) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Credit payment check failed', { error: error instanceof Error ? error.name : 'unknown' });
    return fail(502, 'Status pembayaran belum bisa diperiksa. Coba lagi.');
  }
}
