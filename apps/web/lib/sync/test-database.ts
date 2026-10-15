/**
 * Guard for the destructive integration tests.
 *
 * Test-only; nothing in the app imports it.
 */

/**
 * Throws unless the connection string names a throwaway database.
 *
 * The name must contain `test` as a whole segment (`gencv_test`, `test-gencv`). Matching the
 * letters anywhere is not enough: `contest` and `latest` would pass, and those look exactly
 * like the sort of database someone points this test at by accident.
 */
export function assertThrowawayDatabase(connectionString: string): void {
  const name = new URL(connectionString).pathname.replace(/^\//, '');
  if (!/(^|[_-])test([_-]|$)/i.test(name)) {
    throw new Error(
      `Refusing to run: database "${name}" does not look like a throwaway database. ` +
        'Its name must contain a `test` segment (e.g. `gencv_test`) — this test drops tables.',
    );
  }
}
