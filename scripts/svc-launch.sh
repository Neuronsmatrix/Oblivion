#!/usr/bin/env bash
# systemd ExecStart wrapper for the release binaries.
#
# labs and billing require the JWT *public key contents* in JWT_PUBLIC_KEY (the
# other services read JWT_PUBLIC_KEY_PATH from .env via dotenvy). systemd can't
# hold a multiline value in Environment=, so we export it here instead. Exporting
# it unconditionally is harmless for the services that don't need it.
#
# Usage (from a systemd unit):  ExecStart=<repo>/scripts/svc-launch.sh <service>
set -euo pipefail

cd "$(dirname "$0")/.."

svc="${1:?usage: svc-launch.sh <auth|case|labs|recognition|notifier|reference|billing>}"

if [[ -f keys/public.pem ]]; then
  JWT_PUBLIC_KEY="$(cat keys/public.pem)"
  export JWT_PUBLIC_KEY
fi

exec "./target/release/oblivion-$svc"
