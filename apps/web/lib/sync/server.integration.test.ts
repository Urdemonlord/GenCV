import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { applyUpserts, listRecords, readFor, type Upsert } from './server';
import { assertThrowawayDatabase } from './test-database';
import { hashText, winsOver } from './merge';
import { normalizeCV } from '@/lib/cv/normalize';
import type { Database } from './db';
import * as schema from './schema';
import { documents, user } from './schema';

/**
 * Integration tests for the server half of sync, against a real Postgres.
 *
 * The two things that must be exercised for real: the total order is enforced *in SQL* (a
 * unit test on `winsOver` cannot show that a concurrent round is kept out), and every query is
 * scoped to one user (the composite primary key is not authorization).
 *
 * Skipped unless `TEST_DATABASE_URL` points at a throwaway database, so CI (which has no
 * Postgres) stays green. See the header of `auth.integration.test.ts` for the setup command.
 */
const url = process.env.TEST_DATABASE_URL;

const mkUser = (tag: string) => ({
  id: `sync-user-${tag}-${Date.now()}`,
  name: tag,
  email: `sync-${tag}-${Date.now()}@example.com`,
  emailVerified: false,
  createdAt: new Date(),
  updatedAt: new Date(),
});

/** The body as the server will store it; the stored hash is derived from exactly this. */
const norm = (body: unknown) => normalizeCV(body) as unknown;

/** The hash the server derives for a body. */
const hashOf = (body: unknown) => hashText(JSON.stringify(norm(body)));

/**
 * A client write. `hash` defaults to the hash of the normalised body, which is what a real
 * client sends — the server recomputes it anyway and only uses its own value.
 */
const upsert = (id: string, updatedAt: number, body: unknown | null, hash?: string): Upsert => ({
  id,
  updatedAt,
  deleted: body === null,
  hash: hash ?? (body === null ? 'tombstone' : hashOf(body)),
  body,
});

