/**
 * Cloud sync configuration. Sync is optional: without these variables GenCV keeps working
 * exactly as before, entirely on the device. Every entry point checks `isSyncConfigured()`
 * first and returns 503 instead of crashing, the same pattern as `isAiConfigured()` for AI.
 */

/** Postgres connection string. Any Postgres works; the app only needs one reachable from Vercel. */
export const DATABASE_URL_ENV = 'DATABASE_URL';

/** Signing secret for session cookies. Must be >= 32 chars; generate with `openssl rand -base64 32`. */
export const AUTH_SECRET_ENV = 'BETTER_AUTH_SECRET';

/** Minimum length for the session signing secret. Short secrets are weak; reject them. */
export const MIN_AUTH_SECRET_LENGTH = 32;

/** Public origin, used for cookie/redirect correctness behind a proxy. */
export const AUTH_URL_ENV = 'BETTER_AUTH_URL';

/**
 * True only when sync is fully and *safely* configured.
 *
 * The secret length is checked here rather than left to Better Auth: a short secret still
 * "works", so a weak value would silently enable session signing instead of failing loudly.
 * With this guard the route stays 503 until a proper secret is set.
 */
export function isSyncConfigured(): boolean {
  const databaseUrl = process.env[DATABASE_URL_ENV]?.trim();
  const secret = process.env[AUTH_SECRET_ENV]?.trim();
  return Boolean(databaseUrl && secret && secret.length >= MIN_AUTH_SECRET_LENGTH);
}

/** Origin for Better Auth. Falls back to the app URL, then to local dev. */
export function authBaseUrl(): string | undefined {
  return process.env[AUTH_URL_ENV]?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || undefined;
}

/**
 * Origins allowed to call the auth endpoints.
 *
 * A preview deployment serves from its own hostname, which is *not* the production origin in
 * `NEXT_PUBLIC_APP_URL`. Without trusting it, the browser sends the preview origin, Better Auth
 * compares it against the configured base URL, and rejects every sign-in on previews — the one
 * place the flow most needs testing.
 *
 * Deliberately `VERCEL_URL` and not a `*.vercel.app` wildcard: the former is set by the platform
 * to this deployment's own hostname, while the latter would trust every Vercel deployment anyone
 * on the internet can create, which is most of what the origin check is for.
 */
export function trustedOrigins(): string[] {
  const origins: string[] = [];
  const base = authBaseUrl();
  if (base) origins.push(base);

  const vercelUrl = process.env.VERCEL_URL?.trim();
  // `VERCEL_URL` is documented as a bare hostname, but a value that already carries a scheme
  // would otherwise become `https://https://…` — an origin that can never match anything.
  if (vercelUrl) origins.push(/^https?:\/\//.test(vercelUrl) ? vercelUrl : `https://${vercelUrl}`);

  return origins;
}
