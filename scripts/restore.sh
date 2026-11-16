#!/bin/sh
set -eu

if [ "$#" -lt 1 ]; then
  echo "Penggunaan: $0 <path-berkas.dump> [nama_database_tujuan]" >&2
  exit 1
fi

DUMP_FILE="$1"
TARGET_DB="${2:-sigap}"
CONTAINER_NAME="${SIGAP_DB_CONTAINER:-sigap_postgres}"
PGUSER="${SIGAP_RESTORE_USER:-sigap}"

if [ ! -f "$DUMP_FILE" ]; then
  echo "[RESTORE] GAGAL: Berkas '$DUMP_FILE' tidak ditemukan." >&2
  exit 1
fi

TABLE_COUNT="$(docker exec "$CONTAINER_NAME" psql -U "$PGUSER" -d "$TARGET_DB" -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" | tr -d '[:space:]')"
if [ "${TABLE_COUNT:-0}" != "0" ]; then
  echo "[RESTORE] DITOLAK: Database '$TARGET_DB' tidak kosong ($TABLE_COUNT tabel sudah ada)." >&2
  echo "[RESTORE] Kosongkan/buat database baru terlebih dahulu agar pemulihan aman." >&2
  exit 1
fi

echo "[RESTORE] Memulihkan '$DUMP_FILE' ke database kosong '$TARGET_DB' (container '$CONTAINER_NAME')..."
docker exec -i "$CONTAINER_NAME" pg_restore \
  --no-owner \
  --no-privileges \
  -U "$PGUSER" \
  -d "$TARGET_DB" < "$DUMP_FILE"

echo "[RESTORE] Pemulihan ke '$TARGET_DB' selesai."
