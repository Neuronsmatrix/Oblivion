//! Database row types and HTTP request/response DTOs for the auth service.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ── Database row types ────────────────────────────────────────────────────────

/// Row returned from the `auth.users` table.
#[derive(Debug, sqlx::FromRow, Serialize)]
pub struct User {
    pub id: Uuid,
    pub email: String,
    /// Never included in serialised output.
    #[serde(skip_serializing)]
    pub password_hash: String,
    pub role: String,
    pub name: String,
    pub organization: Option<String>,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

/// Row returned from the `auth.refresh_tokens` table.
#[derive(Debug, sqlx::FromRow)]
pub struct RefreshToken {
    pub id: Uuid,
    pub user_id: Uuid,
    pub token_hash: String,
    pub expires_at: DateTime<Utc>,
    pub created_at: DateTime<Utc>,
}

// ── Request DTOs ─────────────────────────────────────────────────────────────

/// Body for `POST /auth/register`.
#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
    pub role: String,
    pub name: String,
    pub organization: Option<String>,
}

/// Body for `POST /auth/login`.
#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

/// Body for `POST /auth/refresh`.
#[derive(Debug, Deserialize)]
pub struct RefreshRequest {
    pub refresh_token: String,
}

/// Body for `DELETE /auth/logout`.
#[derive(Debug, Deserialize)]
pub struct LogoutRequest {
    pub refresh_token: String,
}

// ── Response DTOs ─────────────────────────────────────────────────────────────

/// Returned on successful login or token refresh.
#[derive(Debug, Serialize)]
pub struct AuthTokens {
    pub access_token: String,
    pub refresh_token: String,
    pub token_type: String,
    pub expires_in: i64,
}

/// Public user profile (no credentials).
#[derive(Debug, Serialize)]
pub struct UserProfile {
    pub id: Uuid,
    pub email: String,
    pub role: String,
    pub name: String,
    pub organization: Option<String>,
}

impl From<&User> for UserProfile {
    fn from(u: &User) -> Self {
        Self {
            id: u.id,
            email: u.email.clone(),
            role: u.role.clone(),
            name: u.name.clone(),
            organization: u.organization.clone(),
        }
    }
}
