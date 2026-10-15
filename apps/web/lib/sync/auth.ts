import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { getDb } from './db';
import { account, session, user, verification } from './schema';
import { AUTH_SECRET_ENV, authBaseUrl, isSyncConfigured } from './config';

/**
 * Better Auth instance, or `null` when sync is not configured.
 *
 * Returning `null` (instead of throwing) is what lets the whole app build and run with sync
 * switched off: callers use `getAuth()` and answer 503. `nextCookies()` must stay the last
 * plugin so it can attach Set-Cookie headers for server actions.
 */
function buildAuth() {
  const db = getDb();
  if (!db) return null;

  return betterAuth({
    baseURL: authBaseUrl(),
    secret: process.env[AUTH_SECRET_ENV],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      // No email provider is wired up yet, so accounts are usable immediately. Enabling
      // verification is a follow-up once transactional email is configured.
      requireEmailVerification: false,
      minPasswordLength: 8,
    },
    session: {
      // Cookie cache: a short window where the session is trusted without a DB round trip.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    advanced: {
      database: { generateId: () => crypto.randomUUID() },
    },
    plugins: [nextCookies()],
  });
}

export type Auth = NonNullable<ReturnType<typeof buildAuth>>;

const globalForAuth = globalThis as unknown as { gencvAuth?: Auth | null };

/** Returns the auth instance, or `null` when sync is unconfigured. */
export function getAuth(): Auth | null {
  if (!isSyncConfigured()) return null;
  if (globalForAuth.gencvAuth === undefined) globalForAuth.gencvAuth = buildAuth();
  return globalForAuth.gencvAuth;
}
