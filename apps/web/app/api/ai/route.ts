import { NextRequest, NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { generate, isAiConfigured } from '@/lib/ai/generate';
import { AiOutputRejected } from '@/lib/ai/postprocess';
import { aiRequestSchema } from '@/lib/ai/tasks';
import { clientKey, rateLimit } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { isBillingConfigured } from '@/lib/billing/config';
import { FREE_AI_PER_DAY } from '@/lib/billing/packs';
import { refundCredit, spendCredit } from '@/lib/billing/server';
import { sessionUserId } from '@/lib/billing/session';
import { getDb } from '@/lib/sync/db';

export const runtime = 'nodejs';

/** Raw body cap; the schema caps each field as well. */
const MAX_BODY_BYTES = 16_000;
const MINUTE = { name: 'minute', limit: 10, windowMs: 60_000 };
/** Without credit sales, the daily cap per IP is the only brake on cost. */
const DAY = { name: 'day', limit: 150, windowMs: 86_400_000 };
const DAY_MS = 86_400_000;

const fail = (status: number, error: string, headers?: HeadersInit) =>
  NextResponse.json({ success: false, error }, { status, headers });

// CV text is personal data: nothing from the request body is ever logged.
export async function POST(request: NextRequest) {
  const ip = clientKey(request.headers);
  const billing = isBillingConfigured();
  for (const { name, limit, windowMs } of billing ? [MINUTE] : [MINUTE, DAY]) {
    const result = await rateLimit(`ai:${name}:${ip}`, limit, windowMs);
    if (!result.ok) {
      return fail(429, 'Terlalu banyak permintaan AI. Coba lagi sebentar lagi.', { 'Retry-After': String(result.retryAfter) });
    }
  }

  if (!isAiConfigured()) return fail(503, 'Fitur AI belum dikonfigurasi di server ini.');

  if (!(await verifyTurnstile(request.headers.get('x-turnstile-token'), ip))) {
    return fail(403, 'Verifikasi keamanan gagal. Muat ulang halaman lalu coba lagi.');
  }

  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return fail(413, 'Teks terlalu panjang untuk diproses sekaligus.');

  let body;
  try {
    body = aiRequestSchema.parse(JSON.parse(raw));
  } catch (error) {
    const tooLong = error instanceof ZodError && error.issues.some((issue) => issue.code === 'too_big');
    return fail(tooLong ? 413 : 400, tooLong ? 'Teks terlalu panjang untuk diproses sekaligus.' : 'Permintaan tidak valid.');
  }

  // With credit sales on: a free daily quota per account (or per IP for visitors), then one credit
  // per request. The credit is taken before the model runs and given back if it fails.
  const db = billing ? getDb() : null;
  let paidBy: string | null = null;
  if (db) {
    const userId = await sessionUserId(request.headers);
    const free = await rateLimit(`ai:free:${userId ? `u:${userId}` : `ip:${ip}`}`, FREE_AI_PER_DAY, DAY_MS);
    if (!free.ok) {
      if (!userId) {
        return fail(402, `Kuota AI gratis hari ini (${FREE_AI_PER_DAY}x) sudah habis. Masuk dan beli kredit AI di halaman /kredit.`);
      }
      if (!(await spendCredit(db, userId))) {
        return fail(402, `Kuota AI gratis hari ini (${FREE_AI_PER_DAY}x) sudah habis dan kredit AI kamu kosong. Beli kredit di halaman /kredit.`);
      }
      paidBy = userId;
    }
  }

  try {
    const data = await generate(body.task, body.input as never);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    if (db && paidBy) await refundCredit(db, paidBy).catch(() => undefined);
    if (error instanceof AiOutputRejected) return fail(422, error.message);
    // Only the error type: messages from the SDK can echo the prompt.
    console.error('AI request failed', { task: body.task, error: error instanceof Error ? error.name : 'unknown' });
    return fail(502, 'Layanan AI sedang tidak tersedia. Coba lagi nanti.');
  }
}
