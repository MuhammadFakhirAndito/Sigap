#!/usr/bin/env bash
# ==============================================================================
# SIGAP - ChatLog & Metrics Maintenance Cleanup Script
# Menghapus catatan riwayat chat yang lebih tua dari batas retensi (misal 30 hari).
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Load variabel lingkungan dari .env
if [ -f "${PROJECT_ROOT}/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs -0 2>/dev/null || true)
fi

CONTAINER_NAME="${DB_CONTAINER_NAME:-sigap_postgres}"
DB_USER="${POSTGRES_USER:-sigap_user}"
DB_NAME="${POSTGRES_DB:-sigap_gempa}"
RETENTION_DAYS=30

echo "=================================================="
echo " [SIGAP] Pemeliharaan Retensi ChatLog (> ${RETENTION_DAYS} hari)"
echo " Waktu: $(date)"
echo "=================================================="

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "⚠️ Container database tidak berjalan, pembersihan dilewati."
  exit 0
fi

CLEANUP_QUERY="DELETE FROM \"ChatLog\" WHERE \"createdAt\" < NOW() - INTERVAL '${RETENTION_DAYS} days';"

DELETED_ROWS=$(docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}" -t -c "${CLEANUP_QUERY}" || true)

echo "✅ Pembersihan log selesai: ${DELETED_ROWS}"

