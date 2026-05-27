//! JWT authentication extractor for the case service.
//!
//! Implements `FromRequestParts` for [`AuthUser`], which extracts and validates
//! the Bearer token from the `Authorization` header.  The service only
//! *verifies* tokens — it never issues them — so only the public key (or the
//! HS256 shared secret) is needed.

use axum::{
    extract::FromRequestParts,
    http::{header, request::Parts},
};
use jsonwebtoken::{decode, Algorithm, DecodingKey, Validation};
use oblivion_common::ServiceError;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::state::AppState;

/// Claims embedded in a platform JWT.
#[derive(Debug, Serialize, Deserialize)]
struct Claims {
    /// Subject — the user's UUID in string form.
    sub: String,
    /// User's e-mail address.
    email: String,
    /// User role string (`"doctor"`, `"lab"`, `"admin"`).
    role: String,
    /// Expiry timestamp (Unix seconds).
    exp: usize,
    /// Issued-at timestamp (Unix seconds).
    iat: usize,
}

/// Represents the authenticated caller after successful JWT validation.
#[derive(Debug, Clone)]
#[allow(dead_code)] // fields are part of the public API, consumed by handlers
pub struct AuthUser {
    /// The authenticated user's UUID.
    pub user_id: Uuid,
    /// The authenticated user's e-mail address.
    pub email: String,
    /// The authenticated user's role string.
    pub role: String,
}

impl FromRequestParts<AppState> for AuthUser {
    type Rejection = ServiceError;

    async fn from_request_parts(
        parts: &mut Parts,
        state: &AppState,
    ) -> Result<Self, Self::Rejection> {
        // Extract the Authorization header.
        let auth_header = parts
            .headers
            .get(header::AUTHORIZATION)
            .and_then(|v| v.to_str().ok())
            .ok_or_else(|| ServiceError::Unauthorized("missing Authorization header".to_owned()))?;

        // Expect a `Bearer <token>` scheme.
        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or_else(|| {
                ServiceError::Unauthorized("Authorization header must use Bearer scheme".to_owned())
            })?;

        // Choose the decoding key based on whether RSA is available.
        let decoding_key = if state.config.jwt_use_rsa {
            DecodingKey::from_rsa_pem(state.config.jwt_public_key.as_bytes()).map_err(|e| {
                ServiceError::InternalError(format!("invalid JWT public key: {e}"))
            })?
        } else {
            DecodingKey::from_secret(state.config.jwt_public_key.as_bytes())
        };

        let algorithm = if state.config.jwt_use_rsa {
            Algorithm::RS256
        } else {
            Algorithm::HS256
        };

        let mut validation = Validation::new(algorithm);
        validation.validate_exp = true;

        let token_data = decode::<Claims>(token, &decoding_key, &validation)
            .map_err(|e| {
                use jsonwebtoken::errors::ErrorKind;
                match e.kind() {
                    ErrorKind::ExpiredSignature => {
                        ServiceError::Unauthorized("token has expired".to_owned())
                    }
                    _ => ServiceError::Unauthorized(format!("invalid token: {e}")),
                }
            })?;

        let claims = token_data.claims;

        let user_id = Uuid::parse_str(&claims.sub).map_err(|_| {
            ServiceError::Unauthorized("token subject is not a valid UUID".to_owned())
        })?;

        Ok(AuthUser {
            user_id,
            email: claims.email,
            role: claims.role,
        })
    }
}
