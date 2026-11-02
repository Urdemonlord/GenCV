import { getAuth } from '@/lib/sync/auth';

/** The signed-in user's id from the Better Auth session cookie, or null. */
export async function sessionUserId(headers: Headers): Promise<string | null> {
  const auth = getAuth();
  if (!auth) return null;
  const session = await auth.api.getSession({ headers }).catch(() => null);
  return session?.user.id ?? null;
}
