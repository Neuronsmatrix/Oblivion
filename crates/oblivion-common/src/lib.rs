//! Shared types for the Oblivion platform.
//!
//! This crate provides domain newtypes, API envelope types, error types,
//! Kafka topic constants, domain enums, and Kafka message structs that are
//! consumed by every microservice in the workspace.
//!
//! # Example — building a successful response
//!
//! ```rust
//! use oblivion_common::ApiResponse;
//!
//! let resp: ApiResponse<&str> = ApiResponse::ok("hello");
//! assert_eq!(resp.status, "ok");
//! assert_eq!(resp.data, Some("hello"));
//! assert!(resp.error.is_none());
//! ```

#![forbid(unsafe_code)]
#![warn(clippy::pedantic)]
#![allow(clippy::module_name_repetitions)]

use axum::{
    Json,
    response::{IntoResponse, Response},
    http::{HeaderValue, StatusCode},
};
use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tower_http::cors::{Any, CorsLayer};
use uuid::Uuid;

// ───────────────────────────────────────────────────────────────────────────
// Domain ID newtypes
// ───────────────────────────────────────────────────────────────────────────

macro_rules! uuid_newtype {
    (
        $(#[$attr:meta])*
        $name:ident
    ) => {
        $(#[$attr])*
        #[derive(
            Debug, Clone, Copy, PartialEq, Eq, Hash,
            Serialize, Deserialize,
            sqlx::Type,
        )]
        #[sqlx(transparent)]
        pub struct $name(pub Uuid);

        impl $name {
            /// Create a new instance backed by a randomly-generated v4 UUID.
            ///
            /// # Example
            ///
            /// ```rust
            #[doc = concat!("use oblivion_common::", stringify!($name), ";")]
            ///
            #[doc = concat!("let id = ", stringify!($name), "::new();")]
            /// // The inner UUID is always non-nil.
            /// assert_ne!(id.0, uuid::Uuid::nil());
            /// ```
            #[must_use]
            pub fn new() -> Self {
                Self(Uuid::new_v4())
            }
        }

        impl Default for $name {
            fn default() -> Self {
                Self::new()
            }
        }

        impl std::fmt::Display for $name {
            fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
                self.0.fmt(f)
            }
        }

        impl From<Uuid> for $name {
            fn from(id: Uuid) -> Self {
                Self(id)
            }
        }

        impl From<$name> for Uuid {
            fn from(wrapper: $name) -> Uuid {
                wrapper.0
            }
        }
    };
}

uuid_newtype!(
    /// Strongly-typed identifier for a user record.
    UserId
);

uuid_newtype!(
    /// Strongly-typed identifier for a clinical case.
    CaseId
);

uuid_newtype!(
    /// Strongly-typed identifier for a laboratory.
    LabId
);

uuid_newtype!(
    /// Strongly-typed identifier for a syndrome / diagnosis entry.
    SyndromeId
);

uuid_newtype!(
    /// Strongly-typed identifier for a batch of lab samples.
    BatchId
);

// ───────────────────────────────────────────────────────────────────────────
// API envelope
// ───────────────────────────────────────────────────────────────────────────

/// Standard JSON envelope returned by every Oblivion HTTP endpoint.
///
/// # Examples
///
/// ```rust
/// use oblivion_common::ApiResponse;
///
/// let ok: ApiResponse<u32> = ApiResponse::ok(42);
/// assert_eq!(ok.status, "ok");
/// assert_eq!(ok.data, Some(42));
/// assert!(ok.error.is_none());
///
/// let err: ApiResponse<()> = ApiResponse::error("not found");
/// assert_eq!(err.status, "error");
/// assert!(err.data.is_none());
/// assert_eq!(err.error.as_deref(), Some("not found"));
/// ```
#[derive(Debug, Serialize)]
pub struct ApiResponse<T: Serialize> {
    /// `"ok"` for success responses, `"error"` for failures.
    pub status: &'static str,
    /// Payload present on success.
    pub data: Option<T>,
    /// Human-readable error description present on failure.
    pub error: Option<String>,
}

