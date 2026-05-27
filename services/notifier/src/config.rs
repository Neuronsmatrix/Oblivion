//! Configuration loader for the notifier service.
//!
//! All values are read from environment variables at startup. The JWT public
//! key is loaded from the path given by `JWT_PUBLIC_KEY_PATH`; if that file
//! cannot be read the service falls back to `JWT_SECRET` as an HS256 secret,
//! or generates a random one for local development.

use std::{env, fs};

use tracing::warn;

/// Runtime configuration for the notifier service.
#[derive(Debug, Clone)]
pub struct Config {
    /// TCP port the HTTP server binds to (`NOTIFIER_PORT`, default `3005`).
    pub port: u16,
    /// PostgreSQL connection string (`DATABASE_URL`).
    pub database_url: String,
    /// PostgreSQL search-path schema (`NOTIFIER_DB_SCHEMA`, default `"notifier"`).
    pub db_schema: String,
    /// Maximum connections in the Postgres pool
    /// (`NOTIFIER_DB_MAX_CONNECTIONS`, default `10`).
    pub db_max_connections: u32,
    /// Comma-separated Kafka broker list (`KAFKA_BROKERS`).
    pub kafka_brokers: String,
    /// Kafka consumer group id (`NOTIFIER_KAFKA_GROUP_ID`, default `"notifier-service"`).
    pub kafka_group_id: String,
    /// SMTP server hostname (`NOTIFIER_SMTP_HOST`, default `"localhost"`).
    pub smtp_host: String,
    /// SMTP server port (`NOTIFIER_SMTP_PORT`, default `1025`).
    pub smtp_port: u16,
    /// Envelope sender address (`NOTIFIER_SMTP_FROM`, default `"noreply@oblivion.dev"`).
    pub smtp_from: String,
    /// PEM-encoded public key (RS256) or shared secret (HS256) used to verify
    /// incoming JWTs. Loaded from `JWT_PUBLIC_KEY_PATH`, then `JWT_SECRET`,
    /// then a generated fallback.
    pub jwt_public_key: String,
    /// Whether the `jwt_public_key` field holds an RSA PEM key (`true`) or an
    /// HS256 raw secret (`false`).
    pub jwt_use_rsa: bool,
}

impl Config {
    /// Load configuration from the process environment.
    ///
    /// # Errors
    ///
    /// Returns an error string if a mandatory variable (`DATABASE_URL` or
    /// `KAFKA_BROKERS`) is absent or if a numeric variable cannot be parsed.
    ///
    /// # Panics
    ///
    /// Will not panic — all failures are returned as `Err`.
    pub fn from_env() -> Result<Self, String> {
        let port = env_u16("NOTIFIER_PORT", 3005)?;
        let database_url = require_env("DATABASE_URL")?;
        let db_schema = env_string("NOTIFIER_DB_SCHEMA", "notifier");
        let db_max_connections = env_u32("NOTIFIER_DB_MAX_CONNECTIONS", 10)?;
        let kafka_brokers = require_env("KAFKA_BROKERS")?;
        let kafka_group_id = env_string("NOTIFIER_KAFKA_GROUP_ID", "notifier-service");
        let smtp_host = env_string("NOTIFIER_SMTP_HOST", "localhost");
        let smtp_port = env_u16("NOTIFIER_SMTP_PORT", 1025)?;
        let smtp_from = env_string("NOTIFIER_SMTP_FROM", "noreply@oblivion.dev");
        let (jwt_public_key, jwt_use_rsa) = load_jwt_public_key();

        Ok(Self {
            port,
            database_url,
            db_schema,
            db_max_connections,
            kafka_brokers,
            kafka_group_id,
            smtp_host,
            smtp_port,
            smtp_from,
            jwt_public_key,
            jwt_use_rsa,
        })
    }
}

// ── helpers ───────────────────────────────────────────────────────────────────

/// Attempt to load the JWT public key for token verification.
///
/// Resolution order:
/// 1. PEM file at `JWT_PUBLIC_KEY_PATH` (RS256).
/// 2. Raw secret from `JWT_SECRET` (HS256).
/// 3. Randomly generated HS256 secret (dev-only fallback, emits a warning).
fn load_jwt_public_key() -> (String, bool) {
    if let Ok(path) = env::var("JWT_PUBLIC_KEY_PATH") {
        if !path.is_empty() {
            match fs::read_to_string(&path) {
                Ok(pem) => return (pem, true),
                Err(e) => warn!(
                    path = %path,
                    error = %e,
                    "Could not read JWT_PUBLIC_KEY_PATH; trying JWT_SECRET"
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
        "JWT_PUBLIC_KEY_PATH and JWT_SECRET are both unset; \
         generating a random HS256 secret (tokens from other services will be rejected)"
    );

    use rand::RngCore;
    let mut secret = [0u8; 64];
    rand::rng().fill_bytes(&mut secret);
    let hex_secret = secret.iter().map(|b| format!("{b:02x}")).collect::<String>();
    (hex_secret, false)
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
