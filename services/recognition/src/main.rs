//! Recognition service entry point.
//!
//! This binary starts the Oblivion recognition service, which:
//!
//! * Listens on `RECOGNITION_PORT` (default `3004`) for direct HTTP requests.
//! * Consumes [`oblivion_common::AnalysisRequest`] messages from Kafka.
//! * Generates random differential diagnoses (ML stub).
//! * Publishes [`oblivion_common::AnalysisResult`] messages back to Kafka.
//!
//! Configuration is sourced from environment variables; a `.env` file in the
//! working directory is loaded first via [`dotenvy`].

#![forbid(unsafe_code)]
#![warn(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]

mod config;
mod generator;
mod handlers;
mod kafka;
mod routes;
mod state;
mod syndromes;

use std::net::SocketAddr;

use tokio::net::TcpListener;
use tokio::signal;
use tracing::info;
use tracing_subscriber::{EnvFilter, fmt, prelude::*};

use config::Config;
use kafka::{create_consumer, create_producer, start_consumer};
use routes::router;
use state::AppState;
use syndromes::get_syndromes;

#[tokio::main]
async fn main() {
    // Load .env before touching std::env so Config::from_env sees the values.
    let _ = dotenvy::dotenv();

    // Initialise structured logging.  RUST_LOG controls verbosity; defaults to
    // "info" if unset.
    tracing_subscriber::registry()
        .with(EnvFilter::try_from_default_env().unwrap_or_else(|_| EnvFilter::new("info")))
        .with(fmt::layer().json())
        .init();

    let config = Config::from_env();

    info!(
        port          = config.port,
        kafka_brokers = %config.kafka_brokers,
        group_id      = %config.kafka_group_id,
        "starting recognition service"
    );

    let syndromes = get_syndromes();
    info!(count = syndromes.len(), "syndrome catalogue loaded");

    // ── Kafka setup ──────────────────────────────────────────────────────────
    let producer = create_producer(&config.kafka_brokers);
    let consumer = create_consumer(&config.kafka_brokers, &config.kafka_group_id);

    // Clone syndromes for the Kafka consumer task; the HTTP handler gets its
    // own copy via AppState.
    let kafka_syndromes = syndromes.clone();

    tokio::spawn(async move {
        start_consumer(consumer, producer, kafka_syndromes).await;
    });

    // ── HTTP server ──────────────────────────────────────────────────────────
    let state = AppState { syndromes };
    let app = router(state);

    let addr = SocketAddr::from(([0, 0, 0, 0], config.port));
    let listener = TcpListener::bind(addr)
        .await
        .expect("failed to bind TCP listener");

    info!(address = %addr, "HTTP server listening");

    axum::serve(listener, app)
        .with_graceful_shutdown(shutdown_signal())
        .await
        .expect("HTTP server error");

    info!("recognition service shut down");
}

/// Wait for SIGINT or SIGTERM and return, triggering graceful shutdown.
async fn shutdown_signal() {
    let ctrl_c = async {
        signal::ctrl_c()
            .await
            .expect("failed to install Ctrl+C handler");
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
