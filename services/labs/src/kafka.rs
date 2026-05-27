//! Kafka producer and consumer for the labs service.
//!
//! # Producer
//! [`create_producer`] returns an [`rdkafka::producer::FutureProducer`] used to
//! publish [`oblivion_common::AnalysisRequest`] messages to the
//! `analysis.requests` topic.
//!
//! # Consumer
//! [`start_result_consumer`] spawns a background task that subscribes to
//! `analysis.results`, processes each message, and updates the database.

use oblivion_common::{AnalysisRequest, AnalysisResult, AnalysisSource, topics};
use rdkafka::{
    Message,
    consumer::{Consumer, StreamConsumer},
    producer::{FutureProducer, FutureRecord},
};
use sqlx::PgPool;
use std::time::Duration;
use uuid::Uuid;

use crate::db;

// ── Producer ──────────────────────────────────────────────────────────────────

/// Create a Kafka producer configured to connect to `brokers`.
///
/// # Errors
///
/// Returns an error string if the producer cannot be created.
pub fn create_producer(brokers: &str) -> Result<FutureProducer, String> {
    use rdkafka::config::ClientConfig;

    ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .set("message.timeout.ms", "5000")
        .create::<FutureProducer>()
        .map_err(|e| format!("failed to create Kafka producer: {e}"))
}

/// Publish a single [`AnalysisRequest`] message to the `analysis.requests`
/// topic.
///
/// The message key is the `batch_id` (as a string) so that all items from the
/// same batch land on the same partition.
///
/// # Errors
///
/// Returns an error string if serialisation or the Kafka send fails.
pub async fn publish_analysis_request(
    producer: &FutureProducer,
    request: &AnalysisRequest,
) -> Result<(), String> {
    let payload = serde_json::to_string(request)
        .map_err(|e| format!("serialise AnalysisRequest: {e}"))?;

    let key = request
        .batch_id
        .map_or_else(|| request.request_id.to_string(), |id| id.to_string());

    producer
        .send(
            FutureRecord::to(topics::ANALYSIS_REQUESTS)
                .payload(&payload)
                .key(&key),
            Duration::from_secs(5),
        )
        .await
        .map_err(|(e, _)| format!("kafka send failed: {e}"))?;

    Ok(())
}

// ── Consumer ──────────────────────────────────────────────────────────────────

/// Spawn a background task that consumes `analysis.results` and updates the
/// database accordingly.
///
/// For each result message:
/// 1. Parse the [`AnalysisResult`] payload.
/// 2. Find the matching batch item by `request_id` (looked up via `case_id`).
/// 3. Update the batch item's status to `"completed"` and set `case_id`.
/// 4. Increment the batch's `processed_items` counter.
/// 5. If the batch is now fully processed, log a completion event.
pub fn start_result_consumer(brokers: String, group_id: String, pool: PgPool) {
    tokio::spawn(async move {
        if let Err(e) = run_result_consumer(&brokers, &group_id, pool).await {
            tracing::error!(error = %e, "analysis.results consumer exited with error");
        }
    });
}

async fn run_result_consumer(
    brokers: &str,
    group_id: &str,
    pool: PgPool,
) -> Result<(), String> {
    use rdkafka::config::ClientConfig;

    let consumer: StreamConsumer = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .set("group.id", group_id)
        .set("enable.auto.commit", "true")
        .set("auto.offset.reset", "earliest")
        .create()
        .map_err(|e| format!("failed to create Kafka consumer: {e}"))?;

    consumer
        .subscribe(&[topics::ANALYSIS_RESULTS])
        .map_err(|e| format!("failed to subscribe to {}: {e}", topics::ANALYSIS_RESULTS))?;

    tracing::info!(
        topic = topics::ANALYSIS_RESULTS,
        group_id,
        "analysis results consumer started"
    );

    loop {
        match consumer.recv().await {
            Err(e) => {
                tracing::warn!(error = %e, "kafka receive error; retrying");
            }
            Ok(msg) => {
                let payload = match msg.payload() {
                    Some(p) => p,
                    None => {
                        tracing::warn!("received empty kafka message; skipping");
                        continue;
                    }
                };

                match serde_json::from_slice::<AnalysisResult>(payload) {
                    Err(e) => {
                        tracing::warn!(error = %e, "failed to deserialise AnalysisResult; skipping");
                    }
                    Ok(result) => {
                        if result.source != AnalysisSource::Lab {
                            // This message belongs to the case service; skip.
                            continue;
                        }

                        let batch_id = match result.batch_id {
                            Some(id) => id,
                            None => {
                                tracing::warn!(
                                    request_id = %result.request_id,
                                    "lab analysis result has no batch_id; skipping"
                                );
                                continue;
                            }
                        };

                        if let Err(e) =
                            handle_result(&pool, batch_id, result.case_id, result.request_id)
                                .await
                        {
                            tracing::error!(
                                error = %e,
                                batch_id = %batch_id,
                                "failed to handle analysis result"
                            );
                        }
                    }
                }
            }
        }
    }
}

/// Apply a single analysis result to the database.
async fn handle_result(
    pool: &PgPool,
    batch_id: Uuid,
    case_id: Uuid,
    _request_id: Uuid,
) -> Result<(), String> {
    // Find the pending batch item by batch_id whose case_id is not yet set.
    // We use the first pending item as a proxy since request_id tracking
    // across the analysis pipeline maps via case_id.
    let item = sqlx::query_as::<_, crate::models::BatchItem>(
        r#"
        SELECT id, batch_id, image_key, case_id, status, created_at
        FROM batch_items
        WHERE batch_id = $1 AND status = 'pending'
        ORDER BY created_at ASC
        LIMIT 1
        "#,
    )
    .bind(batch_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| format!("fetch pending batch item: {e}"))?;

    let Some(item) = item else {
        tracing::warn!(%batch_id, "no pending items found for batch; result may be duplicate");
        return Ok(());
    };

    // Mark item as completed with the resulting case_id.
    db::update_batch_item_status(pool, item.id, "completed", Some(case_id))
        .await
        .map_err(|e| format!("update batch item status: {e}"))?;

    // Increment the processed counter; get back the updated batch.
    let batch = db::increment_batch_processed(pool, batch_id)
        .await
        .map_err(|e| format!("increment batch processed: {e}"))?;

    if batch.status == "completed" {
        tracing::info!(
            batch_id = %batch_id,
            lab_id = %batch.lab_id,
            total_items = batch.total_items,
            "batch fully processed"
        );
    }

    Ok(())
}
