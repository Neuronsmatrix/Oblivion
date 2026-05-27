//! Shared application state threaded through every Axum handler.

use aws_sdk_s3::Client as S3Client;
use rdkafka::producer::FutureProducer;
use sqlx::PgPool;

use crate::config::Config;

/// Application state passed to every handler via Axum's `State` extractor.
#[derive(Clone)]
pub struct AppState {
    /// PostgreSQL connection pool.
    pub pool: PgPool,
    /// Configured S3 / MinIO client.
    pub s3: S3Client,
    /// Kafka producer for publishing analysis requests and notifications.
    pub producer: FutureProducer,
    /// Service configuration (JWT public key, bucket name, etc.).
    pub config: Config,
}
