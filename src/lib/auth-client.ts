import { createAuthClient } from 'better-auth/client';

export const authClient = createAuthClient({
  baseURL: import.meta.env.SITE ?? 'http://localhost:4321',
});
