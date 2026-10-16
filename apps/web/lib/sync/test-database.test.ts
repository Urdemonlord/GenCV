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

  it('refuses a database named only in a query parameter', () => {
    // Reading only the URL path would let `.../gencv_test?db=production` through, and the tests
    // would then drop production's tables.
    for (const param of ['db', 'database', 'dbname']) {
      expect(() => assertThrowawayDatabase(`postgres://127.0.0.1:55432/gencv_test?${param}=production`)).toThrow(/test/);
    }
  });

  it('accepts a query parameter that is also a throwaway name', () => {
    expect(() => assertThrowawayDatabase('postgres://127.0.0.1:55432/gencv_test?db=gencv_test')).not.toThrow();
  });

  it('refuses a connection string that names no database at all', () => {
    // `pg` falls back to a default database (the user name) when none is given, so accepting
    // this would run `drop table cascade` against whatever that default happens to be.
    expect(() => assertThrowawayDatabase('postgres://127.0.0.1:55432')).toThrow(/no database/);
    expect(() => assertThrowawayDatabase('postgres://127.0.0.1:55432/')).toThrow(/no database/);
  });

  it('refuses names that merely contain the letters `test`', () => {
    // `contest` and `latest` are exactly the sort of database someone pastes in by accident,
    // so matching the substring anywhere is not good enough.
    for (const name of ['contest', 'latest', 'mytestdata']) {
      expect(() => assertThrowawayDatabase(`postgres://127.0.0.1:55432/${name}`)).toThrow(/test/);
    }
  });
});