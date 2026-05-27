//! Handlers for notification list and mark-as-read endpoints.

use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
};
use oblivion_common::ApiResponse;
use uuid::Uuid;

use crate::{
    auth_extractor::AuthUser,
    db,
    error::NotifierError,
    models::PaginationParams,
    state::AppState,
};

// ── List notifications ────────────────────────────────────────────────────────

/// `GET /notifications?limit=20&offset=0`
///
/// Returns a paginated list of notifications belonging to the authenticated
/// user, ordered most-recent first.
///
/// * `limit` is capped at 100 and defaults to 20.
/// * `offset` defaults to 0.
pub async fn list_notifications(
    auth: AuthUser,
    State(state): State<AppState>,
    Query(params): Query<PaginationParams>,
) -> Result<impl IntoResponse, NotifierError> {
    let limit = params.limit.unwrap_or(20).min(100).max(1);
    let offset = params.offset.unwrap_or(0).max(0);

    let notifications =
        db::list_notifications(&state.pool, auth.user_id, limit, offset).await?;

    Ok(ApiResponse::ok(notifications))
}

// ── Mark as read ──────────────────────────────────────────────────────────────

/// `PATCH /notifications/:id/read`
///
/// Marks the notification identified by `id` as read.
///
/// Returns HTTP 404 if the notification does not exist, HTTP 403 if it belongs
/// to a different user, and HTTP 200 on success.
pub async fn mark_read(
    auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, NotifierError> {
    let notification = db::find_notification_by_id(&state.pool, id)
        .await?
        .ok_or_else(|| NotifierError::NotFound(format!("notification {id} not found")))?;

    if notification.user_id != auth.user_id {
        return Err(NotifierError::Forbidden(
            "notification does not belong to this user".to_owned(),
        ));
    }

    db::mark_as_read(&state.pool, id).await?;

    Ok(ApiResponse::ok("marked as read"))
}
