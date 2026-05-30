# Deploying Oblivion + Phenograph on one machine

This is the MVP single-machine deployment: the Phenograph SPA on
`https://<FRONTEND_DOMAIN>`, the Oblivion API on `https://<API_DOMAIN>`, TLS via
Let's Encrypt, CORS locked to the frontend, secrets pulled from `.env`, and the
demo logins seeded into the real database.

```
Internet ──443──> system nginx ──┬─ frontend.<domain>  → /var/www/phenograph (SPA)
                                 ├─ api.<domain>       → 127.0.0.1:8080 (docker gateway → 7 services)
                                 └─ storage.<domain>   → 127.0.0.1:9000 (MinIO, optional)
                                                          ↓
                 systemd units (release binaries)  +  docker infra (loopback-only)
```

## 1. Prerequisites

On the target machine (Ubuntu/Debian or Fedora/RHEL):

- **Docker** + the `docker compose` plugin, and your user in the `docker` group
- **Rust** toolchain (`cargo`, stable) — the build needs `cmake`, `pkg-config`,
  `libssl-dev`, and `librdkafka` build deps (Kafka client)
- **Node 20+** (`node`, `npm`)
- **nginx**, **certbot** + the nginx plugin (`python3-certbot-nginx`)
- **ufw**, plus `jq`, `curl`, `openssl`, `rsync`
- A user with **passwordless-or-prompted sudo** (the script calls `sudo` for the
  privileged steps only)

## 2. DNS (do this first)

Create **A records** pointing at the machine's public IP:

