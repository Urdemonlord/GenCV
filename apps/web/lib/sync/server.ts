import { and, eq } from 'drizzle-orm';
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

type Row = typeof documents.$inferSelect;

const toRecord = (row: Row): SyncRecord => ({
  id: row.id,
  updatedAt: row.updatedAt,
  deleted: row.deleted,
  hash: row.hash,
});

/** Metadata for everything this user owns. Bodies stay behind unless explicitly asked for. */
export async function listRecords(db: Database, userId: string): Promise<SyncRecord[]> {
  const rows = await db.select().from(documents).where(eq(documents.userId, userId));
  return rows.map(toRecord);
}

/**
 * Applies the client's writes, each accepted only if it wins the total order.
 *
 * The check and the write happen inside one transaction that takes a row lock, so two rounds
 * syncing at once cannot both read the old row and then both write. Locking the *table* would
 * serialise every user against every other user, so the lock is taken per document.
 */
export async function applyUpserts(db: Database, userId: string, upserts: Upsert[]): Promise<void> {
  for (const upsert of upserts) {
    await db.transaction(async (tx) => {
      const locked = await tx
        .select()
        .from(documents)
        .where(eq(documents.userId, userId))
        .for('update');
      const current = locked.find((row) => row.id === upsert.id) ?? null;

      // Same rule the client used, so both sides always reach the same verdict.
      if (current && !winsOver(upsert, toRecord(current))) return;

      const values = {
        userId,
        id: upsert.id,
        updatedAt: upsert.updatedAt,
        deleted: upsert.deleted,
        hash: upsert.hash,
        body: upsert.body,
      };

      if (current) {
        await tx
          .update(documents)
          .set(values)
          .where(and(eq(documents.userId, userId), eq(documents.id, upsert.id)));
      } else {
        await tx.insert(documents).values(values);
      }
    });
  }
}

/**
 * Metadata for everything the user owns plus bodies for `want`, restricted to ids the user
 * actually owns — a missing id is simply absent, never borrowed from another user.
 */
export async function readFor(db: Database, userId: string, want: string[]): Promise<SyncOutcome> {
  const rows = await db.select().from(documents).where(eq(documents.userId, userId));
  const byId = new Map(rows.map((row) => [row.id, row]));

  return {
    records: rows.map(toRecord),
    documents: want
      .map((id) => byId.get(id))
      .filter((row): row is Row => row !== undefined)
      .map((row) => ({ ...toRecord(row), body: row.body })),
  };
}
