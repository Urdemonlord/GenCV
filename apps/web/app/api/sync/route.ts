import { getAuth } from '@/lib/sync/auth';
import { getDb } from '@/lib/sync/db';
import { applyUpserts, listRecords, readFor, type Upsert } from '@/lib/sync/server';
import { isRecordLike, RECORD_LIMITS } from '@/lib/sync/merge';

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
/** Per CV. A CV is text; half a megabyte is already far past anything reasonable. */
const MAX_BODY_BYTES = 512 * 1024;
/** Whole request. 200 upserts at the per-body cap would otherwise be ~100 MiB. */
const MAX_REQUEST_BYTES = 4 * 1024 * 1024;
/** How far ahead of server time a client may claim to be, for clock skew between devices. */
const MAX_CLOCK_SKEW_MS = 24 * 60 * 60 * 1000;

const unavailable = () =>
  Response.json({ success: false, error: 'Sinkronisasi cloud belum dikonfigurasi di server ini.' }, { status: 503 });

const badRequest = (error: string) => Response.json({ success: false, error }, { status: 400 });

const tooLarge = (error: string) => Response.json({ success: false, error }, { status: 413 });

interface ParsedRequest {
  upserts: Upsert[];
  want: string[];
}

/** JSON digits are ASCII, so a string length is a safe upper bound on its UTF-8 byte count. */
const bytesOf = (text: string) => Buffer.byteLength(text, 'utf8');

function parseRequest(value: unknown, now: number): ParsedRequest | string {
  if (typeof value !== 'object' || value === null) return 'Body harus berupa objek JSON.';
  const { upserts, want } = value as Record<string, unknown>;

  const parsedUpserts: Upsert[] = [];
  if (upserts !== undefined) {
    if (!Array.isArray(upserts)) return 'Field `upserts` harus berupa array.';
    if (upserts.length > MAX_UPSERTS) return `Terlalu banyak upsert (maks ${MAX_UPSERTS}).`;
    for (const entry of upserts) {
      if (!isRecordLike(entry)) return 'Ada record dengan bentuk tidak valid.';
      // `Date.now()` is ~1.7e12. Accepting the far future would let one write win every
      // conflict forever and make the document uneditable through sync, so only a plausible
      // clock skew is allowed.
      if (entry.updatedAt > now + MAX_CLOCK_SKEW_MS) return 'Timestamp record terlalu jauh di masa depan.';

      const body = (entry as unknown as Record<string, unknown>).body ?? null;
      // The tombstone invariant, checked before the database constraint is reached: a live
      // document needs a body and a tombstone must not have one. A 400 with a clear message
      // beats a constraint violation the client cannot interpret.
      if (entry.deleted !== (body === null)) return 'Record dan body tidak konsisten (invarian tombstone).';
      parsedUpserts.push({ ...entry, body });
    }
  }

  const parsedWant: string[] = [];
  if (want !== undefined) {
    if (!Array.isArray(want)) return 'Field `want` harus berupa array.';
    if (want.length > MAX_WANT) return `Terlalu banyak id di \`want\` (maks ${MAX_WANT}).`;
    for (const id of want) {
      if (typeof id !== 'string' || id.length === 0 || id.length > RECORD_LIMITS.idLength) {
        return 'Field `want` memuat id tidak valid.';
      }
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

  // Read as text and measure the bytes before parsing. Measuring the raw body is the only way
  // to refuse an oversized request *before* paying to parse it; a per-document cap alone would
  // let a hundred 100 MiB requests through the JSON parser first.
  let text: string;
  try {
    text = await request.text();
  } catch {
    return badRequest('Body tidak bisa dibaca.');
  }
  if (bytesOf(text) > MAX_REQUEST_BYTES) return tooLarge('Permintaan sinkronisasi terlalu besar.');

  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return badRequest('Body bukan JSON yang valid.');
  }

  const parsed = parseRequest(raw, Date.now());
  if (typeof parsed === 'string') return badRequest(parsed);
  const { upserts, want } = parsed;

  for (const upsert of upserts) {
    // Byte length, not `String.length`: that counts UTF-16 code units, so a CV full of
    // non-ASCII text would pass a 512 KiB check while being several times larger in bytes.
    const encoded = upsert.body === null ? null : JSON.stringify(upsert.body);
    if (encoded !== null && bytesOf(encoded) > MAX_BODY_BYTES) return tooLarge('Isi CV terlalu besar.');
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
