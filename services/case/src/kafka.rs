//! Kafka producer and consumer helpers for the case service.
//!
//! The producer publishes [`AnalysisRequest`] messages to the
//! `analysis.requests` topic and [`NotificationMessage`] messages to the
//! `notifications` topic.
//!
//! The consumer runs as a background `tokio::spawn` task, subscribes to
//! `analysis.results`, and for each result it:
//! 1. Inserts the ranked diagnoses into the database.
//! 2. Updates the case status to `completed`.
//! 3. Publishes a notification via the `notifications` topic.

use oblivion_common::{AnalysisRequest, AnalysisResult, NotificationMessage, topics};
use rdkafka::{
    consumer::{CommitMode, Consumer, StreamConsumer},
    producer::{FutureProducer, FutureRecord},
    ClientConfig, Message,
};
use serde_json::json;
use sqlx::PgPool;
use std::time::Duration;
use tracing::{error, info, instrument, warn};

use crate::{db, error::CaseError};

// ── Producer ──────────────────────────────────────────────────────────────────

/// Create a `FutureProducer` connected to the given broker list.
///
/// # Panics
///
/// Panics if the rdkafka configuration is syntactically invalid, which cannot
/// happen with the static keys used here.
#[must_use]
pub fn create_producer(brokers: &str) -> FutureProducer {
    ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .set("message.timeout.ms", "5000")
        .set("acks", "all")
        .create()
        .expect("failed to create Kafka FutureProducer")
}

/// Serialize `request` to JSON and publish it to the `analysis.requests` topic.
///
/// The `request_id` is attached as a Kafka message header so that consumers
/// can route or deduplicate without deserializing the full payload.
///
/// # Errors
///
/// Returns [`CaseError::Messaging`] if serialization or Kafka delivery fails.
#[instrument(skip(producer, request), fields(case_id = %request.case_id))]
pub async fn publish_analysis_request(
    producer: &FutureProducer,
    request: AnalysisRequest,
) -> Result<(), CaseError> {
    let payload = serde_json::to_string(&request)
        .map_err(|e| CaseError::Messaging(format!("serialize AnalysisRequest: {e}")))?;

    let key = request.request_id.to_string();
    let request_id_header = request.request_id.to_string();

    let record = FutureRecord::to(topics::ANALYSIS_REQUESTS)
        .payload(payload.as_bytes())
        .key(key.as_bytes())
        .headers(
            rdkafka::message::OwnedHeaders::new()
                .insert(rdkafka::message::Header {
                    key: "request_id",
                    value: Some(request_id_header.as_bytes()),
                }),
        );

    producer
        .send(record, Duration::from_secs(5))
        .await
        .map_err(|(e, _)| CaseError::Messaging(format!("Kafka send failed: {e}")))?;

    info!(case_id = %request.case_id, "analysis request published");
    Ok(())
}

/// Serialize `notification` to JSON and publish it to the `notifications` topic.
///
/// # Errors
///
/// Returns [`CaseError::Messaging`] if serialization or Kafka delivery fails.
#[instrument(skip(producer, notification), fields(user_id = %notification.user_id))]
pub async fn publish_notification(
    producer: &FutureProducer,
    notification: NotificationMessage,
) -> Result<(), CaseError> {
    let payload = serde_json::to_string(&notification)
        .map_err(|e| CaseError::Messaging(format!("serialize NotificationMessage: {e}")))?;

    let key = notification.user_id.to_string();

    let record = FutureRecord::to(topics::NOTIFICATIONS)
        .payload(payload.as_bytes())
        .key(key.as_bytes());

    producer
        .send(record, Duration::from_secs(5))
        .await
        .map_err(|(e, _)| CaseError::Messaging(format!("Kafka notification send failed: {e}")))?;

    info!(user_id = %notification.user_id, "notification published");
    Ok(())
}

// ── Consumer ──────────────────────────────────────────────────────────────────

