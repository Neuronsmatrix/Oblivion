#!/usr/bin/env bash
# Apply all SQL migrations to the local Postgres container.
#
# The services do NOT run migrations themselves (no sqlx::migrate! anywhere),
# and docker-entrypoint-initdb.d only runs once on an empty volume. This script
# is idempotent (every migration uses CREATE ... IF NOT EXISTS / ON CONFLICT)
# and re-runnable without nuking the postgres volume.
set -euo pipefail

cd "$(dirname "$0")/.."

PSQL=(docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U oblivion -d oblivion)

MIGRATIONS=(
  migrations/auth/001_initial.sql
  migrations/cases/001_initial.sql
  migrations/labs/001_initial.sql
  migrations/notifier/001_initial.sql
  migrations/reference/001_initial.sql
  migrations/billing/001_initial.sql
  migrations/reference/002_seed_data.sql
)

for f in "${MIGRATIONS[@]}"; do
  echo ">> applying $f"
  "${PSQL[@]}" < "$f"
done

echo ">> verifying seed data"
"${PSQL[@]}" -c "select 'syndromes' as t, count(*) from reference.syndromes
                 union all select 'hpo_terms', count(*) from reference.hpo_terms
                 union all select 'billing_plans', count(*) from billing.plans;"

echo "migrations OK"
