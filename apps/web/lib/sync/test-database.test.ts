import { describe, expect, it } from 'vitest';
import { assertThrowawayDatabase } from './test-database';

/**
 * The guard that stands between a mistyped `TEST_DATABASE_URL` and `drop table ... cascade`.
 * It runs without Postgres on purpose: a safety mechanism that is itself skipped is not one.
 */
describe('assertThrowawayDatabase', () => {
  it('accepts a name with a `test` segment', () => {
    for (const name of ['gencv_test', 'test-gencv', 'gencv-test', 'test']) {
      expect(() => assertThrowawayDatabase(`postgres://127.0.0.1:55432/${name}`)).not.toThrow();
    }
  });

  it('refuses a production-looking name', () => {
    expect(() => assertThrowawayDatabase('postgres://127.0.0.1:55432/gencv')).toThrow(/test/);
  });

  it('refuses names that merely contain the letters `test`', () => {
    // `contest` and `latest` are exactly the sort of database someone pastes in by accident,
    // so matching the substring anywhere is not good enough.
    for (const name of ['contest', 'latest', 'mytestdata']) {
      expect(() => assertThrowawayDatabase(`postgres://127.0.0.1:55432/${name}`)).toThrow(/test/);
    }
  });
});
