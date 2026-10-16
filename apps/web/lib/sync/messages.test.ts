import { describe, expect, it } from 'vitest';
import { authErrorMessage, syncStatusLabel, type AuthMode } from './messages';

describe('authErrorMessage', () => {
  it('tells an existing account apart from a wrong password', () => {
    // The two need different advice: "sign in instead" versus "try again". Better Auth only
    // guarantees the message text, so that is what is matched.
    expect(authErrorMessage({ message: 'User already exists' }, 'daftar')).toBe('Email ini sudah terdaftar. Coba masuk.');
    expect(authErrorMessage({ message: 'Invalid email or password' }, 'masuk')).toBe('Email atau password salah.');
  });

  it('separates an unconfigured server from a user mistake', () => {
    // 503 is this deployment's fact, not something the user did; telling them their password is
    // wrong would send them round in circles.
    expect(authErrorMessage({ message: 'anything', status: 503 }, 'masuk')).toContain('belum diaktifkan');
  });

  it('says the password is too short rather than blaming the credentials', () => {
    expect(authErrorMessage({ message: 'Password too short' }, 'daftar')).toBe('Password minimal 8 karakter.');
  });

  it('falls back to a plain sentence instead of leaking a raw message', () => {
    // A stack-shaped English string in the UI is worse than admitting the error is unknown.
    const out = authErrorMessage({ message: 'FETCH_ERROR: unexpected token at 0x1f' }, 'masuk');
    expect(out).toBe('Terjadi kesalahan. Coba lagi.');
    expect(out).not.toContain('0x1f');
  });

  it('handles a missing error object', () => {
    for (const mode of ['masuk', 'daftar'] as AuthMode[]) {
      expect(authErrorMessage(null, mode)).toBe('Terjadi kesalahan. Coba lagi.');
      expect(authErrorMessage(undefined, mode)).toBe('Terjadi kesalahan. Coba lagi.');
    }
  });
});

describe('syncStatusLabel', () => {
  it('says an idle round succeeded, rather than reporting zeros', () => {
    // "Selesai: ." or "0 dikirim" would read like a failure. Most rounds are idle.
    expect(syncStatusLabel({ ok: true, uploaded: 0, downloaded: 0 })).toContain('tidak ada perubahan');
  });

  it('counts only what actually moved', () => {
    expect(syncStatusLabel({ ok: true, uploaded: 3, downloaded: 0 })).toBe('Selesai: 3 dikirim.');
    expect(syncStatusLabel({ ok: true, uploaded: 0, downloaded: 2 })).toBe('Selesai: 2 diterima.');
    expect(syncStatusLabel({ ok: true, uploaded: 1, downloaded: 2 })).toBe('Selesai: 1 dikirim, 2 diterima.');
  });

  it('tells the user to sign in again when the session expired', () => {
    // This is the one failure with an action attached, so it must not read like the others.
    expect(syncStatusLabel({ ok: false, reason: 'unauthenticated' })).toContain('Masuk lagi');
  });

  it('explains the unreadable-metadata stop', () => {
    expect(syncStatusLabel({ ok: false, reason: 'local-data-unreadable' })).toContain('tidak bisa dibaca');
  });

  it('has words for every failure reason', () => {
    const reasons = ['offline', 'unauthenticated', 'error', 'local-data-unreadable'] as const;
    for (const reason of reasons) {
      const label = syncStatusLabel({ ok: false, reason });
      expect(label.length).toBeGreaterThan(0);
      expect(label).not.toContain('undefined');
    }
  });
});
