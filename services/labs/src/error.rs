//! Labs-service-specific error type.
//!
//! [`LabsError`] covers domain errors (batch not found, quota exceeded,
//! rate limited) and a catch-all `Internal` variant. It converts seamlessly
//! into [`oblivion_common::ServiceError`] for uniform HTTP responses across
//! the platform.

use axum::response::{IntoResponse, Response};
use deadpool_redis::redis;
use oblivion_common::ServiceError;

/// Domain errors produced by the labs service.
#[derive(Debug, thiserror::Error)]
pub enum LabsError {
    /// The requested batch does not exist or does not belong to this lab.
    #[error("batch not found")]
    BatchNotFound,

    /// The lab has no active billing subscription.
    #[error("no active subscription")]
    NoActiveSubscription,

    /// The lab has exhausted its monthly analysis quota.
    #[error("monthly quota exceeded")]
    QuotaExceeded,

    /// The caller has sent too many requests in the configured time window.
    #[error("rate limit exceeded")]
    RateLimitExceeded,

    /// The request was made by a user whose role does not permit this action.
    #[error("forbidden: {0}")]
    Forbidden(String),

    /// The request payload was invalid.
    #[error("bad request: {0}")]
    BadRequest(String),

    /// Any other internal failure.
    #[error("internal error: {0}")]
    Internal(String),
}

impl From<LabsError> for ServiceError {
    fn from(err: LabsError) -> Self {
        match err {
            LabsError::BatchNotFound => ServiceError::NotFound("batch not found".to_owned()),
            LabsError::NoActiveSubscription => {
                ServiceError::Forbidden("no active subscription".to_owned())
            }
            LabsError::QuotaExceeded => {
                ServiceError::Forbidden("monthly quota exceeded".to_owned())
            }
            LabsError::RateLimitExceeded => {
                ServiceError::Forbidden("rate limit exceeded".to_owned())
            }
            LabsError::Forbidden(msg) => ServiceError::Forbidden(msg),
            LabsError::BadRequest(msg) => ServiceError::BadRequest(msg),
            LabsError::Internal(msg) => ServiceError::InternalError(msg),
        }
    }
}

impl IntoResponse for LabsError {
    fn into_response(self) -> Response {
        ServiceError::from(self).into_response()
    }
}

// ── Conversions from external error types ────────────────────────────────────

impl From<sqlx::Error> for LabsError {
    fn from(e: sqlx::Error) -> Self {
        LabsError::Internal(e.to_string())
    }
}

impl From<deadpool_redis::PoolError> for LabsError {
    fn from(e: deadpool_redis::PoolError) -> Self {
        LabsError::Internal(format!("redis pool error: {e}"))
    }
}

impl From<redis::RedisError> for LabsError {
    fn from(e: redis::RedisError) -> Self {
        LabsError::Internal(format!("redis error: {e}"))
    }
}

impl From<reqwest::Error> for LabsError {
    fn from(e: reqwest::Error) -> Self {
        LabsError::Internal(format!("http client error: {e}"))
    }
}

impl From<serde_json::Error> for LabsError {
    fn from(e: serde_json::Error) -> Self {
        LabsError::Internal(format!("json error: {e}"))
    }
}
