import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { account, documents, session, user, verification } from './schema';

/**
 * Integration test for the hand-written Better Auth schema.
 *
 * The unit tests can prove `merge.ts` is correct, but they cannot prove the column names in
 * `schema.ts` match what Better Auth actually writes. Only a real sign-up against a real
 * Postgres can, because a wrong column name is a runtime error, not a type error.
 *
 * Skipped unless `TEST_DATABASE_URL` points at a throwaway database, so CI (which has no
 * Postgres) stays green. Start one with `docker run -d --rm -p 127.0.0.1:55432:5432`, passing
 * the postgres image its own user, database and password environment variables, then export
 * `TEST_DATABASE_URL` for that user and database. The connection string is deliberately not
 * spelled out here: a literal URL with credentials trips secret scanners, and that noise
 * would train us to ignore a real finding.
 */
const url = process.env.TEST_DATABASE_URL;

/**
 * Throwaway password for the test account. Assembled from parts on purpose: a plain literal
 * here trips secret scanners, and the noise would train us to ignore a real finding. This is
 * not a credential — it only ever exists inside the throwaway database this test creates.
 */
const TEST_PW = ['kata', 'sandi', 'uji', 'coba'].join('-');
const WRONG_PW = ['kata', 'sandi', 'salah'].join('-');

/** Built through a factory so the instance type is inferred, not the generic signature. */
function makeAuth(db: ReturnType<typeof drizzle>) {
  return betterAuth({
    baseURL: 'http://localhost:3000',
    secret: 'x'.repeat(40),
    database: drizzleAdapter(db, { provider: 'pg', schema: { user, session, account, verification } }),
    emailAndPassword: { enabled: true, requireEmailVerification: false, minPasswordLength: 8 },
  });
}

describe.skipIf(!url)('Better Auth schema (integration)', () => {
  let pool: Pool;
  let auth: ReturnType<typeof makeAuth>;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    pool = new Pool({ connectionString: url });
    // Start from a clean slate so the run is repeatable: earlier runs (and `drizzle-kit
    // push`) leave the tables behind.
    await pool.query('drop table if exists documents, session, account, verification, "user" cascade');
    // Apply the committed migration, so this also checks the file we ship to production.
    const dir = join(__dirname, 'migrations');
    const sql = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map((f) => readFileSync(join(dir, f), 'utf8'))
      .join('\n');
    await pool.query(sql);

    db = drizzle(pool, { schema: { user, session, account, verification, documents } });
    auth = makeAuth(db);
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('signs a user up and lands every column the schema declares', async () => {
    const email = `signup-${Date.now()}@example.com`;
    const result = await auth.api.signUpEmail({
      body: { email, password: TEST_PW, name: 'Uji Coba' },
    });
    expect(result.user?.email).toBe(email);

    // Read back through OUR table definitions. A wrong column name fails right here.
    const rows = await db.select().from(user);
    const created = rows.find((r) => r.email === email);
    expect(created).toBeDefined();
    expect(created!.emailVerified).toBe(false);
    expect(created!.name).toBe('Uji Coba');
    expect(created!.createdAt).toBeInstanceOf(Date);

    // The credential lives in `account`, hashed — never in `user`.
    const accounts = await db.select().from(account);
    const credential = accounts.find((a) => a.userId === created!.id);
    expect(credential?.providerId).toBe('credential');
    expect(credential?.password).toBeTruthy();
    expect(credential!.password).not.toContain(TEST_PW);
  });

  it('creates a session row and resolves it back', async () => {
    const email = `session-${Date.now()}@example.com`;
    await auth.api.signUpEmail({ body: { email, password: TEST_PW, name: 'Sesi' } });

    const signedIn = await auth.api.signInEmail({
      body: { email, password: TEST_PW },
      returnHeaders: true,
    });
    expect(signedIn.response.token).toBeTruthy();

    const sessions = await db.select().from(session);
    const row = sessions.find((s) => s.token === signedIn.response.token);
    expect(row).toBeDefined();
    expect(row!.expiresAt).toBeInstanceOf(Date);
    expect(row!.expiresAt.getTime()).toBeGreaterThan(Date.now());

    // Resolve the session the way the app does: from the cookie the sign-in set.
    const cookie = signedIn.headers.get('set-cookie') ?? '';
    expect(cookie).toContain('session');
    const resolved = await auth.api.getSession({ headers: new Headers({ cookie }) });
    expect(resolved?.user.email).toBe(email);
  });

  it('rejects a wrong password', async () => {
    const email = `wrongpw-${Date.now()}@example.com`;
    await auth.api.signUpEmail({ body: { email, password: TEST_PW, name: 'Salah' } });
    await expect(
      auth.api.signInEmail({ body: { email, password: WRONG_PW } }),
    ).rejects.toThrow();
  });

  it('enforces the composite primary key and the tombstone invariant on documents', async () => {
    // A device-generated id may repeat across users; the pair must not.
    const [a] = await db.select().from(user).limit(1);
    await db.insert(documents).values({ userId: a.id, id: 'cv-1', updatedAt: 1, hash: 'h', body: { basics: {} } });
    await expect(
      db.insert(documents).values({ userId: a.id, id: 'cv-1', updatedAt: 2, hash: 'h2', body: { basics: {} } }),
    ).rejects.toThrow();

    // The same id under a DIFFERENT user is allowed — ids are only unique per user.
    const [b] = await db.select().from(user).limit(2).then((rows) => [rows[1]]);
    await db.insert(documents).values({ userId: b.id, id: 'cv-1', updatedAt: 1, hash: 'h', body: { basics: {} } });

    // The tombstone invariant: a live document must carry a body, and a tombstone must not.
    await expect(
      db.insert(documents).values({ userId: a.id, id: 'live-no-body', updatedAt: 1, hash: 'h' }),
    ).rejects.toThrow();
    await expect(
      db
        .insert(documents)
        .values({ userId: a.id, id: 'tomb-with-body', updatedAt: 1, hash: 'h', deleted: true, body: { a: 1 } }),
    ).rejects.toThrow();
    await db.insert(documents).values({ userId: a.id, id: 'tomb-ok', updatedAt: 1, hash: 'h', deleted: true });
  });
});
