//! Entry point for the Oblivion case service.
//!
//! Startup sequence:
//! 1. Load `.env` (if present) via `dotenvy`.
//! 2. Initialise structured JSON tracing to stdout.
//! 3. Load [`Config`] from environment variables.
//! 4. Create the PostgreSQL connection pool.
//! 5. Create the S3 / MinIO client.
//! 6. Create the Kafka producer.
//! 7. Spawn the Kafka result consumer as a background task.
//! 8. Build the Axum router with tower-http middleware.
//! 9. Bind, serve, and wait for a graceful-shutdown signal (Ctrl-C).

#![forbid(unsafe_code)]
#![warn(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]

mod auth_extractor;
mod config;
mod db;
mod error;
mod handlers;
mod kafka;
mod models;
mod routes;
mod s3;
mod state;

use std::net::SocketAddr;

use tokio::net::TcpListener;
use tower_http::trace::TraceLayer;
use tracing::info;
use tracing_subscriber::{fmt, prelude::*, EnvFilter};

use crate::{config::Config, state::AppState};

#[tokio::main]
async fn main() {
    // 1. Load .env (ignore errors — the file is optional in production).
    let _ = dotenvy::dotenv();

    // 2. Initialise tracing.
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| "info".into()))
        .with(fmt::layer().json())
        .init();

    // 3. Load configuration.
    let config = Config::from_env().unwrap_or_else(|e| {
        tracing::error!(error = %e, "Configuration error");
        std::process::exit(1);
    });

    info!(port = config.port, schema = %config.db_schema, "case service starting");

    // 4. Create the PostgreSQL pool.
    let pool = db::create_pool(&config).await.unwrap_or_else(|e| {
        tracing::error!(error = %e, "Failed to connect to the database");
        std::process::exit(1);
    });

    // 5. Create the S3 client.
    let s3 = s3::create_s3_client(&config).await;

    // 6. Create the Kafka producer.
    let producer = kafka::create_producer(&config.kafka_brokers);

    // 7. Spawn the Kafka result consumer.
    kafka::start_result_consumer(
        config.kafka_brokers.clone(),
        config.kafka_group_id.clone(),
        pool.clone(),
        producer.clone(),
    );

    // 8. Build the router.
    let state = AppState {
        pool,
        s3,
        producer,
        config: config.clone(),
    };

    let cors = oblivion_common::cors_layer_from_env();

    let app = routes::router(state)
        .layer(TraceLayer::new_for_http())
        .layer(cors);

    // 9. Bind and serve.
    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    let listener = TcpListener::bind(addr).await.unwrap_or_else(|e| {
        tracing::error!(error = %e, addr = %addr, "Failed to bind TCP listener");
        std::process::exit(1);
    });

    info!(addr = %addr, "listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .unwrap_or_else(|e| {
            tracing::error!(error = %e, "Server error");
            std::process::exit(1);
        });

    info!("case service stopped");
}

/// Resolves when Ctrl-C (SIGINT) is received.
async fn shutdown_signal() {
    tokio::signal::ctrl_c()
        .await
        .expect("failed to install Ctrl-C handler");
    info!("shutdown signal received");
}
