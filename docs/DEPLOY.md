# Panduan Deploy Produksi SIGAP Gempa

Dokumen ini menjelaskan langkah penyebaran (**deploy**) aplikasi **SIGAP Gempa** ke server VPS/host Linux dengan Docker Compose secara aman.

---

## 1. Prasyarat Server (VPS)

- **OS**: Linux (mis. Ubuntu 24.04 LTS / Debian 12)
- **Docker Engine** & **Docker Compose v2** (`docker compose version`)
- **Firewall host (`ufw`)**:
  - Jika langsung memublikasikan aplikasi atau memakai Caddy di host, buka **hanya** port SSH (`22`), HTTP (`80`), dan HTTPS (`443`).
  - **JANGAN** membuka port `5432` (PostgreSQL) atau `6379` (Redis) ke publik. Di [`docker-compose.prod.yml`](../docker-compose.prod.yml), service `postgres` **tidak** memublikasikan port ke host dan terisolasi di jaringan internal `sigap_internal`.

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

---

## 2. Kloning Repositori & Konfigurasi `.env`

```bash
git clone <url-repositori-anda> sigap
cd sigap
cp .env.example .env
chmod 600 .env
```

Buat nilai acak aman menggunakan `openssl rand -hex 32` (karakter hex aman di URL tanpa perlu *encoding* tambahan; jika memakai simbol khusus pada password database, lakukan *URL-encoding* sebelum disisipkan ke `DATABASE_URL`):

```bash
openssl rand -hex 32
```

Isi berkas `.env` produksi:
- `POSTGRES_ADMIN_USER="pgadmin"` dan `POSTGRES_ADMIN_PASSWORD` acak
- `POSTGRES_APP_PASSWORD` acak (**peran `sigap` bukan superuser**)
- `POSTGRES_DEV_PASSWORD=""` (kosongkan di produksi)
- `DATABASE_URL="postgresql://sigap:<POSTGRES_APP_PASSWORD>@127.0.0.1:5432/sigap?schema=public"` *(catatan: di dalam [`docker-compose.prod.yml`](../docker-compose.prod.yml), container `app` otomatis mengarahkan host ke `postgres:5432` via jaringan internal)*
- `SYNC_SECRET` acak (`openssl rand -hex 32`)
- `LOG_HMAC_SECRET` acak (`openssl rand -hex 32`)
- `GEMINI_API_KEY` aktif dari Google AI Studio
- `NEXT_PUBLIC_APP_URL="https://domain-anda.id"` (atau `http://localhost:3000` untuk uji lokal)
- `TRUST_PROXY="true"` jika berada di belakang Caddy/Nginx yang menyetel header `X-Forwarded-For` terpercaya

> **Penting:** Aplikasi menolak menyala pada `NODE_ENV=production` jika `SYNC_SECRET`, `LOG_HMAC_SECRET`, `GEMINI_API_KEY`, atau password di `DATABASE_URL` masih kosong, memakai nilai contoh lama (`sigap_password`), atau berisi *placeholder*.

---

## 3. Jalankan Container Produksi (`docker-compose.prod.yml`)

```bash
docker compose -f docker-compose.prod.yml up -d --build --wait
```

Verifikasi container dan isolasi peran:

```bash
docker compose -f docker-compose.prod.yml ps
docker exec sigap_postgres_prod psql -U pgadmin -d sigap -c "SELECT usename, usesuper, usecreatedb FROM pg_user WHERE usename='sigap';"
```

Output yang diharapkan: `usesuper = f` dan `usecreatedb = f`, serta `sigap_postgres_prod` tidak memiliki pemetaan port host.

---

## 4. Migrasi Skema, Seed Konten Resmi, & Sinkronisasi Awal

Jalankan migrasi menggunakan peran non-superuser `sigap` (`NOCREATEDB`) lalu isi konten statis/rujukan:

```bash
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

> Jangan pernah menjalankan `prisma/seed-fixture-10k.ts` di produksi. Database demo/produksi hanya berisi data resmi BMKG, konten terkurasi (`Artikel`, `Berita`, `FaqGempa`, `Sumber`), dan preset simulasi (`SkenarioSimulasi`).

Picu sinkronisasi awal BMKG (memakai rahasia dari `.env` berizin `600`):

```bash
SIGAP_ENV_FILE="$(pwd)/.env" SIGAP_APP_URL="http://127.0.0.1:3000" sh ./scripts/cron-sync.sh
```

Verifikasi kesehatan & penutupan rute internal dev (`/design`):

```bash
curl -fsS http://127.0.0.1:3000/api/health
# Harapkan: {"status":"healthy"}

curl -s -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/design
# Harapkan: 404
```

---

## 5. Reverse Proxy HTTPS Opsional (Caddy)

Container `app` di [`docker-compose.prod.yml`](../docker-compose.prod.yml) secara bawaan terikat ke `127.0.0.1:3000`. Jika sudah memiliki domain yang mengarah ke VPS, pasang Caddy di host dan salin contoh [`deploy/Caddyfile.example`](../deploy/Caddyfile.example) ke `/etc/caddy/Caddyfile` lalu muat ulang Caddy:

```bash
sudo cp deploy/Caddyfile.example /etc/caddy/Caddyfile
# Edit domain `sigap.contoh.id` menjadi domain Anda
sudo systemctl reload caddy
```

Jika tidak memakai reverse proxy/domain pada pengujian sementara, atur `APP_PUBLISH_BIND="0.0.0.0:3000"` sebelum menjalankan `docker compose` (tidak disarankan untuk produksi jangka panjang tanpa TLS).
