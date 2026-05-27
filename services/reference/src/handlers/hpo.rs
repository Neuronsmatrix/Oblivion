//! Handlers for HPO term search endpoints.
//!
//! Elasticsearch is tried first; if unavailable or returning no hits the
//! service falls back transparently to a Postgres `ILIKE` query.

use axum::{
    extract::{Query, State},
    response::IntoResponse,
};
use oblivion_common::ApiResponse;
use serde::Serialize;

use crate::{
    auth_extractor::AuthUser,
    db,
    elasticsearch::HpoSearchResult,
    error::ReferenceError,
    models::SearchParams,
    state::AppState,
};

// ── Constants ─────────────────────────────────────────────────────────────────

const DEFAULT_LIMIT: i64 = 20;
const MAX_LIMIT: i64 = 100;

// ── Response type ─────────────────────────────────────────────────────────────

/// Unified HPO search result returned to callers regardless of whether the
/// data came from Elasticsearch or Postgres.
#[derive(Debug, Serialize)]
pub struct HpoResult {
    /// Unique identifier (UUID from Postgres or document ID from ES).
    pub id: String,
    /// Official HPO identifier string (e.g. `"HP:0000252"`).
    pub hpo_id: String,
    /// Human-readable term name.
    pub name: String,
    /// Full term definition, if available.
    pub definition: Option<String>,
}

// ── Handlers ──────────────────────────────────────────────────────────────────

/// `GET /reference/hpo/search` — search HPO terms by free text.
///
/// Query parameters:
/// - `q` — search string (required; returns empty list if omitted)
/// - `limit` — max results (default 20, max 100)
///
/// Elasticsearch is tried first.  If unavailable or the index is empty,
/// a Postgres `ILIKE` search is performed instead.
pub async fn search_hpo(
    _auth: AuthUser,
    State(state): State<AppState>,
    Query(params): Query<SearchParams>,
) -> Result<impl IntoResponse, ReferenceError> {
    let limit = params
        .limit
        .unwrap_or(DEFAULT_LIMIT)
        .clamp(1, MAX_LIMIT);

    let Some(ref q) = params.q else {
        return Ok(ApiResponse::ok(Vec::<HpoResult>::new()).into_response());
    };

    // Try Elasticsearch first.
    let es_hits: Vec<HpoSearchResult> =
        state.es.search_hpo(q, limit as usize).await?;

    if !es_hits.is_empty() {
        let results: Vec<HpoResult> = es_hits
            .into_iter()
            .map(|h| HpoResult {
                id: h.id,
                hpo_id: h.hpo_id,
                name: h.name,
                definition: h.definition,
            })
            .collect();
        return Ok(ApiResponse::ok(results).into_response());
    }

    // Fallback: Postgres ILIKE search.
    let terms = db::search_hpo_terms(&state.pool, q, limit).await?;
    let results: Vec<HpoResult> = terms
        .into_iter()
        .map(|t| HpoResult {
            id: t.id.to_string(),
            hpo_id: t.hpo_id,
            name: t.name,
            definition: t.definition,
        })
        .collect();

    Ok(ApiResponse::ok(results).into_response())
}
