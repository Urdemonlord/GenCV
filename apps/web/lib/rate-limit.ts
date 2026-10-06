/**
 * Fixed-window rate limiting. With UPSTASH_REDIS_REST_URL/TOKEN set, counters live in Redis and
 * are shared by every server instance. Without them (local development) they fall back to module
 * memory, which on serverless platforms is per instance and only blunts casual abuse.
 */

export interface RateLimitResult {
  ok: boolean;
  retryAfter: number;
}

const windows = new Map<string, { count: number; resetAt: number }>();

function memoryLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    if (windows.size > 10_000) {
      windows.forEach((w, k) => {
        if (w.resetAt <= now) windows.delete(k);
      });
    }
    return { ok: true, retryAfter: 0 };
  }
  current.count += 1;
  return current.count <= limit
    ? { ok: true, retryAfter: 0 }
    : { ok: false, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
}

async function redisLimit(url: string, token: string, key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const response = await fetch(`${url.replace(/\/$/, '')}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify([
      ['INCR', key],
      ['PEXPIRE', key, String(windowMs), 'NX'],
      ['PTTL', key],
    ]),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Rate limit store responded ${response.status}`);
  const [count, , ttl] = (await response.json()) as { result: number }[];
  return count.result <= limit
    ? { ok: true, retryAfter: 0 }
    : { ok: false, retryAfter: Math.max(1, Math.ceil(ttl.result / 1000)) };
}

export async function rateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    try {
      return await redisLimit(url, token, `gencv:rl:${key}`, limit, windowMs);
    } catch {
      // Store unreachable: fall back to the per-instance limiter instead of blocking every request.
    }
  }
  return memoryLimit(key, limit, windowMs);
}

export function clientKey(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}
