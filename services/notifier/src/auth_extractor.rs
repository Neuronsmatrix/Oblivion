//! Axum request extractor for JWT bearer tokens (notifier service).
//!
//! Handler functions that need an authenticated user add [`AuthUser`] as a
//! parameter. The extractor reads the `Authorization: Bearer <token>` header,
//! decodes the JWT using the public key (RS256) or shared secret (HS256) from
//! [`Config`], and either yields the authenticated user or rejects the request
//! with HTTP 401.
//!
//! Unlike the auth service's extractor, this variant has no Redis blacklist
//! check because the notifier service does not have a Redis dependency. Tokens
//! are validated purely by signature and expiry.
//!
//! # Example
//!
//! ```rust,ignore
//! async fn list(AuthUser { user_id, .. }: AuthUser, ...) -> impl IntoResponse { ... }
//! ```

use axum::{
    extract::FromRequestParts,
    http::request::Parts,
    response::{IntoResponse, Response},
};
use jsonwebtoken::{Algorithm, DecodingKey, TokenData, Validation, decode};
use oblivion_common::ServiceError;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{config::Config, error::NotifierError};

// ── Claims ────────────────────────────────────────────────────────────────────

/// JWT payload extracted from every authenticated request.
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

// ── Authenticated user ────────────────────────────────────────────────────────

/// Extracted and validated identity for the current request.
///
/// All fields are part of the public API; handlers may use any subset.
#[derive(Debug, Clone)]
#[allow(dead_code)]
pub struct AuthUser {
    /// Parsed user UUID from the `sub` claim.
    pub user_id: Uuid,
    /// Email from the token claims.
    pub email: String,
    /// Role string from the token claims.
    pub role: String,
}

// ── State trait ───────────────────────────────────────────────────────────────

/// State subset required by the extractor.
///
/// Any `AppState` that implements this trait can serve the extractor.
pub trait NotifierAuthState: Clone + Send + Sync + 'static {
    fn config(&self) -> &Config;
}

// ── FromRequestParts implementation ──────────────────────────────────────────

impl<S> FromRequestParts<S> for AuthUser
where
    S: NotifierAuthState,
{
    type Rejection = Response;

    async fn from_request_parts(parts: &mut Parts, state: &S) -> Result<Self, Self::Rejection> {
        let token = extract_bearer(parts)
            .map_err(IntoResponse::into_response)?
            .to_owned();

        let claims = decode_token(state.config(), &token)
            .map_err(IntoResponse::into_response)?;

        let user_id = claims
            .sub
            .parse::<Uuid>()
            .map_err(|_| {
                ServiceError::Unauthorized("JWT sub is not a valid UUID".to_owned())
                    .into_response()
            })?;

        Ok(AuthUser {
            user_id,
            email: claims.email,
            role: claims.role,
        })
    }
}

// ── Private helpers ───────────────────────────────────────────────────────────

/// Pull the bearer token out of the `Authorization` header.
fn extract_bearer(parts: &Parts) -> Result<&str, ServiceError> {
    let header = parts
        .headers
        .get(axum::http::header::AUTHORIZATION)
        .and_then(|v| v.to_str().ok())
        .ok_or_else(|| {
            ServiceError::Unauthorized("missing Authorization header".to_owned())
        })?;

    header
        .strip_prefix("Bearer ")
        .ok_or_else(|| ServiceError::Unauthorized("malformed Authorization header".to_owned()))
}

/// Decode and validate the JWT signature and expiry.
fn decode_token(config: &Config, token: &str) -> Result<Claims, NotifierError> {
    let (alg, key) = decoding_parts(config)?;

    let mut validation = Validation::new(alg);
    validation.validate_exp = true;

    let data: TokenData<Claims> = decode(token, &key, &validation)?;
    Ok(data.claims)
}

fn decoding_parts(
    config: &Config,
) -> Result<(Algorithm, DecodingKey), NotifierError> {
    if config.jwt_use_rsa {
        let key = DecodingKey::from_rsa_pem(config.jwt_public_key.as_bytes())
            .map_err(|_| NotifierError::TokenInvalid)?;
        Ok((Algorithm::RS256, key))
    } else {
        let key = DecodingKey::from_secret(config.jwt_public_key.as_bytes());
        Ok((Algorithm::HS256, key))
    }
}
