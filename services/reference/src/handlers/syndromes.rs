//! Handlers for the syndrome endpoints.
//!
//! Both handlers are read-only.  Full-text search is attempted via
//! Elasticsearch first; if ES is unavailable or returns no results from an
//! empty index, the service falls back transparently to a Postgres `ILIKE`
//! query.

use axum::{
    extract::{Path, Query, State},
    response::IntoResponse,
};
use oblivion_common::ApiResponse;
use uuid::Uuid;

use crate::{
    auth_extractor::AuthUser,
    db,
    elasticsearch::SyndromeSearchResult,
    error::ReferenceError,
    models::{SearchParams, Syndrome, SyndromeWithHpo},
    state::AppState,
};

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_LIMIT: i64 = 20;
const MAX_LIMIT: i64 = 100;

// ── Handlers ──────────────────────────────────────────────────────────────────

/// `GET /reference/syndromes` — list syndromes with optional full-text search.
///
/// Query parameters:
/// - `q` — search string (optional)
/// - `limit` — page size (default 20, max 100)
/// - `offset` — zero-based page offset (default 0)
///
/// When `q` is provided, Elasticsearch is tried first.  If it is unavailable
/// or returns an empty hit list, Postgres `ILIKE` is used as a fallback.
pub async fn list_syndromes(
    _auth: AuthUser,
    State(state): State<AppState>,
    Query(params): Query<SearchParams>,
) -> Result<impl IntoResponse, ReferenceError> {
    let limit = params
        .limit
        .unwrap_or(DEFAULT_LIMIT)
        .clamp(1, MAX_LIMIT);
    let offset = params.offset.unwrap_or(0).max(0);

    if let Some(ref q) = params.q {
        // Try Elasticsearch first.
        let es_hits = state.es.search_syndromes(q, limit as usize).await?;

        if !es_hits.is_empty() {
            let syndromes: Vec<Syndrome> = es_hits_to_syndromes(es_hits);
            return Ok(ApiResponse::ok(syndromes).into_response());
        }

        // ES unavailable or index empty — fall back to Postgres ILIKE.
        let syndromes =
            db::list_syndromes(&state.pool, Some(q), limit, offset).await?;
        return Ok(ApiResponse::ok(syndromes).into_response());
    }

    // No search query — plain paginated list from Postgres.
    let syndromes = db::list_syndromes(&state.pool, None, limit, offset).await?;
    Ok(ApiResponse::ok(syndromes).into_response())
}

/// `GET /reference/syndromes/:id` — fetch a syndrome with its HPO terms.
pub async fn get_syndrome(
    _auth: AuthUser,
    State(state): State<AppState>,
    Path(id): Path<Uuid>,
) -> Result<impl IntoResponse, ReferenceError> {
    let result: Option<SyndromeWithHpo> =
        db::find_syndrome_by_id(&state.pool, id).await?;

    match result {
        Some(s) => Ok(ApiResponse::ok(s).into_response()),
        None => Err(ReferenceError::NotFound(format!("syndrome {id} not found"))),
    }
}

// ── Private helpers ───────────────────────────────────────────────────────────

/// Convert Elasticsearch syndrome hits into lightweight [`Syndrome`] structs
/// for the list response.
///
/// Fields not stored in the ES document (`created_at`) are filled with the
/// epoch so that the struct is always valid; callers that need the full record
/// should use [`get_syndrome`] instead.
fn es_hits_to_syndromes(hits: Vec<SyndromeSearchResult>) -> Vec<Syndrome> {
    use chrono::DateTime;
    hits.into_iter()
        .filter_map(|h| {
            let id = h.id.parse::<Uuid>().ok()?;
            Some(Syndrome {
                id,
                name: h.name,
                omim_id: h.omim_id,
                description: h.description,
                prevalence: None,
                inheritance: None,
                created_at: DateTime::UNIX_EPOCH,
            })
        })
        .collect()
}
