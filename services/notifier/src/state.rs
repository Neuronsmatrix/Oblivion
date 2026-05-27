//! Shared application state threaded through axum via `.with_state()`.

use sqlx::PgPool;

use crate::{auth_extractor::NotifierAuthState, config::Config};

/// Cloneable handle to every long-lived resource the handlers need.
#[derive(Clone)]
pub struct AppState {
    /// PostgreSQL connection pool.
    pub pool: PgPool,
    /// Service configuration.
    pub config: Config,
}

impl NotifierAuthState for AppState {
    fn config(&self) -> &Config {
        &self.config
    }
}
