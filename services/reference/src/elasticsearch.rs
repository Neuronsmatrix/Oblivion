//! Elasticsearch client for full-text search over syndromes and HPO terms.
//!
//! Uses the Elasticsearch REST API directly via `reqwest` — no heavyweight
//! client crate is required.  All operations degrade gracefully: when the
//! cluster is unreachable the methods log a warning and return an empty
//! result set rather than propagating the error to callers.
//!
//! # Index names
//!
//! | Data          | Index name           |
//! |---------------|----------------------|
//! | HPO terms     | `oblivion-hpo`       |
//! | Syndromes     | `oblivion-syndromes` |

use serde::{Deserialize, Serialize};
use serde_json::{Value, json};
use tracing::warn;

use crate::error::ReferenceError;

// ── Public result types ───────────────────────────────────────────────────────

/// A single HPO term hit returned from Elasticsearch.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HpoSearchResult {
    /// Document `_id` in the index.
    pub id: String,
    /// Official HPO identifier (e.g. `"HP:0000252"`).
    pub hpo_id: String,
    /// Human-readable term name.
    pub name: String,
    /// Full term definition, if present.
    pub definition: Option<String>,
    /// Relevance score assigned by Elasticsearch.
    pub score: f64,
}

/// A single syndrome hit returned from Elasticsearch.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyndromeSearchResult {
    /// Document `_id` in the index.
    pub id: String,
    /// Human-readable syndrome name.
    pub name: String,
    /// OMIM catalogue identifier, if present.
    pub omim_id: Option<String>,
    /// Free-text clinical description, if present.
    pub description: Option<String>,
    /// Relevance score assigned by Elasticsearch.
    pub score: f64,
}

// ── Client ────────────────────────────────────────────────────────────────────

/// Thin HTTP wrapper around the Elasticsearch REST API.
///
/// The inner [`reqwest::Client`] is already `Clone + Send + Sync`, so
/// `EsClient` can be freely shared across Axum handlers.
#[derive(Clone)]
pub struct EsClient {
    client: reqwest::Client,
    base_url: String,
}

impl EsClient {
    /// Create a new client pointing at `base_url`
    /// (e.g. `"http://localhost:9200"`).
    #[must_use]
    pub fn new(base_url: &str) -> Self {
        Self {
            client: reqwest::Client::new(),
            base_url: base_url.trim_end_matches('/').to_owned(),
        }
    }

    // ── Search ────────────────────────────────────────────────────────────────

    /// Search the `oblivion-hpo` index for terms matching `query`.
    ///
    /// Uses a `multi_match` query over the `name` (boosted ×2) and
    /// `definition` fields with `AUTO` fuzziness.
    ///
    /// Returns an empty `Vec` when Elasticsearch is unavailable rather than
    /// propagating the error.
    ///
    /// # Errors
    ///
    /// Only returns `Err` for unexpected JSON shape — network failures are
    /// swallowed with a warning log.
    pub async fn search_hpo(
        &self,
        query: &str,
        limit: usize,
    ) -> Result<Vec<HpoSearchResult>, ReferenceError> {
        let body = build_multi_match_query(query, &["name^2", "definition"], limit);

        let raw = match self.post_search("oblivion-hpo", &body).await {
            Ok(v) => v,
            Err(e) => {
                warn!(error = %e, "Elasticsearch HPO search unavailable; falling back to Postgres");
                return Ok(vec![]);
            }
        };

        let hits = extract_hits(&raw);
        let results = hits
            .iter()
            .filter_map(|hit| {
                let id = hit["_id"].as_str()?.to_owned();
                let score = hit["_score"].as_f64().unwrap_or(0.0);
                let src = &hit["_source"];
                Some(HpoSearchResult {
                    id,
                    hpo_id: src["hpo_id"].as_str().unwrap_or("").to_owned(),
                    name: src["name"].as_str().unwrap_or("").to_owned(),
                    definition: src["definition"].as_str().map(ToOwned::to_owned),
                    score,
                })
            })
            .collect();

        Ok(results)
    }

