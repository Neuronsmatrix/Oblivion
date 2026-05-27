//! PostgreSQL connection pool and query functions.
//!
//! All queries are read-only (`SELECT`).  The pool is configured with the
//! `search_path` set to the configured schema so that unqualified table
//! references resolve correctly.

use sqlx::{PgPool, postgres::PgPoolOptions};
use uuid::Uuid;

use crate::{config::Config, error::ReferenceError, models::{HpoTerm, Syndrome, SyndromeWithHpo}};

// ── Pool construction ─────────────────────────────────────────────────────────

/// Create and return a `PgPool` with `search_path` set to the configured schema.
///
/// # Errors
///
/// Returns a [`ReferenceError`] if the pool cannot connect or the
/// `search_path` override fails.
pub async fn create_pool(config: &Config) -> Result<PgPool, ReferenceError> {
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
        .map_err(|e| ReferenceError::Internal(format!("database pool error: {e}")))?;

    Ok(pool)
}

// ── Syndrome queries ──────────────────────────────────────────────────────────

/// Return a paginated list of syndromes, optionally filtered by name.
///
/// When `search` is `Some`, only rows whose `name` contains the search string
/// (case-insensitive) are returned.
///
/// # Errors
///
/// Propagates any [`sqlx::Error`] as [`ReferenceError::Internal`].
pub async fn list_syndromes(
    pool: &PgPool,
    search: Option<&str>,
    limit: i64,
    offset: i64,
) -> Result<Vec<Syndrome>, ReferenceError> {
    let syndromes = if let Some(q) = search {
        let pattern = format!("%{q}%");
        sqlx::query_as::<_, Syndrome>(
            "SELECT id, name, omim_id, description, prevalence, inheritance, created_at
               FROM reference.syndromes
              WHERE name ILIKE $1
           ORDER BY name
              LIMIT $2 OFFSET $3",
        )
        .bind(pattern)
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?
    } else {
        sqlx::query_as::<_, Syndrome>(
            "SELECT id, name, omim_id, description, prevalence, inheritance, created_at
               FROM reference.syndromes
           ORDER BY name
              LIMIT $1 OFFSET $2",
        )
        .bind(limit)
        .bind(offset)
        .fetch_all(pool)
        .await?
    };

    Ok(syndromes)
}

/// Fetch a single syndrome by its UUID, joining all associated HPO terms.
///
/// Returns `Ok(None)` when no syndrome exists with the given `id`.
///
/// # Errors
///
/// Propagates any [`sqlx::Error`] as [`ReferenceError::Internal`].
pub async fn find_syndrome_by_id(
    pool: &PgPool,
    id: Uuid,
) -> Result<Option<SyndromeWithHpo>, ReferenceError> {
    let syndrome = sqlx::query_as::<_, Syndrome>(
        "SELECT id, name, omim_id, description, prevalence, inheritance, created_at
           FROM reference.syndromes
          WHERE id = $1",
    )
    .bind(id)
    .fetch_optional(pool)
    .await?;

    let Some(syndrome) = syndrome else {
        return Ok(None);
    };

    let hpo_terms = sqlx::query_as::<_, HpoTerm>(
        "SELECT h.id, h.hpo_id, h.name, h.definition, h.parent_id
           FROM reference.hpo_terms h
           JOIN reference.syndrome_hpo sh ON sh.hpo_term_id = h.id
          WHERE sh.syndrome_id = $1
          ORDER BY h.hpo_id",
    )
    .bind(id)
    .fetch_all(pool)
    .await?;

    Ok(Some(SyndromeWithHpo { syndrome, hpo_terms }))
}

// ── HPO term queries ──────────────────────────────────────────────────────────

/// Search HPO terms by name or HPO identifier using a case-insensitive match.
///
/// Both the `name` and `hpo_id` columns are searched; rows that match on
/// either column are returned.
///
/// # Errors
///
/// Propagates any [`sqlx::Error`] as [`ReferenceError::Internal`].
pub async fn search_hpo_terms(
    pool: &PgPool,
    query: &str,
    limit: i64,
) -> Result<Vec<HpoTerm>, ReferenceError> {
    let pattern = format!("%{query}%");
    let terms = sqlx::query_as::<_, HpoTerm>(
        "SELECT id, hpo_id, name, definition, parent_id
           FROM reference.hpo_terms
          WHERE name ILIKE $1
             OR hpo_id ILIKE $1
          ORDER BY hpo_id
          LIMIT $2",
    )
    .bind(pattern)
    .bind(limit)
    .fetch_all(pool)
    .await?;

    Ok(terms)
}
