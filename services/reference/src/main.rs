//! Entry point for the Oblivion reference service.
//!
//! Start-up sequence:
//! 1. Load `.env` (non-fatal if absent).
//! 2. Initialise JSON tracing subscriber.
//! 3. Read [`Config`] from the environment.
//! 4. Create the PostgreSQL connection pool.
//! 5. Create the Elasticsearch client and ensure indices exist
//!    (a warning is logged if ES is unavailable — the service starts anyway).
//! 6. Build the Axum router.
//! 7. Bind and serve with graceful shutdown on `SIGTERM` / `SIGINT`.

#![forbid(unsafe_code)]
#![warn(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]

mod auth_extractor;
mod config;
mod db;
mod elasticsearch;
mod error;
mod handlers;
mod models;
mod routes;
mod state;

use std::net::SocketAddr;

use tokio::net::TcpListener;
use tracing::{info, warn};
use tracing_subscriber::{EnvFilter, fmt, prelude::*};

use crate::{
    config::Config,
    elasticsearch::EsClient,
    state::AppState,
};

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
        elasticsearch = %config.elasticsearch_url,
        "reference service starting"
    );

    // ── 4. PostgreSQL pool ────────────────────────────────────────────────────
    let pool = db::create_pool(&config).await.unwrap_or_else(|e| {
        eprintln!("FATAL: {e}");
        std::process::exit(1);
    });

    // ── 5. Elasticsearch client ───────────────────────────────────────────────
    let es = EsClient::new(&config.elasticsearch_url);

    if let Err(e) = es.ensure_indices().await {
        warn!(
            error = %e,
            "Elasticsearch index setup failed; search will degrade to Postgres"
        );
    } else {
        info!("Elasticsearch indices ready");
    }

    // ── 6. Router ─────────────────────────────────────────────────────────────
    let state = AppState {
        pool,
        es,
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

    info!("reference service shut down cleanly");
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
