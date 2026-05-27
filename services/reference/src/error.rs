//! Reference-service-specific error type.
//!
//! [`ReferenceError`] maps domain and infrastructure failures onto
//! [`oblivion_common::ServiceError`] for uniform HTTP responses.

use axum::response::{IntoResponse, Response};
use oblivion_common::ServiceError;

/// Domain errors produced by the reference service.
#[derive(Debug, thiserror::Error)]
pub enum ReferenceError {
    /// The requested resource does not exist.
    #[error("not found: {0}")]
    NotFound(String),

    /// A query parameter is malformed or out of range.
    #[error("bad request: {0}")]
    BadRequest(String),

    /// The caller is not authenticated.
    #[error("unauthorized: {0}")]
    Unauthorized(String),

    /// Any other internal failure.
    #[error("internal error: {0}")]
    Internal(String),
}

impl From<ReferenceError> for ServiceError {
    fn from(err: ReferenceError) -> Self {
        match err {
            ReferenceError::NotFound(msg) => ServiceError::NotFound(msg),
            ReferenceError::BadRequest(msg) => ServiceError::BadRequest(msg),
            ReferenceError::Unauthorized(msg) => ServiceError::Unauthorized(msg),
            ReferenceError::Internal(msg) => ServiceError::InternalError(msg),
        }
    }
}

impl IntoResponse for ReferenceError {
    fn into_response(self) -> Response {
        ServiceError::from(self).into_response()
    }
}

// ── Conversions from infrastructure error types ───────────────────────────────

impl From<sqlx::Error> for ReferenceError {
    fn from(e: sqlx::Error) -> Self {
        ReferenceError::Internal(e.to_string())
    }
}

impl From<reqwest::Error> for ReferenceError {
    fn from(e: reqwest::Error) -> Self {
        ReferenceError::Internal(format!("elasticsearch request error: {e}"))
    }
}
