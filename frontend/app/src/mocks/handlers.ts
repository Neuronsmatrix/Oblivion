import { http, HttpResponse } from 'msw';
import { API_BASE_URL } from '../lib/api/client';
import { db, syndromes, hpoTerms, plans, uuid, now } from './db';
import type { Envelope } from '../lib/api/types';

db.seedDemoUser();

// Use a common body type so handlers that branch between ok()/err() unify.
const ok = <T>(data: T) =>
  HttpResponse.json({ status: 'ok', data, error: null } as Envelope<unknown>);
const err = (error: string, status = 400) =>
  HttpResponse.json({ status: 'error', data: null, error } as Envelope<unknown>, { status });

const TOKEN_PREFIX = 'mock-access-';
const issue = (userId: string) => ({
  access_token: `${TOKEN_PREFIX}${userId}`,
  refresh_token: `mock-refresh-${userId}`,
  token_type: 'Bearer',
  expires_in: 3600,
});

function userFromAuth(request: Request) {
  const auth = request.headers.get('Authorization') ?? '';
  const token = auth.replace('Bearer ', '');
  if (!token.startsWith(TOKEN_PREFIX)) return null;
  return db.findUserById(token.slice(TOKEN_PREFIX.length)) ?? null;
}

const u = (p: string) => `${API_BASE_URL}${p}`;

