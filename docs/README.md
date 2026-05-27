# Oblivion API documentation

[`openapi.yaml`](./openapi.yaml) is a single OpenAPI 3.1 spec covering all 7
services, grouped by tag (= service).

## Gateway: one origin

The services each listen on their own port (3001–3007), but an nginx **API
gateway** ([`../gateway/nginx.conf`](../gateway/nginx.conf)) fronts them at
**<http://localhost:8080>** and routes by path prefix (`/auth/*`→3001,
`/cases`→3002, `/labs/*`→3003, `/recognize`→3004, `/notifications`→3005,
`/reference/*`→3006, `/billing/*`→3007). That single origin is the `server` in
the spec, so clients and "Try it out" never juggle ports. Gateway liveness:
`GET /healthz`. To bypass it, hit a service's port directly (noted on each tag).

## View it

**Swagger UI (bundled):** after `docker compose up -d`, open
<http://localhost:8088>. The container snapshots the spec at start, so after
editing `openapi.yaml` run `docker compose restart swagger-ui` to reload it.

**Other tools:** the file is plain OpenAPI 3.1 — import it into Postman /
Insomnia / Bruno, or generate clients with `openapi-generator`:

```bash
openapi-generator-cli generate -i docs/openapi.yaml -g typescript-fetch -o ./client
```

## Auth in Swagger UI

1. `POST /auth/register` then `POST /auth/login`; copy `data.access_token`.
2. Click **Authorize** (top right), paste the token, and authorized endpoints
   will send `Authorization: Bearer <token>`.
3. Lab endpoints (`/labs/*`) need a token from a user registered with
   `role: lab`.

## Keeping it accurate

This spec was hand-written from the live v1 responses. It is **not**
auto-generated, so it can drift when handlers change. Shapes were verified by
`scripts/smoke-test.sh`. For an always-in-sync alternative, annotate the Axum
handlers with [`utoipa`](https://docs.rs/utoipa) and serve a generated spec —
a larger change touching all 7 services.
