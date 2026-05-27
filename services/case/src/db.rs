//! Database helpers for the case service.
//!
//! All queries target the `cases` schema (or whatever `CASE_DB_SCHEMA` is set
//! to). The schema is injected via `SET search_path` on every connection in
//! the pool's `after_connect` hook.

use chrono::Utc;
use sqlx::{postgres::PgPoolOptions, PgPool};
use uuid::Uuid;

use crate::{config::Config, error::CaseError, models::{Case, DiagnosisRow}};

/// Create and return a connection pool.
///
/// The `search_path` is set to the configured schema on every new connection
/// so that bare table names in queries resolve without a schema prefix.
///
/// # Errors
///
/// Returns [`CaseError::Database`] if the pool cannot be created.
pub async fn create_pool(config: &Config) -> Result<PgPool, CaseError> {
    let schema = config.db_schema.clone();
    let pool = PgPoolOptions::new()
        .max_connections(config.db_max_connections)
        .after_connect(move |conn, _meta| {
            let schema = schema.clone();
            Box::pin(async move {
                sqlx::query(&format!("SET search_path = \"{schema}\""))
                    .execute(conn)
                    .await?;
                Ok(())
            })
        })
        .connect(&config.database_url)
        .await
        .map_err(|e| CaseError::Database(e.to_string()))?;
    Ok(pool)
}

/// Insert a new case record and return it.
///
/// The case is created with status `pending`.
///
/// # Errors
///
/// Returns [`CaseError::Database`] on a database failure.
pub async fn insert_case(
    pool: &PgPool,
    id: Uuid,
    user_id: Uuid,
    patient_name: Option<String>,
    patient_age: Option<i32>,
    patient_ethnicity: Option<String>,
    image_key: String,
) -> Result<Case, CaseError> {
    let now = Utc::now();
    let case = sqlx::query_as::<_, Case>(
        r#"
        INSERT INTO cases (
            id, user_id, patient_name, patient_age, patient_ethnicity,
            image_key, status, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, 'pending', $7, $8)
        RETURNING *
        "#,
    )
    .bind(id)
    .bind(user_id)
    .bind(patient_name)
    .bind(patient_age)
    .bind(patient_ethnicity)
    .bind(image_key)
    .bind(now)
    .bind(now)
    .fetch_one(pool)
    .await?;
    Ok(case)
}

/// Find a case by its primary key.
///
/// Returns `None` when no row matches `id`.
///
/// # Errors
///
/// Returns [`CaseError::Database`] on a database failure.
pub async fn find_case_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Case>, CaseError> {
    let case = sqlx::query_as::<_, Case>("SELECT * FROM cases WHERE id = $1")
        .bind(id)
        .fetch_optional(pool)
        .await?;
    Ok(case)
}

/// Return a paginated list of cases belonging to `user_id`.
///
/// `limit` is capped at 100 server-side; `offset` defaults to 0.
///
/// # Errors
///
/// Returns [`CaseError::Database`] on a database failure.
pub async fn list_cases(
    pool: &PgPool,
    user_id: Uuid,
    limit: i64,
    offset: i64,
) -> Result<Vec<Case>, CaseError> {
    let limit = limit.min(100).max(1);
    let cases = sqlx::query_as::<_, Case>(
        "SELECT * FROM cases WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3",
    )
    .bind(user_id)
    .bind(limit)
    .bind(offset)
    .fetch_all(pool)
    .await?;
    Ok(cases)
}

/// Update the lifecycle status of a case.
///
/// # Errors
///
/// Returns [`CaseError::Database`] on a database failure.
pub async fn update_case_status(
    pool: &PgPool,
    case_id: Uuid,
    status: &str,
) -> Result<(), CaseError> {
    sqlx::query(
        "UPDATE cases SET status = $1, updated_at = $2 WHERE id = $3",
    )
    .bind(status)
    .bind(Utc::now())
    .bind(case_id)
    .execute(pool)
    .await?;
    Ok(())
}

/// Update the patient metadata on a case and return the refreshed row.
///
/// # Errors
///
/// Returns [`CaseError::Database`] on a database failure.
pub async fn update_case(
    pool: &PgPool,
    case_id: Uuid,
    patient_name: Option<String>,
    patient_age: Option<i32>,
    patient_ethnicity: Option<String>,
) -> Result<Case, CaseError> {
    let case = sqlx::query_as::<_, Case>(
        r#"
        UPDATE cases
        SET patient_name       = COALESCE($2, patient_name),
            patient_age        = COALESCE($3, patient_age),
            patient_ethnicity  = COALESCE($4, patient_ethnicity),
            updated_at         = $5
        WHERE id = $1
        RETURNING *
        "#,
    )
    .bind(case_id)
    .bind(patient_name)
    .bind(patient_age)
    .bind(patient_ethnicity)
    .bind(Utc::now())
    .fetch_one(pool)
    .await?;
    Ok(case)
}

/// Bulk-insert a slice of diagnosis rows for a given case.
///
/// Each row receives a freshly generated UUID and the current timestamp.
///
/// # Errors
///
/// Returns [`CaseError::Database`] on a database failure.
pub async fn insert_diagnoses(
    pool: &PgPool,
    case_id: Uuid,
    diagnoses: Vec<oblivion_common::DiagnosisEntry>,
) -> Result<(), CaseError> {
    let now = Utc::now();
    for entry in diagnoses {
        let row_id = Uuid::new_v4();
        sqlx::query(
            r#"
            INSERT INTO diagnoses (
                id, case_id, syndrome_id, syndrome_name,
                confidence, rank, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            "#,
        )
        .bind(row_id)
        .bind(case_id)
        .bind(entry.syndrome_id)
        .bind(&entry.syndrome_name)
        .bind(entry.confidence)
        .bind(entry.rank)
        .bind(now)
        .execute(pool)
        .await?;
    }
    Ok(())
}

/// Load all diagnoses for a case, ordered by rank ascending.
///
/// # Errors
///
/// Returns [`CaseError::Database`] on a database failure.
pub async fn find_diagnoses_by_case(
    pool: &PgPool,
    case_id: Uuid,
) -> Result<Vec<DiagnosisRow>, CaseError> {
    let rows = sqlx::query_as::<_, DiagnosisRow>(
        "SELECT * FROM diagnoses WHERE case_id = $1 ORDER BY rank ASC",
    )
    .bind(case_id)
    .fetch_all(pool)
    .await?;
    Ok(rows)
}