/// Spawn a background task that consumes `analysis.results` messages.
///
/// For each message the task:
/// 1. Deserializes the [`AnalysisResult`].
/// 2. Inserts the ranked diagnoses via [`db::insert_diagnoses`].
/// 3. Updates the case status to `"completed"` (or `"failed"` on error).
/// 4. Publishes a push notification to the case owner.
///
/// Errors are logged but do not terminate the consumer loop — the task runs
/// for the lifetime of the process.
pub fn start_result_consumer(
    brokers: String,
    group_id: String,
    pool: PgPool,
    producer: FutureProducer,
) {
    tokio::spawn(async move {
        run_result_consumer(&brokers, &group_id, &pool, &producer).await;
    });
}

async fn run_result_consumer(
    brokers: &str,
    group_id: &str,
    pool: &PgPool,
    producer: &FutureProducer,
) {
    let consumer: StreamConsumer = ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .set("group.id", group_id)
        .set("enable.auto.commit", "false")
        .set("auto.offset.reset", "earliest")
        .set("session.timeout.ms", "6000")
        .create()
        .expect("failed to create Kafka StreamConsumer");

    consumer
        .subscribe(&[topics::ANALYSIS_RESULTS])
        .expect("failed to subscribe to analysis.results");

    info!("Kafka result consumer started, listening on {}", topics::ANALYSIS_RESULTS);

    loop {
        match consumer.recv().await {
            Err(e) => {
                error!(error = %e, "Kafka recv error");
            }
            Ok(msg) => {
                let payload = match msg.payload_view::<str>() {
                    Some(Ok(s)) => s.to_owned(),
                    Some(Err(e)) => {
                        warn!(error = %e, "Kafka message payload is not valid UTF-8; skipping");
                        let _ = consumer.commit_message(&msg, CommitMode::Async);
                        continue;
                    }
                    None => {
                        warn!("Kafka message has no payload; skipping");
                        let _ = consumer.commit_message(&msg, CommitMode::Async);
                        continue;
                    }
                };

                match serde_json::from_str::<AnalysisResult>(&payload) {
                    Err(e) => {
                        warn!(error = %e, "Failed to deserialize AnalysisResult; skipping");
                    }
                    Ok(result) => {
                        process_analysis_result(pool, producer, result).await;
                    }
                }

                let _ = consumer.commit_message(&msg, CommitMode::Async);
            }
        }
    }
}

/// Process a single [`AnalysisResult`]: persist diagnoses, update status,
/// and notify the case owner.
async fn process_analysis_result(
    pool: &PgPool,
    producer: &FutureProducer,
    result: AnalysisResult,
) {
    let case_id = result.case_id;

    // Retrieve the case to get the owner's user_id for the notification.
    let case_opt = match db::find_case_by_id(pool, case_id).await {
        Ok(opt) => opt,
        Err(e) => {
            error!(case_id = %case_id, error = %e, "Could not look up case");
            return;
        }
    };

    let Some(case) = case_opt else {
        warn!(case_id = %case_id, "Received analysis result for unknown case");
        return;
    };

    // Insert ranked diagnoses.
    if let Err(e) = db::insert_diagnoses(pool, case_id, result.top_diagnoses.clone()).await {
        error!(case_id = %case_id, error = %e, "Failed to insert diagnoses; marking case as failed");
        let _ = db::update_case_status(pool, case_id, "failed").await;
        return;
    }

    // Update case status to completed.
    if let Err(e) = db::update_case_status(pool, case_id, "completed").await {
        error!(case_id = %case_id, error = %e, "Failed to update case status to completed");
        return;
    }

    // Publish notification.
    let top_name = result
        .top_diagnoses
        .first()
        .map(|d| d.syndrome_name.as_str())
        .unwrap_or("unknown");

    let notification = NotificationMessage {
        user_id: case.user_id,
        notification_type: "analysis_complete".to_owned(),
        title: "Analysis Ready".to_owned(),
        body: format!(
            "Analysis for case {case_id} is complete. Top finding: {top_name}."
        ),
        metadata: json!({
            "case_id": case_id.to_string(),
            "request_id": result.request_id.to_string(),
            "top_diagnoses": result.top_diagnoses.len(),
        }),
        created_at: chrono::Utc::now(),
    };

    if let Err(e) = publish_notification(producer, notification).await {
        warn!(case_id = %case_id, error = %e, "Failed to publish notification");
    }

    info!(case_id = %case_id, "Analysis result processed successfully");
}

