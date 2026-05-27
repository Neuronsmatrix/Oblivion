//! Axum request extractor for JWT bearer tokens.
//!
//! Handler functions that need an authenticated caller add `AuthUser` as a
//! parameter.  The extractor reads the `Authorization: Bearer <token>` header,
//! decodes the JWT against the configured public key, and either yields the
//! [`Claims`] or rejects the request with HTTP 401.
//!
//! The reference service is read-only and does not maintain a Redis blacklist,
//! so token revocation is not enforced here.

use axum::{
    extract::FromRequestParts,
    http::{StatusCode, request::Parts},
    response::{IntoResponse, Response},
};
use jsonwebtoken::{Algorithm, DecodingKey, TokenData, Validation, decode};
use oblivion_common::ServiceError;
use serde::{Deserialize, Serialize};

use crate::state::AppState;

// ── Claims ─────────────────────────────────────────────────────────────────────

/// JWT payload for Oblivion access tokens.
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

// ── Extractor ─────────────────────────────────────────────────────────────────

/// Holds the validated JWT claims for the current request.
#[derive(Debug, Clone)]
pub struct AuthUser {
    /// Validated claims from the bearer token.
    pub claims: Claims,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = Response;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        let token = extract_bearer(parts)
            .map_err(IntoResponse::into_response)?
            .to_owned();

        let claims = decode_token(&state.config.jwt_public_key, state.config.jwt_use_rsa, &token)
            .map_err(|e| e.into_response())?;

        Ok(AuthUser { claims })
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/// Pull the bearer token string out of the `Authorization` header.
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

/// Decode and validate a JWT, returning its [`Claims`].
fn decode_token(
    public_key: &str,
    use_rsa: bool,
    token: &str,
) -> Result<Claims, ServiceError> {
    let (alg, key) = if use_rsa {
        let k = DecodingKey::from_rsa_pem(public_key.as_bytes()).map_err(|_| {
            ServiceError::Unauthorized("invalid JWT public key".to_owned())
        })?;
        (Algorithm::RS256, k)
    } else {
        let k = DecodingKey::from_secret(public_key.as_bytes());
        (Algorithm::HS256, k)
    };

    let mut validation = Validation::new(alg);
    validation.validate_exp = true;

    let data: TokenData<Claims> =
        decode(token, &key, &validation).map_err(|e| {
            use jsonwebtoken::errors::ErrorKind;
            match e.kind() {
                ErrorKind::ExpiredSignature => {
                    ServiceError::Unauthorized("token has expired".to_owned())
                }
                _ => ServiceError::Unauthorized("token is invalid".to_owned()),
            }
        })?;

    Ok(data.claims)
}

// ── Rejection helper ──────────────────────────────────────────────────────────

/// HTTP 401 response used when authentication fails.
pub struct Unauthenticated(pub String);

impl IntoResponse for Unauthenticated {
    fn into_response(self) -> Response {
        (
            StatusCode::UNAUTHORIZED,
            axum::Json(oblivion_common::ApiResponse::<()>::error(self.0)),
        )
            .into_response()
    }
}
