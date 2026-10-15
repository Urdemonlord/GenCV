import { bigint, boolean, index, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core';

/**
 * Drizzle schema for cloud sync: Better Auth's own tables (user/session/account/verification)
 * plus the CV documents. Column names are snake_case, matching Better Auth's defaults, so
 * the adapter needs no field mapping.
 *
 * The four auth tables follow Better Auth's documented Postgres shape. They are verified
 * against the real library by the sync integration test, which runs an actual sign-up.
 */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').notNull(),
  updatedAt: timestamp('updated_at').notNull(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_user_id_idx').on(table.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    /** Hashed password for the email+password provider. Never a plaintext value. */
    password: text('password'),
    createdAt: timestamp('created_at').notNull(),
    updatedAt: timestamp('updated_at').notNull(),
  },
  (table) => [index('account_user_id_idx').on(table.userId)],
);

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at'),
  updatedAt: timestamp('updated_at'),
});

/**
 * One row per CV per user. The composite primary key is (user_id, id): document ids are
 * generated on the device, so they are only unique within a user, and scoping the key this
 * way makes cross-user writes impossible by construction rather than by a query filter.
 */
export const documents = pgTable(
  'documents',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    id: text('id').notNull(),
    /** ms epoch of the device write; the last-write-wins clock. */
    updatedAt: bigint('updated_at', { mode: 'number' }).notNull(),
    /** Tombstone. Kept so a deletion can reach other devices instead of being re-uploaded. */
    deleted: boolean('deleted').notNull().default(false),
    /** Content fingerprint from `hashText()`, used to break timestamp ties. */
    hash: text('hash').notNull(),
    /** The CV body. NULL for a tombstone: the row only carries sync metadata. */
    body: jsonb('body'),
  },
  (table) => [primaryKey({ columns: [table.userId, table.id] }), index('documents_user_updated_idx').on(table.userId, table.updatedAt)],
);
