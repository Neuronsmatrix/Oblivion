//! Domain models for the labs service.
//!
//! All database-mapped types derive [`sqlx::FromRow`]. Request/response types
//! use [`serde`] for JSON serialisation/deserialisation.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ── Database models ───────────────────────────────────────────────────────────

/// A bulk-analysis batch created by a lab.
#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Batch {
    pub id: Uuid,
    pub lab_id: Uuid,
    /// Lifecycle status: `"pending"`, `"processing"`, `"completed"`, `"failed"`.
    pub status: String,
    /// Total number of images submitted in this batch.
    pub total_items: i32,
    /// Number of items that have been processed so far.
    pub processed_items: i32,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// A single image item within a batch.
#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct BatchItem {
    pub id: Uuid,
    pub batch_id: Uuid,
    /// S3 object key for the image.
    pub image_key: String,
    /// The case ID created by the recognition service, populated on completion.
    pub case_id: Option<Uuid>,
    /// Item status: `"pending"`, `"processing"`, `"completed"`, `"failed"`.
    pub status: String,
    pub created_at: DateTime<Utc>,
}

/// Helper struct used when bulk-inserting batch items.
#[derive(Debug)]
pub struct BatchItemInsert {
    pub image_key: String,
}

// ── Request types ─────────────────────────────────────────────────────────────

/// Body for `POST /labs/batch`.
#[derive(Debug, Deserialize)]
pub struct CreateBatchRequest {
    /// S3 object keys for the images to analyse.
    pub image_keys: Vec<String>,
}

// ── Response types ────────────────────────────────────────────────────────────

/// Full batch detail including its items.
#[derive(Debug, Serialize)]
pub struct BatchResponse {
    pub batch: Batch,
    pub items: Vec<BatchItem>,
}
