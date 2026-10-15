import { toNextJsHandler } from 'better-auth/next-js';
import { getAuth } from '@/lib/sync/auth';

/**
 * Better Auth's catch-all endpoint (sign-up, sign-in, session, sign-out, and future
 * password-reset flows).
 *
 * When sync is not configured the route answers 503 instead of throwing, so a deployment
 * without a database still builds and serves every other page normally.
 *
 * All five verbs are forwarded: `toNextJsHandler` returns GET/POST/PATCH/PUT/DELETE and
 * Better Auth uses more than GET and POST, so exporting only those two silently breaks
 * flows such as sign-out.
 */
export const runtime = 'nodejs';

const unavailable = () =>
  Response.json({ success: false, error: 'Sinkronisasi cloud belum dikonfigurasi di server ini.' }, { status: 503 });

type Handler = (request: Request) => Promise<Response>;

/** Resolves the handler per request, or the 503 responder when sync is switched off. */
function handlerFor(method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'): Handler {
  return async (request: Request) => {
    const auth = getAuth();
    if (!auth) return unavailable();
    return toNextJsHandler(auth)[method](request);
  };
}

export const GET = handlerFor('GET');
export const POST = handlerFor('POST');
export const PATCH = handlerFor('PATCH');
export const PUT = handlerFor('PUT');
export const DELETE = handlerFor('DELETE');