describe.skipIf(!url)('sync server (integration)', () => {
  let pool: Pool;
  let db: Database;
  let alice: { id: string };
  let bob: { id: string };

  beforeAll(async () => {
    assertThrowawayDatabase(url!);
    pool = new Pool({ connectionString: url });
    await pool.query('drop table if exists credit_payments, ai_credits, documents, session, account, verification, "user" cascade');
    const dir = join(__dirname, 'migrations');
    const sql = readdirSync(dir)
      .filter((f) => f.endsWith('.sql'))
      .sort()
      .map((f) => readFileSync(join(dir, f), 'utf8'))
      .join('\n');
    await pool.query(sql);

    db = drizzle(pool, { schema }) as unknown as Database;
    const a = mkUser('alice');
    const b = mkUser('bob');
    await db.insert(user).values([a, b]);
    alice = a;
    bob = b;
  });

  afterAll(async () => {
    await pool?.end();
  });

  it('stores a document and reads its record back, with the hash it derived', async () => {
    const body = { title: 'Satu' };
    await applyUpserts(db, alice.id, [upsert('cv-1', 1000, body)]);

    const records = await listRecords(db, alice.id);
    // The hash is computed from the *stored* (normalised) body, not from what the client sent.
    expect(records).toEqual([{ id: 'cv-1', updatedAt: 1000, deleted: false, hash: hashOf(body) }]);
  });

  it('keeps the winner and refuses the older write', async () => {
    await applyUpserts(db, alice.id, [upsert('cv-2', 2000, { title: 'Baru' }, 'newer')]);
    // An older record must not roll the document back — this is the rule that keeps two
    // concurrent devices from clobbering each other.
    await applyUpserts(db, alice.id, [upsert('cv-2', 1000, { title: 'Lama' }, 'older')]);

    const records = await listRecords(db, alice.id);
    const record = records.find((r) => r.id === 'cv-2');
    expect(record).toMatchObject({ updatedAt: 2000, hash: hashOf({ title: 'Baru' }) });

    const outcome = await readFor(db, alice.id, ['cv-2']);
    expect(outcome.documents[0].body).toEqual(norm({ title: 'Baru' }));
  });

  it('resolves a same-timestamp tie to one winner, the same one either way', async () => {
    // Both bodies share a timestamp, so the larger derived hash decides. The order the two
    // writes arrive in must not change the outcome — otherwise two devices would each keep
    // their own copy and the round would ping-pong forever.
    const bodyX = { title: 'Versi X' };
    const bodyY = { title: 'Versi Y' };
    const winner = winsOver(
      { id: 'cv-3', updatedAt: 3000, deleted: false, hash: hashOf(bodyX) },
      { id: 'cv-3', updatedAt: 3000, deleted: false, hash: hashOf(bodyY) },
    )
      ? bodyX
      : bodyY;

    // The fixtures must really differ after normalisation, or this proves nothing.
    expect(hashOf(bodyX)).not.toBe(hashOf(bodyY));

    await applyUpserts(db, alice.id, [upsert('cv-3', 3000, bodyX)]);
    await applyUpserts(db, alice.id, [upsert('cv-3', 3000, bodyY)]);

    const outcome = await readFor(db, alice.id, ['cv-3']);
    expect(outcome.documents[0].body).toEqual(norm(winner));

    // The loser arriving first must produce the same result.
    await applyUpserts(db, alice.id, [upsert('cv-6', 6000, bodyY)]);
    await applyUpserts(db, alice.id, [upsert('cv-6', 6000, bodyX)]);
    const other = await readFor(db, alice.id, ['cv-6']);
    expect(other.documents[0].body).toEqual(norm(winner === bodyX ? bodyX : bodyY));
  });

  it('refuses a write that loses the tie, so the same tie does not flip back', async () => {
    const bodyX = { title: 'Versi X' };
    const bodyY = { title: 'Versi Y' };
    const xFirst = winsOver(
      { id: 'x', updatedAt: 1, deleted: false, hash: hashOf(bodyX) },
      { id: 'x', updatedAt: 1, deleted: false, hash: hashOf(bodyY) },
    );
    const winner = xFirst ? bodyX : bodyY;
    const loser = xFirst ? bodyY : bodyX;

    await applyUpserts(db, alice.id, [upsert('cv-7', 7000, winner)]);
    await applyUpserts(db, alice.id, [upsert('cv-7', 7000, loser)]);

    const outcome = await readFor(db, alice.id, ['cv-7']);
    expect(outcome.documents[0].body).toEqual(norm(winner));
  });

  it('stores a deletion as a tombstone with no body', async () => {
    await applyUpserts(db, alice.id, [upsert('cv-5', 5000, { title: 'Hidup' })]);
    await applyUpserts(db, alice.id, [upsert('cv-5', 6000, null)]);

    const outcome = await readFor(db, alice.id, ['cv-5']);
    expect(outcome.documents[0]).toMatchObject({ deleted: true, body: null });
  });

  it('never returns another user\'s document, even when its id is requested', async () => {
    // The composite primary key only prevents a duplicate (user_id, id) pair — it is not
    // authorization. Without the scope in every query, this would hand Bob's CV to Alice.
    await applyUpserts(db, bob.id, [upsert('bob-secret', 7000, { title: 'Milik Bob' })]);

    const outcome = await readFor(db, alice.id, ['bob-secret']);
    expect(outcome.documents).toEqual([]);
    expect(outcome.records.map((r) => r.id)).not.toContain('bob-secret');
  });

  it('does not let one user overwrite another user\'s document', async () => {
    // Same id, different owner: Alice writing `bob-secret` must create HER row, not edit his.
    await applyUpserts(db, alice.id, [upsert('bob-secret', 8000, { title: 'Bukan milik Bob' })]);

    const bobs = await readFor(db, bob.id, ['bob-secret']);
    expect(bobs.documents).toHaveLength(1);
    expect(bobs.documents[0].body).toEqual(norm({ title: 'Milik Bob' }));

    const alices = await readFor(db, alice.id, ['bob-secret']);
    expect(alices.documents[0].body).toEqual(norm({ title: 'Bukan milik Bob' }));
  });

  it('allows the same document id for two users', async () => {
    await applyUpserts(db, alice.id, [upsert('shared-id', 9000, { who: 'alice' })]);
    await applyUpserts(db, bob.id, [upsert('shared-id', 9000, { who: 'bob' })]);

    expect((await readFor(db, alice.id, ['shared-id'])).documents[0].body).toEqual(norm({ who: 'alice' }));
    expect((await readFor(db, bob.id, ['shared-id'])).documents[0].body).toEqual(norm({ who: 'bob' }));
  });

  it('rejects a live document with no body at the database level', async () => {
    // The route checks this too, but the constraint is the guarantee: a half-written
    // tombstone would sync as a live document with no content.
    await expect(
      pool.query('insert into documents (user_id, id, updated_at, deleted, hash) values ($1, $2, $3, false, $4)', [
        alice.id,
        'no-body',
        1000,
        'h',
      ]),
    ).rejects.toThrow();
  });

  it('rejects a tombstone that still carries a body', async () => {
    await expect(
      pool.query(
        'insert into documents (user_id, id, updated_at, deleted, hash, body) values ($1, $2, $3, true, $4, $5)',
        [alice.id, 'with-body', 1000, 'h', JSON.stringify({ a: 1 })],
      ),
    ).rejects.toThrow();
  });

  it('derives the hash from the body instead of trusting the client', async () => {
    // A client-supplied hash that does not describe its own body would make the two sides
    // disagree forever: the client hashes the stored (normalised) body, so an unchecked hash
    // never matches and the same document is transferred on every round.
    const body = { personalInfo: { fullName: 'Kanoni' } };
    await applyUpserts(db, alice.id, [
      { id: 'canon', updatedAt: 11_000, deleted: false, hash: 'z', body },
    ]);

    const outcome = await readFor(db, alice.id, ['canon']);
    const stored = outcome.records.find((r) => r.id === 'canon');
    // The bogus hash is discarded and replaced by one derived from the normalised body — the
    // same value the client will compute for it, which is what lets the round converge.
    expect(stored!.hash).not.toBe('z');
    expect(stored!.hash).toBe(hashOf(body));
    expect(outcome.documents[0].body).toEqual(norm(body));
  });

  it('leaves documents untouched when `want` is empty', async () => {
    const before = await listRecords(db, bob.id);
    const outcome = await readFor(db, bob.id, []);
    expect(outcome.documents).toEqual([]);
    expect(outcome.records).toEqual(before);
  });
});