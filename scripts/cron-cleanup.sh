#!/bin/sh
set -eu

ENV_FILE="${SIGAP_ENV_FILE:-/etc/sigap/sigap.env}"
APP_URL="${SIGAP_APP_URL:-http://127.0.0.1:3000}"

if [ ! -f "$ENV_FILE" ]; then
  echo "[CLEANUP] GAGAL: Berkas env '$ENV_FILE' tidak ditemukan." >&2
  exit 1
fi

set -a
# shellcheck disable=SC1090
. "$ENV_FILE"
set +a

if [ -z "${SYNC_SECRET:-}" ]; then
  echo "[CLEANUP] GAGAL: SYNC_SECRET kosong di '$ENV_FILE'." >&2
  exit 1
fi

printf 'header = "x-sync-secret: %s"\n' "$SYNC_SECRET" | \
  curl -fsS --max-time 30 -K - -X POST "${APP_URL%/}/api/chat/cleanup"
echo ""
