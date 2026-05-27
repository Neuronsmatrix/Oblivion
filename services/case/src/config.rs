//! Configuration loader for the case service.
//!
//! All configuration is read from environment variables at startup. The JWT
//! public key is loaded from the PEM file at `JWT_PUBLIC_KEY_PATH`. If that
//! file cannot be read, the service falls back to an HS256 shared secret from
//! `JWT_SECRET` so that local development works without a provisioned key pair.

use std::{env, fs};

use tracing::warn;

/// Runtime configuration for the case service.
#[derive(Debug, Clone)]
pub struct Config {
    /// TCP port the HTTP server binds to (`CASE_PORT`, default `3002`).
    pub port: u16,
    /// PostgreSQL connection string (`DATABASE_URL`).
    pub database_url: String,
    /// PostgreSQL search-path schema (`CASE_DB_SCHEMA`, default `"cases"`).
    pub db_schema: String,
    /// Maximum connections in the Postgres pool
    /// (`CASE_DB_MAX_CONNECTIONS`, default `10`).
    pub db_max_connections: u32,
    /// Comma-separated Kafka broker list (`KAFKA_BROKERS`).
    pub kafka_brokers: String,
    /// Kafka consumer group id (`CASE_KAFKA_GROUP_ID`, default `"case-service"`).
    pub kafka_group_id: String,
    /// MinIO / S3 endpoint URL (`S3_ENDPOINT`).
    pub s3_endpoint: String,
    /// S3 region (`S3_REGION`).
    pub s3_region: String,
    /// S3 access key (`S3_ACCESS_KEY`).
    pub s3_access_key: String,
    /// S3 secret key (`S3_SECRET_KEY`).
    pub s3_secret_key: String,
    /// S3 bucket for raw uploaded images (`S3_BUCKET_RAW`, default `"oblivion-raw"`).
    pub s3_bucket_raw: String,
    /// PEM-encoded public key (or HS256 secret) used to verify JWTs.
    pub jwt_public_key: String,
    /// `true` if an RSA public key was loaded; `false` means HS256 fallback.
    pub jwt_use_rsa: bool,
}

impl Config {
    /// Load configuration from the process environment.
    ///
    /// # Errors
    ///
    /// Returns an error string if any mandatory variable (`DATABASE_URL`,
    /// `KAFKA_BROKERS`, `S3_ENDPOINT`, `S3_REGION`, `S3_ACCESS_KEY`,
    /// `S3_SECRET_KEY`) is absent.
    pub fn from_env() -> Result<Self, String> {
        let port = env_u16("CASE_PORT", 3002)?;
        let database_url = require_env("DATABASE_URL")?;
        let db_schema = env_string("CASE_DB_SCHEMA", "cases");
        let db_max_connections = env_u32("CASE_DB_MAX_CONNECTIONS", 10)?;
        let kafka_brokers = require_env("KAFKA_BROKERS")?;
        let kafka_group_id = env_string("CASE_KAFKA_GROUP_ID", "case-service");
        let s3_endpoint = require_env("S3_ENDPOINT")?;
        let s3_region = require_env("S3_REGION")?;
        let s3_access_key = require_env("S3_ACCESS_KEY")?;
        let s3_secret_key = require_env("S3_SECRET_KEY")?;
        let s3_bucket_raw = env_string("S3_BUCKET_RAW", "oblivion-raw");
        let (jwt_public_key, jwt_use_rsa) = load_jwt_public_key();

        Ok(Self {
            port,
            database_url,
            db_schema,
            db_max_connections,
            kafka_brokers,
            kafka_group_id,
            s3_endpoint,
            s3_region,
            s3_access_key,
            s3_secret_key,
            s3_bucket_raw,
            jwt_public_key,
            jwt_use_rsa,
        })
    }
}

// ── helpers ───────────────────────────────────────────────────────────────────

/// Load the JWT public key from a PEM file, falling back to a HS256 secret.
///
/// Priority:
/// 1. Read PEM from `JWT_PUBLIC_KEY_PATH`.
/// 2. Use plain string from `JWT_SECRET`.
/// 3. Generate a random 64-byte hex string (dev-only, emits a warning).
fn load_jwt_public_key() -> (String, bool) {
    let public_path = env::var("JWT_PUBLIC_KEY_PATH").unwrap_or_default();

    if !public_path.is_empty() {
        match fs::read_to_string(&public_path) {
            Ok(key) => return (key, true),
            Err(e) => {
                warn!(
                    path = %public_path,
                    error = %e,
                    "Could not read JWT public key file; trying JWT_SECRET fallback"
                );
            }
        }
    } else {
        warn!("JWT_PUBLIC_KEY_PATH not set; trying JWT_SECRET fallback");
    }

    if let Ok(secret) = env::var("JWT_SECRET") {
        if !secret.is_empty() {
            return (secret, false);
        }
    }

    warn!(
        "JWT_SECRET not set; generating ephemeral HS256 secret \
         (development only — tokens will be invalidated on restart)"
    );
    use std::fmt::Write as _;
    let mut secret = [0u8; 64];
    // Use getrandom directly so we avoid pulling in the full rand API here.
    // getrandom is a transitive dependency of uuid/rand anyway.
    let _ = (0..64).for_each(|i| secret[i] = (i as u8).wrapping_mul(0xA5).wrapping_add(0x3C));
    // For a real fallback we rely on rand which is already a workspace dep.
    use_rand_fill(&mut secret);
    let mut hex = String::with_capacity(128);
    for b in secret {
        let _ = write!(hex, "{b:02x}");
    }
    (hex, false)
}

fn use_rand_fill(buf: &mut [u8; 64]) {
    // Thin wrapper so the `rand` import only needs to live here.
    use rand::RngCore;
    rand::rng().fill_bytes(buf);
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
