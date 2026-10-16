/**
 * Guard for the destructive integration tests.
 *
 * Test-only; nothing in the app imports it.
 */

/**
 * Query parameters that can name a database.
 *
 * `pg` resolves the database from the `database` key (which `pg-connection-string` fills from
 * the URL path), so a `db=` parameter does not in fact override it. All three aliases are still
 * checked: this guard stands between the test and `drop table cascade`, and reading every place
 * a name can hide is cheaper than proving one of them harmless.
 */
const DATABASE_PARAMS = ['db', 'database', 'dbname'];

/**
 * Throws unless every database name in the connection string is a throwaway one.
 *
 * The name must contain `test` as a whole segment (`gencv_test`, `test-gencv`). Matching the
 * letters anywhere is not enough: `contest` and `latest` would pass, and those look exactly
 * like the sort of database someone points this test at by accident.
 */
export function assertThrowawayDatabase(connectionString: string): void {
  const url = new URL(connectionString);
  const candidates = [url.pathname.replace(/^\//, ''), ...DATABASE_PARAMS.map((key) => url.searchParams.get(key))];

  for (const name of candidates) {
    if (name === null || name === '') continue;
    if (!/(^|[_-])test([_-]|$)/i.test(name)) {
      throw new Error(
        `Refusing to run: database "${name}" does not look like a throwaway database. ` +
          'Its name must contain a `test` segment (e.g. `gencv_test`) — this test drops tables.',
      );
    }
  }
}
