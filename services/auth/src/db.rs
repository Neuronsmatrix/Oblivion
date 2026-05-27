//! Database pool initialisation and query helpers.
//!
//! All queries use `sqlx::query_as` with runtime-checked SQL (no compile-time
//! verification is needed since the schema is managed separately). The
//! `search_path` is set to the configured auth schema after the pool is created
//! so that unqualified table names resolve correctly.

use chrono::{DateTime, Utc};
use sqlx::{PgPool, postgres::PgPoolOptions};
use uuid::Uuid;

use crate::{config::Config, error::AuthError, models::{RefreshToken, User}};

/// Create and return a configured [`PgPool`].
///
/// The pool's `after_connect` hook sets `search_path` to the schema name
/// specified in [`Config::db_schema`] so every connection uses the correct
/// schema without qualifying each table name.
///
/// # Errors
///
/// Returns [`AuthError::Internal`] if the pool cannot be built or if the
/// initial connection to the database fails.
pub async fn create_pool(config: &Config) -> Result<PgPool, AuthError> {
    let schema = config.db_schema.clone();
    let pool = PgPoolOptions::new()
        .max_connections(config.db_max_connections)
        .after_connect(move |conn, _meta| {
            let schema = schema.clone();
            Box::pin(async move {
                sqlx::query(&format!("SET search_path TO {schema}"))
                    .execute(conn)
                    .await?;
                Ok(())
            })
        })
        .connect(&config.database_url)
        .await
        .map_err(|e| AuthError::Internal(format!("database connect failed: {e}")))?;

    Ok(pool)
}

// ── User queries ──────────────────────────────────────────────────────────────

/// Insert a new user row and return the created record.
///
/// # Errors
///
/// Returns [`AuthError::UserAlreadyExists`] when the email violates the unique
/// constraint, or [`AuthError::Internal`] for any other database error.
pub async fn create_user(
    pool: &PgPool,
    email: &str,
    password_hash: &str,
    role: &str,
    name: &str,
    organization: Option<&str>,
) -> Result<User, AuthError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        INSERT INTO users (id, email, password_hash, role, name, organization, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email, password_hash, role, name, organization, created_at, updated_at
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(email)
    .bind(password_hash)
    .bind(role)
    .bind(name)
    .bind(organization)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        // Postgres error code 23505 = unique_violation
        if let sqlx::Error::Database(ref db_err) = e {
            if db_err.code().as_deref() == Some("23505") {
                return AuthError::UserAlreadyExists;
            }
        }
        AuthError::Internal(format!("create_user: {e}"))
    })?;

    Ok(user)
}

/// Look up a user by their email address.
///
/// # Errors
///
/// Returns [`AuthError::Internal`] on database error.
pub async fn find_user_by_email(pool: &PgPool, email: &str) -> Result<Option<User>, AuthError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, password_hash, role, name, organization, created_at, updated_at
        FROM users
        WHERE email = $1
        "#,
    )
    .bind(email)
    .fetch_optional(pool)
    .await
    .map_err(|e| AuthError::Internal(format!("find_user_by_email: {e}")))?;

    Ok(user)
}

/// Look up a user by their primary key.
///
/// # Errors
///
/// Returns [`AuthError::Internal`] on database error.
pub async fn find_user_by_id(pool: &PgPool, id: Uuid) -> Result<Option<User>, AuthError> {
    let user = sqlx::query_as::<_, User>(
        r#"
        SELECT id, email, password_hash, role, name, organization, created_at, updated_at
        FROM users
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| AuthError::Internal(format!("find_user_by_id: {e}")))?;

    Ok(user)
}

// ── Refresh-token queries ─────────────────────────────────────────────────────

/// Persist a new refresh-token record (storing only the SHA-256 hash).
///
/// # Errors
///
/// Returns [`AuthError::Internal`] on database error.
pub async fn save_refresh_token(
    pool: &PgPool,
    user_id: Uuid,
    token_hash: &str,
    expires_at: DateTime<Utc>,
) -> Result<(), AuthError> {
    sqlx::query(
        r#"
        INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, created_at)
        VALUES ($1, $2, $3, $4, NOW())
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(user_id)
    .bind(token_hash)
    .bind(expires_at)
    .execute(pool)
    .await
    .map_err(|e| AuthError::Internal(format!("save_refresh_token: {e}")))?;

    Ok(())
}

/// Delete a refresh-token row identified by its hash.
///
/// # Errors
///
/// Returns [`AuthError::Internal`] on database error.
pub async fn delete_refresh_token(pool: &PgPool, token_hash: &str) -> Result<(), AuthError> {
    sqlx::query("DELETE FROM refresh_tokens WHERE token_hash = $1")
        .bind(token_hash)
        .execute(pool)
        .await
        .map_err(|e| AuthError::Internal(format!("delete_refresh_token: {e}")))?;

    Ok(())
}

/// Find a refresh-token row by its hash.
///
/// # Errors
///
/// Returns [`AuthError::Internal`] on database error.
pub async fn find_refresh_token(
    pool: &PgPool,
    token_hash: &str,
) -> Result<Option<RefreshToken>, AuthError> {
    let token = sqlx::query_as::<_, RefreshToken>(
        r#"
        SELECT id, user_id, token_hash, expires_at, created_at
        FROM refresh_tokens
        WHERE token_hash = $1
        "#,
    )
    .bind(token_hash)
    .fetch_optional(pool)
    .await
    .map_err(|e| AuthError::Internal(format!("find_refresh_token: {e}")))?;

    Ok(token)
}
