'use client';

import { createAuthClient } from 'better-auth/react';

/** Better Auth on this origin (`/api/auth`). Email and password are the only method enabled. */
export const authClient = createAuthClient();