    /// Search the `oblivion-syndromes` index for syndromes matching `query`.
    ///
    /// Uses a `multi_match` query over the `name` (boosted ×2) and
    /// `description` fields with `AUTO` fuzziness.
    ///
    /// Returns an empty `Vec` when Elasticsearch is unavailable rather than
    /// propagating the error.
    ///
    /// # Errors
    ///
    /// Only returns `Err` for unexpected JSON shape — network failures are
    /// swallowed with a warning log.
    pub async fn search_syndromes(
        &self,
        query: &str,
        limit: usize,
    ) -> Result<Vec<SyndromeSearchResult>, ReferenceError> {
        let body = build_multi_match_query(query, &["name^2", "description"], limit);

        let raw = match self.post_search("oblivion-syndromes", &body).await {
            Ok(v) => v,
            Err(e) => {
                warn!(
                    error = %e,
                    "Elasticsearch syndrome search unavailable; falling back to Postgres"
                );
                return Ok(vec![]);
            }
        };

        let hits = extract_hits(&raw);
        let results = hits
            .iter()
            .filter_map(|hit| {
                let id = hit["_id"].as_str()?.to_owned();
                let score = hit["_score"].as_f64().unwrap_or(0.0);
                let src = &hit["_source"];
                Some(SyndromeSearchResult {
                    id,
                    name: src["name"].as_str().unwrap_or("").to_owned(),
                    omim_id: src["omim_id"].as_str().map(ToOwned::to_owned),
                    description: src["description"].as_str().map(ToOwned::to_owned),
                    score,
                })
            })
            .collect();

        Ok(results)
    }

    // ── Index management ──────────────────────────────────────────────────────

    /// Ensure both Elasticsearch indices exist, creating them with field
    /// mappings if they are absent.
    ///
    /// A warning is logged if Elasticsearch is unavailable; the error is not
    /// propagated so that the service starts regardless of ES availability.
    ///
    /// # Errors
    ///
    /// Returns `Err` only when an index creation request receives an unexpected
    /// HTTP error (i.e. not 200 OK or 400 "already exists").
    pub async fn ensure_indices(&self) -> Result<(), ReferenceError> {
        self.ensure_index(
            "oblivion-hpo",
            json!({
                "mappings": {
                    "properties": {
                        "hpo_id":     { "type": "keyword" },
                        "name":       { "type": "text", "analyzer": "standard" },
                        "definition": { "type": "text", "analyzer": "standard" }
                    }
                }
            }),
        )
        .await?;

        self.ensure_index(
            "oblivion-syndromes",
            json!({
                "mappings": {
                    "properties": {
                        "name":        { "type": "text", "analyzer": "standard" },
                        "omim_id":     { "type": "keyword" },
                        "description": { "type": "text", "analyzer": "standard" },
                        "prevalence":  { "type": "keyword" },
                        "inheritance": { "type": "keyword" }
                    }
                }
            }),
        )
        .await?;

        Ok(())
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    /// `PUT /{index}` — create the index if it does not already exist.
    async fn ensure_index(&self, index: &str, body: Value) -> Result<(), ReferenceError> {
        let url = format!("{}/{index}", self.base_url);
        let resp = self
            .client
            .put(&url)
            .json(&body)
            .send()
            .await
            .map_err(|e| {
                ReferenceError::Internal(format!("ES index creation request failed: {e}"))
            })?;

        let status = resp.status();
        if status.is_success() {
            tracing::info!(index = %index, "Elasticsearch index ready");
            return Ok(());
        }

        // 400 with "resource_already_exists_exception" is not an error.
        if status.as_u16() == 400 {
            let body: Value = resp.json().await.unwrap_or(Value::Null);
            let kind = body
                .pointer("/error/type")
                .and_then(Value::as_str)
                .unwrap_or("");
            if kind == "resource_already_exists_exception" {
                return Ok(());
            }
            return Err(ReferenceError::Internal(format!(
                "ES index creation returned 400: {body}"
            )));
        }

        Err(ReferenceError::Internal(format!(
            "ES index creation returned unexpected status {status} for index {index}"
        )))
    }

    /// `POST /{index}/_search` — execute a search and return the raw JSON body.
    async fn post_search(&self, index: &str, body: &Value) -> Result<Value, reqwest::Error> {
        let url = format!("{}/{index}/_search", self.base_url);
        self.client
            .post(&url)
            .json(body)
            .send()
            .await?
            .json::<Value>()
            .await
    }
}

// ── JSON helpers ──────────────────────────────────────────────────────────────

/// Build the standard Elasticsearch `multi_match` query body.
fn build_multi_match_query(query: &str, fields: &[&str], size: usize) -> Value {
    json!({
        "query": {
            "multi_match": {
                "query": query,
                "fields": fields,
                "fuzziness": "AUTO"
            }
        },
        "size": size
    })
}

/// Extract the `hits.hits` array from an Elasticsearch response.
fn extract_hits(raw: &Value) -> &[Value] {
    raw.pointer("/hits/hits")
        .and_then(Value::as_array)
        .map(Vec::as_slice)
        .unwrap_or(&[])
}
