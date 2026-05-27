//! HTTP handlers for the labs service endpoints.

use axum::{
    Json,
    extract::{Path, State},
    response::IntoResponse,
};
use chrono::Utc;
use oblivion_common::{AnalysisRequest, AnalysisSource, ApiResponse};
use uuid::Uuid;

use crate::{
    auth_extractor::AuthUser,
    billing_client,
    db,
    error::LabsError,
    kafka,
    models::{BatchItemInsert, BatchResponse, CreateBatchRequest},
    rate_limiter,
    state::AppState,
};

/// Rate-limit window in seconds (1 minute).
const RATE_LIMIT_WINDOW_SECS: u64 = 60;
/// Maximum batch submissions per lab per minute.
const RATE_LIMIT_MAX_REQUESTS: u64 = 10;

// ── Handlers ──────────────────────────────────────────────────────────────────

/// `POST /labs/batch` — create a new analysis batch.
///
/// Requires the caller to be authenticated with role `"lab"`.
///
/// 1. Validates the caller's role.
/// 2. Applies a Redis-backed rate limit.
/// 3. Checks billing quota via the billing service (Redis cache first).
/// 4. Creates the batch and item rows in the database.
/// 5. Publishes one `AnalysisRequest` Kafka message per image.
pub async fn create_batch(
    State(state): State<AppState>,
    AuthUser { claims }: AuthUser,
    Json(body): Json<CreateBatchRequest>,
) -> Result<impl IntoResponse, LabsError> {
    // 1. Role check.
    if claims.role != "lab" {
        return Err(LabsError::Forbidden(
            "only lab accounts may submit batches".to_owned(),
        ));
    }

    if body.image_keys.is_empty() {
        return Err(LabsError::BadRequest(
            "image_keys must not be empty".to_owned(),
        ));
    }

    let lab_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| LabsError::Internal("invalid sub claim in token".to_owned()))?;

    // 2. Rate limit check.
    let rl = rate_limiter::check_rate_limit(
        &state.redis,
        lab_id,
        RATE_LIMIT_WINDOW_SECS,
        RATE_LIMIT_MAX_REQUESTS,
    )
    .await?;

    if !rl.allowed {
        return Err(LabsError::RateLimitExceeded);
    }

    // 3. Billing quota check (count = number of images being submitted).
    #[allow(clippy::cast_possible_truncation)]
    let item_count = body.image_keys.len() as i32;

    billing_client::check_quota(
        &state.http,
        &state.redis,
        &state.config.billing_url,
        lab_id,
        item_count,
    )
    .await?;

    // 4. Persist batch and items.
    let batch = db::create_batch(&state.db, lab_id, item_count).await?;

    let inserts: Vec<BatchItemInsert> = body
        .image_keys
        .iter()
        .map(|key| BatchItemInsert {
            image_key: key.clone(),
        })
        .collect();

    let items = db::create_batch_items(&state.db, batch.id, inserts).await?;

    // 5. Publish one Kafka message per item.
    for item in &items {
        let request = AnalysisRequest {
            request_id: Uuid::new_v4(),
            case_id: Uuid::new_v4(), // Placeholder; the recognition service creates the real case.
            image_key: item.image_key.clone(),
            source: AnalysisSource::Lab,
            batch_id: Some(batch.id),
            patient_ethnicity: None,
            requested_at: Utc::now(),
        };

        if let Err(e) = kafka::publish_analysis_request(&state.kafka_producer, &request).await {
            tracing::error!(
                error = %e,
                batch_id = %batch.id,
                image_key = %item.image_key,
                "failed to publish analysis request; item will remain pending"
            );
        }
    }

    let response = BatchResponse { batch, items };
    Ok((axum::http::StatusCode::CREATED, Json(ApiResponse::ok(response))))
}

/// `GET /labs/results/:batch_id` — fetch a batch and all its items.
///
/// Only the owning lab may access a batch's results. The claim's `sub` field
/// is compared against the batch's `lab_id`.
pub async fn get_results(
    State(state): State<AppState>,
    AuthUser { claims }: AuthUser,
    Path(batch_id): Path<Uuid>,
) -> Result<impl IntoResponse, LabsError> {
    let lab_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| LabsError::Internal("invalid sub claim in token".to_owned()))?;

    let batch = db::find_batch_by_id(&state.db, batch_id)
        .await?
        .ok_or(LabsError::BatchNotFound)?;

    // Only the owning lab or an admin may read results.
    if batch.lab_id != lab_id && claims.role != "admin" {
        return Err(LabsError::BatchNotFound); // Do not leak existence to other labs.
    }

    let items = db::list_batch_items(&state.db, batch_id).await?;

    Ok(Json(ApiResponse::ok(BatchResponse { batch, items })))
}

/// `GET /labs/usage` — return the caller's current-month usage stats.
///
/// Delegates to the billing service's `/billing/usage/:lab_id` endpoint.
pub async fn get_usage(
    State(state): State<AppState>,
    AuthUser { claims }: AuthUser,
) -> Result<impl IntoResponse, LabsError> {
    let lab_id = Uuid::parse_str(&claims.sub)
        .map_err(|_| LabsError::Internal("invalid sub claim in token".to_owned()))?;

    let url = format!("{}/billing/usage/{lab_id}", state.config.billing_url);

    let resp = state
        .http
        .get(&url)
        .send()
        .await
        .map_err(|e| LabsError::Internal(format!("billing usage request failed: {e}")))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(LabsError::Internal(format!(
            "billing usage error {status}: {text}"
        )));
    }

    let payload: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| LabsError::Internal(format!("billing usage parse error: {e}")))?;

    Ok(Json(ApiResponse::ok(payload)))
}

/// `GET /labs/tiers` — return available subscription plans.
///
/// Proxies to the billing service's `/billing/plans` endpoint.
pub async fn get_tiers(
    State(state): State<AppState>,
) -> Result<impl IntoResponse, LabsError> {
    let url = format!("{}/billing/plans", state.config.billing_url);

    let resp = state
        .http
        .get(&url)
        .send()
        .await
        .map_err(|e| LabsError::Internal(format!("billing plans request failed: {e}")))?;

    if !resp.status().is_success() {
        let status = resp.status();
        let text = resp.text().await.unwrap_or_default();
        return Err(LabsError::Internal(format!(
            "billing plans error {status}: {text}"
        )));
    }

    let payload: serde_json::Value = resp
        .json()
        .await
        .map_err(|e| LabsError::Internal(format!("billing plans parse error: {e}")))?;

    Ok(Json(ApiResponse::ok(payload)))
}
