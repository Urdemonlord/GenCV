import QRCode from 'qrcode';
import { and, desc, eq, gt, sql } from 'drizzle-orm';
import { AmountBusy, CustomerAlreadyPaying, MeowPay } from './meowpay.mjs';
import { findPack } from './packs';
import { aiCredits, creditPayments } from '@/lib/sync/schema';
import type { Database } from '@/lib/sync/db';

/**
 * Credit purchases and spending. Every status change is a conditional UPDATE inside a
 * transaction, so a webhook redelivery and a status poll arriving together credit the pack once.
 */

/** The part of the MeowPay client used here; tests pass a fake panel. */
export interface Panel {
  createOrderUnique(base: number, opts: { customerRef?: string }): Promise<{ id: string; amount: number; qr_string?: string | null; expires_at?: string | number | null }>;
  getOrder(id: string): Promise<{ status: string; amount: number } | null>;
}

export function panelFromEnv(): Panel {
  return new MeowPay({ host: process.env.MEOWPAY_HOST!.trim(), apiKey: process.env.MEOWPAY_KEY!.trim() });
}

export class BillingError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

export type PaymentStatus = 'pending' | 'paid' | 'expired' | 'cancelled' | 'reversed';

export interface PaymentView {
  id: string;
  packId: string;
  credits: number;
  price: number;
  amount: number;
  discount: number;
  status: PaymentStatus;
  expiresAt: string;
  paidAt: string | null;
  /** Only while pending. */
  qrSvg?: string;
}

type Row = typeof creditPayments.$inferSelect;

const QR_TTL_MS = 15 * 60 * 1000;

async function view(row: Row, withQr = true): Promise<PaymentView> {
  const out: PaymentView = {
    id: row.id,
    packId: row.packId,
    credits: row.credits,
    price: row.price,
    amount: row.amount,
    discount: row.price - row.amount,
    status: row.status as PaymentStatus,
    expiresAt: row.expiresAt.toISOString(),
    paidAt: row.paidAt?.toISOString() ?? null,
  };
  if (withQr && row.status === 'pending') out.qrSvg = await QRCode.toString(row.qrString, { type: 'svg', margin: 2, errorCorrectionLevel: 'M' });
  return out;
}

function expiryOf(value: string | number | null | undefined, now: Date): Date {
  const t = typeof value === 'number' ? value : value ? (/^\d+$/.test(value) ? Number(value) : Date.parse(value)) : NaN;
  return Number.isFinite(t) ? new Date(t) : new Date(now.getTime() + QR_TTL_MS);
}

export async function getBalance(db: Database, userId: string): Promise<number> {
  const [row] = await db.select({ balance: aiCredits.balance }).from(aiCredits).where(eq(aiCredits.userId, userId));
  return row?.balance ?? 0;
}

/** Takes one credit. Returns false when the user has none; the CHECK stops a race going below zero. */
export async function spendCredit(db: Database, userId: string): Promise<boolean> {
  const rows = await db
    .update(aiCredits)
    .set({ balance: sql`${aiCredits.balance} - 1`, updatedAt: new Date() })
    .where(and(eq(aiCredits.userId, userId), gt(aiCredits.balance, 0)))
    .returning({ balance: aiCredits.balance });
  return rows.length === 1;
}

/** Gives back a credit spent on a request that then failed. */
export async function refundCredit(db: Database, userId: string): Promise<void> {
  await db
    .update(aiCredits)
    .set({ balance: sql`${aiCredits.balance} + 1`, updatedAt: new Date() })
    .where(eq(aiCredits.userId, userId));
}

