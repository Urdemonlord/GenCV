import { randomUUID } from 'node:crypto';
import { after } from 'next/server';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { nextCookies } from 'better-auth/next-js';
import { getDb } from './db';
import { account, session, user, verification } from './schema';
import { sendIrisAuthEmail, type IrisTemplateId } from './iris-email';
import { AUTH_SECRET_ENV, authBaseUrl, isSyncConfigured, trustedOrigins } from './config';

function deferIrisAuthEmail(templateId: IrisTemplateId, recipient: string, actionUrl: string) {
  after(() =>
    sendIrisAuthEmail({ templateId, recipient, actionUrl }).catch(() => {
      console.error('GenCV Iris auth email request failed', { template_id: templateId });
    }),
  );
}

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
    // Preview deployments serve from their own hostname, so the browser's origin would not match
    // `baseURL` and every sign-in would be rejected there.
    trustedOrigins: trustedOrigins(),
    secret: process.env[AUTH_SECRET_ENV],
    database: drizzleAdapter(db, {
      provider: 'pg',
      schema: { user, session, account, verification },
    }),
    emailAndPassword: {
      enabled: true,
      // Email verification remains opt-in: existing accounts still work without Iris credentials.
      requireEmailVerification: false,
      sendResetPassword: async ({ user, url }) => {
        deferIrisAuthEmail('auth.recovery', user.email, url);
      },
      minPasswordLength: 8,
    },
    emailVerification: {
      sendVerificationEmail: async ({ user, url }) => {
        deferIrisAuthEmail('auth.verify', user.email, url);
      },
      sendOnSignUp: false,
    },
    session: {
      // Cookie cache: a short window where the session is trusted without a DB round trip.
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    advanced: {
      database: { generateId: () => randomUUID() },
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
