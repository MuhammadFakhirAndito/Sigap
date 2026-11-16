#!/bin/sh
set -eu

SCRIPT_DIR="$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)"
PROJECT_ROOT="$(CDPATH= cd -- "$SCRIPT_DIR/.." && pwd)"

CONTAINER_NAME="${SIGAP_DB_CONTAINER:-sigap_postgres}"
PGUSER="${SIGAP_BACKUP_USER:-sigap}"
PGDB="${SIGAP_DB_NAME:-sigap}"
BACKUP_DIR="${BACKUP_DIR:-$PROJECT_ROOT/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"

mkdir -p "$BACKUP_DIR"
if command -v chmod >/dev/null 2>&1; then
  chmod 700 "$BACKUP_DIR"
fi

TIMESTAMP="$(date +%Y%m%d_%H%M%S)"
OUT_FILE="$BACKUP_DIR/sigap_${TIMESTAMP}.dump"

echo "[BACKUP] Memulai pg_dump format custom dari container '$CONTAINER_NAME' ke '$OUT_FILE'..."
docker exec "$CONTAINER_NAME" pg_dump -U "$PGUSER" -d "$PGDB" -Fc > "$OUT_FILE"

if command -v chmod >/dev/null 2>&1; then
  chmod 600 "$OUT_FILE"
fi

if [ ! -s "$OUT_FILE" ]; then
  echo "[BACKUP] GAGAL: Berkas backup kosong ($OUT_FILE)." >&2
  rm -f "$OUT_FILE"
  exit 1
fi

echo "[BACKUP] Menghapus backup lebih lama dari $RETENTION_DAYS hari di '$BACKUP_DIR'..."
find "$BACKUP_DIR" -maxdepth 1 -name 'sigap_*.dump' -type f -mtime +"$RETENTION_DAYS" -delete

echo "[BACKUP] Selesai: $OUT_FILE ($(wc -c < "$OUT_FILE" | tr -d '[:space:]') bytes)"
