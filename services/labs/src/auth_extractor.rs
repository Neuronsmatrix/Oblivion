//! Axum request extractor for JWT bearer tokens used by the labs service.
//!
//! Handler functions that require an authenticated caller simply add `AuthUser`
//! as a parameter. The extractor reads the `Authorization: Bearer <token>`
//! header, decodes the JWT using the configured public key, and either yields
//! the decoded [`Claims`] or rejects the request with HTTP 401.

use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
    response::{IntoResponse, Response},
};
use deadpool_redis::Pool as RedisPool;
use jsonwebtoken::{Algorithm, DecodingKey, TokenData, Validation, decode};
use oblivion_common::{ApiResponse, ServiceError};
use serde::{Deserialize, Serialize};

use crate::config::Config;

// ── Claims ────────────────────────────────────────────────────────────────────

/// JWT payload emitted by the auth service.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Claims {
    /// Subject — the user's UUID as a string.
    pub sub: String,
    /// User's email address.
    pub email: String,
    /// User's role string (`"doctor"`, `"lab"`, `"admin"`).
    pub role: String,
    /// Expiry timestamp (Unix seconds).
    pub exp: usize,
    /// Issued-at timestamp (Unix seconds).
    pub iat: usize,
}

// ── AuthState trait ───────────────────────────────────────────────────────────

/// State subset required by the extractor, kept as a separate trait so any
/// `AppState` can satisfy it without exposing internal fields directly.
pub trait AuthState: Clone + Send + Sync + 'static {
    fn config(&self) -> &Config;
    fn redis_pool(&self) -> &RedisPool;
}

// ── Extractor ─────────────────────────────────────────────────────────────────

/// Holds the validated JWT claims for the current request.
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub claims: Claims,
}

impl<S> FromRequestParts<S> for AuthUser
where
    S: AuthState,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let token = extract_bearer(parts)
            .map_err(IntoResponse::into_response)?
            .to_owned();

        let claims = decode_token(state.config(), &token)
            .map_err(|e| ServiceError::Unauthorized(e).into_response())?;

        Ok(AuthUser { claims })
    }
}

// ── Private helpers ───────────────────────────────────────────────────────────

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

fn decode_token(config: &Config, token: &str) -> Result<Claims, String> {
    let key_pem = config.jwt_public_key.as_bytes();
    let (alg, decoding_key) = if config.jwt_public_key.contains("BEGIN PUBLIC KEY")
        || config.jwt_public_key.contains("BEGIN RSA PUBLIC KEY")
    {
        let key = DecodingKey::from_rsa_pem(key_pem)
            .map_err(|e| format!("invalid RSA public key: {e}"))?;
        (Algorithm::RS256, key)
    } else {
        let key = DecodingKey::from_secret(key_pem);
        (Algorithm::HS256, key)
    };

    let mut validation = Validation::new(alg);
    validation.validate_exp = true;

    let data: TokenData<Claims> = decode(token, &decoding_key, &validation)
        .map_err(|e| format!("token validation failed: {e}"))?;

    Ok(data.claims)
}

// ── Rejection helper ──────────────────────────────────────────────────────────

/// HTTP 401 response produced when token validation fails.
pub struct TokenRejection(pub String);

impl IntoResponse for TokenRejection {
    fn into_response(self) -> Response {
        (
            StatusCode::UNAUTHORIZED,
            axum::Json(ApiResponse::<()>::error(self.0)),
        )
            .into_response()
    }
}
