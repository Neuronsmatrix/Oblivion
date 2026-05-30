#!/usr/bin/env bash
#
# One-shot, single-machine production deployment for Oblivion (backend) +
# Phenograph (frontend). Idempotent: safe to re-run. See docs/DEPLOY.md.
#
#   ./deploy.sh <FRONTEND_DOMAIN> <API_DOMAIN> <CERTBOT_EMAIL> [STORAGE_DOMAIN]
#
# Run as a NORMAL user that has sudo + docker access (do NOT `sudo ./deploy.sh`;
# the script calls sudo only for the privileged steps so cargo/npm artefacts stay
# owned by you). Prerequisites and what each step does are documented in DEPLOY.md.
set -euo pipefail

# ── 0. Args & helpers ────────────────────────────────────────────────────────
FRONTEND_DOMAIN="${1:-}"
API_DOMAIN="${2:-}"
CERTBOT_EMAIL="${3:-}"
STORAGE_DOMAIN="${4:-}"

if [[ -z "$FRONTEND_DOMAIN" || -z "$API_DOMAIN" || -z "$CERTBOT_EMAIL" ]]; then
  echo "usage: $0 <FRONTEND_DOMAIN> <API_DOMAIN> <CERTBOT_EMAIL> [STORAGE_DOMAIN]" >&2
  exit 1
fi

REPO="$(cd "$(dirname "$0")" && pwd)"
cd "$REPO"

log()  { printf '\n\033[1;34m>> %s\033[0m\n' "$*"; }
ok()   { printf '   \033[32m%s\033[0m\n' "$*"; }
die()  { printf '\033[31mERROR: %s\033[0m\n' "$*" >&2; exit 1; }

if [[ "${EUID}" -eq 0 ]]; then
  SUDO=""; DEPLOY_USER="${SUDO_USER:-root}"
else
  SUDO="sudo"; DEPLOY_USER="$(id -un)"
fi

# ── 1. Preflight ─────────────────────────────────────────────────────────────
log "1/11 preflight checks"
for c in docker cargo node npm nginx certbot ufw jq curl openssl pkg-config rsync; do
  command -v "$c" >/dev/null 2>&1 || die "required command not found: $c"
done
docker compose version >/dev/null 2>&1 || die "'docker compose' plugin not available"
if [[ -n "$SUDO" ]]; then
  sudo -v >/dev/null 2>&1 || die "this user cannot sudo (needed for nginx/systemd/ufw/certbot)"
fi

# Rust >= 1.85 (workspace crates use edition 2024).
cargo_ver="$(cargo --version | awk '{print $2}')"
cargo_major="${cargo_ver%%.*}"
cargo_minor="$(printf '%s' "$cargo_ver" | cut -d. -f2)"
if (( cargo_major < 1 || (cargo_major == 1 && cargo_minor < 85) )); then
  die "Rust >= 1.85 required (edition 2024); found $cargo_ver. Fix: rustup update stable && rustup default stable"
fi

# Node >= 20.19 (Vite minimum).
node_ver="$(node --version | sed 's/^v//')"
node_major="${node_ver%%.*}"
node_rest="${node_ver#*.}"
node_minor="${node_rest%%.*}"
if (( node_major < 20 || (node_major == 20 && node_minor < 19) )); then
  die "Node >= 20.19 required (Vite minimum); found v$node_ver. Fix: install Node 22.x from NodeSource (deb.nodesource.com/setup_22.x)"
fi

# librdkafka build deps (cmake-build feature compiles librdkafka from source).
pkg-config --exists libcurl  2>/dev/null || die "libcurl headers missing (rdkafka-sys build). Fix: sudo apt-get install -y libcurl4-openssl-dev"
pkg-config --exists libsasl2 2>/dev/null || die "libsasl2 headers missing (rdkafka-sys build). Fix: sudo apt-get install -y libsasl2-dev"

# certbot nginx plugin (step 10 needs it; certbot itself isn't enough).
$SUDO certbot plugins 2>/dev/null | grep -qE '^\* nginx$' \
  || die "certbot nginx plugin not installed. Fix: sudo apt-get install -y python3-certbot-nginx"

ok "all prerequisites present; deploying as user '$DEPLOY_USER'"

# ── 2. Secrets & .env generation (idempotent: never clobbers an existing .env) ─
log "2/11 secrets & environment"
[[ -f .env.example ]] || die ".env.example missing"

