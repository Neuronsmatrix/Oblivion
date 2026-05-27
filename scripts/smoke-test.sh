#!/usr/bin/env bash
# End-to-end smoke test for the Oblivion backend.
# Assumes infra (docker compose) + all 7 services are up. Requires curl + jq.
#
# Exercises: auth (register/login/me/refresh), reference reads, the direct
# recognition endpoint, the full async case pipeline (create -> upload to MinIO
# -> confirm -> Kafka -> recognition -> result -> diagnoses + notification),
# billing, and the labs batch flow (which calls billing over HTTP).
set -uo pipefail

AUTH=localhost:3001 CASE=localhost:3002 LABS=localhost:3003
RECOG=localhost:3004 NOTIF=localhost:3005 REF=localhost:3006 BILL=localhost:3007

PASS=0 FAIL=0
ok()   { printf "  \033[32mPASS\033[0m %s\n" "$1"; PASS=$((PASS+1)); }
bad()  { printf "  \033[31mFAIL\033[0m %s\n" "$1"; FAIL=$((FAIL+1)); }
# check <desc> <condition-cmd...> ; passes if the command succeeds
section() { printf "\n\033[1m== %s ==\033[0m\n" "$1"; }

rand=$RANDOM

# ── 1. Auth ───────────────────────────────────────────────────────────────────
section "auth"
DOC_EMAIL="doctor_$rand@example.com"
LAB_EMAIL="lab_$rand@example.com"

curl -s -X POST $AUTH/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DOC_EMAIL\",\"password\":\"Pass12345\",\"role\":\"doctor\",\"name\":\"Dr Smoke\",\"organization\":\"Hosp\"}" >/dev/null
curl -s -X POST $AUTH/auth/register -H 'Content-Type: application/json' \
  -d "{\"email\":\"$LAB_EMAIL\",\"password\":\"Pass12345\",\"role\":\"lab\",\"name\":\"Lab Smoke\",\"organization\":\"LabCo\"}" >/dev/null

DOC=$(curl -s -X POST $AUTH/auth/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"$DOC_EMAIL\",\"password\":\"Pass12345\"}")
DOC_TOKEN=$(echo "$DOC" | jq -r '.data.access_token')
DOC_REFRESH=$(echo "$DOC" | jq -r '.data.refresh_token')
[ -n "$DOC_TOKEN" ] && [ "$DOC_TOKEN" != null ] && ok "doctor login -> access token" || bad "doctor login"

LAB=$(curl -s -X POST $AUTH/auth/login -H 'Content-Type: application/json' \
  -d "{\"email\":\"$LAB_EMAIL\",\"password\":\"Pass12345\"}")
LAB_TOKEN=$(echo "$LAB" | jq -r '.data.access_token')
LAB_ID=$(echo "$LAB_TOKEN" | cut -d. -f2 | tr '_-' '/+' | base64 -d 2>/dev/null | jq -r '.sub')
[ -n "$LAB_TOKEN" ] && [ "$LAB_TOKEN" != null ] && ok "lab login -> access token (lab_id=$LAB_ID)" || bad "lab login"

ME=$(curl -s $AUTH/auth/me -H "Authorization: Bearer $DOC_TOKEN")
[ "$(echo "$ME" | jq -r '.data.email')" = "$DOC_EMAIL" ] && ok "GET /auth/me" || bad "GET /auth/me ($ME)"

RF=$(curl -s -X POST $AUTH/auth/refresh -H 'Content-Type: application/json' \
  -d "{\"refresh_token\":\"$DOC_REFRESH\"}")
[ "$(echo "$RF" | jq -r '.data.access_token')" != null ] && ok "POST /auth/refresh" || bad "refresh ($RF)"

# ── 2. Reference (seeded reads, require auth) ──────────────────────────────────
section "reference"
SY=$(curl -s "$REF/reference/syndromes?limit=5" -H "Authorization: Bearer $DOC_TOKEN")
[ "$(echo "$SY" | jq '.data | length')" -gt 0 ] 2>/dev/null && ok "list syndromes" || bad "list syndromes ($SY)"
HPO=$(curl -s "$REF/reference/hpo/search?q=micro" -H "Authorization: Bearer $DOC_TOKEN")
echo "$HPO" | jq -e '.data' >/dev/null 2>&1 && ok "hpo search" || bad "hpo search ($HPO)"

# ── 3. Recognition direct (isolates the Kafka path) ────────────────────────────
section "recognition (direct HTTP)"
RG=$(curl -s -X POST $RECOG/recognize)
N=$(echo "$RG" | jq '.data.top_diagnoses | length' 2>/dev/null)
[ "$N" = 10 ] && ok "POST /recognize -> 10 diagnoses" || bad "recognize ($RG)"

