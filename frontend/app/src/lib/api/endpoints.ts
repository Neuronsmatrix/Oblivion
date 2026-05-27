// Typed endpoint functions grouped by service. All build on apiFetch.
import { apiFetch } from './client';
import type {
  AuthTokens, User, RegisterRequest, LoginRequest,
  Case, CaseWithDiagnoses, CreateCaseRequest, CreateCaseResponse,
  BatchWithItems, UsageInfo, Plan, Subscription,
  Notification, Syndrome, SyndromeDetail, HpoTerm,
} from './types';

// ── auth (3001) ────────────────────────────────────────────────────────────
export const authApi = {
  register: (body: RegisterRequest) =>
    apiFetch<User>('/auth/register', { method: 'POST', body, auth: false }),
  login: (body: LoginRequest) =>
    apiFetch<AuthTokens>('/auth/login', { method: 'POST', body, auth: false }),
  me: () => apiFetch<User>('/auth/me', { method: 'GET' }),
  logout: (refresh_token: string) =>
    apiFetch<null>('/auth/logout', { method: 'DELETE', body: { refresh_token } }),
};

// ── cases (3002) ───────────────────────────────────────────────────────────
export const casesApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    apiFetch<Case[]>('/cases', { method: 'GET', params }),
  create: (body: CreateCaseRequest) =>
    apiFetch<CreateCaseResponse>('/cases', { method: 'POST', body }),
  get: (id: string) => apiFetch<CaseWithDiagnoses>(`/cases/${id}`, { method: 'GET' }),
  update: (id: string, body: CreateCaseRequest) =>
    apiFetch<Case>(`/cases/${id}`, { method: 'PATCH', body }),
  confirmUpload: (id: string) =>
    apiFetch<null>(`/cases/${id}/confirm-upload`, { method: 'POST' }),
};

/** Upload image bytes to a presigned S3/MinIO PUT URL (no auth header). */
export async function uploadToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  const res = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!res.ok) throw new Error(`Image upload failed (${res.status})`);
}

// ── labs (3003) ────────────────────────────────────────────────────────────
export const labsApi = {
  submitBatch: (image_keys: string[]) =>
    apiFetch<BatchWithItems>('/labs/batch', { method: 'POST', body: { image_keys } }),
  results: (batchId: string) =>
    apiFetch<BatchWithItems>(`/labs/results/${batchId}`, { method: 'GET' }),
  usage: () => apiFetch<UsageInfo | null>('/labs/usage', { method: 'GET' }),
  tiers: () => apiFetch<Plan[]>('/labs/tiers', { method: 'GET' }),
};

// ── notifier (3005) ────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: { limit?: number; offset?: number }) =>
    apiFetch<Notification[]>('/notifications', { method: 'GET', params }),
  markRead: (id: string) =>
    apiFetch<Notification>(`/notifications/${id}/read`, { method: 'PATCH' }),
};

// ── reference (3006) ───────────────────────────────────────────────────────
export const referenceApi = {
  syndromes: (params?: { search?: string; limit?: number; offset?: number }) =>
    apiFetch<Syndrome[]>('/reference/syndromes', { method: 'GET', params }),
  syndrome: (id: string) =>
    apiFetch<SyndromeDetail>(`/reference/syndromes/${id}`, { method: 'GET' }),
  hpoSearch: (q: string, limit = 20) =>
    apiFetch<HpoTerm[]>('/reference/hpo/search', { method: 'GET', params: { q, limit } }),
};

// ── billing (3007) ─────────────────────────────────────────────────────────
export const billingApi = {
  plans: () => apiFetch<Plan[]>('/billing/plans', { method: 'GET', auth: false }),
  subscribe: (lab_id: string, plan_id: string) =>
    apiFetch<Subscription>('/billing/subscribe', { method: 'POST', body: { lab_id, plan_id } }),
};
