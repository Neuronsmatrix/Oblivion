//! Axum router construction for the reference service.

use axum::{
    Router,
    routing::get,
};
use tower_http::{
    cors::{Any, CorsLayer},
    trace::TraceLayer,
};

use crate::{
    handlers::{
        health::health,
        hpo::search_hpo,
        syndromes::{get_syndrome, list_syndromes},
    },
    state::AppState,
};

/// Build and return the fully configured [`Router`] with all routes attached.
///
/// Routes:
/// - `GET /reference/syndromes` — list / search syndromes
/// - `GET /reference/syndromes/{id}` — fetch syndrome with HPO terms
/// - `GET /reference/hpo/search` — search HPO terms
/// - `GET /health` — liveness probe
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
        .route("/reference/syndromes", get(list_syndromes))
        .route("/reference/syndromes/{id}", get(get_syndrome))
        .route("/reference/hpo/search", get(search_hpo))
        .route("/health", get(health))
        .layer(TraceLayer::new_for_http())
        .layer(cors)
        .with_state(state)
}
