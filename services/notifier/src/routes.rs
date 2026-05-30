//! Axum router construction for the notifier service.

use axum::{
    Router,
    routing::{get, patch},
};
use tower_http::trace::TraceLayer;

use crate::{
    handlers::{
        health::health,
        notifications::{list_notifications, mark_read},
    },
    state::AppState,
};

/// Build and return the fully configured [`Router`] with all routes attached.
///
/// Layers applied (outermost first):
/// - [`TraceLayer`] — structured per-request tracing.
/// - CORS — origins restricted via `CORS_ALLOWED_ORIGIN` (permissive if unset).
pub fn router(state: AppState) -> Router {
    let cors = oblivion_common::cors_layer_from_env();

    Router::new()
        .route("/notifications", get(list_notifications))
        .route("/notifications/{id}/read", patch(mark_read))
        .route("/health", get(health))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}
