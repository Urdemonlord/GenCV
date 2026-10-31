import { sql } from 'drizzle-orm';
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from 'drizzle-orm/pg-core';

/**
 * Drizzle schema for cloud sync: Better Auth's own tables (user/session/account/verification)
 * plus the CV documents. Column names are snake_case, matching Better Auth's defaults, so
 * the adapter needs no field mapping.
 *
 * The `user`, `account` and `session` tables are verified against the real library by
 * `auth.integration.test.ts`, which runs a real sign-up, sign-in and session lookup against
 * Postgres. Run it with `TEST_DATABASE_URL` set (see the file header); it skips itself when
 * that variable is absent so CI needs no database.
 *
 * `verification` is NOT covered: no flow this app enables (email verification, password
 * reset) writes to it, so its columns have not been exercised against the library. Treat
 * them as unverified until one of those flows is turned on.
 */

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull(),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
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
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    /** Hashed password for the email+password provider. Never a plaintext value. */
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('account_user_id_idx').on(table.userId),
    // A provider identity is the pair (provider_id, account_id). Better Auth throws at runtime
    // when that pair resolves to more than one row, so keep the duplicate impossible in the
    // database rather than discovering it mid-sign-in.
    unique('account_provider_account_unique').on(table.providerId, table.accountId),
  ],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }),
    updatedAt: timestamp('updated_at', { withTimezone: true }),
  },
  // Verification and password-reset lookups filter by identifier; without this they scan
  // every token row.
  (table) => [index('verification_identifier_idx').on(table.identifier)],
);

/**
 * One row per CV per user. The composite primary key is (user_id, id): document ids are
 * generated on the device, so they are only unique within a user — two different users can
 * both own a document called `cv1`.
 *
 * This key is a *uniqueness* constraint, NOT authorization. It only prevents a duplicate
 * `(user_id, id)` pair; it does not stop two users from using the same `id`, and it does not
 * stop a write from naming another user's `user_id`. Every query must therefore be scoped to
 * the authenticated user (`where(eq(documents.userId, session.user.id))`) in the sync route.
 * When that route lands, consider a row-level-security policy as a second line of defence.
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
  (table) => [
    primaryKey({ columns: [table.userId, table.id] }),
    index('documents_user_updated_idx').on(table.userId, table.updatedAt),
    // `deleted` and `body IS NULL` are both tombstone markers, so they must not disagree:
    // a half-written tombstone would sync as a live document with no content.
    check('documents_tombstone_has_no_body', sql`${table.deleted} = (${table.body} IS NULL)`),
  ],
);

/**
 * AI credit balance. One row per user, created on the first purchase. Users without a row have
 * no paid credits and only the free daily quota. The CHECK keeps a race from spending below zero.
 */
export const aiCredits = pgTable(
  'ai_credits',
  {
    userId: text('user_id')
      .primaryKey()
      .references(() => user.id, { onDelete: 'cascade' }),
    balance: integer('balance').notNull().default(0),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [check('ai_credits_balance_not_negative', sql`${table.balance} >= 0`)],
);

/**
 * QRIS purchases of credit packs through the MeowPay panel. `id` is the panel's order id.
 * Status only moves pending → paid/expired/cancelled; expired/cancelled/reversed → paid (a late
 * payment still counts); paid → reversed (the money was pulled back).
 */
export const creditPayments = pgTable(
  'credit_payments',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    packId: text('pack_id').notNull(),
    credits: integer('credits').notNull(),
    /** List price of the pack. */
    price: integer('price').notNull(),
    /** What the buyer pays: the price, or a little less when another buyer holds that amount. */
    amount: integer('amount').notNull(),
    qrString: text('qr_string').notNull(),
    status: text('status').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).notNull(),
  },
  (table) => [
    index('credit_payments_user_idx').on(table.userId, table.createdAt),
    check('credit_payments_status', sql`${table.status} in ('pending', 'paid', 'expired', 'cancelled', 'reversed')`),
    check('credit_payments_amount', sql`${table.amount} > 0 and ${table.amount} <= ${table.price} and ${table.credits} > 0`),
  ],
);