impl<T: Serialize> ApiResponse<T> {
    /// Construct a successful response wrapping `data`.
    pub fn ok(data: T) -> Self {
        Self {
            status: "ok",
            data: Some(data),
            error: None,
        }
    }

    /// Construct an error response with the given message.
    pub fn error(msg: impl Into<String>) -> Self {
        Self {
            status: "error",
            data: None,
            error: Some(msg.into()),
        }
    }
}

impl<T: Serialize> IntoResponse for ApiResponse<T> {
    fn into_response(self) -> Response {
        let status = if self.status == "ok" {
            StatusCode::OK
        } else {
            StatusCode::INTERNAL_SERVER_ERROR
        };
        (status, Json(self)).into_response()
    }
}

// ───────────────────────────────────────────────────────────────────────────
// CORS
// ───────────────────────────────────────────────────────────────────────────

/// Build the [`CorsLayer`] every service applies, driven by the
/// `CORS_ALLOWED_ORIGIN` environment variable.
///
/// - **Unset, empty, or `*`** → permissive `allow_origin(Any)` (the development
///   default; preserves the previous behaviour so local runs are unaffected).
/// - **One or more origins** (comma-separated) → only those exact origins are
///   allowed, e.g. `CORS_ALLOWED_ORIGIN=https://frontend.example.com`.
///
/// Methods and headers stay permissive; credentials are never enabled because
/// auth uses a bearer token in the `Authorization` header, not cookies.
///
/// # Example
///
/// ```rust
/// // With no env var set, the layer is permissive and constructs cleanly.
/// let _layer = oblivion_common::cors_layer_from_env();
/// ```
#[must_use]
pub fn cors_layer_from_env() -> CorsLayer {
    let base = CorsLayer::new().allow_methods(Any).allow_headers(Any);

    match std::env::var("CORS_ALLOWED_ORIGIN") {
        Ok(raw) if !raw.trim().is_empty() && raw.trim() != "*" => {
            let origins: Vec<HeaderValue> = raw
                .split(',')
                .filter_map(|o| o.trim().parse::<HeaderValue>().ok())
                .collect();
            if origins.is_empty() {
                base.allow_origin(Any)
            } else {
                base.allow_origin(origins)
            }
        }
        _ => base.allow_origin(Any),
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Service error
// ───────────────────────────────────────────────────────────────────────────

/// Canonical error type shared across all Oblivion microservices.
///
/// Each variant maps to a well-defined HTTP status code via [`IntoResponse`].
///
/// # Example
///
/// ```rust
/// use oblivion_common::ServiceError;
///
/// let e = ServiceError::NotFound("case 123 not found".to_string());
/// assert!(matches!(e, ServiceError::NotFound(_)));
/// ```
#[derive(Debug, thiserror::Error)]
pub enum ServiceError {
    /// The requested resource does not exist (HTTP 404).
    #[error("not found: {0}")]
    NotFound(String),

    /// The request is malformed or contains invalid data (HTTP 400).
    #[error("bad request: {0}")]
    BadRequest(String),

    /// The caller is not authenticated (HTTP 401).
    #[error("unauthorized: {0}")]
    Unauthorized(String),

    /// The caller lacks permission to perform this operation (HTTP 403).
    #[error("forbidden: {0}")]
    Forbidden(String),

    /// An unexpected server-side failure occurred (HTTP 500).
    #[error("internal error: {0}")]
    InternalError(String),

    /// The operation would create a duplicate resource (HTTP 409).
    #[error("conflict: {0}")]
    Conflict(String),
}

impl IntoResponse for ServiceError {
    fn into_response(self) -> Response {
        let status = match &self {
            ServiceError::NotFound(_)      => StatusCode::NOT_FOUND,
            ServiceError::BadRequest(_)    => StatusCode::BAD_REQUEST,
            ServiceError::Unauthorized(_)  => StatusCode::UNAUTHORIZED,
            ServiceError::Forbidden(_)     => StatusCode::FORBIDDEN,
            ServiceError::InternalError(_) => StatusCode::INTERNAL_SERVER_ERROR,
            ServiceError::Conflict(_)      => StatusCode::CONFLICT,
        };
        let body: ApiResponse<()> = ApiResponse::error(self.to_string());
        (status, Json(body)).into_response()
    }
}

// ───────────────────────────────────────────────────────────────────────────
// Kafka topic constants
// ───────────────────────────────────────────────────────────────────────────

/// Kafka topic name constants shared by all producers and consumers.
///
/// # Example
///
/// ```rust
/// use oblivion_common::topics;
///
/// assert_eq!(topics::ANALYSIS_REQUESTS, "analysis.requests");
/// ```
pub mod topics {
    /// Requests for image analysis dispatched by the case or labs service.
    pub const ANALYSIS_REQUESTS: &str = "analysis.requests";

    /// Results produced by the recognition service.
    pub const ANALYSIS_RESULTS: &str = "analysis.results";

    /// Out-of-band user notifications produced by any service.
    pub const NOTIFICATIONS: &str = "notifications";

    /// Bulk sample batches ingested from laboratory integrations.
    pub const LABS_BATCH: &str = "labs.batch";
}

// ───────────────────────────────────────────────────────────────────────────
// Domain enums
// ───────────────────────────────────────────────────────────────────────────

/// User role within the platform.
///
/// The database representation uses lowercase strings (`"doctor"`, `"lab"`,
/// `"admin"`) via the `sqlx::Type` derive.
///
/// # Example
///
/// ```rust
/// use oblivion_common::Role;
/// use serde_json;
///
/// let serialised = serde_json::to_string(&Role::Admin).unwrap();
/// assert_eq!(serialised, r#""admin""#);
/// ```
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum Role {
    /// A medical practitioner.
    Doctor,
    /// A laboratory operator.
    Lab,
    /// A platform administrator.
    Admin,
}

/// Lifecycle state of an AI analysis job.
///
/// # Example
///
/// ```rust
/// use oblivion_common::AnalysisStatus;
/// use serde_json;
///
/// let serialised = serde_json::to_string(&AnalysisStatus::Completed).unwrap();
/// assert_eq!(serialised, r#""completed""#);
/// ```
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum AnalysisStatus {
    /// The job has been created but not yet picked up.
    Pending,
    /// The recognition service is actively processing the request.
    Processing,
    /// The job finished successfully.
    Completed,
    /// The job terminated with an error.
    Failed,
}

/// Origin of an analysis request.
///
/// # Example
///
/// ```rust
/// use oblivion_common::AnalysisSource;
/// use serde_json;
///
/// let serialised = serde_json::to_string(&AnalysisSource::Lab).unwrap();
/// assert_eq!(serialised, r#""lab""#);
/// ```
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize, sqlx::Type)]
#[serde(rename_all = "lowercase")]
#[sqlx(type_name = "text", rename_all = "lowercase")]
pub enum AnalysisSource {
    /// Request originated from a doctor via the case service.
    Doctor,
    /// Request originated from a laboratory via the labs service.
    Lab,
}

