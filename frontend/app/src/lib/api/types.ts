// Domain types — mirror docs/openapi.yaml component schemas.
// Hand-written (rather than generated) for ergonomic consumption: every API
// response is unwrapped from its { status, data, error } envelope by apiFetch,
// so these describe the `data` payloads directly.

export type Role = 'doctor' | 'lab' | 'admin';
export type CaseStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface User {
  id: string;
  email: string;
  role: Role;
  name: string;
  organization?: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  role: Role;
  name: string;
  organization?: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateCaseRequest {
  patient_name?: string | null;
  patient_age?: number | null;
  patient_ethnicity?: string | null;
}

export interface CreateCaseResponse {
  case_id: string;
  upload_url: string;
  image_key: string;
}

export interface Case {
  id: string;
  user_id: string;
  patient_name?: string | null;
  patient_age?: number | null;
  patient_ethnicity?: string | null;
  image_key: string;
  status: CaseStatus;
  created_at: string;
  updated_at: string;
}

export interface Diagnosis {
  id: string;
  case_id: string;
  syndrome_id?: string | null;
  syndrome_name: string;
  confidence: number;
  rank: number;
  created_at: string;
}

export interface CaseWithDiagnoses extends Case {
  diagnoses: Diagnosis[];
}

export interface Batch {
  id: string;
  lab_id: string;
  status: CaseStatus;
  total_items: number;
  processed_items: number;
  created_at: string;
  updated_at: string;
}

export interface BatchItem {
  id: string;
  batch_id: string;
  image_key: string;
  case_id?: string | null;
  status: CaseStatus;
  created_at: string;
}

export interface BatchWithItems {
  batch: Batch;
  items: BatchItem[];
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body?: string | null;
  read: boolean;
  metadata?: Record<string, unknown> | null;
  created_at: string;
}

export interface Syndrome {
  id: string;
  name: string;
  omim_id?: string | null;
  description?: string | null;
  prevalence?: string | null;
  inheritance?: string | null;
  created_at: string;
}

export interface HpoTerm {
  id: string;
  hpo_id: string;
  name: string;
  definition?: string | null;
}

export interface SyndromeDetail extends Syndrome {
  hpo_terms: HpoTerm[];
}

export interface Plan {
  id: string;
  name: string;
  monthly_limit: number;
  overage_price_cents: number;
  created_at: string;
}

export interface Subscription {
  id: string;
  lab_id: string;
  plan_id: string;
  status: string;
  started_at: string;
}

export interface UsageInfo {
  lab_id: string;
  month: string;
  plan_name: string;
  monthly_limit: number;
  current_usage: number;
  remaining: number;
}

export interface QuotaCheck {
  allowed: boolean;
  remaining: number;
  monthly_limit: number;
  current_usage: number;
}

export interface DiagnosisEntry {
  syndrome_id: string;
  syndrome_name: string;
  confidence: number;
  rank: number;
}

export interface AnalysisResult {
  request_id: string;
  case_id: string;
  source: 'doctor' | 'lab';
  batch_id?: string | null;
  top_diagnoses: DiagnosisEntry[];
  processing_time_ms: number;
  completed_at: string;
}

/** Standard response envelope used by every endpoint. */
export interface Envelope<T> {
  status: 'ok' | 'error';
  data: T | null;
  error: string | null;
}
