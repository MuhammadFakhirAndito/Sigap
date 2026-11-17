# Panduan Deploy Gratis: Vercel + Neon PostgreSQL

Panduan ini menyiapkan **SIGAP** secara gratis (tanpa kartu kredit) menggunakan **Vercel Hobby** untuk aplikasi Next.js dan **Neon Free Tier** untuk database PostgreSQL.

---

## 1. Siapkan Database di Neon

1. Daftar / masuk ke [neon.tech](https://neon.tech) lalu buat project baru (pilih region terdekat, misalnya **AWS Asia Pacific (Singapore) `ap-southeast-1`**).
2. Buka **SQL Editor** di dashboard Neon dan aktifkan ekstensi pencarian wilayah (`pg_trgm`):
   ```sql
   CREATE EXTENSION IF NOT EXISTS pg_trgm;
   ```
3. Ambil dua URL koneksi dari tombol **Connect** di dashboard Neon:
   - **Direct connection** (tanpa `-pooler`) — dipakai **sementara di laptop** untuk menjalankan migrasi skema Prisma (`migrate deploy`) dan `seed`.
   - **Pooled connection** (ada `-pooler` di hostname, berakhiran `?sslmode=require`) — dipakai untuk `DATABASE_URL` di **Vercel Environment Variables**.

---

## 2. Migrasi Skema & Seed Data Awal ke Neon

Jalankan dari folder proyek ini di laptop Anda menggunakan **Direct connection string** Neon (jangan ubah berkas `.env` lokal permanen; cukup lewat variabel sesi sementara):

PowerShell (Windows):
```powershell
$env:DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST-DIRECT>.aws.neon.tech/<DB>?sslmode=require"
npx prisma migrate deploy
npx prisma db seed
Remove-Item Env:DATABASE_URL
```

Bash / Linux / macOS:
```bash
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST-DIRECT>.aws.neon.tech/<DB>?sslmode=require" npx prisma migrate deploy
DATABASE_URL="postgresql://<USER>:<PASSWORD>@<HOST-DIRECT>.aws.neon.tech/<DB>?sslmode=require" npx prisma db seed
```

---

## 3. Generate Secret Produksi & Deploy di Vercel

Buat 2 kunci acak baru (jangan pakai nilai dev/`sigap_password`, karena validator `src/lib/env.ts` akan menolak start di produksi):

```bash
node -e "const c=require('crypto'); console.log('SYNC_SECRET=' + c.randomBytes(32).toString('hex')); console.log('LOG_HMAC_SECRET=' + c.randomBytes(32).toString('hex'));"
```

1. Buka [vercel.com](https://vercel.com), pilih **Add New... -> Project**, lalu impor repositori GitHub **`Sigap`**.
2. Framework Preset: **Next.js** (`package.json` sudah menyiapkan skrip `vercel-build` agar otomatis menjalankan `prisma generate && next build`).
3. Tambahkan **Environment Variables** berikut di Vercel (centang Production & Preview):

| Nama | Nilai |
| --- | --- |
| `DATABASE_URL` | **Pooled connection string** dari Neon (`...-pooler...sslmode=require`) |
| `SYNC_SECRET` | Nilai hex 64 karakter acak hasil perintah di atas |
| `LOG_HMAC_SECRET` | Nilai hex 64 karakter acak berbeda hasil perintah di atas |
| `GEMINI_API_KEY` | API key Google AI Studio yang aktif |
| `NEXT_PUBLIC_APP_URL` | URL Vercel Anda, misalnya `https://sigap-xxx.vercel.app` |
| `TRUST_PROXY` | `true` |
| `GEMINI_PRIMARY_MODEL` | `gemini-3.5-flash-lite` |
| `GEMINI_FALLBACK_MODEL` | `gemini-4-hydrogen` |
| `GEMINI_QUOTA_RESET_TIMEZONE` | `America/Los_Angeles` |

4. Klik **Deploy** dan tunggu hingga selesai.

---

## 4. Sinkronisasi Awal & Jadwal Cron Gratis (`cron-job.org`)

Setelah URL Vercel aktif (misalnya `https://sigap-xxx.vercel.app`):

1. Picu sinkronisasi BMKG pertama kali dari terminal:
   ```powershell
   curl.exe -X POST "https://sigap-xxx.vercel.app/api/sync" -H "x-sync-secret: <SYNC_SECRET>"
   ```
2. Verifikasi endpoint kesehatan publik:
   ```powershell
   curl.exe "https://sigap-xxx.vercel.app/api/health"
   # Harapan: {"status":"healthy"}
   ```
3. Pasang scheduler gratis di [cron-job.org](https://cron-job.org) (karena Vercel Hobby membatasi cron bawaan hanya 1x sehari dan memakai `GET`):
   - **Job 1 — Sync BMKG (setiap 10 atau 15 menit):**
     - URL: `https://sigap-xxx.vercel.app/api/sync`
     - Method: `POST`
     - Header: `x-sync-secret: <SYNC_SECRET>`
   - **Job 2 — Cleanup ChatLog > 30 hari (1x sehari, mis. 03:15 WIB):**
     - URL: `https://sigap-xxx.vercel.app/api/chat/cleanup`
     - Method: `POST`
     - Header: `x-sync-secret: <SYNC_SECRET>`
