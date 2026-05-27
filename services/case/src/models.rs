//! Domain models and request/response DTOs for the case service.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ── Database row types ────────────────────────────────────────────────────────

/// A clinical case record as stored in the database.
#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct Case {
    /// Unique case identifier.
    pub id: Uuid,
    /// The user (doctor) who owns this case.
    pub user_id: Uuid,
    /// Optional patient name.
    pub patient_name: Option<String>,
    /// Optional patient age in years.
    pub patient_age: Option<i32>,
    /// Optional patient self-reported ethnicity.
    pub patient_ethnicity: Option<String>,
    /// S3 object key for the patient image.
    pub image_key: String,
    /// Lifecycle status: `pending`, `processing`, `completed`, or `failed`.
    pub status: String,
    /// Wall-clock time at which this record was created.
    pub created_at: DateTime<Utc>,
    /// Wall-clock time of the last update.
    pub updated_at: DateTime<Utc>,
}

/// A single ranked differential diagnosis row as stored in the database.
#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct DiagnosisRow {
    /// Unique row identifier.
    pub id: Uuid,
    /// The case this diagnosis belongs to.
    pub case_id: Uuid,
    /// Reference to the syndrome catalogue entry (may be absent for unknown syndromes).
    pub syndrome_id: Option<Uuid>,
    /// Human-readable syndrome name captured at analysis time.
    pub syndrome_name: String,
    /// Model confidence score in `[0.0, 1.0]`.
    pub confidence: f64,
    /// 1-based rank in the differential list (`1` = most likely).
    pub rank: i32,
    /// Wall-clock time at which this diagnosis was inserted.
    pub created_at: DateTime<Utc>,
}

// ── Request DTOs ──────────────────────────────────────────────────────────────

/// Payload for `POST /cases`.
#[derive(Debug, Deserialize)]
pub struct CreateCaseRequest {
    /// Optional patient name.
    pub patient_name: Option<String>,
    /// Optional patient age in years.
    pub patient_age: Option<i32>,
    /// Optional self-reported patient ethnicity.
    pub patient_ethnicity: Option<String>,
}

/// Payload for `PATCH /cases/:id`.
#[derive(Debug, Deserialize)]
pub struct UpdateCaseRequest {
    /// New patient name, if being changed.
    pub patient_name: Option<String>,
    /// New patient age in years, if being changed.
    pub patient_age: Option<i32>,
    /// New patient ethnicity, if being changed.
    pub patient_ethnicity: Option<String>,
}

/// Query parameters for `GET /cases`.
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    /// Maximum number of results to return (default handled in handler).
    pub limit: Option<i64>,
    /// Number of results to skip (default handled in handler).
    pub offset: Option<i64>,
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

/// Response for `POST /cases`.
#[derive(Debug, Serialize)]
pub struct CreateCaseResponse {
    /// The newly created case identifier.
    pub case_id: Uuid,
    /// Presigned PUT URL for uploading the image directly to MinIO/S3.
    pub upload_url: String,
    /// The S3 object key the client must upload to.
    pub image_key: String,
}

/// A case record together with its resolved differential diagnoses.
#[derive(Debug, Serialize)]
pub struct CaseWithDiagnoses {
    /// The case fields, flattened into the JSON object.
    #[serde(flatten)]
    pub case: Case,
    /// Ranked differential diagnoses, empty until analysis completes.
    pub diagnoses: Vec<DiagnosisRow>,
}
