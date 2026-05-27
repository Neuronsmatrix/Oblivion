// Simplest viable token storage: localStorage. Trade-off vs httpOnly cookies
// (XSS exposure) is accepted for this build per the plan.

import type { AuthTokens } from './types';

const ACCESS_KEY = 'pg_access_token';
const REFRESH_KEY = 'pg_refresh_token';

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  set(tokens: Pick<AuthTokens, 'access_token' | 'refresh_token'>) {
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};
