#!/usr/bin/env bash
# ==============================================================================
# SIGAP - Database Restore & Recovery Testing Script (TC-DB-07, NFR-DB-05)
# Memulihkan dump database ke container PostgreSQL untuk validasi disaster recovery.
# ==============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"

# Load variabel lingkungan
if [ -f "${PROJECT_ROOT}/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs -0 2>/dev/null || true)
fi

CONTAINER_NAME="${DB_CONTAINER_NAME:-sigap-postgres}"
DB_USER="${POSTGRES_USER:-sigap_user}"
DB_NAME="${POSTGRES_DB:-sigap_db}"

# Tentukan file backup: argumen $1 atau file terbaru di folder backups
BACKUP_FILE="${1:-}"

if [ -z "${BACKUP_FILE}" ]; then
  # Cari file backup terakhir
  LATEST_BACKUP=$(find "${BACKUP_DIR}" -name "sigap_db_*.sql.gz" -type f 2>/dev/null | sort -r | head -n 1 || true)
  if [ -z "${LATEST_BACKUP}" ]; then
    echo "❌ Error: Tidak ditemukan file backup di folder '${BACKUP_DIR}'!" >&2
    echo "Gunakan: bash scripts/restore.sh <path_file_backup.sql.gz>" >&2
    exit 1
  fi
  BACKUP_FILE="${LATEST_BACKUP}"
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "❌ Error: File backup tidak ditemukan: ${BACKUP_FILE}" >&2
  exit 1
fi

echo "=================================================="
echo " [SIGAP] Prosedur Restore Database (Disaster Recovery)"
echo " File Backup : ${BACKUP_FILE}"
echo " Target DB   : ${DB_NAME} di container ${CONTAINER_NAME}"
echo "=================================================="

# Cek container
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "❌ Error: Docker container '${CONTAINER_NAME}' tidak sedang berjalan!" >&2
  exit 1
fi

# Konfirmasi restore
read -r -p "⚠️ PERINGATAN: Data saat ini akan ditimpa! Lanjutkan restore? (y/N): " CONFIRM
if [[ ! "$CONFIRM" =~ ^[yY](es)?$ ]]; then
  echo "Operasi restore dibatalkan oleh pengguna."
  exit 0
fi

echo "⏳ Mendekompresi dan memulihkan data ke PostgreSQL..."
if gzip -dc "${BACKUP_FILE}" | docker exec -i "${CONTAINER_NAME}" psql -U "${DB_USER}" -d "${DB_NAME}"; then
  echo "=================================================="
  echo "✅ Restore database BERHASIL!"
  echo "Data telah dipulihkan secara utuh dari ${BACKUP_FILE}."
  echo "=================================================="
else
  echo "❌ Gagal memulihkan database dari backup!" >&2
  exit 1
fi
