//! Health-check endpoint.

use axum::{Json, response::IntoResponse};

/// `GET /health` — returns a simple liveness response.
pub async fn health() -> impl IntoResponse {
    Json(serde_json::json!({
        "status": "ok",
        "service": "auth",
        "version": "0.1.0"
    }))
}
