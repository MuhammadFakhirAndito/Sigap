#!/usr/bin/env bash
# ==============================================================================
# SIGAP - Automated Database Backup Script (FR-DB-15, NFR-DB-05)
# Melakukan backup database PostgreSQL dengan kompresi gzip dan retensi 7 hari.
# ==============================================================================

set -euo pipefail

# Direktori dasar
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
TIMESTAMP="$(date +'%Y%m%d_%H%M%S')"
BACKUP_FILE="${BACKUP_DIR}/sigap_db_${TIMESTAMP}.sql.gz"
RETENTION_DAYS=7

# Load konfigurasi .env jika ada
if [ -f "${PROJECT_ROOT}/.env" ]; then
  # shellcheck disable=SC2046
  export $(grep -v '^#' "${PROJECT_ROOT}/.env" | xargs -0 2>/dev/null || true)
fi

CONTAINER_NAME="${DB_CONTAINER_NAME:-sigap-postgres}"
DB_USER="${POSTGRES_USER:-sigap_user}"
DB_NAME="${POSTGRES_DB:-sigap_db}"

echo "=================================================="
echo " [SIGAP] Memulai Backup Database Terjadwal"
echo " Waktu       : $(date)"
echo " Container   : ${CONTAINER_NAME}"
echo " Database    : ${DB_NAME}"
echo "=================================================="

# Buat folder backup jika belum ada
mkdir -p "${BACKUP_DIR}"

# Cek apakah container docker berjalan
if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "❌ Error: Docker container '${CONTAINER_NAME}' tidak sedang berjalan!" >&2
  exit 1
fi

# Jalankan pg_dump via Docker exec dan kompres dengan gzip
echo "⏳ Mengeksekusi pg_dump & mengompresi ke ${BACKUP_FILE}..."
if docker exec -t "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" -d "${DB_NAME}" --clean --if-exists | gzip > "${BACKUP_FILE}"; then
  FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
  echo "✅ Backup berhasil dibuat: ${BACKUP_FILE} (${FILE_SIZE})"
else
  echo "❌ Gagal membuat backup database!" >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# Rotasi berkas backup lama (hapus backup yang lebih lama dari RETENTION_DAYS hari)
echo "🧹 Memeriksa dan membersihkan backup lama (> ${RETENTION_DAYS} hari)..."
DELETED_COUNT=0
while IFS= read -r old_file; do
  if [ -n "$old_file" ]; then
    rm -f "$old_file"
    echo "   - Menghapus backup lama: $old_file"
    DELETED_COUNT=$((DELETED_COUNT + 1))
  fi
done < <(find "${BACKUP_DIR}" -name "sigap_db_*.sql.gz" -type f -mtime +"${RETENTION_DAYS}" 2>/dev/null)

echo "   Selesai rotasi (${DELETED_COUNT} file dihapus)."
echo "=================================================="
echo " [SIGAP] Backup selesai dengan sukses!"
echo "=================================================="
