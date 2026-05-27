//! Configuration loader for the auth service.
//!
//! All configuration is read from environment variables at startup. JWT keys
//! are loaded from PEM files specified by `JWT_PRIVATE_KEY_PATH` and
//! `JWT_PUBLIC_KEY_PATH`. If those files cannot be read, a random HS256 secret
//! is generated and a warning is emitted so that local development works
//! without a pre-provisioned key pair.

use std::{env, fs};

use tracing::warn;

/// Runtime configuration for the auth service.
#[derive(Debug, Clone)]
pub struct Config {
    /// TCP port the HTTP server binds to (`AUTH_PORT`, default `3001`).
    pub port: u16,
    /// PostgreSQL connection string (`DATABASE_URL`).
    pub database_url: String,
    /// PostgreSQL search-path schema (`AUTH_DB_SCHEMA`, default `"auth"`).
    pub db_schema: String,
    /// Maximum connections in the Postgres pool
    /// (`AUTH_DB_MAX_CONNECTIONS`, default `10`).
    pub db_max_connections: u32,
    /// Redis connection URL (`REDIS_URL`).
    pub redis_url: String,
    /// PEM-encoded private key used for signing JWTs.
    /// Contains either an RSA private key (RS256) or an HS256 secret.
    pub jwt_private_key: String,
    /// PEM-encoded public key used for verifying JWTs.
    /// For HS256 fallback this is the same value as `jwt_private_key`.
    pub jwt_public_key: String,
    /// Whether RSA keys are available; `false` means HS256 fallback is active.
    pub jwt_use_rsa: bool,
    /// Lifetime of access tokens in seconds
    /// (`JWT_ACCESS_TOKEN_EXPIRY_SECS`, default `3600`).
    pub jwt_access_expiry_secs: i64,
    /// Lifetime of refresh tokens in seconds
    /// (`JWT_REFRESH_TOKEN_EXPIRY_SECS`, default `604800`).
    pub jwt_refresh_expiry_secs: i64,
}

impl Config {
    /// Load configuration from the process environment.
    ///
    /// # Errors
    ///
    /// Returns an error string if any mandatory variable (`DATABASE_URL`,
    /// `REDIS_URL`) is absent.
    ///
    /// # Panics
    ///
    /// Will not panic — all failures are returned as `Err`.
    pub fn from_env() -> Result<Self, String> {
        let port = env_u16("AUTH_PORT", 3001)?;
        let database_url = require_env("DATABASE_URL")?;
        let db_schema = env_string("AUTH_DB_SCHEMA", "auth");
        let db_max_connections = env_u32("AUTH_DB_MAX_CONNECTIONS", 10)?;
        let redis_url = require_env("REDIS_URL")?;
        let jwt_access_expiry_secs = env_i64("JWT_ACCESS_TOKEN_EXPIRY_SECS", 3600)?;
        let jwt_refresh_expiry_secs = env_i64("JWT_REFRESH_TOKEN_EXPIRY_SECS", 604_800)?;

        let (jwt_private_key, jwt_public_key, jwt_use_rsa) = load_jwt_keys();

        Ok(Self {
            port,
            database_url,
            db_schema,
            db_max_connections,
            redis_url,
            jwt_private_key,
            jwt_public_key,
            jwt_use_rsa,
            jwt_access_expiry_secs,
            jwt_refresh_expiry_secs,
        })
    }
}

// ── helpers ──────────────────────────────────────────────────────────────────

/// Read and return the JWT keys, falling back to a generated HS256 secret.
fn load_jwt_keys() -> (String, String, bool) {
    let private_path = env::var("JWT_PRIVATE_KEY_PATH").unwrap_or_default();
    let public_path = env::var("JWT_PUBLIC_KEY_PATH").unwrap_or_default();

    if !private_path.is_empty() && !public_path.is_empty() {
        match (fs::read_to_string(&private_path), fs::read_to_string(&public_path)) {
            (Ok(priv_key), Ok(pub_key)) => {
                return (priv_key, pub_key, true);
            }
            (Err(e), _) => {
                warn!(
                    path = %private_path,
                    error = %e,
                    "Could not read JWT private key file; falling back to HS256"
                );
            }
            (_, Err(e)) => {
                warn!(
                    path = %public_path,
                    error = %e,
                    "Could not read JWT public key file; falling back to HS256"
                );
            }
        }
    } else {
        warn!(
            "JWT_PRIVATE_KEY_PATH / JWT_PUBLIC_KEY_PATH not set; \
             falling back to HS256 with generated secret (development only)"
        );
    }

    // HS256 fallback: generate a random 64-byte secret encoded as hex.
    use rand::RngCore;
    let mut secret = [0u8; 64];
    rand::rng().fill_bytes(&mut secret);
    let hex_secret = secret.iter().map(|b| format!("{b:02x}")).collect::<String>();
    (hex_secret.clone(), hex_secret, false)
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

fn env_i64(key: &str, default: i64) -> Result<i64, String> {
    match env::var(key) {
        Err(_) => Ok(default),
        Ok(v) => v
            .parse::<i64>()
            .map_err(|e| format!("invalid value for {key}: {e}")),
    }
}
