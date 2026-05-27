//! HTTP client for the billing service.
//!
//! Wraps calls to `POST /billing/check-quota` with a short Redis cache so that
//! the billing service is not hammered on every individual request. Cache
//! entries have a 30-second TTL.

use deadpool_redis::redis;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::error::LabsError;

// ── Shared types ──────────────────────────────────────────────────────────────

/// The quota-check response returned by the billing service.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct QuotaResponse {
    pub allowed: bool,
    pub remaining: i32,
    pub monthly_limit: i32,
    pub current_usage: i32,
}

/// Wrapper matching the billing service's `ApiResponse<QuotaResponse>` envelope.
#[derive(Debug, Deserialize)]
struct BillingApiResponse {
    #[allow(dead_code)]
    status: String,
    data: Option<QuotaResponse>,
    error: Option<String>,
}

// ── Client function ───────────────────────────────────────────────────────────

/// Call `POST {billing_url}/billing/check-quota` and return the result.
///
/// Results are cached in Redis under `quota_cache:{lab_id}` for 30 seconds so
/// that burst traffic does not hammer the billing service. The cached value is
/// only used as a positive ("allowed") hint — quota enforcement is authoritative
/// in the billing service.
///
/// # Errors
///
/// Returns [`LabsError::Internal`] if the HTTP call or Redis access fails.
/// Returns [`LabsError::QuotaExceeded`] if the billing service denies the request.
/// Returns [`LabsError::NoActiveSubscription`] if no subscription exists.
pub async fn check_quota(
    http: &reqwest::Client,
    redis: &deadpool_redis::Pool,
    billing_url: &str,
    lab_id: Uuid,
    count: i32,
) -> Result<QuotaResponse, LabsError> {
    let cache_key = format!("quota_cache:{lab_id}");

    // ── Try Redis cache first ─────────────────────────────────────────────────
    if let Ok(cached) = get_cached_quota(redis, &cache_key).await {
        if let Some(quota) = cached {
            tracing::debug!(%lab_id, "quota check served from cache");
            return Ok(quota);
        }
    }

    // ── Call billing service ──────────────────────────────────────────────────
    let url = format!("{billing_url}/billing/check-quota");
    let body = serde_json::json!({ "lab_id": lab_id, "count": count });

    let resp = http
        .post(&url)
        .json(&body)
        .send()
        .await
        .map_err(|e| LabsError::Internal(format!("billing request failed: {e}")))?;

    let status = resp.status();

    // HTTP 404 from billing means no active subscription.
    if status == reqwest::StatusCode::NOT_FOUND {
        return Err(LabsError::NoActiveSubscription);
    }

    // HTTP 429 means quota exhausted.
    if status == reqwest::StatusCode::TOO_MANY_REQUESTS {
        return Err(LabsError::QuotaExceeded);
    }

    if !status.is_success() {
        let text = resp.text().await.unwrap_or_default();
        return Err(LabsError::Internal(format!(
            "billing service error {status}: {text}"
        )));
    }

    let envelope: BillingApiResponse = resp
        .json()
        .await
        .map_err(|e| LabsError::Internal(format!("billing response parse error: {e}")))?;

    let quota = envelope.data.ok_or_else(|| {
        LabsError::Internal(
            envelope
                .error
                .unwrap_or_else(|| "empty billing response".to_owned()),
        )
    })?;

    // ── Cache successful result ───────────────────────────────────────────────
    if quota.allowed {
        let _ = cache_quota(redis, &cache_key, &quota).await;
    }

    Ok(quota)
}

// ── Redis helpers ─────────────────────────────────────────────────────────────

async fn get_cached_quota(
    redis: &deadpool_redis::Pool,
    key: &str,
) -> Result<Option<QuotaResponse>, LabsError> {
    let mut conn = redis.get().await?;
    let value: Option<String> = redis::cmd("GET")
        .arg(key)
        .query_async::<Option<String>>(&mut *conn)
        .await?;

    match value {
        None => Ok(None),
        Some(json) => {
            let quota: QuotaResponse = serde_json::from_str(&json)?;
            Ok(Some(quota))
        }
    }
}

async fn cache_quota(
    redis: &deadpool_redis::Pool,
    key: &str,
    quota: &QuotaResponse,
) -> Result<(), LabsError> {
    let json = serde_json::to_string(quota)?;
    let mut conn = redis.get().await?;

    redis::cmd("SET")
        .arg(key)
        .arg(&json)
        .arg("EX")
        .arg(30u64)
        .query_async::<()>(&mut *conn)
        .await?;

    Ok(())
}