// ───────────────────────────────────────────────────────────────────────────
// Kafka message structs
// ───────────────────────────────────────────────────────────────────────────

/// Message published to [`topics::ANALYSIS_REQUESTS`] when a new image
/// analysis is requested.
///
/// # Example
///
/// ```rust
/// use oblivion_common::{AnalysisRequest, AnalysisSource};
/// use uuid::Uuid;
/// use chrono::Utc;
///
/// let msg = AnalysisRequest {
///     request_id: Uuid::new_v4(),
///     case_id: Uuid::new_v4(),
///     image_key: "images/case-abc/photo.jpg".to_string(),
///     source: AnalysisSource::Doctor,
///     batch_id: None,
///     patient_ethnicity: Some("Hispanic".to_string()),
///     requested_at: Utc::now(),
/// };
///
/// let json = serde_json::to_string(&msg).unwrap();
/// assert!(json.contains("image_key"));
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisRequest {
    /// Unique identifier for this individual analysis job.
    pub request_id: Uuid,
    /// The case this analysis belongs to.
    pub case_id: Uuid,
    /// S3 object key for the image to be analysed.
    pub image_key: String,
    /// Whether the request originated from a doctor or a lab.
    pub source: AnalysisSource,
    /// Optional lab batch this request is part of.
    pub batch_id: Option<Uuid>,
    /// Optional self-reported patient ethnicity, used to improve accuracy.
    pub patient_ethnicity: Option<String>,
    /// Wall-clock time at which the request was created.
    pub requested_at: DateTime<Utc>,
}

