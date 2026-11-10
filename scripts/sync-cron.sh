#!/usr/bin/env bash
# ==============================================================================
# SIGAP - BMKG Background Sync Cron Trigger Script
# Menjalankan sinkronisasi data BMKG ke database lokal via API Endpoint terproteksi.
# Dapat dipasang di crontab VPS: */5 * * * * /path/to/sigap/scripts/sync-cron.sh >> /var/log/sigap-sync.log 2>&1
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load variabel lingkungan dari .env
if [ -f "${PROJECT_ROOT}/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs -0 2>/dev/null || true)
fi

APP_URL="${APP_URL:-http://localhost:3000}"
SYNC_ENDPOINT="${APP_URL}/api/sync"
SECRET_TOKEN="${SYNC_SECRET:-${SYNC_SECRET_TOKEN:-sigap_secure_sync_token_2026}}"

echo "[$(date -u +'%Y-%m-%dT%H:%M:%SZ')] Memicu sinkronisasi data BMKG ke ${SYNC_ENDPOINT}..."

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "${SYNC_ENDPOINT}" \
  -H "SYNC_SECRET: ${SECRET_TOKEN}" \
  -H "Authorization: Bearer ${SECRET_TOKEN}" \
  -H "Content-Type: application/json" \
  --connect-timeout 10 \
  --max-time 30 || true)

HTTP_BODY=$(echo "$RESPONSE" | sed '$d')
HTTP_CODE=$(echo "$RESPONSE" | tail -n 1)

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "✅ Sinkronisasi berhasil (HTTP 200): ${HTTP_BODY}"
else
  echo "⚠️ Sinkronisasi menghasilkan HTTP ${HTTP_CODE}: ${HTTP_BODY}" >&2
fi

