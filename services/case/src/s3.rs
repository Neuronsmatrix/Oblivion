//! S3 / MinIO integration for the case service.
//!
//! Provides helpers for constructing the AWS SDK S3 client with a custom
//! endpoint (for MinIO compatibility), generating presigned PUT URLs for
//! direct client uploads, and verifying that an object exists via a HEAD
//! request.

use std::time::Duration;

use aws_config::{BehaviorVersion, Region};
use aws_sdk_s3::{
    config::{Credentials, SharedCredentialsProvider},
    presigning::PresigningConfig,
    Client,
};
use tracing::instrument;

use crate::{config::Config, error::CaseError};

/// Build and return a configured S3 client.
///
/// When `config.s3_endpoint` is non-empty the client is configured to use that
/// endpoint, which is required for local MinIO deployments. Path-style
/// addressing is forced so that bucket names appear in the URL path rather than
/// as a subdomain.
pub async fn create_s3_client(config: &Config) -> Client {
    let creds = Credentials::new(
        &config.s3_access_key,
        &config.s3_secret_key,
        None,
        None,
        "oblivion-case-static",
    );

    let mut builder = aws_config::defaults(BehaviorVersion::latest())
        .region(Region::new(config.s3_region.clone()))
        .credentials_provider(SharedCredentialsProvider::new(creds));

    if !config.s3_endpoint.is_empty() {
        builder = builder.endpoint_url(&config.s3_endpoint);
    }

    let sdk_config = builder.load().await;

    // Force path-style so that MinIO works correctly with virtual-hosted
    // style disabled.
    let s3_config = aws_sdk_s3::config::Builder::from(&sdk_config)
        .force_path_style(true)
        .build();

    Client::from_conf(s3_config)
}

/// Generate a presigned PUT URL that allows the caller to upload a single
/// object directly to MinIO/S3 without further server involvement.
///
/// The URL expires after `expiry_secs` seconds.
///
/// # Errors
///
/// Returns [`CaseError::Storage`] if the presigning configuration is invalid
/// or if the SDK fails to produce a URL.
#[instrument(skip(client), fields(bucket, key))]
pub async fn generate_presigned_upload_url(
    client: &Client,
    bucket: &str,
    key: &str,
    expiry_secs: u64,
) -> Result<String, CaseError> {
    let presigning_config = PresigningConfig::expires_in(Duration::from_secs(expiry_secs))
        .map_err(|e| CaseError::Storage(format!("presigning config error: {e}")))?;

    let presigned = client
        .put_object()
        .bucket(bucket)
        .key(key)
        .presigned(presigning_config)
        .await
        .map_err(|e| CaseError::Storage(format!("presigning failed: {e}")))?;

    Ok(presigned.uri().to_string())
}

/// Check whether an object already exists in S3 / MinIO by issuing a HEAD
/// request.
///
/// Returns `true` when the object is present and `false` when S3 returns a
/// 404-equivalent response. All other S3 errors are surfaced as
/// [`CaseError::Storage`].
///
/// # Errors
///
/// Returns [`CaseError::Storage`] for any non-404 SDK error.
#[instrument(skip(client), fields(bucket, key))]
pub async fn check_object_exists(
    client: &Client,
    bucket: &str,
    key: &str,
) -> Result<bool, CaseError> {
    match client.head_object().bucket(bucket).key(key).send().await {
        Ok(_) => Ok(true),
        Err(e) => {
            // The SDK wraps 404 responses in a SdkError<HeadObjectError>.
            // We check whether the service error code indicates "not found".
            let is_not_found = e
                .as_service_error()
                .map(|se| se.is_not_found())
                .unwrap_or(false);

            if is_not_found {
                Ok(false)
            } else {
                Err(CaseError::Storage(format!("head_object failed: {e}")))
            }
        }
    }
}
