import { isBillingConfigured } from '@/lib/billing/config';
import { verifyWebhook, WebhookError } from '@/lib/billing/meowpay.mjs';
import { closePayment, markPaid, reversePayment } from '@/lib/billing/server';
import { getDb } from '@/lib/sync/db';

export const runtime = 'nodejs';

/**
 * Signed events from the MeowPay panel. The raw body is verified before it is parsed. Events
 * for orders that are not GenCV's (and webhook.test) get a 200 so the panel stops retrying.
 */
export async function POST(request: Request) {
  const db = getDb();
  if (!isBillingConfigured() || !db) return Response.json({ error: 'billing disabled' }, { status: 503 });
  const raw = await request.text();
  let event;
  try {
    event = await verifyWebhook(
      raw,
      request.headers.get('x-panel-timestamp'),
      request.headers.get('x-panel-signature'),
      process.env.MEOWPAY_WEBHOOK_SECRET!.trim(),
    );
  } catch (error) {
    if (error instanceof WebhookError) return Response.json({ error: error.message }, { status: 401 });
    throw error;
  }

  const id = event.order_id;
  if (!id) return Response.json({ ok: true });
  let result: { ok: boolean; reason?: string } = { ok: true };
  if (event.event === 'payment.paid') result = await markPaid(db, id, event.amount);
  else if (event.event === 'payment.reversed') result = await reversePayment(db, id, event.amount);
  else if (event.event === 'payment.expired') await closePayment(db, id, 'expired');
  if (!result.ok && result.reason === 'amount_mismatch') {
    console.error('Credit webhook amount mismatch', { order: id, event: event.event });
    return Response.json({ error: 'amount mismatch' }, { status: 400 });
  }
  return Response.json({ ok: true });
}
