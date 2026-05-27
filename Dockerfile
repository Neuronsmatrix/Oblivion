ARG SERVICE=auth

# ── Builder stage ──────────────────────────────────────────────
FROM rust:1.85-bookworm AS builder

ARG SERVICE

RUN apt-get update && apt-get install -y cmake librdkafka-dev pkg-config libssl-dev && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy workspace manifests first for layer caching
COPY Cargo.toml Cargo.lock ./
COPY crates/oblivion-common/Cargo.toml crates/oblivion-common/
COPY services/auth/Cargo.toml services/auth/
COPY services/case/Cargo.toml services/case/
COPY services/labs/Cargo.toml services/labs/
COPY services/recognition/Cargo.toml services/recognition/
COPY services/notifier/Cargo.toml services/notifier/
COPY services/reference/Cargo.toml services/reference/
COPY services/billing/Cargo.toml services/billing/

# Create dummy source files for dependency caching
RUN mkdir -p crates/oblivion-common/src && echo "pub fn _dummy() {}" > crates/oblivion-common/src/lib.rs
RUN for svc in auth case labs recognition notifier reference billing; do \
        mkdir -p services/$svc/src && echo "fn main() {}" > services/$svc/src/main.rs; \
    done

# Build dependencies only (cached unless Cargo.toml changes)
RUN cargo build --release --package oblivion-${SERVICE} 2>/dev/null || true

# Copy real source code
COPY crates/ crates/
COPY services/ services/

# Touch source files to invalidate the dummy build cache
RUN find crates/ services/ -name "*.rs" -exec touch {} +

# Build the target service
RUN cargo build --release --package oblivion-${SERVICE}

# ── Runtime stage ──────────────────────────────────────────────
FROM debian:bookworm-slim AS runtime

ARG SERVICE

RUN apt-get update && apt-get install -y ca-certificates librdkafka1 libssl3 && rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/target/release/oblivion-${SERVICE} /usr/local/bin/service

EXPOSE 3000

CMD ["service"]
