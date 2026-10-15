import { and, eq, inArray } from 'drizzle-orm';
import type { Database } from './db';
import { winsOver, type SyncRecord } from './merge';
import { documents } from './schema';

/**
 * The server half of the sync protocol, kept out of the route so it can be tested against a
 * real Postgres without going through HTTP.
 *
 * The server owns exactly one rule: a write is accepted only if it wins the total order
 * (`winsOver`). It never decides *what* to transfer — that is the client's job (`planMerge`),
 * because only the client knows what its device holds. Putting merge logic in both places
 * would be two chances to disagree, and a disagreement here is a round that never converges.
 *
 * That is also why the rule is *not* re-expressed as a SQL `WHERE` in the upsert: a second
 * copy of the comparison in a second language is exactly the drift this design avoids.
 *
 * Every statement is scoped to `userId`. The composite primary key on `documents` is *not*
 * authorization — it only prevents a duplicate `(user_id, id)` pair — so without this scope a
 * caller could read or overwrite another user's CV by naming their `user_id`.
 */

export interface Upsert {
  id: string;
  updatedAt: number;
  deleted: boolean;
  hash: string;
  body: unknown | null;
}

export interface SyncOutcome {
  /** Every document the caller owns, metadata only. Feeds the client's `planMerge`. */
  records: SyncRecord[];
  /** Bodies for the ids the client asked for, and only for ids it actually owns. */
  documents: (SyncRecord & { body: unknown | null })[];
}

/** The four metadata columns. Selecting `body` for a metadata reply drags every JSONB out. */
const META = {
  id: documents.id,
  updatedAt: documents.updatedAt,
  deleted: documents.deleted,
  hash: documents.hash,
};

const toRecord = (row: SyncRecord): SyncRecord => ({
  id: row.id,
  updatedAt: row.updatedAt,
  deleted: row.deleted,
  hash: row.hash,
});

/**
 * Metadata for everything this user owns.
 *
 * Projected to the metadata columns on purpose: selecting the whole row would pull every JSONB
 * body out of Postgres to be discarded, on the request the client makes most often.
 */
export async function listRecords(db: Database, userId: string): Promise<SyncRecord[]> {
  const rows = await db.select(META).from(documents).where(eq(documents.userId, userId));
  return rows.map(toRecord);
}

/** Reads one document's metadata under a row lock, or `null` when it does not exist. */
async function lockOne(tx: Database, userId: string, id: string): Promise<SyncRecord | null> {
  const rows = await tx
    .select(META)
    .from(documents)
    .where(and(eq(documents.userId, userId), eq(documents.id, id)))
    .for('update');
  return rows[0] ? toRecord(rows[0]) : null;
}

/**
 * Applies the client's writes, each accepted only if it wins the total order.
 *
 * Each document is handled in its own transaction so the check and the write cannot be
 * separated by a concurrent round, while unrelated documents stay independent — locking the
 * whole user would serialise every write they make.
 *
 * The insert path is deliberately not a plain insert: `for('update')` locks nothing when the
 * row does not exist yet, so two rounds can both see "absent" and then race to insert the same
 * `(user_id, id)`. `onConflictDoNothing` let Postgres settle that race (it waits for the other
 * transaction), and a conflict is then re-read under a lock so the normal rule decides.
 */
export async function applyUpserts(db: Database, userId: string, upserts: Upsert[]): Promise<void> {
  for (const upsert of upserts) {
    await db.transaction(async (tx) => {
      const values = {
        userId,
        id: upsert.id,
        updatedAt: upsert.updatedAt,
        deleted: upsert.deleted,
        hash: upsert.hash,
        body: upsert.body,
      };

      const existing = await lockOne(tx, userId, upsert.id);
      if (existing) {
        // Same rule the client used, so both sides always reach the same verdict.
        if (!winsOver(upsert, toRecord(existing))) return;
        await tx
          .update(documents)
          .set(values)
          .where(and(eq(documents.userId, userId), eq(documents.id, upsert.id)));
        return;
      }

      const inserted = await tx.insert(documents).values(values).onConflictDoNothing().returning({ id: documents.id });
      if (inserted.length > 0) return;

      // Another round inserted the same document first. Re-read it under a lock and let the
      // ordinary rule decide, rather than overwriting a row we never looked at.
      const current = await lockOne(tx, userId, upsert.id);
      if (current && !winsOver(upsert, toRecord(current))) return;
      await tx
        .update(documents)
        .set(values)
        .where(and(eq(documents.userId, userId), eq(documents.id, upsert.id)));
    });
  }
}

/**
 * Metadata for everything the user owns, plus bodies for `want`.
 *
 * `want` is resolved with one scoped query rather than by filtering a full read: the bodies of
 * documents the client did not ask for are never loaded. Ids the user does not own simply do
 * not come back — never borrowed from another user.
 */
export async function readFor(db: Database, userId: string, want: string[]): Promise<SyncOutcome> {
  const records = await listRecords(db, userId);

  const bodies = new Map<string, unknown | null>();
  if (want.length > 0) {
    const rows = await db
      .select({ ...META, body: documents.body })
      .from(documents)
      .where(and(eq(documents.userId, userId), inArray(documents.id, want)));
    for (const row of rows) bodies.set(row.id, row.body ?? null);
  }

  return {
    records,
    documents: records
      .filter((record) => bodies.has(record.id))
      .map((record) => ({ ...record, body: bodies.get(record.id) ?? null })),
  };
}
