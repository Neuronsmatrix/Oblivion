//! Kafka producer and consumer wiring for the recognition service.
//!
//! This module provides two factory functions — [`create_producer`] and
//! [`create_consumer`] — and a long-running [`start_consumer`] task that
//! continuously reads [`AnalysisRequest`] messages, simulates ML inference
//! with a random delay, generates a diagnosis result, and publishes an
//! [`AnalysisResult`] back to Kafka.
//!
//! # Message flow
//!
//! ```text
//! [case / labs service]
//!        |
//!        v  analysis.requests
//! [recognition service]   <-- start_consumer
//!        |
//!        v  analysis.results
//! [case / labs service]
//! ```

use std::time::{Duration, Instant};

use chrono::Utc;
use oblivion_common::{AnalysisRequest, AnalysisResult, topics};
use rand::Rng;
use rdkafka::{
    ClientConfig, Message,
    consumer::{Consumer, StreamConsumer},
    message::OwnedHeaders,
    producer::{FutureProducer, FutureRecord},
};
use tokio::time::sleep;
use tracing::{error, info, warn};

use crate::generator::generate_random_diagnoses;
use crate::syndromes::SyndromeInfo;

/// Timeout used when sending a result message to Kafka.
const PRODUCE_TIMEOUT: Duration = Duration::from_secs(5);

/// Minimum simulated ML inference delay in milliseconds.
const DELAY_MIN_MS: u64 = 500;

/// Maximum simulated ML inference delay in milliseconds.
const DELAY_MAX_MS: u64 = 2_000;

// ─────────────────────────────────────────────────────────────────────────────
// Factory functions
// ─────────────────────────────────────────────────────────────────────────────

/// Create a Kafka [`FutureProducer`] connected to the given broker list.
///
/// # Panics
///
/// Panics if `rdkafka` cannot create the producer from the given configuration,
/// which typically indicates an invalid broker address.
#[must_use]
pub fn create_producer(brokers: &str) -> FutureProducer {
    ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .set("message.timeout.ms", "5000")
        .set("acks", "all")
        .create()
        .expect("failed to create Kafka producer")
}

/// Create a Kafka [`StreamConsumer`] with the given broker list and group ID.
///
/// The consumer is configured with automatic offset commits so messages are
/// acknowledged after being processed.
///
/// # Panics
///
/// Panics if `rdkafka` cannot create the consumer, which typically indicates
/// an invalid broker address or group ID.
#[must_use]
pub fn create_consumer(brokers: &str, group_id: &str) -> StreamConsumer {
    ClientConfig::new()
        .set("bootstrap.servers", brokers)
        .set("group.id", group_id)
        .set("enable.auto.commit", "true")
        .set("auto.offset.reset", "earliest")
        .set("session.timeout.ms", "6000")
        .create()
        .expect("failed to create Kafka consumer")
}

// ─────────────────────────────────────────────────────────────────────────────
// Consumer loop
// ─────────────────────────────────────────────────────────────────────────────

/// Drive the recognition consumer loop indefinitely.
///
/// For each [`AnalysisRequest`] received on [`topics::ANALYSIS_REQUESTS`]:
///
/// 1. Deserialise the message payload.
/// 2. Simulate ML inference by sleeping between 500 ms and 2 000 ms.
/// 3. Generate random top-10 diagnoses via [`generate_random_diagnoses`].
/// 4. Publish an [`AnalysisResult`] to [`topics::ANALYSIS_RESULTS`] with the
///    `request_id` attached as a Kafka header.
///
/// Deserialization errors and Kafka errors are logged and skipped; the consumer
/// never panics on a bad message.
pub async fn start_consumer(
    consumer: StreamConsumer,
    producer: FutureProducer,
    syndromes: Vec<SyndromeInfo>,
) {
    consumer
        .subscribe(&[topics::ANALYSIS_REQUESTS])
        .expect("failed to subscribe to analysis.requests topic");

    info!(
        topic = topics::ANALYSIS_REQUESTS,
        "recognition consumer subscribed"
    );

    loop {
        match consumer.recv().await {
            Err(err) => {
                error!(%err, "kafka consumer error");
            }
            Ok(borrowed_message) => {
                let payload = match borrowed_message.payload() {
                    Some(bytes) => bytes,
                    None => {
                        warn!("received empty Kafka message, skipping");
                        continue;
                    }
                };

                let request: AnalysisRequest = match serde_json::from_slice(payload) {
                    Ok(r) => r,
                    Err(err) => {
                        warn!(%err, "failed to deserialise AnalysisRequest, skipping message");
                        continue;
                    }
                };

                info!(
                    request_id = %request.request_id,
                    case_id    = %request.case_id,
                    "processing analysis request"
                );

                // Simulate variable ML inference latency.
                let delay_ms = rand::rng().random_range(DELAY_MIN_MS..=DELAY_MAX_MS);
                let started_at = Instant::now();
                sleep(Duration::from_millis(delay_ms)).await;
                let processing_time_ms =
                    u64::try_from(started_at.elapsed().as_millis()).unwrap_or(delay_ms);

                let top_diagnoses = generate_random_diagnoses(&syndromes);

                let result = AnalysisResult {
                    request_id: request.request_id,
                    case_id: request.case_id,
                    source: request.source,
                    batch_id: request.batch_id,
                    top_diagnoses,
                    processing_time_ms,
                    completed_at: Utc::now(),
                };

                let json = match serde_json::to_vec(&result) {
                    Ok(b) => b,
                    Err(err) => {
                        error!(%err, "failed to serialise AnalysisResult");
                        continue;
                    }
                };

                let request_id_str = result.request_id.to_string();

                let record = FutureRecord::to(topics::ANALYSIS_RESULTS)
                    .payload(json.as_slice())
                    .key(request_id_str.as_bytes())
                    .headers(
                        OwnedHeaders::new().insert(rdkafka::message::Header {
                            key: "request_id",
                            value: Some(request_id_str.as_bytes()),
                        }),
                    );

                match producer.send(record, PRODUCE_TIMEOUT).await {
                    Ok((partition, offset)) => {
                        info!(
                            request_id = %result.request_id,
                            partition,
                            offset,
                            "published result for request"
                        );
                    }
                    Err((err, _)) => {
                        error!(
                            request_id = %result.request_id,
                            %err,
                            "failed to publish AnalysisResult to kafka"
                        );
                    }
                }
            }
        }
    }
}
