//! HTTP request handlers for the recognition service.
//!
//! These endpoints exist for direct testing and health checks. In production
//! the service operates exclusively through the Kafka consumer loop; the HTTP
//! interface provides a convenient way to exercise the diagnosis generator
//! without a running Kafka cluster.
//!
//! # Routes
//!
//! | Method | Path         | Description                        |
//! |--------|--------------|------------------------------------|
//! | POST   | `/recognize` | Generate a mock `AnalysisResult`.  |
//! | GET    | `/health`    | Return service health information. |

use axum::{Json, extract::State, response::IntoResponse};
use chrono::Utc;
use oblivion_common::{AnalysisResult, AnalysisSource, ApiResponse};
use serde_json::json;
use uuid::Uuid;

use crate::generator::generate_random_diagnoses;
use crate::state::AppState;

/// Generate a mock [`AnalysisResult`] with random diagnoses.
///
/// This endpoint simulates the recognition pipeline without any Kafka
/// involvement and returns the result immediately (no artificial delay).
/// It is intended for integration tests and local development.
///
/// # Response
///
/// `200 OK` with an [`ApiResponse`] wrapping a freshly-generated
/// [`AnalysisResult`] whose `request_id` and `case_id` are new random UUIDs.
pub async fn recognize(State(state): State<AppState>) -> impl IntoResponse {
    let top_diagnoses = generate_random_diagnoses(&state.syndromes);

    let result = AnalysisResult {
        request_id: Uuid::new_v4(),
        case_id: Uuid::new_v4(),
        source: AnalysisSource::Doctor,
        batch_id: None,
        top_diagnoses,
        processing_time_ms: 0,
        completed_at: Utc::now(),
    };

    ApiResponse::ok(result)
}

/// Return a simple JSON health payload.
///
/// Used by load balancers, container orchestrators, and CI smoke tests to
/// verify that the service is running and its HTTP server is reachable.
pub async fn health() -> impl IntoResponse {
    Json(json!({
        "status":  "ok",
        "service": "recognition",
        "version": "0.1.0"
    }))
}
