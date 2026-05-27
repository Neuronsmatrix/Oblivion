//! Shared application state threaded through axum via `.with_state()`.

use deadpool_redis::Pool as RedisPool;
use sqlx::PgPool;

use crate::{auth_extractor::AuthState, config::Config};

/// Cloneable handle to every long-lived resource the handlers need.
#[derive(Clone)]
pub struct AppState {
    pub db: PgPool,
    pub redis: RedisPool,
    pub config: Config,
}

impl AuthState for AppState {
    fn config(&self) -> &Config {
        &self.config
    }

    fn redis_pool(&self) -> &RedisPool {
        &self.redis
    }
}
