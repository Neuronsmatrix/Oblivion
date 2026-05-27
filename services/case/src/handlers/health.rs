//! Health-check endpoint.

use axum::response::IntoResponse;
use axum::Json;
use serde_json::json;

/// `GET /health` — returns a simple liveness probe response.
///
/// # Example response
///
/// ```json
/// {"status":"ok","service":"case","version":"0.1.0"}
/// ```
pub async fn health() -> impl IntoResponse {
    Json(json!({
        "status": "ok",
        "service": "case",
        "version": "0.1.0"
    }))
}
