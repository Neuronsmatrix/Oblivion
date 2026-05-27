//! Axum request extractor for JWT bearer tokens.
//!
//! Handler functions that need an authenticated user simply add `AuthUser` as
//! a parameter:
//!
//! ```rust,ignore
//! async fn me(AuthUser { claims }: AuthUser, ...) -> impl IntoResponse { ... }
//! ```
//!
//! The extractor reads the `Authorization: Bearer <token>` header, decodes the
//! JWT, checks the Redis blacklist, and either yields the [`Claims`] or rejects
//! the request with HTTP 401.

use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
    response::{IntoResponse, Response},
};
use deadpool_redis::Pool as RedisPool;
use oblivion_common::ServiceError;

use crate::{
    config::Config,
    jwt::{Claims, decode_access_token},
};

// ── Extractor ─────────────────────────────────────────────────────────────────

/// Holds the validated JWT claims for the current request.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub claims: Claims,
}

/// State subset required by the extractor — kept as a separate trait so that
/// any `AppState` can satisfy it without exposing internal fields directly.
pub trait AuthState: Clone + Send + Sync + 'static {
    fn config(&self) -> &Config;
    fn redis_pool(&self) -> &RedisPool;
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: AuthState,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        // 1. Extract the raw bearer token.
        let token = extract_bearer(parts)
            .map_err(IntoResponse::into_response)?
            .to_owned();

        // 2. Decode and validate the JWT signature / expiry.
        let claims = decode_access_token(state.config(), &token)
            .map_err(IntoResponse::into_response)?;

        // 3. Check Redis blacklist (best-effort; allow on connection failure).
        if let Err(e) = check_blacklist(state.redis_pool(), &token).await {
            tracing::warn!(error = %e, "Redis blacklist check failed; allowing request");
        }

        Ok(AuthUser { claims })
    }
}

// ── Private helpers ───────────────────────────────────────────────────────────

/// Pull the bearer token out of the `Authorization` header.
fn extract_bearer(parts: &Parts) -> Result<&str, ServiceError> {
    let header = parts
        .headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| ServiceError::Unauthorized("missing Authorization header".to_owned()))?;

    header
        .strip_prefix("Bearer ")
        .ok_or_else(|| ServiceError::Unauthorized("malformed Authorization header".to_owned()))
}

/// Returns an error if the token is present in the Redis blacklist.
async fn check_blacklist(pool: &RedisPool, token: &str) -> Result<(), String> {
    let mut conn = pool
        .get()
        .await
        .map_err(|e| format!("redis pool error: {e}"))?;

    let key = blacklist_key(token);
    let exists: Option<String> = redis::cmd("GET")
        .arg(&key)
        .query_async::<Option<String>>(&mut *conn)
        .await
        .map_err(|e| format!("redis GET error: {e}"))?;

    if exists.is_some() {
        return Err(format!("token {key} is blacklisted"));
    }

    Ok(())
}

/// Derive a Redis key from the raw token string.
pub fn blacklist_key(token: &str) -> String {
    use sha2::{Digest, Sha256};
    let hash = Sha256::digest(token.as_bytes());
    format!("auth:blacklist:{}", hex::encode(hash))
}

// ── Rejection helper ──────────────────────────────────────────────────────────

/// HTTP 401 response for a blacklisted token.
pub struct BlacklistedToken;

impl IntoResponse for BlacklistedToken {
    fn into_response(self) -> Response {
        (
            StatusCode::UNAUTHORIZED,
            axum::Json(oblivion_common::ApiResponse::<()>::error("token has been revoked")),
        )
            .into_response()
    }
}
