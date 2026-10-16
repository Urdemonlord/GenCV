/**
 * Indonesian labels for what the auth and sync endpoints report.
 *
 * Kept as pure functions in a module with no JSX and no imports so they can be unit-tested
 * without a browser, a server, or a database. The UI components stay thin: they call these and
 * render the result, instead of growing their own copy of the wording.
 */

/** What a Better Fetch error carries, without importing its types into the UI layer. */
export interface AuthErrorLike {
  message?: string;
  status?: number;
}

/** The two things the sign-in form can be doing. */
export type AuthMode = 'masuk' | 'daftar';

/**
 * Turns an auth failure into something a user can act on.
 *
 * Matching is on the message text because that is all Better Auth guarantees across versions;
 * status alone cannot tell "wrong password" from "email already taken". The fallback is
 * deliberately generic rather than technical — a raw English stack message is worse than
 * "Coba lagi".
 */
export function authErrorMessage(error: AuthErrorLike | null | undefined, mode: AuthMode): string {
  if (!error) return 'Terjadi kesalahan. Coba lagi.';

  if (error.status === 503) return 'Sinkronisasi cloud belum diaktifkan di server ini.';

  const text = (error.message ?? '').toLowerCase();

  if (text.includes('already exists') || text.includes('already registered')) {
    return 'Email ini sudah terdaftar. Coba masuk.';
  }
  if (text.includes('password') && (text.includes('short') || text.includes('at least'))) {
    return 'Password minimal 8 karakter.';
  }
  // Before the email-format check, deliberately: "invalid email or password" *contains* "invalid
  // email", so the other order would tell every failed sign-in that their address is malformed.
  if (text.includes('invalid email or password') || text.includes('invalid credentials')) {
    return mode === 'masuk' ? 'Email atau password salah.' : 'Email dan password tidak bisa dipakai.';
  }
  if (text.includes('invalid email') || text.includes('email is not valid')) {
    return 'Format email tidak sah.';
  }

  return 'Terjadi kesalahan. Coba lagi.';
}

/** What the sync panel says about the most recent round. */
export type SyncReason = 'offline' | 'unauthenticated' | 'error' | 'local-data-unreadable';

/**
 * A short label for a finished round.
 *
 * `unauthenticated` is separated from the other failures because it needs a different action
 * from the user (sign in again) — showing it as a generic error would leave them stuck.
 */
export function syncStatusLabel(
  result: { ok: true; uploaded: number; downloaded: number } | { ok: false; reason: SyncReason },
): string {
  if (result.ok) {
    if (result.uploaded === 0 && result.downloaded === 0) return 'Sudah sinkron — tidak ada perubahan.';
    const parts: string[] = [];
    if (result.uploaded > 0) parts.push(`${result.uploaded} dikirim`);
    if (result.downloaded > 0) parts.push(`${result.downloaded} diterima`);
    return `Selesai: ${parts.join(', ')}.`;
  }

  switch (result.reason) {
    case 'offline':
      return 'Tidak ada koneksi ke server sinkronisasi.';
    case 'unauthenticated':
      return 'Sesi masuk sudah berakhir. Masuk lagi untuk melanjutkan.';
    case 'local-data-unreadable':
      return 'Data sinkronisasi di perangkat ini tidak bisa dibaca, jadi sinkronisasi dihentikan.';
    default:
      return 'Sinkronisasi gagal. Coba lagi.';
  }
}
