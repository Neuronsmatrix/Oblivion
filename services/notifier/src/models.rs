//! Domain models for the notifier service.

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

// ── Notification ──────────────────────────────────────────────────────────────

/// A persisted notification record retrieved from the database.
///
/// # Example
///
/// ```rust,ignore
/// use uuid::Uuid;
/// use chrono::Utc;
/// use serde_json::json;
/// use oblivion_notifier::models::Notification;
///
/// // Typically returned by db::list_notifications.
/// let n = Notification {
///     id: Uuid::new_v4(),
///     user_id: Uuid::new_v4(),
///     notification_type: "analysis_complete".to_string(),
///     title: "Analysis Ready".to_string(),
///     body: Some("Your results are available.".to_string()),
///     read: false,
///     metadata: Some(json!({ "case_id": "abc" })),
///     created_at: Utc::now(),
/// };
/// assert!(!n.read);
/// ```
#[derive(Debug, Clone, Serialize, sqlx::FromRow)]
pub struct Notification {
    /// Primary key of the notification row.
    pub id: Uuid,
    /// Recipient user identifier.
    pub user_id: Uuid,
    /// Machine-readable event type (e.g. `"analysis_complete"`).
    #[sqlx(rename = "type")]
    pub notification_type: String,
    /// Short human-readable title.
    pub title: String,
    /// Optional full notification body.
    pub body: Option<String>,
    /// Whether the user has acknowledged this notification.
    pub read: bool,
    /// Arbitrary JSON metadata for client-side deep-linking.
    pub metadata: Option<serde_json::Value>,
    /// Timestamp at which the notification was created.
    pub created_at: DateTime<Utc>,
}

// ── Pagination ────────────────────────────────────────────────────────────────

/// Query parameters for paginated list endpoints.
///
/// Both fields are optional; callers that omit them receive the service
/// defaults (`limit = 20`, `offset = 0`).
#[derive(Debug, Deserialize)]
pub struct PaginationParams {
    /// Maximum number of items to return (capped at 100 by the handler).
    pub limit: Option<i64>,
    /// Number of items to skip before returning results.
    pub offset: Option<i64>,
}
