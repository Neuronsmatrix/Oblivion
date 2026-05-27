//! Billing-service-specific error type.
//!
//! [`BillingError`] covers domain errors (plan not found, no active
//! subscription, quota exceeded) and a catch-all `Internal` variant. It
//! converts seamlessly into [`oblivion_common::ServiceError`] for uniform HTTP
//! responses across the platform.

use axum::response::{IntoResponse, Response};
use deadpool_redis::redis;
use oblivion_common::ServiceError;

/// Domain errors produced by the billing service.
#[derive(Debug, thiserror::Error)]
pub enum BillingError {
    /// The requested plan does not exist.
    #[error("plan not found")]
    PlanNotFound,

    /// The lab has no active subscription.
    #[error("no active subscription for lab")]
    NoActiveSubscription,

    /// The lab has exhausted its monthly quota.
    #[error("quota exceeded")]
    QuotaExceeded,

    /// A subscription already exists for this lab.
    #[error("subscription already exists")]
    SubscriptionAlreadyExists,

    /// Any other internal failure.
    #[error("internal error: {0}")]
    Internal(String),
}

impl From<BillingError> for ServiceError {
    fn from(err: BillingError) -> Self {
        match err {
            BillingError::PlanNotFound => ServiceError::NotFound("plan not found".to_owned()),
            BillingError::NoActiveSubscription => {
                ServiceError::NotFound("no active subscription".to_owned())
            }
            BillingError::QuotaExceeded => {
                ServiceError::Forbidden("monthly quota exceeded".to_owned())
            }
            BillingError::SubscriptionAlreadyExists => {
                ServiceError::Conflict("subscription already exists".to_owned())
            }
            BillingError::Internal(msg) => ServiceError::InternalError(msg),
        }
    }
}

impl IntoResponse for BillingError {
    fn into_response(self) -> Response {
        ServiceError::from(self).into_response()
    }
}

// ── Conversions from external error types ────────────────────────────────────

impl From<sqlx::Error> for BillingError {
    fn from(e: sqlx::Error) -> Self {
        BillingError::Internal(e.to_string())
    }
}

impl From<deadpool_redis::PoolError> for BillingError {
    fn from(e: deadpool_redis::PoolError) -> Self {
        BillingError::Internal(format!("redis pool error: {e}"))
    }
}

impl From<redis::RedisError> for BillingError {
    fn from(e: redis::RedisError) -> Self {
        BillingError::Internal(format!("redis error: {e}"))
    }
}