# ── 4. Case pipeline (the integration test) ────────────────────────────────────
section "case pipeline"
CC=$(curl -s -X POST $CASE/cases -H "Authorization: Bearer $DOC_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"patient_name":"John Doe","patient_age":35,"patient_ethnicity":"European"}')
CASE_ID=$(echo "$CC" | jq -r '.data.case_id')
UPLOAD_URL=$(echo "$CC" | jq -r '.data.upload_url')
[ -n "$CASE_ID" ] && [ "$CASE_ID" != null ] && ok "POST /cases -> case_id + presigned url" || bad "create case ($CC)"

TMPIMG=$(mktemp /tmp/oblivion-XXXX.jpg); head -c 2048 /dev/urandom > "$TMPIMG"
UP=$(curl -s -o /dev/null -w "%{http_code}" -X PUT --upload-file "$TMPIMG" "$UPLOAD_URL")
[ "$UP" = 200 ] && ok "PUT image to MinIO ($UP)" || bad "minio upload (http $UP)"
rm -f "$TMPIMG"

CF=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$CASE/cases/$CASE_ID/confirm-upload" \
  -H "Authorization: Bearer $DOC_TOKEN")
[ "$CF" = 200 ] || [ "$CF" = 202 ] && ok "POST confirm-upload (http $CF)" || bad "confirm-upload (http $CF)"

printf "  ... polling case status (Kafka -> recognition -> result) "
STATUS="" DIAG=0
for i in $(seq 1 20); do
  G=$(curl -s "$CASE/cases/$CASE_ID" -H "Authorization: Bearer $DOC_TOKEN")
  STATUS=$(echo "$G" | jq -r '.data.case.status // .data.status')
  DIAG=$(echo "$G" | jq '(.data.diagnoses // []) | length')
  printf "."
  [ "$STATUS" = completed ] && break
  sleep 1
done
echo
[ "$STATUS" = completed ] && ok "case completed" || bad "case status=$STATUS after polling"
[ "$DIAG" -gt 0 ] 2>/dev/null && ok "case has $DIAG diagnoses" || bad "no diagnoses on case"

# notification produced by the case service on completion. The notifier
# consumes the `notifications` topic a beat after the case is marked completed,
# so poll briefly rather than asserting immediately.
NCOUNT=0
for i in $(seq 1 10); do
  NF=$(curl -s "$NOTIF/notifications" -H "Authorization: Bearer $DOC_TOKEN")
  NCOUNT=$(echo "$NF" | jq '(.data // []) | length' 2>/dev/null)
  [ "$NCOUNT" -gt 0 ] 2>/dev/null && break
  sleep 1
done
[ "$NCOUNT" -gt 0 ] 2>/dev/null && ok "notifier persisted a notification" || bad "no notification ($NF)"

# ── 5. Billing ─────────────────────────────────────────────────────────────────
section "billing"
PLANS=$(curl -s $BILL/billing/plans)
PLAN_ID=$(echo "$PLANS" | jq -r '.data[0].id // .data[0].plan_id')
[ -n "$PLAN_ID" ] && [ "$PLAN_ID" != null ] && ok "list plans (plan_id=$PLAN_ID)" || bad "list plans ($PLANS)"

SUB=$(curl -s -X POST $BILL/billing/subscribe -H 'Content-Type: application/json' \
  -d "{\"lab_id\":\"$LAB_ID\",\"plan_id\":\"$PLAN_ID\"}")
echo "$SUB" | jq -e '.status == "ok"' >/dev/null 2>&1 && ok "subscribe lab to plan" || bad "subscribe ($SUB)"

QUOTA=$(curl -s -X POST $BILL/billing/check-quota -H 'Content-Type: application/json' \
  -d "{\"lab_id\":\"$LAB_ID\"}")
echo "$QUOTA" | jq -e '.status == "ok"' >/dev/null 2>&1 && ok "check-quota" || bad "check-quota ($QUOTA)"

# ── 6. Labs (exercises labs -> billing HTTP) ───────────────────────────────────
section "labs"
TIERS=$(curl -s $LABS/labs/tiers -H "Authorization: Bearer $LAB_TOKEN")
echo "$TIERS" | jq -e '.data' >/dev/null 2>&1 && ok "GET /labs/tiers" || bad "tiers ($TIERS)"

BATCH=$(curl -s -X POST $LABS/labs/batch -H "Authorization: Bearer $LAB_TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"image_keys":["smoke/a.jpg","smoke/b.jpg","smoke/c.jpg"]}')
BATCH_ID=$(echo "$BATCH" | jq -r '.data.batch.batch_id // .data.batch_id // .data.batch.id')
[ -n "$BATCH_ID" ] && [ "$BATCH_ID" != null ] && ok "POST /labs/batch (batch_id=$BATCH_ID)" || bad "create batch ($BATCH)"

if [ -n "$BATCH_ID" ] && [ "$BATCH_ID" != null ]; then
  RES=$(curl -s "$LABS/labs/results/$BATCH_ID" -H "Authorization: Bearer $LAB_TOKEN")
  echo "$RES" | jq -e '.data' >/dev/null 2>&1 && ok "GET /labs/results/{id}" || bad "batch results ($RES)"
  # Prove the labs Kafka round-trip: 3 items -> recognition -> labs results
  # consumer -> DB. Recognition processes sequentially (0.5-2s each), so poll.
  DONE=0
  for i in $(seq 1 15); do
    DONE=$(docker compose exec -T postgres psql -U oblivion -d oblivion -tAc \
      "select count(*) from labs.batch_items where batch_id='$BATCH_ID' and status='completed';" 2>/dev/null | tr -d '[:space:]')
    [ "$DONE" = 3 ] && break
    sleep 1
  done
  [ "$DONE" = 3 ] && ok "labs: 3/3 batch items completed via Kafka" || bad "labs: only $DONE/3 items completed"
fi
USE=$(curl -s $LABS/labs/usage -H "Authorization: Bearer $LAB_TOKEN")
echo "$USE" | jq -e '.data' >/dev/null 2>&1 && ok "GET /labs/usage" || bad "usage ($USE)"

# ── Summary ────────────────────────────────────────────────────────────────────
printf "\n\033[1m== summary: %d passed, %d failed ==\033[0m\n" "$PASS" "$FAIL"
[ "$FAIL" -eq 0 ]
