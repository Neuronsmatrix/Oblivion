//! Axum router construction for the billing service.

use axum::{
    Router,
    routing::{get, post},
};
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};

use crate::{
    handlers::{
        billing::{check_quota, get_usage, list_plans, subscribe},
        health::health,
    },
    state::AppState,
};

/// Build and return the fully configured [`Router`] with all routes attached.
///
/// Layers applied (outermost first):
/// - [`TraceLayer`] — structured per-request tracing.
/// - [`CorsLayer`] — permissive CORS for development.
pub fn router(state: AppState) -> Router {
    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    Router::new()
        .route("/billing/plans", get(list_plans))
        .route("/billing/subscribe", post(subscribe))
        .route("/billing/usage/{lab_id}", get(get_usage))
        .route("/billing/check-quota", post(check_quota))
        .route("/health", get(health))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}
