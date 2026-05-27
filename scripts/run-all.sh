#!/usr/bin/env bash
# Launch all 7 Oblivion services on the host (infra runs in Docker).
# Each service reads ./.env via dotenvy and logs to logs/<svc>.log.
# PIDs are recorded in logs/pids; stop everything with scripts/stop-all.sh.
set -euo pipefail

cd "$(dirname "$0")/.."
mkdir -p logs
: > logs/pids

SERVICES=(auth case labs recognition notifier reference billing)

# Build once up front, then launch the compiled binaries directly. Running
# `cargo run` for all 7 at once contends on the cargo build lock; the prebuilt
# binaries start instantly and in parallel.
echo ">> building workspace"
cargo build --workspace

# auth/case/notifier/reference read the key via JWT_PUBLIC_KEY_PATH (./keys),
# but labs and billing require the key *contents* in JWT_PUBLIC_KEY. Exporting
# it here propagates to every child; dotenvy won't override an already-set var.
export JWT_PUBLIC_KEY="$(cat keys/public.pem)"

for svc in "${SERVICES[@]}"; do
  echo ">> starting oblivion-$svc"
  nohup "./target/debug/oblivion-$svc" > "logs/$svc.log" 2>&1 &
  echo "$svc $!" >> logs/pids
done

echo
echo "started: $(wc -l < logs/pids) services. logs in ./logs/, pids in ./logs/pids"

# Stay alive as the parent so the backgrounded services are not orphaned/killed.
# Run this script itself in the background (or under nohup) to keep them up.
trap 'kill $(awk "{print \$2}" logs/pids) 2>/dev/null' INT TERM
wait
