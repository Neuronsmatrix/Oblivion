//! Domain models for the reference service.
//!
//! All models are read-only; the reference service exposes no mutation
//! endpoints.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ── Database row types ─────────────────────────────────────────────────────────

/// A genetic syndrome record from `reference.syndromes`.
#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct Syndrome {
    /// Primary key.
    pub id: Uuid,
    /// Human-readable syndrome name.
    pub name: String,
    /// OMIM catalogue identifier (e.g. `"190685"`).
    pub omim_id: Option<String>,
    /// Free-text clinical description.
    pub description: Option<String>,
    /// Estimated population prevalence (e.g. `"1:700 births"`).
    pub prevalence: Option<String>,
    /// Inheritance pattern (e.g. `"Autosomal dominant"`).
    pub inheritance: Option<String>,
    /// Row creation timestamp.
    pub created_at: DateTime<Utc>,
}

/// An HPO (Human Phenotype Ontology) term from `reference.hpo_terms`.
#[derive(Debug, Clone, sqlx::FromRow, Serialize)]
pub struct HpoTerm {
    /// Primary key.
    pub id: Uuid,
    /// Official HPO identifier string (e.g. `"HP:0000252"`).
    pub hpo_id: String,
    /// Human-readable term name.
    pub name: String,
    /// Full term definition.
    pub definition: Option<String>,
    /// Parent term UUID for ontology hierarchy navigation.
    pub parent_id: Option<Uuid>,
}

/// A [`Syndrome`] enriched with its associated HPO terms.
#[derive(Debug, Serialize)]
pub struct SyndromeWithHpo {
    /// Flattened syndrome fields.
    #[serde(flatten)]
    pub syndrome: Syndrome,
    /// All HPO terms linked to this syndrome via `reference.syndrome_hpo`.
    pub hpo_terms: Vec<HpoTerm>,
}

// ── Query parameter types ─────────────────────────────────────────────────────

/// Query parameters accepted by list/search endpoints.
#[derive(Debug, Deserialize)]
pub struct SearchParams {
    /// Full-text search query string.
    pub q: Option<String>,
    /// Maximum number of results to return (default `20`, max `100`).
    pub limit: Option<i64>,
    /// Zero-based offset for pagination (default `0`).
    pub offset: Option<i64>,
}
