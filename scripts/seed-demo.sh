#!/usr/bin/env bash
# Seed the demo doctor + lab logins by registering them through the live auth
# service. Registering via the real endpoint (rather than inserting rows) means
# the password is hashed exactly the way the service expects (Argon2id), so the
# demo accounts can actually log in.
#
# Idempotent: a 409 "already exists" is treated as success, so re-running after
# the accounts exist is a no-op.
#
# Credentials come from .env (DEMO_DOCTOR_* / DEMO_LAB_*). The API base defaults
# to the local gateway; override with arg 1 or SEED_API_BASE, e.g.
#   scripts/seed-demo.sh https://api.example.com
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ ! -f .env ]]; then
  echo "seed-demo: .env not found in $(pwd)" >&2
  exit 1
fi

# Load .env (values with spaces are quoted in .env.example).
set -a
# shellcheck disable=SC1091
. ./.env
set +a

# Defaults, so the script works even if .env predates the DEMO_* keys (a .env
# value, if present, wins because := only assigns when unset). Override in .env.
: "${DEMO_DOCTOR_EMAIL:=doctor@phenograph.test}"
: "${DEMO_DOCTOR_PASSWORD:=demopass123}"
: "${DEMO_DOCTOR_NAME:=Demo Doctor}"
: "${DEMO_DOCTOR_ORG:=Demo Hospital}"
: "${DEMO_LAB_EMAIL:=lab@phenograph.test}"
: "${DEMO_LAB_PASSWORD:=demopass123}"
: "${DEMO_LAB_NAME:=Demo Lab}"
: "${DEMO_LAB_ORG:=Demo LabCo}"

API_BASE="${1:-${SEED_API_BASE:-http://127.0.0.1:8080}}"

# register <email> <password> <role> <name> <org>
register() {
  local email="$1" password="$2" role="$3" name="$4" org="$5"
  local body code
  body=$(jq -nc \
    --arg email "$email" --arg password "$password" --arg role "$role" \
    --arg name "$name" --arg organization "$org" \
    '{email:$email, password:$password, role:$role, name:$name, organization:$organization}')

  code=$(curl -s -o /dev/null -w '%{http_code}' \
    -X POST "$API_BASE/auth/register" \
    -H 'Content-Type: application/json' \
    -d "$body")

  case "$code" in
    2*)      echo "  created $role $email" ;;
    409)     echo "  exists  $role $email (ok)" ;;
    *)       echo "  FAILED  $role $email -> HTTP $code" >&2; return 1 ;;
  esac
}

echo ">> seeding demo logins via $API_BASE"
register "$DEMO_DOCTOR_EMAIL" "$DEMO_DOCTOR_PASSWORD" doctor "$DEMO_DOCTOR_NAME" "$DEMO_DOCTOR_ORG"
register "$DEMO_LAB_EMAIL"    "$DEMO_LAB_PASSWORD"    lab    "$DEMO_LAB_NAME"    "$DEMO_LAB_ORG"
echo ">> demo seed OK"
