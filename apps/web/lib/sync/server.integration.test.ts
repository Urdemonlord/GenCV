import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { applyUpserts, listRecords, readFor, type Upsert } from './server';
import { assertThrowawayDatabase } from './test-database';
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

const upsert = (id: string, updatedAt: number, body: unknown | null, hash = 'h'): Upsert => ({
  id,
  updatedAt,
  deleted: body === null,
  hash,
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
    await pool.query('drop table if exists documents, session, account, verification, "user" cascade');
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

  it('stores a document and reads its record back', async () => {
    await applyUpserts(db, alice.id, [upsert('cv-1', 1000, { title: 'Satu' })]);

    const records = await listRecords(db, alice.id);
    expect(records).toEqual([{ id: 'cv-1', updatedAt: 1000, deleted: false, hash: 'h' }]);
  });

  it('keeps the winner and refuses the older write', async () => {
    await applyUpserts(db, alice.id, [upsert('cv-2', 2000, { title: 'Baru' }, 'newer')]);
    // An older record must not roll the document back — this is the rule that keeps two
    // concurrent devices from clobbering each other.
    await applyUpserts(db, alice.id, [upsert('cv-2', 1000, { title: 'Lama' }, 'older')]);

    const records = await listRecords(db, alice.id);
    const record = records.find((r) => r.id === 'cv-2');
    expect(record).toMatchObject({ updatedAt: 2000, hash: 'newer' });

    const outcome = await readFor(db, alice.id, ['cv-2']);
    expect(outcome.documents[0].body).toEqual({ title: 'Baru' });
  });

  it('accepts a win on the hash tie-break, so the devices agree', async () => {
    // Same clock: the larger hash wins. If the server used `!==` here instead, both devices
    // would consider themselves the winner and the round would never converge.
    await applyUpserts(db, alice.id, [upsert('cv-3', 3000, { v: 'x' }, 'aaaa')]);
    await applyUpserts(db, alice.id, [upsert('cv-3', 3000, { v: 'y' }, 'bbbb')]);

    const outcome = await readFor(db, alice.id, ['cv-3']);
    expect(outcome.documents[0].hash).toBe('bbbb');
  });

  it('refuses the smaller hash, so the same tie does not flip back', async () => {
    await applyUpserts(db, alice.id, [upsert('cv-4', 4000, { v: 'y' }, 'bbbb')]);
    await applyUpserts(db, alice.id, [upsert('cv-4', 4000, { v: 'x' }, 'aaaa')]);

    const outcome = await readFor(db, alice.id, ['cv-4']);
    expect(outcome.documents[0].hash).toBe('bbbb');
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
    expect(bobs.documents[0].body).toEqual({ title: 'Milik Bob' });

    const alices = await readFor(db, alice.id, ['bob-secret']);
    expect(alices.documents[0].body).toEqual({ title: 'Bukan milik Bob' });
  });

  it('allows the same document id for two users', async () => {
    await applyUpserts(db, alice.id, [upsert('shared-id', 9000, { who: 'alice' })]);
    await applyUpserts(db, bob.id, [upsert('shared-id', 9000, { who: 'bob' })]);

    expect((await readFor(db, alice.id, ['shared-id'])).documents[0].body).toEqual({ who: 'alice' });
    expect((await readFor(db, bob.id, ['shared-id'])).documents[0].body).toEqual({ who: 'bob' });
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

  it('leaves documents untouched when `want` is empty', async () => {
    const before = await listRecords(db, bob.id);
    const outcome = await readFor(db, bob.id, []);
    expect(outcome.documents).toEqual([]);
    expect(outcome.records).toEqual(before);
  });
});