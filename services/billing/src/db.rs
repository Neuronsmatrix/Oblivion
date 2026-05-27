//! Database pool initialisation and query helpers for the billing service.
//!
//! All queries use runtime-checked SQL via `sqlx::query_as`. The pool's
//! `after_connect` hook sets `search_path` to the configured billing schema so
//! that unqualified table names resolve correctly.

use chrono::NaiveDate;
use sqlx::{PgPool, postgres::PgPoolOptions};
use uuid::Uuid;

use crate::{
    config::Config,
    error::BillingError,
    models::{Plan, Subscription, SubscriptionWithPlan, UsageRecord},
};

/// Create and return a configured [`PgPool`].
///
/// The pool's `after_connect` hook sets `search_path` to the schema name
/// specified in [`Config::db_schema`] so every connection uses the correct
/// schema without qualifying each table name.
///
/// # Errors
///
/// Returns [`BillingError::Internal`] if the pool cannot be built or if the
/// initial connection to the database fails.
pub async fn create_pool(config: &Config) -> Result<PgPool, BillingError> {
    let schema = config.db_schema.clone();
    let pool = PgPoolOptions::new()
        .max_connections(config.db_max_connections)
        .after_connect(move |conn, _meta| {
            let schema = schema.clone();
            Box::pin(async move {
                sqlx::query(&format!("SET search_path TO {schema}"))
                    .execute(conn)
                    .await?;
                Ok(())
            })
        })
        .connect(&config.database_url)
        .await
        .map_err(|e| BillingError::Internal(format!("database connect failed: {e}")))?;

    Ok(pool)
}

// ── Plan queries ──────────────────────────────────────────────────────────────

/// Return all available subscription plans, ordered by monthly limit ascending.
///
/// # Errors
///
/// Returns [`BillingError::Internal`] on database error.
pub async fn list_plans(pool: &PgPool) -> Result<Vec<Plan>, BillingError> {
    let plans = sqlx::query_as::<_, Plan>(
        r#"
        SELECT id, name, monthly_limit, overage_price_cents, created_at
        FROM plans
        ORDER BY monthly_limit ASC
        "#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| BillingError::Internal(format!("list_plans: {e}")))?;

    Ok(plans)
}

/// Return a single plan by its primary key, or `None` if not found.
///
/// # Errors
///
/// Returns [`BillingError::Internal`] on database error.
pub async fn find_plan_by_id(pool: &PgPool, id: Uuid) -> Result<Option<Plan>, BillingError> {
    let plan = sqlx::query_as::<_, Plan>(
        r#"
        SELECT id, name, monthly_limit, overage_price_cents, created_at
        FROM plans
        WHERE id = $1
        "#,
    )
    .bind(id)
    .fetch_optional(pool)
    .await
    .map_err(|e| BillingError::Internal(format!("find_plan_by_id: {e}")))?;

    Ok(plan)
}

// ── Subscription queries ──────────────────────────────────────────────────────

/// Create a new active subscription for `lab_id` on `plan_id`.
///
/// # Errors
///
/// Returns [`BillingError::SubscriptionAlreadyExists`] on a unique constraint
/// violation, or [`BillingError::Internal`] for any other database error.
pub async fn create_subscription(
    pool: &PgPool,
    lab_id: Uuid,
    plan_id: Uuid,
) -> Result<Subscription, BillingError> {
    let record = sqlx::query_as::<_, Subscription>(
        r#"
        INSERT INTO subscriptions (id, lab_id, plan_id, status, started_at)
        VALUES ($1, $2, $3, 'active', NOW())
        RETURNING id, lab_id, plan_id, status, started_at
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(lab_id)
    .bind(plan_id)
    .fetch_one(pool)
    .await
    .map_err(|e| {
        if let sqlx::Error::Database(ref db_err) = e {
            if db_err.code().as_deref() == Some("23505") {
                return BillingError::SubscriptionAlreadyExists;
            }
        }
        BillingError::Internal(format!("create_subscription: {e}"))
    })?;

    Ok(record)
}

/// Return the active subscription for a lab, joined with plan details.
///
/// # Errors
///
/// Returns [`BillingError::Internal`] on database error.
pub async fn find_active_subscription(
    pool: &PgPool,
    lab_id: Uuid,
) -> Result<Option<SubscriptionWithPlan>, BillingError> {
    let sub = sqlx::query_as::<_, SubscriptionWithPlan>(
        r#"
        SELECT s.id, s.lab_id, p.name AS plan_name, p.monthly_limit, s.status
        FROM subscriptions s
        JOIN plans p ON p.id = s.plan_id
        WHERE s.lab_id = $1 AND s.status = 'active'
        ORDER BY s.started_at DESC
        LIMIT 1
        "#,
    )
    .bind(lab_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| BillingError::Internal(format!("find_active_subscription: {e}")))?;

    Ok(sub)
}

// ── Usage queries ─────────────────────────────────────────────────────────────

/// Return the usage record for `lab_id` in `month`, or `None` if absent.
///
/// `month` must be the first day of the target month (`YYYY-MM-01`).
///
/// # Errors
///
/// Returns [`BillingError::Internal`] on database error.
pub async fn get_usage(
    pool: &PgPool,
    lab_id: Uuid,
    month: NaiveDate,
) -> Result<Option<UsageRecord>, BillingError> {
    let record = sqlx::query_as::<_, UsageRecord>(
        r#"
        SELECT id, lab_id, month, count, created_at
        FROM usage_records
        WHERE lab_id = $1 AND month = $2
        "#,
    )
    .bind(lab_id)
    .bind(month)
    .fetch_optional(pool)
    .await
    .map_err(|e| BillingError::Internal(format!("get_usage: {e}")))?;

    Ok(record)
}

/// Atomically increment (or initialise) the usage counter for `lab_id` this
/// month, returning the updated [`UsageRecord`].
///
/// Uses `INSERT … ON CONFLICT … DO UPDATE` to avoid race conditions.
///
/// # Errors
///
/// Returns [`BillingError::Internal`] on database error.
pub async fn increment_usage(
    pool: &PgPool,
    lab_id: Uuid,
    month: NaiveDate,
) -> Result<UsageRecord, BillingError> {
    let record = sqlx::query_as::<_, UsageRecord>(
        r#"
        INSERT INTO usage_records (id, lab_id, month, count, created_at)
        VALUES ($1, $2, $3, 1, NOW())
        ON CONFLICT (lab_id, month) DO UPDATE
          SET count = usage_records.count + 1
        RETURNING id, lab_id, month, count, created_at
        "#,
    )
    .bind(Uuid::new_v4())
    .bind(lab_id)
    .bind(month)
    .fetch_one(pool)
    .await
    .map_err(|e| BillingError::Internal(format!("increment_usage: {e}")))?;

    Ok(record)
}
