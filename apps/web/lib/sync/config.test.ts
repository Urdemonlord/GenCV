import { afterEach, describe, expect, it } from 'vitest';
import { isSyncConfigured, trustedOrigins } from './config';

/**
 * These read process env, so each test sets what it needs and the teardown clears it. Without
 * that, an unrelated test's leftovers decide the result.
 */
const ENV_KEYS = ['BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL', 'VERCEL_URL', 'DATABASE_URL', 'BETTER_AUTH_SECRET'];

afterEach(() => {
  for (const key of ENV_KEYS) delete process.env[key];
});

describe('trustedOrigins', () => {
  it('trusts the configured base URL', () => {
    process.env.BETTER_AUTH_URL = 'https://gencv.meowlabs.id';
    expect(trustedOrigins()).toContain('https://gencv.meowlabs.id');
  });

  it('trusts the preview deployment it is actually running on', () => {
    // A preview serves from its own hostname. Without this, the browser sends that origin,
    // Better Auth compares it against the production base URL, and every sign-in on previews is
    // rejected — the one place the flow most needs testing.
    process.env.NEXT_PUBLIC_APP_URL = 'https://gencv.meowlabs.id';
    process.env.VERCEL_URL = 'gen-cv-web-abc123.vercel.app';

    const origins = trustedOrigins();
    expect(origins).toContain('https://gencv.meowlabs.id');
    expect(origins).toContain('https://gen-cv-web-abc123.vercel.app');
  });

  it('trusts the exact deployment hostname, not every Vercel deployment', () => {
    // A `*.vercel.app` wildcard would trust any deployment anyone on the internet can create,
    // which is most of what the origin check exists to prevent. `VERCEL_URL` is set by the
    // platform to this deployment only, so the wildcard is not needed.
    process.env.VERCEL_URL = 'gen-cv-web-abc123.vercel.app';
    const origins = trustedOrigins();

    expect(origins.every((origin) => !origin.includes('*'))).toBe(true);
    expect(origins).toEqual(['https://gen-cv-web-abc123.vercel.app']);
  });

  it('returns nothing rather than a broken entry when no origin is configured', () => {
    // Better Auth accepts an empty list; an empty string or `https://undefined` would be trusted
    // garbage.
    expect(trustedOrigins()).toEqual([]);
  });

  it('does not double-prefix a VERCEL_URL that already carries a scheme', () => {
    // Documented behaviour is a bare hostname, but a misconfigured `https://` prefix should not
    // silently produce `https://https://…` — an origin that can never match.
    process.env.VERCEL_URL = 'https://gen-cv-web-abc123.vercel.app';
    expect(trustedOrigins()).not.toContain('https://https://gen-cv-web-abc123.vercel.app');
  });
});

describe('isSyncConfigured', () => {
  it('requires both a database and a long enough secret', () => {
    process.env.DATABASE_URL = 'postgres://host/db';
    process.env.BETTER_AUTH_SECRET = 'x'.repeat(32);
    expect(isSyncConfigured()).toBe(true);

    process.env.BETTER_AUTH_SECRET = 'short';
    expect(isSyncConfigured()).toBe(false);

    delete process.env.DATABASE_URL;
    process.env.BETTER_AUTH_SECRET = 'x'.repeat(32);
    expect(isSyncConfigured()).toBe(false);
  });
});