export const handlers = [
  // ── auth ──────────────────────────────────────────────────────────────────
  http.post(u('/auth/register'), async ({ request }) => {
    const body = (await request.json()) as Record<string, string>;
    if (db.findUserByEmail(body.email)) return err('Email already registered', 409);
    const user = {
      id: uuid(), email: body.email, role: (body.role as 'doctor' | 'lab' | 'admin'),
      name: body.name, organization: body.organization ?? null,
    };
    db.users.push(user);
    db.passwords.set(body.email, body.password);
    return ok(user);
  }),

  http.post(u('/auth/login'), async ({ request }) => {
    const body = (await request.json()) as { email: string; password: string };
    const user = db.findUserByEmail(body.email);
    if (!user || db.passwords.get(body.email) !== body.password) return err('Invalid credentials', 401);
    return ok(issue(user.id));
  }),

  http.post(u('/auth/refresh'), async ({ request }) => {
    const body = (await request.json()) as { refresh_token: string };
    const id = body.refresh_token?.replace('mock-refresh-', '');
    if (!id || !db.findUserById(id)) return err('Invalid refresh token', 401);
    return ok(issue(id));
  }),

  http.get(u('/auth/me'), ({ request }) => {
    const user = userFromAuth(request);
    return user ? ok(user) : err('Unauthorized', 401);
  }),

  http.delete(u('/auth/logout'), () => ok(null)),

  // ── cases ─────────────────────────────────────────────────────────────────
  http.get(u('/cases'), ({ request }) => {
    const user = userFromAuth(request);
    if (!user) return err('Unauthorized', 401);
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const mine = db.cases
      .filter((c) => c.user_id === user.id)
      .map((c) => db.resolveCase(c))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return ok(mine.slice(offset, offset + limit));
  }),

  http.post(u('/cases'), async ({ request }) => {
    const user = userFromAuth(request);
    if (!user) return err('Unauthorized', 401);
    const body = (await request.json()) as Record<string, unknown>;
    const id = uuid();
    const image_key = `cases/${id}.jpg`;
    db.cases.push({
      id, user_id: user.id,
      patient_name: (body.patient_name as string) ?? null,
      patient_age: (body.patient_age as number) ?? null,
      patient_ethnicity: (body.patient_ethnicity as string) ?? null,
      image_key, status: 'pending', created_at: now(), updated_at: now(),
    });
    return ok({ case_id: id, upload_url: `${API_BASE_URL}/__mock_upload/${image_key}`, image_key });
  }),

  http.put(u('/__mock_upload/*'), () => new HttpResponse(null, { status: 200 })),

  http.get(u('/cases/:id'), ({ request, params }) => {
    const user = userFromAuth(request);
    if (!user) return err('Unauthorized', 401);
    const c = db.cases.find((x) => x.id === params.id);
    if (!c) return err('Case not found', 404);
    if (c.user_id !== user.id) return err('Forbidden', 403);
    db.resolveCase(c);
    return ok({ ...c, diagnoses: c.diagnoses ?? [] });
  }),

  http.patch(u('/cases/:id'), async ({ request, params }) => {
    const user = userFromAuth(request);
    if (!user) return err('Unauthorized', 401);
    const c = db.cases.find((x) => x.id === params.id);
    if (!c) return err('Case not found', 404);
    const body = (await request.json()) as Record<string, unknown>;
    if ('patient_name' in body) c.patient_name = (body.patient_name as string) ?? null;
    if ('patient_age' in body) c.patient_age = (body.patient_age as number) ?? null;
    if ('patient_ethnicity' in body) c.patient_ethnicity = (body.patient_ethnicity as string) ?? null;
    c.updated_at = now();
    return ok({ ...c });
  }),

  http.post(u('/cases/:id/confirm-upload'), ({ request, params }) => {
    const user = userFromAuth(request);
    if (!user) return err('Unauthorized', 401);
    const c = db.cases.find((x) => x.id === params.id);
    if (!c) return err('Case not found', 404);
    if (c.status !== 'pending') return err('Case is not pending', 409);
    c.confirmedAt = Date.now();
    c.status = 'processing';
    c.updated_at = now();
    return ok(null);
  }),

  // ── labs ──────────────────────────────────────────────────────────────────
  http.post(u('/labs/batch'), async ({ request }) => {
    const user = userFromAuth(request);
    if (!user) return err('Unauthorized', 401);
    const body = (await request.json()) as { image_keys: string[] };
    const batchId = uuid();
    const items = body.image_keys.map((k) => ({
      id: uuid(), batch_id: batchId, image_key: k, case_id: null,
      status: 'processing' as const, created_at: now(),
    }));
    const rec = {
      batch: {
        id: batchId, lab_id: user.id, status: 'processing' as const,
        total_items: items.length, processed_items: 0, created_at: now(), updated_at: now(),
      },
      items, confirmedAt: Date.now(),
    };
    db.batches.push(rec);
    return ok({ batch: rec.batch, items: rec.items });
  }),

  http.get(u('/labs/results/:batchId'), ({ params }) => {
    const rec = db.batches.find((b) => b.batch.id === params.batchId);
    if (!rec) return err('Batch not found', 404);
    db.resolveBatch(rec);
    return ok({ batch: rec.batch, items: rec.items });
  }),

  http.get(u('/labs/usage'), ({ request }) => {
    const user = userFromAuth(request);
    if (!user) return err('Unauthorized', 401);
    const sub = db.subscriptions.find((s) => s.lab_id === user.id);
    if (!sub) return ok(null);
    const plan = plans.find((p) => p.id === sub.plan_id)!;
    const used = db.batches.reduce((n, b) => n + b.items.length, 0);
    return ok({
      lab_id: user.id, month: new Date().toISOString().slice(0, 10),
      plan_name: plan.name, monthly_limit: plan.monthly_limit,
      current_usage: used, remaining: Math.max(0, plan.monthly_limit - used),
    });
  }),

  http.get(u('/labs/tiers'), () => ok(plans)),

  // ── notifier ────────────────────────────────────────────────────────────────
  http.get(u('/notifications'), ({ request }) => {
    const user = userFromAuth(request);
    if (!user) return err('Unauthorized', 401);
    return ok(
      db.notifications
        .filter((n) => n.user_id === user.id)
        .sort((a, b) => b.created_at.localeCompare(a.created_at)),
    );
  }),

  http.patch(u('/notifications/:id/read'), ({ params }) => {
    const n = db.notifications.find((x) => x.id === params.id);
    if (!n) return err('Notification not found', 404);
    n.read = true;
    return ok(n);
  }),

  // ── reference ─────────────────────────────────────────────────────────────
  http.get(u('/reference/syndromes'), ({ request }) => {
    const url = new URL(request.url);
    const search = (url.searchParams.get('search') ?? '').toLowerCase();
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const offset = Number(url.searchParams.get('offset') ?? 0);
    const filtered = search
      ? syndromes.filter((s) =>
          s.name.toLowerCase().includes(search) || (s.description ?? '').toLowerCase().includes(search))
      : syndromes;
    return ok(filtered.slice(offset, offset + limit));
  }),

  http.get(u('/reference/syndromes/:id'), ({ params }) => {
    const s = syndromes.find((x) => x.id === params.id);
    if (!s) return err('Syndrome not found', 404);
    const linked = hpoTerms.slice(0, 5 + (s.name.length % 3));
    return ok({ ...s, hpo_terms: linked });
  }),

  http.get(u('/reference/hpo/search'), ({ request }) => {
    const url = new URL(request.url);
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const matched = hpoTerms.filter(
      (t) => t.name.toLowerCase().includes(q) || t.hpo_id.toLowerCase().includes(q),
    );
    return ok(matched.slice(0, limit));
  }),

  // ── billing ───────────────────────────────────────────────────────────────
  http.get(u('/billing/plans'), () => ok(plans)),

  http.post(u('/billing/subscribe'), async ({ request }) => {
    const body = (await request.json()) as { lab_id: string; plan_id: string };
    const sub = {
      id: uuid(), lab_id: body.lab_id, plan_id: body.plan_id,
      status: 'active', started_at: now(),
    };
    db.subscriptions = db.subscriptions.filter((s) => s.lab_id !== body.lab_id);
    db.subscriptions.push(sub);
    return ok(sub);
  }),
];
