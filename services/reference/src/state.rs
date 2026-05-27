//! Shared application state threaded through Axum via `.with_state()`.

use sqlx::PgPool;

use crate::{config::Config, elasticsearch::EsClient};

/// Cloneable handle to every long-lived resource the handlers need.
///
/// `PgPool`, `EsClient`, and `Config` are all cheaply cloneable — the first
/// two via internal `Arc`, the last via standard struct clone.
#[derive(Clone)]
pub struct AppState {
    /// PostgreSQL connection pool for primary read queries.
    pub pool: PgPool,
    /// Elasticsearch client for full-text search (optional — degrades
    /// gracefully when the cluster is unavailable).
    pub es: EsClient,
    /// Service runtime configuration.
    pub config: Config,
}
