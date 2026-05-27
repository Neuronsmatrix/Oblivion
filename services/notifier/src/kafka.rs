//! Kafka consumer for the `notifications` topic.
//!
//! [`start_notification_consumer`] spawns a background task that subscribes to
//! [`oblivion_common::topics::NOTIFICATIONS`], deserialises each message as a
//! [`NotificationMessage`], persists it to the database, and optionally sends
//! an email via SMTP (or logs the intent when SMTP is not configured).

use oblivion_common::{NotificationMessage, topics};
use rdkafka::{
    ClientConfig,
    consumer::{CommitMode, Consumer, StreamConsumer},
    message::Message,
};
use sqlx::PgPool;
use tracing::{error, info, warn};

use crate::{config::Config, db};

// ── Public API ────────────────────────────────────────────────────────────────

/// Spawn a background Kafka consumer task.
///
/// The task runs indefinitely; it logs any per-message errors and continues
/// consuming rather than terminating on transient failures. The spawned
/// `JoinHandle` is intentionally dropped — callers use graceful shutdown to
/// stop the process.
pub fn start_notification_consumer(
    brokers: String,
    group_id: String,
    pool: PgPool,
    config: Config,
) {
    tokio::spawn(async move {
        run_consumer(brokers, group_id, pool, config).await;
    });
}

// ── Consumer loop ─────────────────────────────────────────────────────────────

async fn run_consumer(brokers: String, group_id: String, pool: PgPool, config: Config) {
    let consumer: StreamConsumer = ClientConfig::new()
        .set("bootstrap.servers", &brokers)
        .set("group.id", &group_id)
        .set("auto.offset.reset", "earliest")
        .set("enable.auto.commit", "false")
        .create()
        .unwrap_or_else(|e| {
            error!(error = %e, "Failed to create Kafka consumer");
            std::process::exit(1);
        });

    consumer
        .subscribe(&[topics::NOTIFICATIONS])
        .unwrap_or_else(|e| {
            error!(
                topic = topics::NOTIFICATIONS,
                error = %e,
                "Failed to subscribe to Kafka topic"
            );
            std::process::exit(1);
        });

    info!(
        topic = topics::NOTIFICATIONS,
        group_id = %group_id,
        "Kafka consumer started"
    );

    loop {
        match consumer.recv().await {
            Err(e) => {
                warn!(error = %e, "Kafka receive error; retrying");
            }
            Ok(msg) => {
                let payload = match msg.payload() {
                    Some(bytes) => bytes,
                    None => {
                        warn!("Received empty Kafka message; skipping");
                        let _ = consumer.commit_message(&msg, CommitMode::Async);
                        continue;
                    }
                };

                match serde_json::from_slice::<NotificationMessage>(payload) {
                    Err(e) => {
                        warn!(error = %e, "Failed to deserialise NotificationMessage; skipping");
                    }
                    Ok(notification) => {
                        handle_notification(&pool, &config, &notification).await;
                    }
                }

                let _ = consumer.commit_message(&msg, CommitMode::Async);
            }
        }
    }
}

// ── Per-message logic ─────────────────────────────────────────────────────────

async fn handle_notification(pool: &PgPool, config: &Config, msg: &NotificationMessage) {
    let metadata_ref = if msg.metadata.is_null() {
        None
    } else {
        Some(&msg.metadata)
    };

    match db::insert_notification(
        pool,
        msg.user_id,
        &msg.notification_type,
        &msg.title,
        Some(msg.body.as_str()),
        metadata_ref,
    )
    .await
    {
        Ok(n) => {
            info!(
                notification_id = %n.id,
                user_id = %msg.user_id,
                notification_type = %msg.notification_type,
                "Notification persisted"
            );
        }
        Err(e) => {
            error!(
                user_id = %msg.user_id,
                error = %e,
                "Failed to persist notification"
            );
            // Continue — we still attempt the email even if DB write failed.
        }
    }

    send_email_or_log(config, msg).await;
}

// ── Email delivery ────────────────────────────────────────────────────────────

/// Attempt to deliver an email via SMTP.
///
/// When the SMTP host is `"localhost"` on port `1025` (the dev default) the
/// function logs the intent instead of opening a real SMTP connection.
/// In all other configurations it tries to relay the message through the
/// configured SMTP server and falls back to logging on any transport error.
async fn send_email_or_log(config: &Config, msg: &NotificationMessage) {
    let is_dev_smtp =
        config.smtp_host == "localhost" && config.smtp_port == 1025;

    if is_dev_smtp {
        info!(
            user_id = %msg.user_id,
            title = %msg.title,
            "Would send email to user {}: {}",
            msg.user_id,
            msg.title
        );
        return;
    }

    match try_send_email(config, msg) {
        Ok(()) => {
            info!(
                user_id = %msg.user_id,
                title = %msg.title,
                "Email sent successfully"
            );
        }
        Err(e) => {
            warn!(
                user_id = %msg.user_id,
                error = %e,
                "Email delivery failed; notification was persisted to DB"
            );
        }
    }
}

/// Build and relay an email using lettre's SMTP transport.
///
/// This is a synchronous operation performed on the calling async task; lettre's
/// `SmtpTransport` blocks internally. For higher-volume scenarios this should be
/// offloaded to `tokio::task::spawn_blocking`, but for the notifier's expected
/// load the current approach is acceptable.
fn try_send_email(config: &Config, msg: &NotificationMessage) -> Result<(), String> {
    use lettre::{
        Message as EmailMessage, SmtpTransport, Transport,
        message::header::ContentType,
        transport::smtp::authentication::Credentials,
    };

    let body_text = msg.body.clone();

    let email = EmailMessage::builder()
        .from(
            config
                .smtp_from
                .parse()
                .map_err(|e| format!("invalid from address: {e}"))?,
        )
        // We do not have the user's email address in the NotificationMessage,
        // so we address the envelope to a placeholder. A real deployment would
        // look up the email from the user service or include it in the message.
        .to(format!("user-{}@internal.oblivion.dev", msg.user_id)
            .parse()
            .map_err(|e| format!("invalid to address: {e}"))?)
        .subject(&msg.title)
        .header(ContentType::TEXT_PLAIN)
        .body(body_text)
        .map_err(|e| format!("build email: {e}"))?;

    let mailer = SmtpTransport::relay(&config.smtp_host)
        .map_err(|e| format!("SMTP relay error: {e}"))?
        .port(config.smtp_port)
        .credentials(Credentials::new(String::new(), String::new()))
        .build();

    mailer
        .send(&email)
        .map(|_| ())
        .map_err(|e| format!("SMTP send error: {e}"))
}