# set_env KEY VALUE — replace an existing KEY= line, or append it. Used both for
# one-time secret generation and for always-derived config (domains, CORS, S3 endpoint).
set_env() {
  local k="$1" v="$2" esc
  esc=$(printf '%s' "$v" | sed -e 's/[&/\]/\\&/g')
  if grep -q "^$k=" .env; then
    sed -i "s/^$k=.*/$k=$esc/" .env
  else
    printf '%s=%s\n' "$k" "$v" >> .env
  fi
}

if [[ -f .env ]]; then
  ok ".env already exists — keeping secrets (delete it to regenerate them)"
else
  PG_PW="$(openssl rand -hex 24)"
  MINIO_PW="$(openssl rand -hex 24)"
  MINIO_USER="oblivion"
  cp .env.example .env
  set_env DATABASE_URL        "postgres://oblivion:${PG_PW}@localhost:5432/oblivion"
  set_env POSTGRES_PASSWORD   "$PG_PW"
  set_env S3_ACCESS_KEY       "$MINIO_USER"
  set_env S3_SECRET_KEY       "$MINIO_PW"
  set_env MINIO_ROOT_USER     "$MINIO_USER"
  set_env MINIO_ROOT_PASSWORD "$MINIO_PW"
  chmod 600 .env
  ok "generated .env with fresh DB/MinIO credentials (chmod 600)"
fi

# Always-applied config derived from CLI args (safe to re-apply on every run).
# If no STORAGE_DOMAIN is given, serve MinIO under the API host using the bucket
# name itself as the path prefix — SigV4 stays valid because neither host nor path
# is rewritten between the signer (case service) and MinIO. See the API server
# block in step 9 for the matching nginx locations.
if [[ -n "$STORAGE_DOMAIN" ]]; then
  S3_ENDPOINT="https://$STORAGE_DOMAIN"
else
  S3_ENDPOINT="https://$API_DOMAIN"
fi
set_env S3_ENDPOINT         "$S3_ENDPOINT"
set_env CORS_ALLOWED_ORIGIN "https://$FRONTEND_DOMAIN"
set_env FRONTEND_DOMAIN     "$FRONTEND_DOMAIN"
set_env API_DOMAIN          "$API_DOMAIN"
set_env STORAGE_DOMAIN      "$STORAGE_DOMAIN"
ok "applied derived config (S3_ENDPOINT=$S3_ENDPOINT, CORS -> https://$FRONTEND_DOMAIN)"

# Fresh JWT signing keypair (never reuse the committed dev keys). Idempotent.
if [[ -f keys/private.pem && -f keys/public.pem ]]; then
  ok "keys/ already present — keeping existing JWT keypair"
else
  mkdir -p keys
  openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out keys/private.pem 2>/dev/null
  openssl rsa -in keys/private.pem -pubout -out keys/public.pem 2>/dev/null
  chmod 600 keys/private.pem; chmod 644 keys/public.pem
  ok "generated fresh RSA JWT keypair in keys/"
fi

# Frontend production env (not secret; safe to overwrite each run).
STORAGE_CONNECT=""
[[ -n "$STORAGE_DOMAIN" ]] && STORAGE_CONNECT=" https://$STORAGE_DOMAIN"
cat > frontend/app/.env.production <<EOF
VITE_API_BASE_URL=https://$API_DOMAIN
VITE_USE_MOCKS=false
EOF
ok "wrote frontend/app/.env.production (mocks OFF, API -> https://$API_DOMAIN)"

# ── 3. Build backend (release) — infra DOWN to avoid the OOM killer ───────────
log "3/11 building backend (release)"
# The release build of aws-sdk-s3 / aws-lc-sys is very memory-hungry and gets
# OOM-killed (SIGKILL) when it competes with the Elasticsearch/Kafka JVMs. So we
# build BEFORE starting infra, and stop anything left running from a prior run.
# On a low-RAM host also export CARGO_BUILD_JOBS=1 (or 2) and/or add swap — see DEPLOY.md.
docker compose stop >/dev/null 2>&1 || true
build_jobs_arg=()
[[ -n "${CARGO_BUILD_JOBS:-}" ]] && build_jobs_arg=(--jobs "$CARGO_BUILD_JOBS")
cargo build --release --workspace "${build_jobs_arg[@]}"
chmod +x scripts/svc-launch.sh
ok "backend built"

# ── 4. Build & publish frontend (also before infra) ──────────────────────────
log "4/11 building frontend"
( cd frontend/app && npm ci && npm run build )
$SUDO mkdir -p /var/www/phenograph
$SUDO rsync -a --delete frontend/app/dist/ /var/www/phenograph/ 2>/dev/null \
  || $SUDO cp -rT frontend/app/dist /var/www/phenograph
