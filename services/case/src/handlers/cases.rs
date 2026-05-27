//! HTTP handlers for clinical case CRUD and the analysis pipeline.

use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
    Json,
};
use chrono::Utc;
use oblivion_common::{AnalysisRequest, AnalysisSource, ApiResponse};
use serde_json::json;
use uuid::Uuid;

use crate::{
    auth_extractor::AuthUser,
    db,
    error::CaseError,
    kafka,
    models::{
        CaseWithDiagnoses, CreateCaseRequest, CreateCaseResponse, PaginationParams,
        UpdateCaseRequest,
    },
    s3,
    state::AppState,
};

// ── POST /cases ───────────────────────────────────────────────────────────────

/// Create a new case and return a presigned upload URL.
///
/// The case is persisted with status `pending`. The caller must then upload the
/// image to `upload_url` and call `POST /cases/:id/confirm-upload` to advance
/// the pipeline.
pub async fn create_case(
    State(state): State<AppState>,
    auth: AuthUser,
    Json(body): Json<CreateCaseRequest>,
) -> Result<impl IntoResponse, CaseError> {
    let case_id = Uuid::new_v4();
    let image_key = format!("{}/{}.jpg", case_id, Uuid::new_v4());

    // Generate presigned PUT URL (15-minute window).
    let upload_url = s3::generate_presigned_upload_url(
        &state.s3,
        &state.config.s3_bucket_raw,
        &image_key,
        900,
    )
    .await?;

    // Persist the case record. Reuse `case_id` so the row id, the response,
    // and the `image_key` prefix all refer to the same case.
    let _case = db::insert_case(
        &state.pool,
        case_id,
        auth.user_id,
        body.patient_name,
        body.patient_age,
        body.patient_ethnicity,
        image_key.clone(),
    )
    .await?;

    let response = CreateCaseResponse {
        case_id,
        upload_url,
        image_key,
    };

    Ok((axum::http::StatusCode::CREATED, Json(ApiResponse::ok(response))))
}

// ── POST /cases/:id/confirm-upload ────────────────────────────────────────────

/// Confirm that the client has finished uploading the image.
///
/// Verifies the object exists in S3, transitions the case to `processing`, and
/// publishes an [`AnalysisRequest`] to Kafka.
pub async fn confirm_upload(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, CaseError> {
    // Load and authorise.
    let case = load_owned_case(&state, auth.user_id, id).await?;

    // Only a pending case can move to processing.
    if case.status != "pending" {
        return Err(CaseError::InvalidState {
            current: case.status.clone(),
        });
    }

    // Verify the image was actually uploaded.
    let exists = s3::check_object_exists(
        &state.s3,
        &state.config.s3_bucket_raw,
        &case.image_key,
    )
    .await?;

    if !exists {
        return Err(CaseError::ImageNotFound {
            key: case.image_key.clone(),
        });
    }

    // Transition to processing.
    db::update_case_status(&state.pool, id, "processing").await?;

    // Publish analysis request.
    let request = AnalysisRequest {
        request_id: Uuid::new_v4(),
        case_id: id,
        image_key: case.image_key,
        source: AnalysisSource::Doctor,
        batch_id: None,
        patient_ethnicity: case.patient_ethnicity,
        requested_at: Utc::now(),
    };

    kafka::publish_analysis_request(&state.producer, request).await?;

    Ok(Json(json!({"status": "ok", "message": "analysis started"})))
}

// ── GET /cases/:id ────────────────────────────────────────────────────────────

/// Retrieve a single case with its diagnoses.
pub async fn get_case(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, CaseError> {
    let case = load_owned_case(&state, auth.user_id, id).await?;
    let diagnoses = db::find_diagnoses_by_case(&state.pool, id).await?;

    let body = CaseWithDiagnoses { case, diagnoses };
    Ok(Json(ApiResponse::ok(body)))
}

// ── GET /cases ────────────────────────────────────────────────────────────────

/// List cases belonging to the authenticated user with pagination.
pub async fn list_cases(
    State(state): State<AppState>,
    auth: AuthUser,
    Query(params): Query<PaginationParams>,
) -> Result<impl IntoResponse, CaseError> {
    let limit = params.limit.unwrap_or(20);
    let offset = params.offset.unwrap_or(0);

    let cases = db::list_cases(&state.pool, auth.user_id, limit, offset).await?;
    Ok(Json(ApiResponse::ok(cases)))
}

// ── PATCH /cases/:id ─────────────────────────────────────────────────────────

/// Update patient metadata on a case.
///
/// Only cases in `pending` status may be updated; attempts on `processing`,
/// `completed`, or `failed` cases are rejected with 400.
pub async fn update_case(
    State(state): State<AppState>,
    auth: AuthUser,
    Path(id): Path<Uuid>,
    Json(body): Json<UpdateCaseRequest>,
) -> Result<impl IntoResponse, CaseError> {
    let case = load_owned_case(&state, auth.user_id, id).await?;

    if case.status != "pending" {
        return Err(CaseError::InvalidState {
            current: case.status,
        });
    }

    let updated = db::update_case(
        &state.pool,
        id,
        body.patient_name,
        body.patient_age,
        body.patient_ethnicity,
    )
    .await?;

    Ok(Json(ApiResponse::ok(updated)))
}

// ── Internal helpers ──────────────────────────────────────────────────────────

/// Load a case by `id` and verify it belongs to `user_id`.
///
/// Returns [`CaseError::NotFound`] when the case does not exist and
/// [`CaseError::Forbidden`] when the case exists but belongs to another user.
async fn load_owned_case(
    state: &AppState,
    user_id: Uuid,
    case_id: Uuid,
) -> Result<crate::models::Case, CaseError> {
    let case = db::find_case_by_id(&state.pool, case_id)
        .await?
        .ok_or(CaseError::NotFound)?;

    if case.user_id != user_id {
        return Err(CaseError::Forbidden);
    }

    Ok(case)
}
