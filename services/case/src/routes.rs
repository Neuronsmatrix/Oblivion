//! Axum router construction for the case service.

use axum::{
    routing::{get, post},
    Router,
};

use crate::{
    handlers::{
        cases::{confirm_upload, create_case, get_case, list_cases, update_case},
        health::health,
    },
    state::AppState,
};

/// Build the complete [`Router`] for the case service.
///
/// All routes share the provided `state`.
///
/// | Method | Path                          | Handler            |
/// |--------|-------------------------------|--------------------|
/// | POST   | `/cases`                      | `create_case`      |
/// | GET    | `/cases`                      | `list_cases`       |
/// | GET    | `/cases/:id`                  | `get_case`         |
/// | PATCH  | `/cases/:id`                  | `update_case`      |
/// | POST   | `/cases/:id/confirm-upload`   | `confirm_upload`   |
/// | GET    | `/health`                     | `health`           |
pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/cases", post(create_case).get(list_cases))
        .route("/cases/{id}", get(get_case).patch(update_case))
        .route("/cases/{id}/confirm-upload", post(confirm_upload))
        .route("/health", get(health))
        .with_state(state)
}
