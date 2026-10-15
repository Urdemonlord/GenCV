import { getAuth } from '@/lib/sync/auth';
import { getDb } from '@/lib/sync/db';
import { applyUpserts, listRecords, readFor, type Upsert } from '@/lib/sync/server';
import type { SyncRecord } from '@/lib/sync/merge';

/**
 * One sync round.
 *
 * `POST { upserts?: Upsert[], want?: string[] }` → `{ records, documents }`:
 *   - `upserts` are this device's writes, each accepted only if it wins the total order;
 *   - `records` is every document the caller owns, metadata only, which the client feeds to
 *     `planMerge` to decide the next round;
 *   - `want` names the ids whose bodies the client is missing, so the metadata phase carries
 *     no bodies and a round with nothing new transfers nothing.
 *
 * `GET` returns the caller's metadata only — for debugging and a future read-only check.
 *
 * Sync is off unless the environment configures it; then this answers 503, like `/api/auth`.
 */
export const runtime = 'nodejs';

const MAX_UPSERTS = 200;
const MAX_WANT = 500;
const MAX_BODY_BYTES = 512 * 1024;

const unavailable = () =>
  Response.json({ success: false, error: 'Sinkronisasi cloud belum dikonfigurasi di server ini.' }, { status: 503 });

const badRequest = (error: string) => Response.json({ success: false, error }, { status: 400 });

/** Validates a client-supplied record. Anything off-shape is rejected, never coerced. */
function parseRecord(value: unknown): SyncRecord | null {
  if (typeof value !== 'object' || value === null) return null;
  const { id, updatedAt, deleted, hash } = value as Record<string, unknown>;

  if (typeof id !== 'string' || id.length === 0 || id.length > 128) return null;
  // `Date.now()` is ~1.7e12; anything beyond the ECMAScript date range is a clock bug, or an
  // attempt to win every future conflict by writing a maximum timestamp.
  if (typeof updatedAt !== 'number' || !Number.isInteger(updatedAt) || updatedAt < 0 || updatedAt > 8.64e15) return null;
  if (typeof deleted !== 'boolean') return null;
  if (typeof hash !== 'string' || hash.length === 0 || hash.length > 64) return null;

  return { id, updatedAt, deleted, hash };
}

interface ParsedRequest {
  upserts: Upsert[];
  want: string[];
}

function parseRequest(value: unknown): ParsedRequest | string {
  if (typeof value !== 'object' || value === null) return 'Body harus berupa objek JSON.';
  const { upserts, want } = value as Record<string, unknown>;

  const parsedUpserts: Upsert[] = [];
  if (upserts !== undefined) {
    if (!Array.isArray(upserts)) return 'Field `upserts` harus berupa array.';
    if (upserts.length > MAX_UPSERTS) return `Terlalu banyak upsert (maks ${MAX_UPSERTS}).`;
    for (const entry of upserts) {
      const record = parseRecord(entry);
      if (!record) return 'Ada record dengan bentuk tidak valid.';
      const body = (entry as Record<string, unknown>).body ?? null;
      // The tombstone invariant, checked before the database check constraint is reached: a
      // live document needs a body and a tombstone must not have one. A 400 with a clear
      // message beats a constraint violation the client cannot interpret.
      if (record.deleted !== (body === null)) return 'Record dan body tidak konsisten (invarian tombstone).';
      parsedUpserts.push({ ...record, body });
    }
  }

  const parsedWant: string[] = [];
  if (want !== undefined) {
    if (!Array.isArray(want)) return 'Field `want` harus berupa array.';
    if (want.length > MAX_WANT) return `Terlalu banyak id di \`want\` (maks ${MAX_WANT}).`;
    for (const id of want) {
      if (typeof id !== 'string' || id.length === 0 || id.length > 128) return 'Field `want` memuat id tidak valid.';
      parsedWant.push(id);
    }
  }

  return { upserts: parsedUpserts, want: parsedWant };
}

/** Resolves the authenticated user, or a ready-made response to return instead. */
async function authenticate(request: Request) {
  const auth = getAuth();
  const db = getDb();
  if (!auth || !db) return { response: unavailable() } as const;

  const session = await auth.api.getSession({ headers: request.headers });
  const userId = session?.user.id;
  if (!userId) return { response: Response.json({ success: false, error: 'Perlu masuk dulu.' }, { status: 401 }) } as const;

  return { db, userId } as const;
}

export async function POST(request: Request) {
  const session = await authenticate(request);
  if ('response' in session) return session.response;
  const { db, userId } = session;

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return badRequest('Body bukan JSON yang valid.');
  }

  const parsed = parseRequest(raw);
  if (typeof parsed === 'string') return badRequest(parsed);
  const { upserts, want } = parsed;

  for (const upsert of upserts) {
    const encoded = upsert.body === null ? null : JSON.stringify(upsert.body);
    if (encoded !== null && encoded.length > MAX_BODY_BYTES) {
      return Response.json({ success: false, error: 'Isi CV terlalu besar.' }, { status: 413 });
    }
  }

  await applyUpserts(db, userId, upserts);
  const outcome = await readFor(db, userId, want);
  return Response.json({ success: true, ...outcome });
}

export async function GET(request: Request) {
  const session = await authenticate(request);
  if ('response' in session) return session.response;

  const records = await listRecords(session.db, session.userId);
  return Response.json({ success: true, records });
}
