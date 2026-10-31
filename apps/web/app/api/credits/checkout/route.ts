import { isBillingConfigured } from '@/lib/billing/config';
import { BillingError, createCheckout, panelFromEnv } from '@/lib/billing/server';
import { sessionUserId } from '@/lib/billing/session';
import { rateLimit } from '@/lib/rate-limit';
import { getDb } from '@/lib/sync/db';

export const runtime = 'nodejs';

const fail = (status: number, error: string) => Response.json({ success: false, error }, { status });

/** `POST { packId }` → a QRIS payment for the signed-in user (with `qrSvg`). */
export async function POST(request: Request) {
  const db = getDb();
  if (!isBillingConfigured() || !db) return fail(503, 'Pembelian kredit belum dibuka.');
  const userId = await sessionUserId(request.headers);
  if (!userId) return fail(401, 'Masuk dulu untuk membeli kredit.');
  if (!(await rateLimit(`credits:checkout:${userId}`, 20, 3_600_000)).ok) {
    return fail(429, 'Terlalu banyak percobaan pembayaran. Coba lagi nanti.');
  }

  let packId: unknown;
  try {
    ({ packId } = await request.json());
  } catch {
    return fail(400, 'Permintaan tidak valid.');
  }
  if (typeof packId !== 'string') return fail(400, 'Pilih paket kredit.');

  try {
    return Response.json({ success: true, payment: await createCheckout(db, panelFromEnv(), userId, packId) });
  } catch (error) {
    if (error instanceof BillingError) return fail(error.status, error.message);
    console.error('Credit checkout failed', { error: error instanceof Error ? error.name : 'unknown' });
    return fail(502, 'Layanan pembayaran sedang bermasalah. Coba lagi nanti.');
  }
}
