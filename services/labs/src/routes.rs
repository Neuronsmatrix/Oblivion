//! Axum router construction for the labs service.

use axum::{
    Router,
    routing::{get, post},
};
use tower_http::trace::TraceLayer;

use crate::{
    handlers::{
        health::health,
        labs::{create_batch, get_results, get_tiers, get_usage},
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
        .route("/labs/batch", post(create_batch))
        .route("/labs/results/{batch_id}", get(get_results))
        .route("/labs/usage", get(get_usage))
        .route("/labs/tiers", get(get_tiers))
        .route("/health", get(health))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}
