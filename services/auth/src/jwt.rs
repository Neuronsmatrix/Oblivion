//! JWT encoding and decoding utilities.
//!
//! When RSA keys are available the service uses RS256. Otherwise it falls
//! back to HS256 with the generated development secret stored in [`Config`].
//! The public interface is algorithm-agnostic: callers only see
//! [`encode_access_token`] and [`decode_access_token`].

use chrono::Utc;
use jsonwebtoken::{
    Algorithm, DecodingKey, EncodingKey, Header, TokenData, Validation, decode, encode,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{config::Config, error::AuthError};

// ── Claims ────────────────────────────────────────────────────────────────────

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

// ── Encoding ──────────────────────────────────────────────────────────────────

/// Encode a new short-lived access token for `user_id`.
///
/// # Errors
///
/// Returns [`AuthError::Internal`] if the JWT library fails to sign the token.
pub fn encode_access_token(
    config: &Config,
    user_id: Uuid,
    email: &str,
    role: &str,
) -> Result<String, AuthError> {
    #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
    let now = Utc::now().timestamp() as usize;
    #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
    let exp = now + config.jwt_access_expiry_secs as usize;

    let claims = Claims {
        sub: user_id.to_string(),
        email: email.to_owned(),
        role: role.to_owned(),
        exp,
        iat: now,
    };

    let (header, key) = encoding_parts(config)
        .map_err(|e| AuthError::Internal(format!("JWT key error: {e}")))?;

    encode(&header, &claims, &key)
        .map_err(|e| AuthError::Internal(format!("JWT encode failed: {e}")))
}

/// Decode and validate an access token, returning its [`Claims`].
///
/// # Errors
///
/// Returns [`AuthError::TokenExpired`] or [`AuthError::TokenInvalid`] on
/// verification failure.
pub fn decode_access_token(config: &Config, token: &str) -> Result<Claims, AuthError> {
    let (alg, key) = decoding_parts(config)
        .map_err(|_| AuthError::TokenInvalid)?;

    let mut validation = Validation::new(alg);
    validation.validate_exp = true;

    let data: TokenData<Claims> = decode(token, &key, &validation)?;
    Ok(data.claims)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn encoding_parts(config: &Config) -> Result<(Header, EncodingKey), jsonwebtoken::errors::Error> {
    if config.jwt_use_rsa {
        let key = EncodingKey::from_rsa_pem(config.jwt_private_key.as_bytes())?;
        Ok((Header::new(Algorithm::RS256), key))
    } else {
        let key = EncodingKey::from_secret(config.jwt_private_key.as_bytes());
        Ok((Header::new(Algorithm::HS256), key))
    }
}

fn decoding_parts(
    config: &Config,
) -> Result<(Algorithm, DecodingKey), jsonwebtoken::errors::Error> {
    if config.jwt_use_rsa {
        let key = DecodingKey::from_rsa_pem(config.jwt_public_key.as_bytes())?;
        Ok((Algorithm::RS256, key))
    } else {
        let key = DecodingKey::from_secret(config.jwt_public_key.as_bytes());
        Ok((Algorithm::HS256, key))
    }
}
