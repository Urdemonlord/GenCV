import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { DATABASE_URL_ENV, isSyncConfigured } from './config';

/**
 * Lazy Postgres connection. Nothing connects at import time: the app must build and run
 * with sync switched off, and a module-load connection would also break `next build`.
 *
 * The pool is cached on `globalThis` so Next.js hot reload does not open a new pool per
 * edit — the usual way dev servers run out of connections.
 */

export type Database = NodePgDatabase<typeof schema>;

const globalForDb = globalThis as unknown as { gencvPool?: Pool; gencvDb?: Database };

export function getDb(): Database | null {
  if (!isSyncConfigured()) return null;

  if (!globalForDb.gencvPool) {
    const pool = new Pool({
      connectionString: process.env[DATABASE_URL_ENV],
      // Serverless: keep the pool tiny, and let the platform close idle sockets.
      max: 3,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
    });
    // A pool-level error must not take the process down; the next query reconnects.
    pool.on('error', (error) => console.error('Postgres pool error', { message: error.message }));
    globalForDb.gencvPool = pool;
  }

  if (!globalForDb.gencvDb) {
    globalForDb.gencvDb = drizzle(globalForDb.gencvPool, { schema });
  }
  return globalForDb.gencvDb;
}

/** Closes the pool. Used by tests and scripts so the process can exit cleanly. */
export async function closeDb(): Promise<void> {
  const pool = globalForDb.gencvPool;
  globalForDb.gencvPool = undefined;
  globalForDb.gencvDb = undefined;
  if (pool) await pool.end();
}
