//! Configuration loader for the recognition service.
//!
//! All configuration is sourced from environment variables at startup.
//! A `.env` file in the working directory is loaded first via [`dotenvy`],
//! so local development requires no shell exports.
//!
//! # Example
//!
//! ```rust,ignore
//! use oblivion_recognition::config::Config;
//!
//! let cfg = Config::from_env();
//! assert!(cfg.port > 0);
//! ```

use std::env;

/// Runtime configuration for the recognition service.
#[derive(Debug, Clone)]
pub struct Config {
    /// TCP port the HTTP server binds to (`RECOGNITION_PORT`, default `3004`).
    pub port: u16,
    /// Comma-separated list of Kafka broker addresses (`KAFKA_BROKERS`).
    pub kafka_brokers: String,
    /// Kafka consumer group identifier
    /// (`RECOGNITION_KAFKA_GROUP_ID`, default `"recognition-service"`).
    pub kafka_group_id: String,
}

impl Config {
    /// Build a [`Config`] by reading environment variables.
    ///
    /// # Panics
    ///
    /// Panics if `KAFKA_BROKERS` is not set, or if `RECOGNITION_PORT`
    /// is present but cannot be parsed as a `u16`.
    #[must_use]
    pub fn from_env() -> Self {
        let port = env::var("RECOGNITION_PORT")
            .unwrap_or_else(|_| "3004".to_string())
            .parse::<u16>()
            .expect("RECOGNITION_PORT must be a valid u16");

        let kafka_brokers =
            env::var("KAFKA_BROKERS").expect("KAFKA_BROKERS environment variable must be set");

        let kafka_group_id = env::var("RECOGNITION_KAFKA_GROUP_ID")
            .unwrap_or_else(|_| "recognition-service".to_string());

        Self {
            port,
            kafka_brokers,
            kafka_group_id,
        }
    }
}
