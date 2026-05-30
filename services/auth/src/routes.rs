//! Axum router construction for the auth service.

use axum::{
    Router,
    routing::{delete, get, post},
};
use tower_http::trace::TraceLayer;

use crate::{
    handlers::{
        auth::{login, logout, me, refresh, register},
        health::health,
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
        .route("/auth/register", post(register))
        .route("/auth/login", post(login))
        .route("/auth/refresh", post(refresh))
        .route("/auth/me", get(me))
        .route("/auth/logout", delete(logout))
        .route("/health", get(health))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}