/** Opens a QR for a pack. An unexpired pending QR for the same pack is reused, so a double click opens one order. */
export async function createCheckout(db: Database, panel: Panel, userId: string, packId: string, now = new Date()): Promise<PaymentView> {
  const pack = findPack(packId);
  if (!pack) throw new BillingError(400, 'Paket kredit tidak dikenal.');

  const [open] = await db
    .select()
    .from(creditPayments)
    .where(
      and(
        eq(creditPayments.userId, userId),
        eq(creditPayments.packId, pack.id),
        eq(creditPayments.status, 'pending'),
        gt(creditPayments.expiresAt, new Date(now.getTime() + 60_000)),
      ),
    )
    .orderBy(desc(creditPayments.createdAt))
    .limit(1);
  if (open) return view(open);

  let order;
  try {
    order = await panel.createOrderUnique(pack.price, { customerRef: `gencv:${userId}:${pack.id}` });
  } catch (error) {
    if (error instanceof AmountBusy || error instanceof CustomerAlreadyPaying) {
      throw new BillingError(503, 'Antrean pembayaran sedang penuh. Coba lagi sebentar lagi.');
    }
    throw error;
  }
  if (!order?.id || !order.qr_string || !(order.amount > 0 && order.amount <= pack.price)) {
    throw new Error('Incomplete order from the payment panel');
  }
  const [row] = await db
    .insert(creditPayments)
    .values({
      id: order.id,
      userId,
      packId: pack.id,
      credits: pack.credits,
      price: pack.price,
      amount: order.amount,
      qrString: order.qr_string!,
      status: 'pending',
      expiresAt: expiryOf(order.expires_at, now),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  return view(row);
}

export type Settle = { ok: true; changed: boolean } | { ok: false; reason: 'unknown' | 'amount_mismatch' };

/** Credits a paid order once. A late payment for an expired, cancelled or reversed QR still counts. */
export async function markPaid(db: Database, id: string, amount?: number | null): Promise<Settle> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(creditPayments).where(eq(creditPayments.id, id)).for('update');
    if (!row) return { ok: false, reason: 'unknown' } as const;
    if (amount != null && amount !== row.amount) return { ok: false, reason: 'amount_mismatch' } as const;
    if (row.status === 'paid') return { ok: true, changed: false } as const;
    const now = new Date();
    await tx
      .insert(aiCredits)
      .values({ userId: row.userId, balance: row.credits, updatedAt: now })
      .onConflictDoUpdate({
        target: aiCredits.userId,
        set: { balance: sql`${aiCredits.balance} + ${row.credits}`, updatedAt: now },
      });
    await tx
      .update(creditPayments)
      .set({ status: 'paid', paidAt: now, updatedAt: now })
      .where(and(eq(creditPayments.id, id), eq(creditPayments.status, row.status)));
    return { ok: true, changed: true } as const;
  });
}

/**
 * Takes a reversed payment's credits back. Credits already spent cannot be recovered, so the
 * balance stops at zero rather than going negative.
 */
export async function reversePayment(db: Database, id: string, amount?: number | null): Promise<Settle> {
  return db.transaction(async (tx) => {
    const [row] = await tx.select().from(creditPayments).where(eq(creditPayments.id, id)).for('update');
    if (!row) return { ok: false, reason: 'unknown' } as const;
    if (amount != null && amount !== row.amount) return { ok: false, reason: 'amount_mismatch' } as const;
    if (row.status !== 'paid') return { ok: true, changed: false } as const;
    const now = new Date();
    await tx
      .update(aiCredits)
      .set({ balance: sql`greatest(${aiCredits.balance} - ${row.credits}, 0)`, updatedAt: now })
      .where(eq(aiCredits.userId, row.userId));
    await tx
      .update(creditPayments)
      .set({ status: 'reversed', updatedAt: now })
      .where(and(eq(creditPayments.id, id), eq(creditPayments.status, 'paid')));
    return { ok: true, changed: true } as const;
  });
}

export async function closePayment(db: Database, id: string, status: 'expired' | 'cancelled'): Promise<void> {
  await db
    .update(creditPayments)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(creditPayments.id, id), eq(creditPayments.status, 'pending')));
}

/**
 * Status for the checkout page's poll. While pending it asks the panel, so a webhook that never
 * arrived still completes the purchase. Another user's payment reads as not found.
 */
export async function checkPayment(db: Database, panel: Panel, userId: string, id: string): Promise<PaymentView | null> {
  const read = async () => {
    const [row] = await db
      .select()
      .from(creditPayments)
      .where(and(eq(creditPayments.id, id), eq(creditPayments.userId, userId)));
    return row;
  };
  const row = await read();
  if (!row) return null;
  if (row.status !== 'pending') return view(row);

  const order = await panel.getOrder(id);
  if (order?.status === 'PAID') await markPaid(db, id, order.amount);
  else if (order?.status === 'EXPIRED') await closePayment(db, id, 'expired');
  else if (order?.status === 'CANCELLED') await closePayment(db, id, 'cancelled');
  else return view(row);
  return view((await read())!);
}

export async function listPayments(db: Database, userId: string, limit = 20): Promise<PaymentView[]> {
  const rows = await db
    .select()
    .from(creditPayments)
    .where(eq(creditPayments.userId, userId))
    .orderBy(desc(creditPayments.createdAt))
    .limit(limit);
  return Promise.all(rows.map((r) => view(r, false)));
}
