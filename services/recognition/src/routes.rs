//! Axum router configuration for the recognition service.
//!
//! # Example
//!
//! ```rust,ignore
//! use oblivion_recognition::{routes::router, state::AppState, syndromes::get_syndromes};
//!
//! let state = AppState { syndromes: get_syndromes() };
//! let _app = router(state);
//! ```

use axum::{Router, routing::{get, post}};

use crate::handlers::{health, recognize};
use crate::state::AppState;

/// Build and return the application [`Router`] with shared `state` injected.
#[must_use]
pub fn router(state: AppState) -> Router {
    Router::new()
        .route("/recognize", post(recognize))
        .route("/health", get(health))
        .with_state(state)
}
