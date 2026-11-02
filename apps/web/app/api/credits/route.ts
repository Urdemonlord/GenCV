import { isBillingConfigured } from '@/lib/billing/config';
import { CREDIT_PACKS, FREE_AI_PER_DAY } from '@/lib/billing/packs';
import { getBalance, listPayments } from '@/lib/billing/server';
import { sessionUserId } from '@/lib/billing/session';
import { getDb } from '@/lib/sync/db';

export const runtime = 'nodejs';

/** `GET` → whether credits are on sale, the packs, and for a signed-in user the balance and purchase history. */
export async function GET(request: Request) {
  const enabled = isBillingConfigured();
  const base = { success: true, enabled, freePerDay: FREE_AI_PER_DAY, packs: CREDIT_PACKS };
  const db = getDb();
  const userId = enabled && db ? await sessionUserId(request.headers) : null;
  if (!userId || !db) return Response.json({ ...base, signedIn: false, balance: 0, payments: [] });
  const [balance, payments] = await Promise.all([getBalance(db, userId), listPayments(db, userId)]);
  return Response.json({ ...base, signedIn: true, balance, payments }, { headers: { 'Cache-Control': 'no-store' } });
}