ok "published SPA to /var/www/phenograph"

# ── 5. Infrastructure (Docker) ───────────────────────────────────────────────
log "5/11 starting infrastructure (docker compose)"
docker compose up -d
ok "waiting for postgres + kafka to report healthy..."
for i in $(seq 1 60); do
  unhealthy=$(docker compose ps --format '{{.Service}} {{.Health}}' \
    | awk '$2 != "" && $2 != "healthy" {print $1}' || true)
  [[ -z "$unhealthy" ]] && break
  sleep 3
  [[ "$i" -eq 60 ]] && die "infra did not become healthy: $unhealthy"
done
ok "infrastructure healthy"

# ── 6. Migrations ────────────────────────────────────────────────────────────
log "6/11 applying database migrations"
bash scripts/migrate.sh
ok "migrations applied"

# ── 7. Backend services (systemd) ────────────────────────────────────────────
log "7/11 installing and starting systemd units"
SERVICES=(auth case labs recognition notifier reference billing)
# Every unit runs scripts/svc-launch.sh, which exports the multiline JWT public
# key (needed by labs/billing) and execs the release binary. Keeping the logic in
# the wrapper avoids putting a "$(...)" into ExecStart, which systemd would try to
# expand itself. dotenvy loads ./.env from WorkingDirectory for the rest of config.
for svc in "${SERVICES[@]}"; do
  unit="/etc/systemd/system/oblivion-$svc.service"
  $SUDO tee "$unit" >/dev/null <<EOF
[Unit]
Description=Oblivion $svc service
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=$DEPLOY_USER
WorkingDirectory=$REPO
ExecStart=$REPO/scripts/svc-launch.sh $svc
Restart=always
RestartSec=2

[Install]
WantedBy=multi-user.target
EOF
done
$SUDO systemctl daemon-reload
for svc in "${SERVICES[@]}"; do
  $SUDO systemctl enable --now "oblivion-$svc" >/dev/null
done
# Re-runs: pick up any .env changes (S3_ENDPOINT, CORS_ALLOWED_ORIGIN, etc.).
# try-restart is a no-op for units not yet running, so first run isn't bounced.
for svc in "${SERVICES[@]}"; do
  $SUDO systemctl try-restart "oblivion-$svc"
done
ok "7 services enabled and (re)started (systemctl status oblivion-'*')"

# Wait for the AUTH service to actually be listening before seeding. (Note: the
# gateway's /healthz returns 200 the moment the nginx container is up and does NOT
# depend on the services, so we probe auth's own /health on its host port instead.)
log "waiting for the auth service to come up"
for i in $(seq 1 40); do
  curl -fsS http://127.0.0.1:3001/health >/dev/null 2>&1 && break
  sleep 2
  [[ "$i" -eq 40 ]] && die "auth service never came up — check 'journalctl -u oblivion-auth'"
done
ok "auth service is up"

# ── 8. Demo logins ───────────────────────────────────────────────────────────
log "8/11 seeding demo logins"
# Non-fatal: a seeding hiccup must never block nginx/TLS setup below.
bash scripts/seed-demo.sh http://127.0.0.1:8080 \
  || log "demo seed failed (non-fatal) — continuing; re-run scripts/seed-demo.sh later"

# ── 8. System nginx ──────────────────────────────────────────────────────────
log "9/11 configuring system nginx"
# http-context rate-limit zone for the login endpoint.
$SUDO tee /etc/nginx/conf.d/oblivion-ratelimit.conf >/dev/null <<'EOF'
limit_req_zone $binary_remote_addr zone=oblivion_login:10m rate=10r/m;
EOF

CSP="default-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://$API_DOMAIN$STORAGE_CONNECT; font-src 'self' data:; frame-ancestors 'none'; base-uri 'self'; object-src 'none'"

# Frontend site (certbot upgrades :80 -> :443 in place and adds the redirect).
$SUDO tee /etc/nginx/conf.d/oblivion-frontend.conf >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $FRONTEND_DOMAIN;
    root /var/www/phenograph;
    index index.html;

    add_header X-Content-Type-Options nosniff always;
    add_header X-Frame-Options DENY always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;
    add_header Content-Security-Policy "$CSP" always;
    add_header Cache-Control "no-cache" always;

    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable" always;
    }

    # SPA fallback: every unknown path serves index.html for client-side routing.
    location / {
        try_files \$uri /index.html;
    }
}
EOF

