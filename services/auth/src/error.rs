//! Auth-service-specific error type.
//!
//! [`AuthError`] covers domain errors (invalid credentials, token problems,
//! duplicate accounts) and a catch-all `Internal` variant. It converts
//! seamlessly into [`oblivion_common::ServiceError`] for uniform HTTP
//! responses across the platform.

use axum::response::{IntoResponse, Response};
use oblivion_common::ServiceError;

/// Domain errors produced by the auth service.
#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    /// Email/password pair did not match any user record.
    #[error("invalid credentials")]
    InvalidCredentials,

    /// The JWT access token has passed its `exp` timestamp.
    #[error("token has expired")]
    TokenExpired,

    /// The JWT could not be decoded or its signature is wrong.
    #[error("token is invalid")]
    TokenInvalid,

    /// A registration was attempted for an email that already exists.
    #[error("user already exists")]
    UserAlreadyExists,

    /// Any other internal failure (wraps the underlying message).
    #[error("internal error: {0}")]
    Internal(String),
}

impl From<AuthError> for ServiceError {
    fn from(err: AuthError) -> Self {
        match err {
            AuthError::InvalidCredentials => {
                ServiceError::Unauthorized("invalid credentials".to_owned())
            }
            AuthError::TokenExpired => ServiceError::Unauthorized("token has expired".to_owned()),
            AuthError::TokenInvalid => ServiceError::Unauthorized("token is invalid".to_owned()),
            AuthError::UserAlreadyExists => {
                ServiceError::Conflict("user already exists".to_owned())
            }
            AuthError::Internal(msg) => ServiceError::InternalError(msg),
        }
    }
}

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        ServiceError::from(self).into_response()
    }
}

// ── conversions from external error types ────────────────────────────────────

impl From<sqlx::Error> for AuthError {
    fn from(e: sqlx::Error) -> Self {
        AuthError::Internal(e.to_string())
    }
}

impl From<jsonwebtoken::errors::Error> for AuthError {
    fn from(e: jsonwebtoken::errors::Error) -> Self {
        use jsonwebtoken::errors::ErrorKind;
        match e.kind() {
            ErrorKind::ExpiredSignature => AuthError::TokenExpired,
            _ => AuthError::TokenInvalid,
        }
    }
}

impl From<argon2::password_hash::Error> for AuthError {
    fn from(_: argon2::password_hash::Error) -> Self {
        AuthError::InvalidCredentials
    }
}
