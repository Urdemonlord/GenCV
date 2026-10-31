import { createHmac } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { assertThrowawayDatabase } from '@/lib/sync/test-database';
import type { Database } from '@/lib/sync/db';
import * as schema from '@/lib/sync/schema';
import { user } from '@/lib/sync/schema';

/**
 * Credit packs end to end: the real route handlers and SQL, a fake MeowPay panel behind `fetch`,
 * and the AI model and Turnstile stubbed out.
 *
 * Skipped unless `TEST_DATABASE_URL` points at a throwaway database (see the header of
 * `lib/sync/auth.integration.test.ts`). It works in its own database, `<name>_billing`, created
 * next to that one, so it never races the sync tests that drop tables in the shared database.
 */
const url = process.env.TEST_DATABASE_URL;
const SECRET = 'whsec-test';

const state = vi.hoisted(() => ({ db: null as unknown, userId: null as string | null, aiFails: false }));
vi.mock('@/lib/sync/db', () => ({ getDb: () => state.db }));
vi.mock('@/lib/billing/session', () => ({ sessionUserId: async () => state.userId }));
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: async () => true }));
vi.mock('@/lib/ai/generate', () => ({
  isAiConfigured: () => true,
  generate: async () => {
    if (state.aiFails) throw new Error('model down');
    return { text: 'ok' };
  },
}));

// The panel: one unpaid order per amount, like MAX_PENDING_PER_AMOUNT=1.
type Order = { id: string; amount: number; status: string; expires_at: number };
let orders: Map<string, Order>;
let busy: Set<number>;
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status });
const realFetch = globalThis.fetch;
vi.stubGlobal('fetch', async (input: string, init: RequestInit = {}) => {
  const u = new URL(input);
  if (u.host !== 'panel.test') return realFetch(input, init);
  if (init.method === 'POST' && u.pathname === '/api/v1/orders') {
    const { amount } = JSON.parse(String(init.body));
    if (busy.has(amount) || [...orders.values()].some((o) => o.status === 'PENDING' && o.amount === amount)) {
      return json(429, { code: 'queue_full' });
    }
    const id = `ORD-${Date.now()}-${orders.size}`;
    orders.set(id, { id, amount, status: 'PENDING', expires_at: Date.now() + 900_000 });
    return json(201, { ...orders.get(id), qr_string: '00020101021126QRIS' + amount });
  }
  const o = orders.get(u.pathname.split('/').pop()!);
  return o ? json(200, o) : json(404, {});
});

const { POST: checkout } = await import('@/app/api/credits/checkout/route');
const { GET: status } = await import('@/app/api/credits/payments/[id]/route');
const { POST: webhook } = await import('@/app/api/credits/webhook/route');
const { GET: overview } = await import('@/app/api/credits/route');
const { POST: ai } = await import('@/app/api/ai/route');

const post = (handler: (r: never) => Promise<Response>, body: unknown, ip = '10.0.0.1') =>
  handler(
    new Request('http://app.test/api', {
      method: 'POST',
      body: JSON.stringify(body),
      headers: { 'content-type': 'application/json', 'x-forwarded-for': ip },
    }) as never,
  );
const poll = (id: string) => status(new Request('http://app.test/api') as never, { params: Promise.resolve({ id }) });
function hook(event: object, secret = SECRET) {
  const raw = JSON.stringify(event);
  const ts = String(Date.now());
  const sig = createHmac('sha512', secret).update(`${ts}.${raw}`).digest('hex');
  return webhook(new Request('http://app.test/api/credits/webhook', { method: 'POST', body: raw, headers: { 'x-panel-timestamp': ts, 'x-panel-signature': sig } }));
}
const aiCall = (ip: string) => post(ai, { task: 'skills', input: { language: 'id', role: 'Analis', level: 'professional', confirmedKeywords: [], skills: [] } }, ip);

