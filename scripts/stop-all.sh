#!/usr/bin/env bash
# Stop all services started by run-all.sh.
set -uo pipefail
cd "$(dirname "$0")/.."
[ -f logs/pids ] || { echo "no logs/pids"; exit 0; }
while read -r svc pid; do
  if kill -0 "$pid" 2>/dev/null; then
    echo ">> stopping $svc ($pid)"
    kill "$pid" 2>/dev/null || true
  fi
done < logs/pids
# cargo run spawns a child target binary; clean those up too.
pkill -f 'target/debug/oblivion-' 2>/dev/null || true
echo "stopped"
