'use client';

import { createAuthClient } from 'better-auth/react';

/**
 * Browser-side auth client.
 *
 * No `baseURL`: the client defaults to the current origin, which is right in every environment
 * here (local dev, Vercel preview, production) without a build-time variable. A baked-in
 * `NEXT_PUBLIC_*` URL would be wrong on previews, which are exactly where sign-in needs testing.
 */
export const authClient = createAuthClient();
