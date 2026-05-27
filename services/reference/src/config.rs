//! Configuration loader for the reference service.
//!
//! All configuration is read from environment variables at startup.  The
//! service has no write path, so the only secrets it needs are the JWT public
//! key (for token verification) and the database credentials embedded in
//! `DATABASE_URL`.

use std::{env, fs};

use tracing::warn;

/// Runtime configuration for the reference service.
#[derive(Debug, Clone)]
pub struct Config {
    /// TCP port the HTTP server binds to (`REFERENCE_PORT`, default `3006`).
    pub port: u16,
    /// PostgreSQL connection string (`DATABASE_URL`).
    pub database_url: String,
    /// PostgreSQL search-path schema (`REFERENCE_DB_SCHEMA`, default `"reference"`).
    pub db_schema: String,
    /// Maximum connections in the Postgres pool
    /// (`REFERENCE_DB_MAX_CONNECTIONS`, default `10`).
    pub db_max_connections: u32,
    /// Base URL for the Elasticsearch cluster
    /// (`ELASTICSEARCH_URL`, default `"http://localhost:9200"`).
    pub elasticsearch_url: String,
    /// PEM-encoded public key (or HS256 secret) used to verify inbound JWTs.
    pub jwt_public_key: String,
    /// Whether to interpret `jwt_public_key` as an RSA public key (`true`) or
    /// a plain HS256 secret (`false`).
    pub jwt_use_rsa: bool,
}

impl Config {
    /// Load configuration from the process environment.
    ///
    /// # Errors
    ///
    /// Returns an error string if any mandatory variable (`DATABASE_URL`) is
    /// absent.
    pub fn from_env() -> Result<Self, String> {
        let port = env_u16("REFERENCE_PORT", 3006)?;
        let database_url = require_env("DATABASE_URL")?;
        let db_schema = env_string("REFERENCE_DB_SCHEMA", "reference");
        let db_max_connections = env_u32("REFERENCE_DB_MAX_CONNECTIONS", 10)?;
        let elasticsearch_url =
            env_string("ELASTICSEARCH_URL", "http://localhost:9200");

        let (jwt_public_key, jwt_use_rsa) = load_jwt_public_key();

        Ok(Self {
            port,
            database_url,
            db_schema,
            db_max_connections,
            elasticsearch_url,
            jwt_public_key,
            jwt_use_rsa,
        })
    }
}

// ── helpers ───────────────────────────────────────────────────────────────────

/// Load the JWT public key from the path given by `JWT_PUBLIC_KEY_PATH`.
///
/// Falls back to reading `JWT_SECRET` as a plain HS256 secret, and finally
/// generates a random secret so the service starts even without any key
/// configuration (development mode).
fn load_jwt_public_key() -> (String, bool) {
    if let Ok(path) = env::var("JWT_PUBLIC_KEY_PATH") {
        if !path.is_empty() {
            match fs::read_to_string(&path) {
                Ok(key) => return (key, true),
                Err(e) => warn!(
                    path = %path,
                    error = %e,
                    "Could not read JWT public key file; falling back to HS256"
                ),
            }
        }
    }

    if let Ok(secret) = env::var("JWT_SECRET") {
        if !secret.is_empty() {
            return (secret, false);
        }
    }

    warn!(
        "JWT_PUBLIC_KEY_PATH / JWT_SECRET not set; \
         falling back to HS256 with generated secret (development only)"
    );

    use rand::RngCore;
    let mut bytes = [0u8; 64];
    rand::rng().fill_bytes(&mut bytes);
    let hex: String = bytes.iter().map(|b| format!("{b:02x}")).collect();
    (hex, false)
}

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