# When no dedicated STORAGE_DOMAIN is provided, the bucket paths are served on
# the API host. The bucket name IS the URL prefix, so SigV4 stays valid (nginx
# doesn't rewrite host or path). These prefix locations are longer than "/", so
# nginx routes them to MinIO before falling through to the gateway.
BUCKET_LOCATIONS=""
if [[ -z "$STORAGE_DOMAIN" ]]; then
  BUCKET_LOCATIONS=$(cat <<'BLEOF'
    location /oblivion-raw/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50m;
        proxy_request_buffering off;
    }
    location /oblivion-processed/ {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        client_max_body_size 50m;
    }
BLEOF
)
fi

# API site -> docker gateway on 127.0.0.1:8080 (plus optional bucket locations).
$SUDO tee /etc/nginx/conf.d/oblivion-api.conf >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $API_DOMAIN;
    client_max_body_size 25m;

    add_header X-Content-Type-Options nosniff always;
    add_header Referrer-Policy strict-origin-when-cross-origin always;

$BUCKET_LOCATIONS
    # Brute-force defence on login (no rate limiting exists in the services).
    location = /auth/login {
        limit_req zone=oblivion_login burst=5 nodelay;
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Optional storage site -> MinIO (1:1, no path rewrite so SigV4 signatures match).
CERT_DOMAINS=(-d "$FRONTEND_DOMAIN" -d "$API_DOMAIN")
if [[ -n "$STORAGE_DOMAIN" ]]; then
  $SUDO tee /etc/nginx/conf.d/oblivion-storage.conf >/dev/null <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name $STORAGE_DOMAIN;
    client_max_body_size 50m;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
  CERT_DOMAINS+=(-d "$STORAGE_DOMAIN")
else
  $SUDO rm -f /etc/nginx/conf.d/oblivion-storage.conf
fi

$SUDO nginx -t
$SUDO systemctl reload nginx
ok "nginx configured and reloaded"

# ── 10. TLS via certbot ──────────────────────────────────────────────────────
log "10/11 obtaining TLS certificates (certbot)"
# --expand: cover the case where a previous run issued a cert for fewer domains
# (e.g. without STORAGE_DOMAIN), then this run adds one. --keep-until-expiring
# keeps the existing cert when the domain set hasn't changed.
$SUDO certbot --nginx -n --agree-tos -m "$CERTBOT_EMAIL" \
  --redirect --keep-until-expiring --expand "${CERT_DOMAINS[@]}"
ok "certificates installed; HTTP now redirects to HTTPS"

# ── 11. Firewall ─────────────────────────────────────────────────────────────
log "11/11 configuring firewall (ufw)"
$SUDO ufw allow 22/tcp   >/dev/null
$SUDO ufw allow 80/tcp   >/dev/null
$SUDO ufw allow 443/tcp  >/dev/null
$SUDO ufw default deny incoming  >/dev/null
$SUDO ufw default allow outgoing >/dev/null
# Allow docker bridge interfaces so containers (the gateway) can reach the 7 host
# services on 3001-3007. Without this, ufw's default-deny silently drops bridge
# -> host traffic — every /auth/*, /cases, etc. times out and the browser reports
# it as a CORS failure (gateway returns 502 with no headers). External traffic to
# 3001-3007 is still blocked because it arrives on the public interface, not a bridge.
$SUDO ufw allow in on docker0 >/dev/null 2>&1 || true
for br in $(ip -br link | awk -F'[ @]' '/^br-/{print $1}'); do
  $SUDO ufw allow in on "$br" >/dev/null 2>&1 || true
done
$SUDO ufw --force enable >/dev/null
ok "ufw active: 22/80/443 + docker bridges allowed inbound"

# ── Done ─────────────────────────────────────────────────────────────────────
printf '\n\033[1;32mDeployment complete.\033[0m\n\n'
printf '  Frontend : https://%s\n' "$FRONTEND_DOMAIN"
printf '  API      : https://%s/healthz\n' "$API_DOMAIN"
[[ -n "$STORAGE_DOMAIN" ]] && printf '  Storage  : https://%s\n' "$STORAGE_DOMAIN"
cat <<EOF

Verify it yourself (see docs/DEPLOY.md "Verification"):
  - curl https://$API_DOMAIN/healthz   -> ok
  - open https://$FRONTEND_DOMAIN and log in with the demo accounts from .env
  - run: scripts/smoke-test.sh  (point it at the API; see DEPLOY.md)
EOF
