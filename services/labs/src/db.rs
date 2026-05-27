//! Database pool initialisation and query helpers for the labs service.
//!
//! All queries use runtime-checked SQL via `sqlx::query_as`. The pool's
//! `after_connect` hook sets `search_path` to the configured labs schema so
//! that unqualified table names resolve correctly.

use sqlx::{PgPool, postgres::PgPoolOptions};
use uuid::Uuid;

use crate::{
    config::Config,
    error::LabsError,
    models::{Batch, BatchItem, BatchItemInsert},
};

/// Create and return a configured [`PgPool`].
///
/// The pool's `after_connect` hook sets `search_path` to the schema name
/// specified in [`Config::db_schema`].
///
/// # Errors
///
/// Returns [`LabsError::Internal`] if the pool cannot be built or if the
/// initial connection to the database fails.
pub async fn create_pool(config: &Config) -> Result<PgPool, LabsError> {
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
        .map_err(|e| LabsError::Internal(format!("database connect failed: {e}")))?;

    Ok(pool)
}

// ── Batch queries ─────────────────────────────────────────────────────────────

/// Insert a new batch row and return the created record.
///
/// # Errors
///
/// Returns [`LabsError::Internal`] on database error.
pub async fn create_batch(
    pool: &PgPool,
    lab_id: Uuid,
    total_items: i32,
) -> Result<Batch, LabsError> {
    let batch = sqlx::query_as::<_, Batch>(
        r#"
        INSERT INTO batches (id, lab_id, status, total_items, processed_items, created_at, updated_at)
        VALUES ($1, $2, 'pending', $3, 0, NOW(), NOW())
        RETURNING id, lab_id, status, total_items, processed_items, created_at, updated_at
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(lab_id)
    .bind(total_items)
    .fetch_one(pool)
    .await
    .map_err(|e| LabsError::Internal(format!("create_batch: {e}")))?;

    Ok(batch)
}

/// Bulk-insert items for a batch.
///
/// Each item starts with status `"pending"`. Returns the inserted rows.
///
/// # Errors
///
/// Returns [`LabsError::Internal`] on database error.
pub async fn create_batch_items(
    pool: &PgPool,
    batch_id: Uuid,
    items: Vec<BatchItemInsert>,
) -> Result<Vec<BatchItem>, LabsError> {
    let mut results = Vec::with_capacity(items.len());

    for item in items {
        let record = sqlx::query_as::<_, BatchItem>(
            r#"
            INSERT INTO batch_items (id, batch_id, image_key, case_id, status, created_at)
            VALUES ($1, $2, $3, NULL, 'pending', NOW())
            RETURNING id, batch_id, image_key, case_id, status, created_at
            "#,
        )
        .bind(Uuid::new_v4())
        .bind(batch_id)
        .bind(&item.image_key)
        .fetch_one(pool)
        .await
        .map_err(|e| LabsError::Internal(format!("create_batch_items: {e}")))?;

        results.push(record);
    }

    Ok(results)
}

/// Return a batch by its primary key, or `None` if not found.
///
/// # Errors
///
/// Returns [`LabsError::Internal`] on database error.
pub async fn find_batch_by_id(pool: &PgPool, batch_id: Uuid) -> Result<Option<Batch>, LabsError> {
    let batch = sqlx::query_as::<_, Batch>(
        r#"
        SELECT id, lab_id, status, total_items, processed_items, created_at, updated_at
        FROM batches
        WHERE id = $1
        "#,
    )
    .bind(batch_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| LabsError::Internal(format!("find_batch_by_id: {e}")))?;

    Ok(batch)
}

/// Return all items belonging to `batch_id`, ordered by creation time.
///
/// # Errors
///
/// Returns [`LabsError::Internal`] on database error.
pub async fn list_batch_items(
    pool: &PgPool,
    batch_id: Uuid,
) -> Result<Vec<BatchItem>, LabsError> {
    let items = sqlx::query_as::<_, BatchItem>(
        r#"
        SELECT id, batch_id, image_key, case_id, status, created_at
        FROM batch_items
        WHERE batch_id = $1
        ORDER BY created_at ASC
        "#,
    )
    .bind(batch_id)
    .fetch_all(pool)
    .await
    .map_err(|e| LabsError::Internal(format!("list_batch_items: {e}")))?;

    Ok(items)
}

/// Update the status (and optionally the case ID) of a single batch item.
///
/// # Errors
///
/// Returns [`LabsError::Internal`] on database error.
pub async fn update_batch_item_status(
    pool: &PgPool,
    item_id: Uuid,
    status: &str,
    case_id: Option<Uuid>,
) -> Result<(), LabsError> {
    sqlx::query(
        r#"
        UPDATE batch_items
        SET status = $2, case_id = $3
        WHERE id = $1
        "#,
    )
    .bind(item_id)
    .bind(status)
    .bind(case_id)
    .execute(pool)
    .await
    .map_err(|e| LabsError::Internal(format!("update_batch_item_status: {e}")))?;

    Ok(())
}

/// Atomically increment `processed_items` for a batch and update its status to
/// `"completed"` when all items have been processed.
///
/// Returns the updated [`Batch`].
///
/// # Errors
///
/// Returns [`LabsError::Internal`] on database error.
pub async fn increment_batch_processed(pool: &PgPool, batch_id: Uuid) -> Result<Batch, LabsError> {
    let batch = sqlx::query_as::<_, Batch>(
        r#"
        UPDATE batches
        SET
          processed_items = processed_items + 1,
          status = CASE
            WHEN processed_items + 1 >= total_items THEN 'completed'
            ELSE 'processing'
          END,
          updated_at = NOW()
        WHERE id = $1
        RETURNING id, lab_id, status, total_items, processed_items, created_at, updated_at
        "#,
    )
    .bind(batch_id)
    .fetch_one(pool)
    .await
    .map_err(|e| LabsError::Internal(format!("increment_batch_processed: {e}")))?;

    Ok(batch)
}