/// A single ranked diagnosis produced by the recognition model.
///
/// # Example
///
/// ```rust
/// use oblivion_common::DiagnosisEntry;
/// use uuid::Uuid;
///
/// let entry = DiagnosisEntry {
///     syndrome_id: Uuid::new_v4(),
///     syndrome_name: "Noonan Syndrome".to_string(),
///     confidence: 0.91,
///     rank: 1,
/// };
///
/// assert!(entry.confidence > 0.0);
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiagnosisEntry {
    /// Reference to the syndrome catalogue.
    pub syndrome_id: Uuid,
    /// Human-readable name of the syndrome at the time of analysis.
    pub syndrome_name: String,
    /// Model confidence score in the range `[0.0, 1.0]`.
    pub confidence: f64,
    /// 1-based rank in the differential list (1 = most likely).
    pub rank: i32,
}

/// Message published to [`topics::ANALYSIS_RESULTS`] when the recognition
/// service completes processing.
///
/// # Example
///
/// ```rust
/// use oblivion_common::{AnalysisResult, AnalysisSource, DiagnosisEntry};
/// use uuid::Uuid;
/// use chrono::Utc;
///
/// let result = AnalysisResult {
///     request_id: Uuid::new_v4(),
///     case_id: Uuid::new_v4(),
///     source: AnalysisSource::Lab,
///     batch_id: None,
///     top_diagnoses: vec![],
///     processing_time_ms: 1_234,
///     completed_at: Utc::now(),
/// };
///
/// assert_eq!(result.processing_time_ms, 1_234);
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AnalysisResult {
    /// Mirrors the `request_id` from the originating [`AnalysisRequest`].
    pub request_id: Uuid,
    /// The case this result belongs to.
    pub case_id: Uuid,
    /// Origin of the original request.
    pub source: AnalysisSource,
    /// Lab batch, if applicable.
    pub batch_id: Option<Uuid>,
    /// Ranked differential diagnoses returned by the model.
    pub top_diagnoses: Vec<DiagnosisEntry>,
    /// Wall-clock duration of the ML inference step in milliseconds.
    pub processing_time_ms: u64,
    /// Wall-clock time at which processing finished.
    pub completed_at: DateTime<Utc>,
}

