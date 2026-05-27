// apiFetch: base URL + bearer + envelope unwrap + single-flight 401 refresh.
import type { AuthTokens, Envelope } from './types';
import { tokenStore } from './storage';

export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// Registered by AuthContext so the client can force a logout when refresh fails.
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: (() => void) | null) {
  onAuthFailure = fn;
}

let refreshPromise: Promise<boolean> | null = null;

async function tryRefresh(): Promise<boolean> {
  // Share a single in-flight refresh across concurrent 401s.
  if (refreshPromise) return refreshPromise;
  const refresh_token = tokenStore.getRefresh();
  if (!refresh_token) return false;

  refreshPromise = (async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token }),
      });
      if (!res.ok) return false;
      const env = (await res.json()) as Envelope<AuthTokens>;
      if (env.status !== 'ok' || !env.data) return false;
      tokenStore.set(env.data);
      return true;
    } catch {
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  /** Skip the Authorization header (used for login/register/refresh). */
  auth?: boolean;
  /** Query string params. */
  params?: Record<string, string | number | undefined>;
}

function buildUrl(path: string, params?: ApiFetchOptions['params']): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function rawFetch(
  path: string,
  opts: ApiFetchOptions,
  accessOverride?: string,
): Promise<Response> {
  const headers = new Headers(opts.headers);
  if (opts.body !== undefined) headers.set('Content-Type', 'application/json');
  if (opts.auth !== false) {
    const token = accessOverride ?? tokenStore.getAccess();
    if (token) headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(buildUrl(path, opts.params), {
    ...opts,
    headers,
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

/**
 * Fetch an API endpoint, unwrap the envelope, and return `data` typed as T.
 * Retries once after a transparent token refresh on 401.
 */
export async function apiFetch<T>(path: string, opts: ApiFetchOptions = {}): Promise<T> {
  let res = await rawFetch(path, opts);

  if (res.status === 401 && opts.auth !== false) {
    const ok = await tryRefresh();
    if (ok) {
      res = await rawFetch(path, opts, tokenStore.getAccess() ?? undefined);
    } else {
      tokenStore.clear();
      onAuthFailure?.();
      throw new ApiError('Session expired. Please sign in again.', 401);
    }
  }

  let env: Envelope<T> | null = null;
  try {
    env = (await res.json()) as Envelope<T>;
  } catch {
    // Non-JSON response.
  }

  if (!res.ok || (env && env.status === 'error')) {
    const message = env?.error ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return (env ? env.data : null) as T;
}
