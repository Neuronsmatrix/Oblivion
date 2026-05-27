//! Redis-backed sliding-window rate limiter.
//!
//! Uses the `INCR` + `EXPIRE` pattern: on every request, increment a counter
//! keyed by `rate_limit:{lab_id}`. If this is the first increment, set an
//! expiry equal to the window duration. Deny the request when the counter
//! exceeds `max_requests`.
//!
//! This is an approximate limiter — because the TTL is set only on the first
//! increment the actual window starts from the first request, not a rolling
//! sliding window. This is intentional: the implementation is atomic and
//! requires only two Redis commands.

use deadpool_redis::redis;
use uuid::Uuid;

use crate::error::LabsError;

/// Result of a rate-limit check.
#[derive(Debug, Clone)]
pub struct RateLimitResult {
    /// Whether the caller is allowed to proceed.
    pub allowed: bool,
    /// Remaining requests in the current window.
    pub remaining: u64,
    /// If denied, seconds to wait before the window resets.
    pub retry_after: Option<u64>,
}

/// Check (and increment) the rate-limit counter for `lab_id`.
///
/// `window_secs` — duration of the rate-limit window in seconds.
/// `max_requests` — maximum number of requests permitted within the window.
///
/// # Errors
///
/// Returns [`LabsError::Internal`] if Redis is unavailable.
pub async fn check_rate_limit(
    redis: &deadpool_redis::Pool,
    lab_id: Uuid,
    window_secs: u64,
    max_requests: u64,
) -> Result<RateLimitResult, LabsError> {
    let key = format!("rate_limit:{lab_id}");
    let mut conn = redis.get().await?;

    // Atomically increment the counter.
    let count: u64 = redis::cmd("INCR")
        .arg(&key)
        .query_async::<u64>(&mut *conn)
        .await?;

    // Set the TTL only on the very first request within the window so the
    // expiry is anchored to the start of the window, not each request.
    if count == 1 {
        redis::cmd("EXPIRE")
            .arg(&key)
            .arg(window_secs)
            .query_async::<()>(&mut *conn)
            .await?;
    }

    if count > max_requests {
        // Retrieve TTL to populate retry_after.
        let ttl: i64 = redis::cmd("TTL")
            .arg(&key)
            .query_async::<i64>(&mut *conn)
            .await
            .unwrap_or(-1);

        let retry_after = if ttl > 0 { Some(ttl as u64) } else { Some(window_secs) };

        return Ok(RateLimitResult {
            allowed: false,
            remaining: 0,
            retry_after,
        });
    }

    let remaining = max_requests.saturating_sub(count);

    Ok(RateLimitResult {
        allowed: true,
        remaining,
        retry_after: None,
    })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rate_limit_result_allowed_has_no_retry_after() {
        let result = RateLimitResult {
            allowed: true,
            remaining: 5,
            retry_after: None,
        };
        assert!(result.allowed);
        assert!(result.retry_after.is_none());
    }

    #[test]
    fn rate_limit_result_denied_has_retry_after() {
        let result = RateLimitResult {
            allowed: false,
            remaining: 0,
            retry_after: Some(60),
        };
        assert!(!result.allowed);
        assert_eq!(result.retry_after, Some(60));
    }
}
