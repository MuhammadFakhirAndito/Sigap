# Panduan Operasi & Pemeliharaan SIGAP Gempa

Dokumen ini merangkum prosedur operasional harian: pencadangan (*backup*), pemulihan (*restore*), penjadwalan sinkronisasi dan retensi log, rotasi rahasia, serta pemantauan kesehatan sistem.

---

## 1. Pencadangan & Pemulihan Database (NFR-DB-05, TC-DB-07)

### Backup Harian (`scripts/backup.sh`)
[`scripts/backup.sh`](../scripts/backup.sh) menjalankan `pg_dump` format custom (`-Fc`) lewat `docker exec`, memberi izin berkas `600`, menyimpannya di direktori host luar container (`./backups` atau `BACKUP_DIR`), dan otomatis menghapus cadangan yang lebih tua dari `7` hari (`RETENTION_DAYS`).

Variabel opsional:
- `SIGAP_DB_CONTAINER` (bawaan: `sigap_postgres`, untuk produksi setel ke `sigap_postgres_prod`)
- `SIGAP_BACKUP_USER` (bawaan: `sigap`)
- `SIGAP_DB_NAME` (bawaan: `sigap`)
- `BACKUP_DIR` (bawaan: `<root>/backups`)
- `RETENTION_DAYS` (bawaan: `7`)

Contoh uji manual di server produksi:
```bash
SIGAP_DB_CONTAINER=sigap_postgres_prod BACKUP_DIR=/var/backups/sigap sh /opt/sigap/scripts/backup.sh
```

### Restore ke Database Kosong (`scripts/restore.sh`)
[`scripts/restore.sh`](../scripts/restore.sh) menolak menimpa database yang sudah berisi tabel (`public` harus kosong) lalu menjalankan `pg_restore --no-owner --no-privileges`.

Langkah uji restore aman ke database sementara:
```bash
docker exec sigap_postgres_prod psql -U pgadmin -d postgres -c "CREATE DATABASE sigap_uji_restore OWNER sigap;"
SIGAP_DB_CONTAINER=sigap_postgres_prod sh /opt/sigap/scripts/restore.sh /var/backups/sigap/sigap_YYYYMMDD_HHMMSS.dump sigap_uji_restore
# Bandingkan jumlah baris tiap tabel, lalu bersihkan:
docker exec sigap_postgres_prod psql -U pgadmin -d postgres -c "DROP DATABASE sigap_uji_restore;"
```

---

## 2. Penjadwalan Cron (Jangan Tulis Rahasia di Crontab)

Siapkan berkas env khusus skrip cron dengan izin `chmod 600` (mis. `/etc/sigap/sigap.env`):
```bash
sudo mkdir -p /etc/sigap
sudo tee /etc/sigap/sigap.env >/dev/null <<'EOF'
SYNC_SECRET="<salin-nilai-SYNC_SECRET-dari-.env>"
SIGAP_APP_URL="http://127.0.0.1:3000"
SIGAP_DB_CONTAINER="sigap_postgres_prod"
BACKUP_DIR="/var/backups/sigap"
EOF
sudo chmod 600 /etc/sigap/sigap.env
```

Skrip [`scripts/cron-sync.sh`](../scripts/cron-sync.sh) dan [`scripts/cron-cleanup.sh`](../scripts/cron-cleanup.sh) membaca berkas env tersebut dan mengirim header via stdin `curl -K -` sehingga rahasia tidak tampil pada daftar proses (`ps`) maupun `crontab`.

Contoh entri `crontab -e` (**pasang secara manual di server, jangan otomatis di repositori**):
```cron
# Sinkronisasi data gempa BMKG setiap 5 menit
*/5 * * * * SIGAP_ENV_FILE=/etc/sigap/sigap.env /bin/sh /opt/sigap/scripts/cron-sync.sh >> /var/log/sigap-sync.log 2>&1

# Hapus ChatLog berusia > 30 hari setiap hari pukul 02.15 WIB
15 2 * * * SIGAP_ENV_FILE=/etc/sigap/sigap.env /bin/sh /opt/sigap/scripts/cron-cleanup.sh >> /var/log/sigap-cleanup.log 2>&1

# Backup pg_dump harian pukul 03.00 WIB (retensi 7 hari)
0 3 * * * SIGAP_DB_CONTAINER=sigap_postgres_prod BACKUP_DIR=/var/backups/sigap /bin/sh /opt/sigap/scripts/backup.sh >> /var/log/sigap-backup.log 2>&1
```

---

## 3. Cek Kesehatan Sistem (`/api/health`)

- **Cek publik** (tanpa rahasia, hanya mengembalikan `healthy` atau `degraded`):
  ```bash
  curl -fsS http://127.0.0.1:3000/api/health
  ```
- **Cek detail operator** (dengan header `x-sync-secret` dari berkas env `600`):
  ```bash
  sh -c '. /etc/sigap/sigap.env && printf "header = \"x-sync-secret: %s\"\n" "$SYNC_SECRET" | curl -fsS -K - http://127.0.0.1:3000/api/health'
  ```

---

## 4. Rotasi Rahasia & Insiden Sandi Lama

> **Peringatan Riwayat Git:** Kata sandi contoh lama (`sigap_password`) pernah tercatat di beberapa komit awal riwayat Git sebelum pembersihan Fase 6 (`5756a0e`, `c4f9bca`, `d9094e0`, `1773cdc`). Nilai tersebut **dilarang keras** digunakan kembali di server mana pun dan ditolak otomatis oleh [`validateEnvironment()`](../src/lib/env.ts).

Langkah rotasi berkala atau bila kunci dicurigai bocor:
1. **Rotasi `SYNC_SECRET` & `LOG_HMAC_SECRET`**:
   - Buat nilai baru via `openssl rand -hex 32`.
   - Perbarui `.env` dan `/etc/sigap/sigap.env` (`chmod 600`), lalu muat ulang container `app`: `docker compose -f docker-compose.prod.yml up -d --force-recreate app`.
   - *(Catatan: rotasi `LOG_HMAC_SECRET` membuat `ipHash` log lama tidak sama dengan sesi baru, hal ini wajar dan aman karena retensi maksimal 30 hari).*
2. **Rotasi password peran DB `sigap` (`POSTGRES_APP_PASSWORD`)**:
   - Buat password baru dengan `openssl rand -hex 32`.
   - Ubah password peran di PostgreSQL lewat admin `pgadmin`:
     ```bash
     docker exec -i sigap_postgres_prod psql -U pgadmin -d postgres -v new_pw="<PASSWORD_BARU>" -c "ALTER ROLE sigap WITH PASSWORD :'new_pw';"
     ```
   - Perbarui `POSTGRES_APP_PASSWORD` dan `DATABASE_URL` di `.env`, lalu recreate container `app`.
3. **Rotasi `GEMINI_API_KEY`**: cabut kunci lama di Google AI Studio, buat kunci baru, perbarui `.env`, lalu recreate `app`.
