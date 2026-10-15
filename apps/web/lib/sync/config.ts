/**
 * Cloud sync configuration. Sync is optional: without these variables GenCV keeps working
 * exactly as before, entirely on the device. Every entry point checks `isSyncConfigured()`
 * first and returns 503 instead of crashing, the same pattern as `isAiConfigured()` for AI.
 */

/** Postgres connection string. Any Postgres works; the app only needs one reachable from Vercel. */
export const DATABASE_URL_ENV = 'DATABASE_URL';

/** Signing secret for session cookies. Must be >= 32 chars; generate with `openssl rand -base64 32`. */
export const AUTH_SECRET_ENV = 'BETTER_AUTH_SECRET';

/** Public origin, used for cookie/redirect correctness behind a proxy. */
export const AUTH_URL_ENV = 'BETTER_AUTH_URL';

export function isSyncConfigured(): boolean {
  return Boolean(process.env[DATABASE_URL_ENV]?.trim() && process.env[AUTH_SECRET_ENV]?.trim());
}

/** Origin for Better Auth. Falls back to the app URL, then to local dev. */
export function authBaseUrl(): string | undefined {
  return process.env[AUTH_URL_ENV]?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || undefined;
}
