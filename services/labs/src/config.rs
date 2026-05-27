//! Configuration loader for the labs service.
//!
//! All values are read from environment variables at startup. Missing mandatory
//! variables cause an early-exit error; optional variables fall back to sensible
//! defaults so that local development works without a full `.env` file.

use std::env;

/// Runtime configuration for the labs service.
#[derive(Debug, Clone)]
pub struct Config {
    /// TCP port the HTTP server binds to (`LABS_PORT`, default `3003`).
    pub port: u16,
    /// PostgreSQL connection string (`DATABASE_URL`).
    pub database_url: String,
    /// PostgreSQL search-path schema (`LABS_DB_SCHEMA`, default `"labs"`).
    pub db_schema: String,
    /// Maximum connections in the Postgres pool
    /// (`LABS_DB_MAX_CONNECTIONS`, default `10`).
    pub db_max_connections: u32,
    /// Redis connection URL (`REDIS_URL`).
    pub redis_url: String,
    /// Comma-separated list of Kafka broker addresses
    /// (`KAFKA_BROKERS`, default `"localhost:9092"`).
    pub kafka_brokers: String,
    /// Kafka consumer group ID
    /// (`LABS_KAFKA_GROUP_ID`, default `"labs-service"`).
    pub kafka_group_id: String,
    /// Base URL of the billing service
    /// (`LABS_BILLING_URL`, default `"http://localhost:3007"`).
    pub billing_url: String,
    /// PEM-encoded public key used for verifying JWTs issued by the auth service
    /// (`JWT_PUBLIC_KEY`).
    pub jwt_public_key: String,
}

impl Config {
    /// Load configuration from the process environment.
    ///
    /// # Errors
    ///
    /// Returns an error string if any mandatory variable (`DATABASE_URL`,
    /// `REDIS_URL`, `JWT_PUBLIC_KEY`) is absent.
    pub fn from_env() -> Result<Self, String> {
        let port = env_u16("LABS_PORT", 3003)?;
        let database_url = require_env("DATABASE_URL")?;
        let db_schema = env_string("LABS_DB_SCHEMA", "labs");
        let db_max_connections = env_u32("LABS_DB_MAX_CONNECTIONS", 10)?;
        let redis_url = require_env("REDIS_URL")?;
        let kafka_brokers = env_string("KAFKA_BROKERS", "localhost:9092");
        let kafka_group_id = env_string("LABS_KAFKA_GROUP_ID", "labs-service");
        let billing_url = env_string("LABS_BILLING_URL", "http://localhost:3007");
        let jwt_public_key = require_env("JWT_PUBLIC_KEY")?;

        Ok(Self {
            port,
            database_url,
            db_schema,
            db_max_connections,
            redis_url,
            kafka_brokers,
            kafka_group_id,
            billing_url,
            jwt_public_key,
        })
    }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

fn require_env(key: &str) -> Result<String, String> {
    env::var(key).map_err(|_| format!("missing required environment variable: {key}"))
}

fn env_string(key: &str, default: &str) -> String {
    env::var(key).unwrap_or_else(|_| default.to_owned())
}

fn env_u16(key: &str, default: u16) -> Result<u16, String> {
    match env::var(key) {
        Err(_) => Ok(default),
        Ok(v) => v
            .parse::<u16>()
            .map_err(|e| format!("invalid value for {key}: {e}")),
    }
}

fn env_u32(key: &str, default: u32) -> Result<u32, String> {
    match env::var(key) {
        Err(_) => Ok(default),
        Ok(v) => v
            .parse::<u32>()
            .map_err(|e| format!("invalid value for {key}: {e}")),
    }
}