- `<FRONTEND_DOMAIN>` (e.g. `frontend.example.com`)
- `<API_DOMAIN>` (e.g. `api.example.com`)
- `<STORAGE_DOMAIN>` (optional, e.g. `storage.example.com`) — **needed for image
  uploads to work from a remote browser**; see [§7](#7-image-uploads--minio).

Certbot validates over HTTP, so the records must resolve before you run the script.

## 3. Deploy

Clone the repo, then from the repo root, **as your normal user** (not `sudo`):

```bash
./deploy.sh <FRONTEND_DOMAIN> <API_DOMAIN> <CERTBOT_EMAIL> [STORAGE_DOMAIN]
# e.g.
./deploy.sh frontend.example.com api.example.com ops@example.com storage.example.com
```

The script is **idempotent** — re-running it rebuilds and reconfigures without
regenerating secrets (it never overwrites an existing `.env` or `keys/`).

> **Deploying on a host that previously ran the dev stack?** It already has a `.env`
> and `keys/` with weak dev values, and the idempotent guard will keep them. Delete
> both first so the script generates fresh production secrets:
> `rm -f .env && rm -rf keys` (then also recreate the Postgres volume if it was
> initialised with the old password — see [§11](#11-security-checklist--notes)).

## 4. What the script does (10 steps)

1. **Preflight** — verifies every required command and that you can `sudo`.
2. **Secrets & `.env`** — if `.env` is absent, copies `.env.example` and fills in a
   strong random Postgres password, strong MinIO credentials, the JWT key paths,
   `CORS_ALLOWED_ORIGIN=https://<FRONTEND_DOMAIN>`, and the domains. Generates a
   fresh RSA JWT keypair into `keys/` if missing. Writes
   `frontend/app/.env.production` (`VITE_USE_MOCKS=false`, API → `https://<API_DOMAIN>`).
3. **Infra** — `docker compose up -d` (postgres, redis, kafka, minio, elasticsearch,
   mailpit, the gateway, swagger-ui) and waits for healthchecks. All infra ports are
   bound to `127.0.0.1` only.
4. **Migrations** — `scripts/migrate.sh` (idempotent SQL).
5. **Backend** — `cargo build --release --workspace`, then installs and starts a
   `oblivion-<svc>` **systemd** unit for each of the 7 services (`Restart=always`,
   starts on boot, logs to journald).
6. **Demo logins** — `scripts/seed-demo.sh` registers the demo doctor + lab.
7. **Frontend** — `npm ci && npm run build`, publishes `dist/` to `/var/www/phenograph`.
8. **System nginx** — writes the frontend, API, (optional) storage server blocks plus
   a login rate-limit zone and security headers; validates and reloads.
9. **TLS** — `certbot --nginx` obtains/installs certs for all domains and adds the
   HTTP→HTTPS redirect.
10. **Firewall** — `ufw` opens only 22/80/443 and denies the rest.

## 5. Demo logins

Credentials live in `.env` (`DEMO_DOCTOR_*`, `DEMO_LAB_*`) and are seeded via the live
`/auth/register` endpoint, so the passwords are hashed the way the service expects.
Defaults are `doctor@phenograph.test` / `lab@phenograph.test`, password `demopass123`
— **change these in `.env` before deploying** (then re-run `scripts/seed-demo.sh`).
Re-seeding is safe: existing accounts return "exists (ok)".

> Note: the in-browser mock logins (`*@phenograph.test` / `password`) only exist when
> the frontend runs with `VITE_USE_MOCKS=true`. Production builds have mocks **off**,
> so the seeded DB accounts above are the real demo logins.

## 6. CORS

Every service now builds its CORS layer from `CORS_ALLOWED_ORIGIN`
(`crates/oblivion-common::cors_layer_from_env`). `deploy.sh` sets it to
`https://<FRONTEND_DOMAIN>`, so only the SPA origin may call the API from a browser.
Unset/`*` falls back to permissive (dev). To allow extra origins, set a comma-separated
list and restart the services (`sudo systemctl restart 'oblivion-*'`).

## 7. Image uploads & MinIO

Uploads use **presigned PUT URLs** generated by the case service and signed against
`S3_ENDPOINT`. A remote browser cannot use a `localhost:9000` URL, and the SigV4
signature is bound to the host, so the public URL must match what was signed.

- **With `STORAGE_DOMAIN`** (recommended): the script sets `S3_ENDPOINT=https://<STORAGE_DOMAIN>`
  and reverse-proxies it 1:1 to MinIO (no path rewrite, so signatures validate). MinIO's
  default CORS allows the browser PUT. Uploads work.
- **Without `STORAGE_DOMAIN`**: `S3_ENDPOINT` stays `http://localhost:9000` and **browser
  uploads will fail**. Fine for an API-only demo; add the storage subdomain (A record +
  re-run `deploy.sh` with the 4th arg) when you need working uploads.

## 8. Operating

```bash
# Service logs / status
journalctl -u oblivion-auth -f
systemctl status 'oblivion-*'
sudo systemctl restart 'oblivion-*'      # after editing .env or rebuilding

# Infra
docker compose ps
docker compose logs -f kafka

# Re-deploy after a code change
git pull && ./deploy.sh <FRONTEND_DOMAIN> <API_DOMAIN> <EMAIL> [STORAGE_DOMAIN]
```

## 9. Rollback

```bash
sudo systemctl stop 'oblivion-*'         # stop the backend
# restore a previous frontend build:
sudo rsync -a /path/to/previous/dist/ /var/www/phenograph/
# infra data persists in the docker named volumes (postgres_data, minio_data, ...)
```

## 10. Verification (run these yourself)

1. `curl https://<API_DOMAIN>/healthz` → `ok`.
2. Open `https://<FRONTEND_DOMAIN>` — valid cert, SPA loads; refresh a deep link
   (e.g. `/app/cases`) → still loads (SPA fallback).
3. Log in with the demo doctor/lab from `.env`.
4. `scripts/smoke-test.sh` — note it targets `localhost:300x` directly by default;
   run it on the host (the services listen there) for a full end-to-end pass, or adapt
   the host vars to hit `https://<API_DOMAIN>`.
5. Cross-origin check: a `fetch('https://<API_DOMAIN>/...')` from some other site's
   console is rejected by CORS preflight.
6. From another host, confirm ports `3001-3007`, `5432`, `9092`, `9200`, `8080`, `8088`
   are unreachable; only `80`/`443`/`22` answer.
7. `sudo systemctl kill oblivion-auth` then `systemctl status oblivion-auth` → it
   auto-restarts.

## 11. Security checklist & notes

**Verified clean:**

- **SQL injection** — all queries use parameterized `sqlx` binds. The single
  `format!("SET search_path TO {schema}")` uses an env-supplied schema name, never user
  input.
- **XSS** — no `dangerouslySetInnerHTML`/`innerHTML`; React escapes all output. The
  residual risk is that JWTs live in `localStorage` (a documented trade-off), so the
  strict **CSP** header (`frame-ancestors 'none'`, `object-src 'none'`, scoped
  `connect-src`) is the mitigation. If the SPA fails to load due to CSP, relax
  `script-src`/`style-src` in `/etc/nginx/conf.d/oblivion-frontend.conf` and reload.

**Handled by deploy.sh:**

- Fresh RSA JWT keypair, strong DB + MinIO credentials (never the committed dev values).
- All infra ports bound to `127.0.0.1`; swagger-ui not exposed publicly.
- `ufw` restricts the host to 22/80/443.
- TLS + HSTS-eligible HTTPS redirect; security headers; login rate-limiting.
- `VITE_USE_MOCKS=false` at build (the MSW worker JS still ships in the bundle but
  stays inert — remove via a build exclusion later if desired).

**Flagged — decide before/after going live (not auto-fixed):**

- **Open registration:** anyone can `POST /auth/register` with any role. Combined with a
  public site this allows free account creation. Gate registration or add a CAPTCHA/admin
  approval before broad exposure.
- **MinIO buckets are public-read**; Kafka/Elasticsearch are single-node with no auth
  (acceptable only because they're firewalled to loopback on one machine).
- **Postgres password change requires an empty data volume** — Postgres only applies
  `POSTGRES_PASSWORD` on first init. Re-deploying onto an existing `postgres_data` volume
  keeps the old password; recreate the volume to rotate.
- This is a **single machine** with no HA/replication/backups. Add database backups
  (`pg_dump`) and offsite storage before relying on it.
