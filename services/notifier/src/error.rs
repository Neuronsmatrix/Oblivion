//! Notifier-service-specific error type.
//!
//! [`NotifierError`] covers database failures, JWT validation problems, and
//! authorisation errors. It converts seamlessly into
//! [`oblivion_common::ServiceError`] for uniform HTTP responses across the
//! platform.

use axum::response::{IntoResponse, Response};
use oblivion_common::ServiceError;

/// Domain errors produced by the notifier service.
#[derive(Debug, thiserror::Error)]
pub enum NotifierError {
    /// A database operation failed.
    #[error("database error: {0}")]
    Database(String),

    /// The JWT bearer token is missing, malformed, or has an invalid signature.
    #[error("token is invalid")]
    TokenInvalid,

    /// The JWT bearer token has passed its `exp` timestamp.
    #[error("token has expired")]
    TokenExpired,

    /// The caller is not allowed to access the requested resource.
    #[error("forbidden: {0}")]
    Forbidden(String),

    /// The requested notification does not exist.
    #[error("not found: {0}")]
    NotFound(String),

    /// Any other unexpected failure.
    #[error("internal error: {0}")]
    Internal(String),
}

impl From<NotifierError> for ServiceError {
    fn from(err: NotifierError) -> Self {
        match err {
            NotifierError::Database(msg) | NotifierError::Internal(msg) => {
                ServiceError::InternalError(msg)
            }
            NotifierError::TokenInvalid => {
                ServiceError::Unauthorized("token is invalid".to_owned())
            }
            NotifierError::TokenExpired => {
                ServiceError::Unauthorized("token has expired".to_owned())
            }
            NotifierError::Forbidden(msg) => ServiceError::Forbidden(msg),
            NotifierError::NotFound(msg) => ServiceError::NotFound(msg),
        }
    }
}

impl IntoResponse for NotifierError {
    fn into_response(self) -> Response {
        ServiceError::from(self).into_response()
    }
}

// ── conversions from external error types ────────────────────────────────────

impl From<sqlx::Error> for NotifierError {
    fn from(e: sqlx::Error) -> Self {
        NotifierError::Database(e.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for NotifierError {
    fn from(e: jsonwebtoken::errors::Error) -> Self {
        use jsonwebtoken::errors::ErrorKind;
        match e.kind() {
            ErrorKind::ExpiredSignature => NotifierError::TokenExpired,
            _ => NotifierError::TokenInvalid,
        }
    }
}
