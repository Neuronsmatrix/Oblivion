//! HTTP handlers for the billing service endpoints.

use axum::{
    Json,
    extract::{Path, State},
    http::{HeaderMap, HeaderValue, StatusCode},
    response::IntoResponse,
};
use chrono::{Datelike, NaiveDate, Utc};
use deadpool_redis::redis;
use oblivion_common::ApiResponse;
use uuid::Uuid;

use crate::{
    db,
    error::BillingError,
    models::{CheckQuotaRequest, QuotaResponse, SubscribeRequest},
    state::AppState,
};

// ── Redis key helpers ─────────────────────────────────────────────────────────

/// Build a Redis key for the per-lab, per-month usage counter.
fn usage_key(lab_id: Uuid, year: i32, month: u32) -> String {
    format!("billing:usage:{lab_id}:{year:04}-{month:02}")
}

/// Return the first day of the current UTC month as a [`NaiveDate`].
fn current_month_start() -> NaiveDate {
    let now = Utc::now();
    NaiveDate::from_ymd_opt(now.year(), now.month(), 1)
        .expect("valid date constructed from current UTC time")
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/// `GET /billing/plans` — list all available subscription plans.
pub async fn list_plans(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, BillingError> {
    let plans = db::list_plans(&state.db).await?;
    Ok(Json(ApiResponse::ok(plans)))
}

/// `POST /billing/subscribe` — create a subscription for a lab.
pub async fn subscribe(
    State(state): State<AppState>,
    Json(body): Json<SubscribeRequest>,
) -> Result<impl IntoResponse, BillingError> {
    // Verify the plan exists before attempting to insert.
    db::find_plan_by_id(&state.db, body.plan_id)
        .await?
        .ok_or(BillingError::PlanNotFound)?;

    let subscription = db::create_subscription(&state.db, body.lab_id, body.plan_id).await?;

    Ok((StatusCode::CREATED, Json(ApiResponse::ok(subscription))))
}

/// `GET /billing/usage/:lab_id` — return usage and plan info for the current month.
pub async fn get_usage(
    State(state): State<AppState>,
    Path(lab_id): Path<Uuid>,
) -> Result<impl IntoResponse, BillingError> {
    let sub = db::find_active_subscription(&state.db, lab_id)
        .await?
        .ok_or(BillingError::NoActiveSubscription)?;

    let month = current_month_start();
    let now = Utc::now();

    // Try Redis first.
    let redis_key = usage_key(lab_id, now.year(), now.month());
    let current_usage = get_redis_usage(&state.redis, &redis_key)
        .await
        .unwrap_or(None)
        .unwrap_or_else(|| {
            // Best-effort: if Redis is unavailable we return 0; the check-quota
            // endpoint will always fall back to DB.
            0
        });

    // Also fetch from DB for an authoritative count in the response.
    let db_usage = db::get_usage(&state.db, lab_id, month)
        .await?
        .map_or(0, |r| r.count);

    let authoritative = db_usage.max(current_usage);
    let remaining = (sub.monthly_limit - authoritative).max(0);

    let payload = serde_json::json!({
        "lab_id": lab_id,
        "plan_name": sub.plan_name,
        "monthly_limit": sub.monthly_limit,
        "current_usage": authoritative,
        "remaining": remaining,
        "month": month.to_string(),
    });

    Ok(Json(ApiResponse::ok(payload)))
}

/// `POST /billing/check-quota` — internal endpoint used by other services to
/// verify that a lab has remaining quota before processing a request.
///
/// If the quota is exhausted the response is `429 Too Many Requests` with a
/// `Retry-After` header set to the number of seconds until the next calendar
/// month.
pub async fn check_quota(
    State(state): State<AppState>,
    Json(body): Json<CheckQuotaRequest>,
) -> Result<impl IntoResponse, BillingError> {
    let requested = body.count.unwrap_or(1);
    let now = Utc::now();
    let month = current_month_start();
    let redis_key = usage_key(body.lab_id, now.year(), now.month());

    // 1. Find active subscription (required).
    let sub = db::find_active_subscription(&state.db, body.lab_id)
        .await?
        .ok_or(BillingError::NoActiveSubscription)?;

    // 2. Try reading the counter from Redis; fall back to DB.
    let current_usage = match get_redis_usage(&state.redis, &redis_key).await {
        Ok(Some(v)) => v,
        _ => {
            // Redis unavailable or key absent — authoritative DB value.
            db::get_usage(&state.db, body.lab_id, month)
                .await?
                .map_or(0, |r| r.count)
        }
    };

    let remaining = (sub.monthly_limit - current_usage).max(0);
    let allowed = remaining >= requested;

    let quota = QuotaResponse {
        allowed,
        remaining,
        monthly_limit: sub.monthly_limit,
        current_usage,
    };

    if !allowed {
        // Compute seconds until next month for Retry-After.
        let retry_after = seconds_until_next_month(now);
        let mut headers = HeaderMap::new();
        headers.insert(
            "Retry-After",
            HeaderValue::from_str(&retry_after.to_string())
                .unwrap_or_else(|_| HeaderValue::from_static("3600")),
        );
        return Ok((StatusCode::TOO_MANY_REQUESTS, headers, Json(ApiResponse::ok(quota)))
            .into_response());
    }

    // 3. On success: increment usage in Redis (with monthly TTL) and DB.
    let _ = increment_redis_usage(&state.redis, &redis_key, now).await;
    db::increment_usage(&state.db, body.lab_id, month).await?;

    Ok((StatusCode::OK, HeaderMap::new(), Json(ApiResponse::ok(quota))).into_response())
}

// ── Redis helpers ─────────────────────────────────────────────────────────────

async fn get_redis_usage(
    redis: &deadpool_redis::Pool,
    key: &str,
) -> Result<Option<i32>, BillingError> {
    let mut conn = redis.get().await?;
    let value: Option<String> = redis::cmd("GET")
        .arg(key)
        .query_async::<Option<String>>(&mut *conn)
        .await?;

    Ok(value.and_then(|s| s.parse::<i32>().ok()))
}

async fn increment_redis_usage(
    redis: &deadpool_redis::Pool,
    key: &str,
    now: chrono::DateTime<Utc>,
) -> Result<i64, BillingError> {
    let mut conn = redis.get().await?;
    let new_val: i64 = redis::cmd("INCR")
        .arg(key)
        .query_async::<i64>(&mut *conn)
        .await?;

    // Set TTL on first write so the key expires after the current month ends.
    if new_val == 1 {
        let ttl = seconds_until_next_month(now);
        redis::cmd("EXPIRE")
            .arg(key)
            .arg(ttl)
            .query_async::<()>(&mut *conn)
            .await?;
    }

    Ok(new_val)
}

/// Calculate the number of seconds from `now` until midnight UTC on the first
/// day of next month.
fn seconds_until_next_month(now: chrono::DateTime<Utc>) -> i64 {
    use chrono::TimeZone;

    let (year, month) = if now.month() == 12 {
        (now.year() + 1, 1u32)
    } else {
        (now.year(), now.month() + 1)
    };

    let next_month_start = Utc
        .with_ymd_and_hms(year, month, 1, 0, 0, 0)
        .single()
        .unwrap_or(now);

    (next_month_start - now).num_seconds().max(0)
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::TimeZone;

    #[test]
    fn seconds_until_next_month_non_negative() {
        let now = Utc::now();
        let secs = seconds_until_next_month(now);
        assert!(secs >= 0, "TTL should never be negative");
    }

    #[test]
    fn seconds_until_next_month_december_wraps() {
        let dec31 = Utc.with_ymd_and_hms(2025, 12, 31, 23, 59, 0).unwrap();
        let secs = seconds_until_next_month(dec31);
        // Should be 60 seconds (1 minute until Jan 1, 2026 00:00:00 UTC).
        assert_eq!(secs, 60);
    }

    #[test]
    fn usage_key_format() {
        let id = Uuid::nil();
        let key = usage_key(id, 2025, 3);
        assert_eq!(key, "billing:usage:00000000-0000-0000-0000-000000000000:2025-03");
    }
}
