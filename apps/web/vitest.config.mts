import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./', import.meta.url)) },
  },
  // Vite 8 transforms with oxc (not esbuild), so JSX is configured here.
  oxc: { jsx: { runtime: 'automatic' } },
  test: {
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules/**', '.next/**', 'e2e/**'],
    // Rendering real PDFs with embedded fonts takes a few seconds on cold start.
    testTimeout: 30_000,
  },
});
