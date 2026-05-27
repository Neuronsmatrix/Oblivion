//! Case-service-specific error type.
//!
//! [`CaseError`] covers domain errors (case not found, ownership violation,
//! invalid state transitions, storage and messaging failures) and a catch-all
//! `Internal` variant. It converts seamlessly into
//! [`oblivion_common::ServiceError`] for uniform HTTP responses across the
//! platform.

use axum::response::{IntoResponse, Response};
use oblivion_common::ServiceError;

/// Domain errors produced by the case service.
#[derive(Debug, thiserror::Error)]
pub enum CaseError {
    /// The requested case record does not exist.
    #[error("case not found")]
    NotFound,

    /// The authenticated user does not own the requested case.
    #[error("access to this case is forbidden")]
    Forbidden,

    /// The operation cannot be performed because the case is in the wrong
    /// lifecycle state (e.g. trying to update a completed case).
    #[error("case is not in a state that allows this operation (current status: {current})")]
    InvalidState {
        /// The current status string.
        current: String,
    },

    /// The uploaded image could not be found in object storage.
    #[error("image not found in object storage at key: {key}")]
    ImageNotFound {
        /// The S3 object key that was checked.
        key: String,
    },

    /// An error occurred while communicating with Kafka.
    #[error("messaging error: {0}")]
    Messaging(String),

    /// An error occurred while communicating with S3 / MinIO.
    #[error("storage error: {0}")]
    Storage(String),

    /// A database operation failed.
    #[error("database error: {0}")]
    Database(String),

    /// Any other internal failure.
    #[error("internal error: {0}")]
    Internal(String),
}

impl From<CaseError> for ServiceError {
    fn from(err: CaseError) -> Self {
        match err {
            CaseError::NotFound => ServiceError::NotFound("case not found".to_owned()),
            CaseError::Forbidden => {
                ServiceError::Forbidden("access to this case is forbidden".to_owned())
            }
            CaseError::InvalidState { current } => ServiceError::BadRequest(format!(
                "case is not in a state that allows this operation (current status: {current})"
            )),
            CaseError::ImageNotFound { key } => {
                ServiceError::BadRequest(format!("image not found in object storage at key: {key}"))
            }
            CaseError::Messaging(msg) => ServiceError::InternalError(format!("messaging: {msg}")),
            CaseError::Storage(msg) => ServiceError::InternalError(format!("storage: {msg}")),
            CaseError::Database(msg) => ServiceError::InternalError(format!("database: {msg}")),
            CaseError::Internal(msg) => ServiceError::InternalError(msg),
        }
    }
}

impl IntoResponse for CaseError {
    fn into_response(self) -> Response {
        ServiceError::from(self).into_response()
    }
}

// ── conversions from external error types ────────────────────────────────────

impl From<sqlx::Error> for CaseError {
    fn from(e: sqlx::Error) -> Self {
        match e {
            sqlx::Error::RowNotFound => CaseError::NotFound,
            other => CaseError::Database(other.to_string()),
        }
    }
}

impl From<jsonwebtoken::errors::Error> for CaseError {
    fn from(e: jsonwebtoken::errors::Error) -> Self {
        CaseError::Internal(format!("jwt: {e}"))
    }
}

impl From<serde_json::Error> for CaseError {
    fn from(e: serde_json::Error) -> Self {
        CaseError::Internal(format!("serialization: {e}"))
    }
}
