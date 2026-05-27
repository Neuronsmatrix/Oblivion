//! Domain models for the billing service.
//!
//! All database-mapped types derive [`sqlx::FromRow`] so they can be populated
//! directly from query results. Request/response types use [`serde`] for JSON
//! serialisation/deserialisation.

use chrono::{DateTime, NaiveDate, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ── Database models ───────────────────────────────────────────────────────────

/// A subscription plan defining monthly limits and overage pricing.
#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Plan {
    pub id: Uuid,
    pub name: String,
    /// Maximum number of analysis requests allowed per month.
    pub monthly_limit: i32,
    /// Price in cents charged per analysis request that exceeds the monthly limit.
    pub overage_price_cents: i32,
    pub created_at: DateTime<Utc>,
}

/// A lab's subscription to a billing plan.
#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Subscription {
    pub id: Uuid,
    pub lab_id: Uuid,
    pub plan_id: Uuid,
    /// Lifecycle status of the subscription, e.g. `"active"`, `"cancelled"`.
    pub status: String,
    pub started_at: DateTime<Utc>,
}

/// A join of `subscriptions` and `plans`, returned when fetching an active
/// subscription with its plan details.
#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct SubscriptionWithPlan {
    pub id: Uuid,
    pub lab_id: Uuid,
    pub plan_name: String,
    pub monthly_limit: i32,
    /// Lifecycle status of the subscription.
    pub status: String,
}

/// Per-lab, per-month usage counter.
#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct UsageRecord {
    pub id: Uuid,
    pub lab_id: Uuid,
    /// First day of the month this record covers (`YYYY-MM-01`).
    pub month: NaiveDate,
    /// Number of analysis requests submitted during this month.
    pub count: i32,
    pub created_at: DateTime<Utc>,
}

// ── Request types ─────────────────────────────────────────────────────────────

/// Body for `POST /billing/subscribe`.
#[derive(Debug, Deserialize)]
pub struct SubscribeRequest {
    pub lab_id: Uuid,
    pub plan_id: Uuid,
}

/// Body for `POST /billing/check-quota`.
#[derive(Debug, Deserialize)]
pub struct CheckQuotaRequest {
    pub lab_id: Uuid,
    /// Number of additional requests the caller wants to consume.
    /// Defaults to `1` when omitted.
    pub count: Option<i32>,
}

// ── Response types ────────────────────────────────────────────────────────────

/// Quota-check result returned to internal callers.
#[derive(Debug, Serialize)]
pub struct QuotaResponse {
    /// Whether the lab is allowed to submit more requests right now.
    pub allowed: bool,
    /// How many requests the lab may still submit this month.
    pub remaining: i32,
    /// The plan's monthly ceiling.
    pub monthly_limit: i32,
    /// Requests already consumed this month.
    pub current_usage: i32,
}
