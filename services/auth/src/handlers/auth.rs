//! HTTP handler functions for the auth endpoints.
//!
//! Every handler receives [`AppState`] via axum's `State` extractor and
//! returns `Result<impl IntoResponse, ServiceError>` so that the error type
//! integrates with the platform's [`ApiResponse`] envelope.

use argon2::{
    Argon2,
    password_hash::{PasswordHash, PasswordHasher, PasswordVerifier, SaltString, rand_core::OsRng},
};
use axum::{
    Json,
    extract::State,
    response::IntoResponse,
};
use chrono::Utc;
use oblivion_common::{ApiResponse, ServiceError};
use uuid::Uuid;

use crate::{
    auth_extractor::AuthUser,
    db,
    error::AuthError,
    jwt,
    models::{AuthTokens, LoginRequest, LogoutRequest, RefreshRequest, RegisterRequest, UserProfile},
    state::AppState,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/// SHA-256 hex digest of `value` — used as the stored form of refresh tokens.
fn sha256_hex(value: &str) -> String {
    use sha2::{Digest, Sha256};
    let hash = Sha256::digest(value.as_bytes());
    hex::encode(hash)
}

/// Build an [`AuthTokens`] response for `user`, persisting the refresh token.
async fn issue_tokens(
    state: &AppState,
    user_id: Uuid,
    email: &str,
    role: &str,
) -> Result<AuthTokens, AuthError> {
    // Access token (JWT).
    let access_token = jwt::encode_access_token(&state.config, user_id, email, role)?;

    // Refresh token: random UUID, stored as SHA-256 hash.
    let raw_refresh = Uuid::new_v4().to_string();
    let refresh_hash = sha256_hex(&raw_refresh);

    let refresh_expiry_secs = state.config.jwt_refresh_expiry_secs;
    let expires_at = Utc::now()
        + chrono::Duration::seconds(refresh_expiry_secs);

    db::save_refresh_token(&state.db, user_id, &refresh_hash, expires_at).await?;

    Ok(AuthTokens {
        access_token,
        refresh_token: raw_refresh,
        token_type: "Bearer".to_owned(),
        expires_in: state.config.jwt_access_expiry_secs,
    })
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/// `POST /auth/register`
///
/// Validate input, hash the password with Argon2id, and create the user.
pub async fn register(
    State(state): State<AppState>,
    Json(body): Json<RegisterRequest>,
) -> Result<impl IntoResponse, ServiceError> {
    // Input validation.
    if body.email.trim().is_empty() {
        return Err(ServiceError::BadRequest("email must not be empty".to_owned()));
    }
    if body.password.len() < 8 {
        return Err(ServiceError::BadRequest(
            "password must be at least 8 characters".to_owned(),
        ));
    }

    // Hash password with Argon2id (default parameters).
    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(body.password.as_bytes(), &salt)
        .map_err(|e| ServiceError::InternalError(format!("argon2 hash: {e}")))?
        .to_string();

    let user = db::create_user(
        &state.db,
        &body.email,
        &password_hash,
        &body.role,
        &body.name,
        body.organization.as_deref(),
    )
    .await
    .map_err(ServiceError::from)?;

    let profile = UserProfile::from(&user);
    Ok(ApiResponse::ok(profile))
}

/// `POST /auth/login`
///
/// Verify credentials and return a fresh token pair.
pub async fn login(
    State(state): State<AppState>,
    Json(body): Json<LoginRequest>,
) -> Result<impl IntoResponse, ServiceError> {
    // Look up user.
    let user = db::find_user_by_email(&state.db, &body.email)
        .await
        .map_err(ServiceError::from)?
        .ok_or(AuthError::InvalidCredentials)
        .map_err(ServiceError::from)?;

    // Verify password.
    let parsed_hash = PasswordHash::new(&user.password_hash)
        .map_err(|_| ServiceError::InternalError("invalid stored hash".to_owned()))?;

    Argon2::default()
        .verify_password(body.password.as_bytes(), &parsed_hash)
        .map_err(|_| ServiceError::from(AuthError::InvalidCredentials))?;

    // Issue tokens.
    let tokens = issue_tokens(&state, user.id, &user.email, &user.role)
        .await
        .map_err(ServiceError::from)?;

    Ok(ApiResponse::ok(tokens))
}

/// `POST /auth/refresh`
///
/// Exchange a valid refresh token for a new token pair.
pub async fn refresh(
    State(state): State<AppState>,
    Json(body): Json<RefreshRequest>,
) -> Result<impl IntoResponse, ServiceError> {
    let token_hash = sha256_hex(&body.refresh_token);

    // Look up stored token.
    let stored = db::find_refresh_token(&state.db, &token_hash)
        .await
        .map_err(ServiceError::from)?
        .ok_or_else(|| ServiceError::Unauthorized("refresh token not found".to_owned()))?;

    // Check expiry.
    if stored.expires_at < Utc::now() {
        db::delete_refresh_token(&state.db, &token_hash)
            .await
            .map_err(ServiceError::from)?;
        return Err(ServiceError::from(AuthError::TokenExpired));
    }

    // Fetch the owning user.
    let user = db::find_user_by_id(&state.db, stored.user_id)
        .await
        .map_err(ServiceError::from)?
        .ok_or_else(|| ServiceError::NotFound("user not found".to_owned()))?;

    // Rotate: delete old token.
    db::delete_refresh_token(&state.db, &token_hash)
        .await
        .map_err(ServiceError::from)?;

    // Issue new tokens.
    let tokens = issue_tokens(&state, user.id, &user.email, &user.role)
        .await
        .map_err(ServiceError::from)?;

    Ok(ApiResponse::ok(tokens))
}

/// `GET /auth/me`
///
/// Return the profile of the currently authenticated user.
pub async fn me(
    State(state): State<AppState>,
    AuthUser { claims }: AuthUser,
) -> Result<impl IntoResponse, ServiceError> {
    let user_id = claims
        .sub
        .parse::<Uuid>()
        .map_err(|_| ServiceError::InternalError("invalid subject in token".to_owned()))?;

    let user = db::find_user_by_id(&state.db, user_id)
        .await
        .map_err(ServiceError::from)?
        .ok_or_else(|| ServiceError::NotFound("user not found".to_owned()))?;

    Ok(ApiResponse::ok(UserProfile::from(&user)))
}

/// `DELETE /auth/logout`
///
/// Revoke the provided refresh token and add the access token to the Redis
/// blacklist.
pub async fn logout(
    State(state): State<AppState>,
    AuthUser { claims }: AuthUser,
    Json(body): Json<LogoutRequest>,
) -> Result<impl IntoResponse, ServiceError> {
    // Remove refresh token from DB.
    let token_hash = sha256_hex(&body.refresh_token);
    db::delete_refresh_token(&state.db, &token_hash)
        .await
        .map_err(ServiceError::from)?;

    // Blacklist the access token in Redis for its remaining lifetime.
    #[allow(clippy::cast_sign_loss, clippy::cast_possible_truncation)]
    let now = Utc::now().timestamp() as usize;
    #[allow(clippy::cast_possible_wrap)]
    let remaining_ttl = claims.exp.saturating_sub(now) as i64;

    if remaining_ttl > 0 {
        if let Ok(mut conn) = state.redis.get().await {
            use crate::auth_extractor::blacklist_key;
            // We don't have the raw token here — we use the subject + exp as
            // a unique key so the entry expires naturally.
            let key = format!("auth:blacklist:{}:{}", claims.sub, claims.exp);
            let _ = redis::cmd("SET")
                .arg(&key)
                .arg("1")
                .arg("EX")
                .arg(remaining_ttl)
                .query_async::<()>(&mut *conn)
                .await;
            // Also blacklist by token hash derived from subject+exp for the extractor.
            let bk = blacklist_key(&format!("{}:{}", claims.sub, claims.exp));
            let _ = redis::cmd("SET")
                .arg(&bk)
                .arg("1")
                .arg("EX")
                .arg(remaining_ttl)
                .query_async::<()>(&mut *conn)
                .await;
        }
    }

    Ok(ApiResponse::ok("logged out"))
}