/// Message published to [`topics::NOTIFICATIONS`] whenever a service needs
/// to push an in-app or push notification to a user.
///
/// # Example
///
/// ```rust
/// use oblivion_common::NotificationMessage;
/// use uuid::Uuid;
/// use chrono::Utc;
/// use serde_json::json;
///
/// let msg = NotificationMessage {
///     user_id: Uuid::new_v4(),
///     notification_type: "analysis_complete".to_string(),
///     title: "Analysis Ready".to_string(),
///     body: "Your case results are available.".to_string(),
///     metadata: json!({ "case_id": "abc-123" }),
///     created_at: Utc::now(),
/// };
///
/// assert_eq!(msg.notification_type, "analysis_complete");
/// ```
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NotificationMessage {
    /// Recipient's user identifier.
    pub user_id: Uuid,
    /// Machine-readable event type (e.g. `"analysis_complete"`).
    pub notification_type: String,
    /// Short human-readable notification title.
    pub title: String,
    /// Full notification body text.
    pub body: String,
    /// Arbitrary JSON metadata for client-side deep-linking or filtering.
    pub metadata: serde_json::Value,
    /// Wall-clock time at which this notification was created.
    pub created_at: DateTime<Utc>,
}

// ───────────────────────────────────────────────────────────────────────────
// Tests
// ───────────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::{from_str, to_string};

    // --- ID newtypes --------------------------------------------------------

    #[test]
    fn user_id_new_is_non_nil() {
        let id = UserId::new();
        assert_ne!(id.0, Uuid::nil());
    }

    #[test]
    fn user_id_display_matches_inner_uuid() {
        let inner = Uuid::new_v4();
        let id = UserId(inner);
        assert_eq!(id.to_string(), inner.to_string());
    }

    #[test]
    fn user_id_from_into_uuid_roundtrip() {
        let inner = Uuid::new_v4();
        let id = UserId::from(inner);
        let back: Uuid = id.into();
        assert_eq!(back, inner);
    }

    #[test]
    fn all_id_newtypes_are_unique_per_call() {
        assert_ne!(UserId::new(), UserId::new());
        assert_ne!(CaseId::new(), CaseId::new());
        assert_ne!(LabId::new(), LabId::new());
        assert_ne!(SyndromeId::new(), SyndromeId::new());
        assert_ne!(BatchId::new(), BatchId::new());
    }

    #[test]
    fn id_serde_roundtrip() {
        let original = CaseId::new();
        let json = to_string(&original).expect("serialise CaseId");
        let decoded: CaseId = from_str(&json).expect("deserialise CaseId");
        assert_eq!(original, decoded);
    }

    // --- ApiResponse --------------------------------------------------------

    #[test]
    fn api_response_ok_fields() {
        let r: ApiResponse<u32> = ApiResponse::ok(99);
        assert_eq!(r.status, "ok");
        assert_eq!(r.data, Some(99));
        assert!(r.error.is_none());
    }

    #[test]
    fn api_response_error_fields() {
        let r: ApiResponse<()> = ApiResponse::error("something broke");
        assert_eq!(r.status, "error");
        assert!(r.data.is_none());
        assert_eq!(r.error.as_deref(), Some("something broke"));
    }

    #[test]
    fn api_response_ok_serialises_correctly() {
        let r: ApiResponse<&str> = ApiResponse::ok("world");
        let json = to_string(&r).unwrap();
        assert!(json.contains(r#""status":"ok""#));
        assert!(json.contains(r#""data":"world""#));
        assert!(json.contains(r#""error":null"#));
    }

    // --- ServiceError -------------------------------------------------------

    #[test]
    fn service_error_display_messages() {
        assert!(ServiceError::NotFound("x".into()).to_string().contains("not found"));
        assert!(ServiceError::BadRequest("x".into()).to_string().contains("bad request"));
        assert!(ServiceError::Unauthorized("x".into()).to_string().contains("unauthorized"));
        assert!(ServiceError::Forbidden("x".into()).to_string().contains("forbidden"));
        assert!(ServiceError::InternalError("x".into()).to_string().contains("internal error"));
        assert!(ServiceError::Conflict("x".into()).to_string().contains("conflict"));
    }

    // --- Domain enums -------------------------------------------------------

    #[test]
    fn role_serialises_lowercase() {
        assert_eq!(to_string(&Role::Doctor).unwrap(), r#""doctor""#);
        assert_eq!(to_string(&Role::Lab).unwrap(), r#""lab""#);
        assert_eq!(to_string(&Role::Admin).unwrap(), r#""admin""#);
    }

    #[test]
    fn analysis_status_serialises_lowercase() {
        assert_eq!(to_string(&AnalysisStatus::Pending).unwrap(),    r#""pending""#);
        assert_eq!(to_string(&AnalysisStatus::Processing).unwrap(), r#""processing""#);
        assert_eq!(to_string(&AnalysisStatus::Completed).unwrap(),  r#""completed""#);
        assert_eq!(to_string(&AnalysisStatus::Failed).unwrap(),     r#""failed""#);
    }

    #[test]
    fn analysis_source_serialises_lowercase() {
        assert_eq!(to_string(&AnalysisSource::Doctor).unwrap(), r#""doctor""#);
        assert_eq!(to_string(&AnalysisSource::Lab).unwrap(),    r#""lab""#);
    }

    #[test]
    fn role_deserialises_from_lowercase() {
        assert_eq!(from_str::<Role>(r#""admin""#).unwrap(), Role::Admin);
    }

    // --- Kafka topic constants ----------------------------------------------

    #[test]
    fn topic_constants_are_non_empty() {
        assert!(!topics::ANALYSIS_REQUESTS.is_empty());
        assert!(!topics::ANALYSIS_RESULTS.is_empty());
        assert!(!topics::NOTIFICATIONS.is_empty());
        assert!(!topics::LABS_BATCH.is_empty());
    }

    // --- Kafka message structs ----------------------------------------------

    #[test]
    fn analysis_request_serde_roundtrip() {
        use chrono::Utc;
        let original = AnalysisRequest {
            request_id: Uuid::new_v4(),
            case_id: Uuid::new_v4(),
            image_key: "images/test.jpg".to_string(),
            source: AnalysisSource::Doctor,
            batch_id: None,
            patient_ethnicity: Some("Asian".to_string()),
            requested_at: Utc::now(),
        };
        let json = to_string(&original).unwrap();
        let decoded: AnalysisRequest = from_str(&json).unwrap();
        assert_eq!(original.request_id, decoded.request_id);
        assert_eq!(original.image_key, decoded.image_key);
    }

    #[test]
    fn analysis_result_serde_roundtrip() {
        use chrono::Utc;
        let entry = DiagnosisEntry {
            syndrome_id: Uuid::new_v4(),
            syndrome_name: "Test Syndrome".to_string(),
            confidence: 0.87,
            rank: 1,
        };
        let original = AnalysisResult {
            request_id: Uuid::new_v4(),
            case_id: Uuid::new_v4(),
            source: AnalysisSource::Lab,
            batch_id: Some(Uuid::new_v4()),
            top_diagnoses: vec![entry],
            processing_time_ms: 500,
            completed_at: Utc::now(),
        };
        let json = to_string(&original).unwrap();
        let decoded: AnalysisResult = from_str(&json).unwrap();
        assert_eq!(original.processing_time_ms, decoded.processing_time_ms);
        assert_eq!(decoded.top_diagnoses.len(), 1);
        assert_eq!(decoded.top_diagnoses[0].syndrome_name, "Test Syndrome");
    }

    #[test]
    fn notification_message_serde_roundtrip() {
        use chrono::Utc;
        use serde_json::json;
        let original = NotificationMessage {
            user_id: Uuid::new_v4(),
            notification_type: "case_update".to_string(),
            title: "Case Updated".to_string(),
            body: "Something changed.".to_string(),
            metadata: json!({ "case_id": "xyz" }),
            created_at: Utc::now(),
        };
        let json_str = to_string(&original).unwrap();
        let decoded: NotificationMessage = from_str(&json_str).unwrap();
        assert_eq!(original.user_id, decoded.user_id);
        assert_eq!(original.notification_type, decoded.notification_type);
        assert_eq!(decoded.metadata["case_id"], "xyz");
    }
}
