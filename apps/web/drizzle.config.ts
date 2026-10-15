import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './lib/sync/schema.ts',
  out: './lib/sync/migrations',
  dialect: 'postgresql',
  dbCredentials: { url: process.env.DATABASE_URL! },
});
