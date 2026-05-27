//! Database pool initialisation and query helpers for the notifier service.
//!
//! The `search_path` is fixed to the configured notifier schema via an
//! `after_connect` hook so every connection resolves unqualified table names
//! correctly without requiring schema-qualified SQL throughout the codebase.

use sqlx::{PgPool, postgres::PgPoolOptions};
use uuid::Uuid;

use crate::{config::Config, error::NotifierError, models::Notification};

// ── Pool ──────────────────────────────────────────────────────────────────────

/// Create and return a configured [`PgPool`].
///
/// The `after_connect` hook sets `search_path` to
/// [`Config::db_schema`] on every new connection.
///
/// # Errors
///
/// Returns [`NotifierError::Database`] if the pool cannot be built or if the
/// initial connection to PostgreSQL fails.
pub async fn create_pool(config: &Config) -> Result<PgPool, NotifierError> {
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
        .map_err(|e| NotifierError::Database(format!("database connect failed: {e}")))?;

    Ok(pool)
}

// ── Notification queries ──────────────────────────────────────────────────────

/// Insert a new notification row and return the persisted record.
///
/// # Errors
///
/// Returns [`NotifierError::Database`] on any SQL error.
pub async fn insert_notification(
    pool: &PgPool,
    user_id: Uuid,
    notification_type: &str,
    title: &str,
    body: Option<&str>,
    metadata: Option<&serde_json::Value>,
) -> Result<Notification, NotifierError> {
    let notification = sqlx::query_as::<_, Notification>(
        r#"
        INSERT INTO notifications (id, user_id, type, title, body, read, metadata, created_at)
        VALUES ($1, $2, $3, $4, $5, false, $6, NOW())
        RETURNING id, user_id, type, title, body, read, metadata, created_at
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(user_id)
    .bind(notification_type)
    .bind(title)
    .bind(body)
    .bind(metadata)
    .fetch_one(pool)
    .await
    .map_err(|e| NotifierError::Database(format!("insert_notification: {e}")))?;

    Ok(notification)
}

/// Return a paginated list of notifications for `user_id`, most recent first.
///
/// `limit` is capped at 100; `offset` defaults to 0.
///
/// # Errors
///
/// Returns [`NotifierError::Database`] on any SQL error.
pub async fn list_notifications(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
    offset: i64,
) -> Result<Vec<Notification>, NotifierError> {
    let rows = sqlx::query_as::<_, Notification>(
        r#"
        SELECT id, user_id, type, title, body, read, metadata, created_at
        FROM notifications
        WHERE user_id = $1
        ORDER BY created_at DESC
        LIMIT $2
        OFFSET $3
        "#,
    )
    .bind(user_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await
    .map_err(|e| NotifierError::Database(format!("list_notifications: {e}")))?;

    Ok(rows)
}

/// Mark a single notification as read.
///
/// # Errors
///
/// Returns [`NotifierError::Database`] on any SQL error.
pub async fn mark_as_read(pool: &PgPool, notification_id: Uuid) -> Result<(), NotifierError> {
    sqlx::query("UPDATE notifications SET read = true WHERE id = $1")
        .bind(notification_id)
        .execute(pool)
        .await
        .map_err(|e| NotifierError::Database(format!("mark_as_read: {e}")))?;

    Ok(())
}

/// Fetch a single notification by its primary key, or `None` if absent.
///
/// # Errors
///
/// Returns [`NotifierError::Database`] on any SQL error.
pub async fn find_notification_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<Notification>, NotifierError> {
    let row = sqlx::query_as::<_, Notification>(
        r#"
        SELECT id, user_id, type, title, body, read, metadata, created_at
        FROM notifications
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| NotifierError::Database(format!("find_notification_by_id: {e}")))?;

    Ok(row)
}