describe.skipIf(!url)('credit packs (integration)', () => {
  let admin: Pool;
  let pool: Pool;
  let n = 0;
  const newUser = async () => {
    const id = `credit-user-${Date.now()}-${n++}`;
    await (state.db as Database).insert(user).values({ id, name: id, email: `${id}@example.com`, emailVerified: false, createdAt: new Date(), updatedAt: new Date() });
    return id;
  };
  const balance = async (id: string) => (await (await overviewFor(id)).json()).balance as number;
  const overviewFor = (id: string) => {
    state.userId = id;
    return overview(new Request('http://app.test/api/credits'));
  };

  beforeAll(async () => {
    assertThrowawayDatabase(url!);
    const target = new URL(url!);
    const name = `${target.pathname.slice(1)}_billing`;
    admin = new Pool({ connectionString: url });
    await admin.query(`drop database if exists "${name}" with (force)`);
    await admin.query(`create database "${name}"`);
    target.pathname = `/${name}`;
    pool = new Pool({ connectionString: target.toString() });
    const dir = join(__dirname, '..', 'sync', 'migrations');
    await pool.query(readdirSync(dir).filter((f) => f.endsWith('.sql')).sort().map((f) => readFileSync(join(dir, f), 'utf8')).join('\n'));
    state.db = drizzle(pool, { schema });
    process.env.DATABASE_URL = target.toString();
    process.env.BETTER_AUTH_SECRET = 'x'.repeat(40);
    process.env.MEOWPAY_HOST = 'https://panel.test';
    process.env.MEOWPAY_KEY = 'mpk_test';
    process.env.MEOWPAY_WEBHOOK_SECRET = SECRET;
  });

  afterAll(async () => {
    await pool?.end();
    await admin?.end();
  });

  beforeEach(() => {
    orders = new Map();
    busy = new Set();
    state.aiFails = false;
  });

  it('opens one QR per pack at the list price, with a small discount only when the amount is busy', async () => {
    state.userId = null;
    expect((await post(checkout, { packId: 'kredit-200' })).status).toBe(401);
    state.userId = await newUser();
    expect((await post(checkout, { packId: 'gratis' })).status).toBe(400);

    const first = (await (await post(checkout, { packId: 'kredit-200' })).json()).payment;
    expect(first).toMatchObject({ price: 29_000, amount: 29_000, discount: 0, credits: 200, status: 'pending' });
    expect(first.qrSvg).toContain('<svg');
    const again = (await (await post(checkout, { packId: 'kredit-200' })).json()).payment;
    expect(again.id).toBe(first.id);
    expect(orders.size).toBe(1);

    busy.add(10_000);
    const cheap = (await (await post(checkout, { packId: 'kredit-50' })).json()).payment;
    expect(cheap.amount).toBeLessThan(10_000);
    expect(cheap.amount).toBeGreaterThanOrEqual(10_000 - 100);
  });

  it('credits once per payment, checks signature and amount, and takes credits back on reversal', async () => {
    const id = await newUser();
    state.userId = id;
    const p = (await (await post(checkout, { packId: 'kredit-50' })).json()).payment;
    const paid = { event: 'payment.paid', order_id: p.id, amount: p.amount };
    expect((await hook(paid, 'wrong')).status).toBe(401);
    expect((await hook({ ...paid, amount: p.amount + 1 })).status).toBe(400);
    expect((await hook(paid)).status).toBe(200);
    expect((await hook(paid)).status).toBe(200); // redelivery
    expect(await balance(id)).toBe(50);

    expect((await hook({ event: 'payment.reversed', order_id: p.id, amount: p.amount })).status).toBe(200);
    expect(await balance(id)).toBe(0);
    expect((await hook({ event: 'payment.paid', order_id: 'ORD-other-shop', amount: 5 })).status).toBe(200);
    expect((await hook({ event: 'webhook.test', order_id: null, amount: null })).status).toBe(200);
  });

  it('polling completes a payment whose webhook never came, and a late payment still counts', async () => {
    const id = await newUser();
    state.userId = id;
    const p = (await (await post(checkout, { packId: 'kredit-200' })).json()).payment;
    expect((await (await poll(p.id)).json()).payment.status).toBe('pending');
    state.userId = await newUser();
    expect((await poll(p.id)).status).toBe(404); // not theirs
    state.userId = id;

    orders.get(p.id)!.status = 'PAID';
    const done = await (await poll(p.id)).json();
    expect(done.payment.status).toBe('paid');
    expect(done.balance).toBe(200);

    const q = (await (await post(checkout, { packId: 'kredit-50' })).json()).payment;
    orders.get(q.id)!.status = 'EXPIRED';
    expect((await (await poll(q.id)).json()).payment.status).toBe('expired');
    await hook({ event: 'payment.paid', order_id: q.id, amount: q.amount });
    expect(await balance(id)).toBe(250);
  });

  it('AI is free up to the daily quota, then spends one credit per request and refunds failures', async () => {
    const id = await newUser();
    state.userId = id;
    for (let i = 0; i < 5; i++) expect((await aiCall('10.0.1.1')).status).toBe(200);
    expect((await aiCall('10.0.1.1')).status).toBe(402); // no credits

    const p = (await (await post(checkout, { packId: 'kredit-50' })).json()).payment;
    await hook({ event: 'payment.paid', order_id: p.id, amount: p.amount });
    expect((await aiCall('10.0.1.1')).status).toBe(200);
    expect(await balance(id)).toBe(49);
    state.userId = id;
    state.aiFails = true;
    expect((await aiCall('10.0.1.1')).status).toBe(502);
    expect(await balance(id)).toBe(49); // refunded

    // Visitors get the free quota per IP, then are asked to sign in.
    state.userId = null;
    state.aiFails = false;
    for (let i = 0; i < 5; i++) expect((await aiCall('10.0.2.2')).status).toBe(200);
    const blocked = await aiCall('10.0.2.2');
    expect(blocked.status).toBe(402);
    expect((await blocked.json()).error).toContain('/kredit');
  });
});
