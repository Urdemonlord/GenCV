/**
 * Best-effort fixed-window limiter kept in module memory. On serverless platforms each
 * instance has its own counters, so this only blunts casual abuse; a shared store
 * (e.g. Upstash) replaces it in milestone R8.
 */
const windows = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): { ok: boolean; retryAfter: number } {
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

export function clientKey(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || headers.get('x-real-ip') || 'unknown';
}
