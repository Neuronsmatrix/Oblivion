//! Entry point for the Oblivion labs service.
//!
//! Start-up sequence:
//! 1. Load `.env` (non-fatal if absent).
//! 2. Initialise JSON tracing subscriber.
//! 3. Read [`Config`] from the environment.
//! 4. Create PostgreSQL, Redis, and Kafka connections.
//! 5. Spawn the Kafka result consumer.
//! 6. Build the axum router.
//! 7. Bind and serve with graceful shutdown on `SIGTERM` / `SIGINT`.

#![forbid(unsafe_code)]
#![warn(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]

mod auth_extractor;
mod billing_client;
mod config;
mod db;
mod error;
mod handlers;
mod kafka;
mod models;
mod rate_limiter;
mod routes;
mod state;

use std::net::SocketAddr;

use deadpool_redis::{Config as RedisConfig, Runtime};
use tokio::net::TcpListener;
use tracing::info;
use tracing_subscriber::{EnvFilter, fmt, prelude::*};

use crate::{config::Config, state::AppState};

#[tokio::main]
async fn main() {
    // ── 1. Load .env (best-effort) ────────────────────────────────────────────
    dotenvy::dotenv().ok();

    // ── 2. Tracing subscriber ─────────────────────────────────────────────────
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(fmt::layer().json())
        .init();

    // ── 3. Configuration ──────────────────────────────────────────────────────
    let config = Config::from_env().unwrap_or_else(|e| {
        eprintln!("FATAL: configuration error: {e}");
        std::process::exit(1);
    });

    info!(
        port = config.port,
        schema = %config.db_schema,
        kafka_brokers = %config.kafka_brokers,
        billing_url = %config.billing_url,
        "labs service starting"
    );

    // ── 4a. PostgreSQL pool ───────────────────────────────────────────────────
    let db_pool = db::create_pool(&config).await.unwrap_or_else(|e| {
        eprintln!("FATAL: {e}");
        std::process::exit(1);
    });

    // ── 4b. Redis pool ────────────────────────────────────────────────────────
    let redis_pool = RedisConfig {
        url: Some(config.redis_url.clone()),
        connection: None,
        pool: None,
    }
    .create_pool(Some(Runtime::Tokio1))
    .unwrap_or_else(|e| {
        eprintln!("FATAL: redis pool creation failed: {e}");
        std::process::exit(1);
    });

    // ── 4c. Kafka producer ────────────────────────────────────────────────────
    let kafka_producer = kafka::create_producer(&config.kafka_brokers).unwrap_or_else(|e| {
        eprintln!("FATAL: {e}");
        std::process::exit(1);
    });

    // ── 5. Kafka result consumer (background task) ────────────────────────────
    kafka::start_result_consumer(
        config.kafka_brokers.clone(),
        config.kafka_group_id.clone(),
        db_pool.clone(),
    );

    // ── 4d. Reqwest HTTP client ───────────────────────────────────────────────
    let http_client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(10))
        .build()
        .unwrap_or_else(|e| {
            eprintln!("FATAL: could not build HTTP client: {e}");
            std::process::exit(1);
        });

    // ── 6. Router ─────────────────────────────────────────────────────────────
    let state = AppState {
        db: db_pool,
        redis: redis_pool,
        kafka_producer,
        http: http_client,
        config: config.clone(),
    };
    let app = routes::router(state);

    // ── 7. Bind & serve ───────────────────────────────────────────────────────
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    let listener = TcpListener::bind(addr).await.unwrap_or_else(|e| {
        eprintln!("FATAL: could not bind to {addr}: {e}");
        std::process::exit(1);
    });

    info!(address = %addr, "listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap_or_else(|e| eprintln!("server error: {e}"));

    info!("labs service shut down cleanly");
}

/// Resolves when either `SIGINT` (Ctrl-C) or `SIGTERM` is received.
async fn shutdown_signal() {
    use tokio::signal;

    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl-C handler");
    };

    #[cfg(unix)]
    let terminate = async {
        signal::unix::signal(signal::unix::SignalKind::terminate())
            .expect("failed to install SIGTERM handler")
            .recv()
            .await;
    };

    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        () = ctrl_c => {},
        () = terminate => {},
    }

    info!("shutdown signal received");
}
