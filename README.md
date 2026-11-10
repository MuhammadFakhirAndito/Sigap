<div align="center">

# SIGAP
### *Sistem Informasi Gempabumi, Simulasi Dampak Seismik & Asisten Mitigasi Cerdas*

[![Next.js](https://img.shields.io/badge/Next.js-16.4-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![Prisma ORM](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![Redis](https://img.shields.io/badge/Redis-7.0-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://redis.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Google Gemini](https://img.shields.io/badge/AI-Google_Gemini-8E75C2?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)

<p align="center">
  Platform komprehensif tanggap kebencanaan gempabumi yang menggabungkan telemetri data terbuka BMKG, simulasi estimasi dampak kerusakan fisik (<em>client-side</em>), arsitektur basis data berkeandalan tinggi (anti-downtime), serta asisten chatbot AI dengan mekanisme pertahanan berlapis (<em>fallback bertingkat</em>).
</p>

[Fitur Unggulan](#fitur-unggulan) •
[Arsitektur Sistem](#arsitektur-sistem) •
[Model Basis Data](#model-basis-data) •
[Panduan Instalasi](#panduan-instalasi--menjalankan-sistem) •
[Spesifikasi API](#spesifikasi-endpoint-api) •
[Kriteria Uji PRD](#kriteria-pengujian--penerimaan-prd)

</div>

---

## Ringkasan Masalah & Solusi

Layanan informasi kebencanaan publik sering kali menghadapi kendala ketersediaan:
1. **Ketergantungan Tunggal**: Ketika server penyedia telemetri publik (seperti BMKG) mengalami kelebihan beban atau gangguan saat gempa besar terjadi, masyarakat kehilangan akses informasi.
2. **Keterbatasan Pemahaman Numerik**: Informasi teknis seperti "Magnitudo 6.8 di kedalaman 10 km" sulit diterjemahkan masyarakat awam menjadi risiko nyata di lapangan (apakah rumah saya aman? seberapa besar guncangannya? apakah tsunami?).
3. **Keterbatasan Kuota AI**: Integrasi Chatbot LLM rentan mengalami *error 429 (quota exceeded)* atau kegagalan jaringan saat diakses ribuan pengguna secara bersamaan.

### Solusi SIGAP:
* **High-Reliability Caching & DB Fallback**: Data BMKG di-*upsert* ke **PostgreSQL** dan di-cache ke **Redis**. Jika server pusat padam, sistem tetap menyajikan riwayat terakhir secara *graceful* tanpa *crash*.
* **Interactive Physics Engine**: Mesin kalkulasi ilmiah *client-side* untuk mengonversi magnitudo & kedalaman ke skala intensitas MMI (I–XII), radius isoseismal, pelepasan energi TNT, *Golden Time* gelombang P-S, dan komparasi ketahanan struktur SNI 1726.
* **Tiered AI Assistant (Lightweight RAG)**: Chatbot AI yang menyuntikkan data gempa terkini ke *prompt*, diproteksi *rate limiter*, serta didukung *graceful fallback* ke model cadangan dan basis aturan FAQ offline.

---

## Arsitektur Sistem

Berikut adalah topologi arsitektur sistem SIGAP:

```mermaid
flowchart TD
    User["Pengguna (Browser / Mobile)"] -->|"Akses Web / Interaksi"| NextApp["Next.js 16 App Router (SSR & CSR)"]
    
    subgraph CoreBackend ["Lapisan Server & Logika Bisnis"]
        NextApp -->|"Panggilan API"| APIRoutes["Next.js Route Handlers (/api/*)"]
        APIRoutes -->|"Kalkulasi Client/Server"| SimEngine["Physics & Simulation Engine"]
        APIRoutes -->|"Manajemen Chat & Prompt"| ChatModule["Chatbot Manager (Lightweight RAG)"]
        APIRoutes -->|"Sinkronisasi Data"| BmkgSync["BMKG Synchronization Service"]
    end

    subgraph DataLayer ["Lapisan Penyimpanan Persisten & Cache"]
        APIRoutes -->|"ORM Queries (Singleton)"| Prisma["Prisma Client v6"]
        Prisma -->|"Port 5432 (Localhost / Docker)"| Postgres[("PostgreSQL 16 (Tabel Utama)")]
        
        ChatModule -->|"Rate Limit & Quota Tracking"| RedisClient["Redis Service (ioredis)"]
        BmkgSync -->|"Cache Autogempa & Terkini"| RedisClient
        RedisClient -.->|"Port 6379 (Localhost / Docker)"| RedisDB[("Redis 7 (In-Memory Data)")]
        RedisClient -.->|"Fallback Otomatis saat Redis Padam"| MemoryStore["In-Memory Local Fallback"]
    end

    subgraph ExternalServices ["Layanan Eksternal"]
        BmkgSync -->|"HTTP GET (JSON Telemetry)"| BMKGAPI["Portal Data Terbuka BMKG"]
        ChatModule -->|"System Prompt + RAG Data"| GeminiPrimary["Google Gemini 1.5 Flash"]
        ChatModule -.->|"Fallback jika Kuota Habis"| GeminiBackup["Gemini Backup Model"]
        ChatModule -.->|"Offline Fallback"| FaqFallback[("FaqGempa (Database Lokal)")]
    end
```

---

## Fitur Unggulan

### 1. Sinkronisasi Seismik BMKG & Graceful Degradation
* **Idempotensi Sinkronisasi**: Menggunakan mekanisme *upsert* berbasis kunci komposit unik `bmkgKey` (`${DateTime}_${Coordinates}`) untuk menjamin tidak ada duplikasi data.
* **Anti-Downtime Guarantee**: Halaman riwayat tetap menyajikan data tersimpan di PostgreSQL ketika koneksi ke BMKG terputus, dilengkapi label akurat status pembaruan terakhir dari tabel `SyncStatus`.
* **Indeks Kueri Cepat**: Pengindeksan pada kolom `waktuUtc (DESC)` dan `magnitudo` memastikan pencarian 15 baris per halaman selesai dalam < 50 milidetik.

### 2. Simulator Dampak & Risiko Seismik
* **Perhitungan Intensitas Puncak ($I_0$)**:
  Menggunakan model redaman kedalaman Esteva & Rosenblueth:
  $$I_0 = 1.5 \times M - 3.5 \times \log_{10}(h) + 3.0 \quad (\text{dibatasi Skala MMI I–XII})$$
* **Estimasi Pelepasan Energi Seismik ($E$)**:
  Berdasarkan persamaan Gutenberg-Richter:
  $$\log_{10}(E) = 4.8 + 1.5 \times M \quad (\text{Joule})$$
  Dikonversi secara komparatif ke ekuivalen Ton/Megaton TNT.
* **Radius Sebaran Dampak (Isoseismal)**:
  Estimasi jarak radius guncangan destruktif (MMI VI+), terasa nyata (MMI IV–V), dan getaran ringan (MMI II–III).
* **Golden Time Penyelamatan (Gelombang P & S)**:
  Kalkulasi selisih kedatangan Gelombang Primer ($V_p \approx 6.0\text{ km/s}$) dan Gelombang Sekunder geser perusak ($V_s \approx 3.5\text{ km/s}$) berdasarkan jarak hiposentral.
* **Indikator Risiko Tsunami**:
  Evaluasi parameter magnitudo ($M \ge 7.0$), kedalaman dangkal ($h \le 60\text{ km}$), dan episentrum laut.
* **Komparasi Struktur Bangunan**:
  Evaluasi kerentanan rumah non-rekayasa (tanpa tulangan) vs bangunan tahan gempa standar **SNI 1726**.

### 3. Chatbot AI Mitigasi (Lightweight RAG)
* **Injeksi Data Faktual**: Backend otomatis menyisipkan data `autogempa` terbaru dan 3 riwayat gempa terakhir ke dalam *system prompt* LLM agar asisten selalu menjawab pertanyaan gempa terkini secara akurat.
* **Fallback Bertingkat Tiga Lapis**:
  $$\text{Model Utama (Gemini)} \xrightarrow{\text{Quota / 429}} \text{Model Cadangan} \xrightarrow{\text{Offline}} \text{FAQ Berbasis Aturan (DB)}$$
* **Rate Limiter & Quota Tracker**:
  * Maksimal 10 permintaan per menit per IP (dengan hash SHA-256 demi privasi).
  * Pelacak kuota harian (20 req/hari) untuk mencegah terjadinya error 429 di sisi klien.
* **Metrik Evaluasi Akademik**:
  Pencatatan waktu latensi pemrosesan (`responseTimeMs`) dan penilaian kepuasan pengguna (👍 / 👎) via `PATCH /api/chat/feedback` untuk bahan analisis kuantitatif laporan kuliah.

### 4. Observabilitas & Healthcheck Terpadu
* Endpoint `GET /api/health` memeriksa status kesehatan PostgreSQL, Redis, keterjangkauan API BMKG, dan waktu sinkronisasi terakhir dalam satu respons JSON terstruktur.

---

## Model Basis Data

Dikelola secara deklaratif menggunakan **Prisma ORM**:

| Model | Fungsi Utama | Kunci Penting |
| :--- | :--- | :--- |
| `Gempa` | Menyimpan katalog riwayat kejadian gempabumi | `bmkgKey` (Unique), `waktuUtc`, `magnitudo` |
| `Berita` | Menyimpan metadata publikasi kebencanaan | `url` (Unique), `tanggalTerbit` |
| `Artikel` | Konten edukasi kesiapsiagaan per modul kategori | `slug` (Unique), `kategori`, `urutan` |
| `Sumber` | Rujukan daftar pustaka lembaga resmi (BMKG, BNPB, PVMBG) | Many-to-Many ke `Artikel` |
| `FaqGempa` | Basis data pengetahuan untuk *fallback rule-based chatbot* | `kataKunci` (Array), `pertanyaan`, `jawaban` |
| `ChatLog` | Log interaksi, evaluasi waktu respon & feedback kepuasan | `responseTimeMs`, `isHelpful`, `ipHash` |
| `SkenarioSimulasi` | Preset gempa nyata (Megathrust, Sesar Lembang, Palu, dll) | `magnitudo`, `kedalamanKm`, `tipeLokasi` |
| `SyncStatus` | Log metadata riwayat sinkronisasi BMKG | `id = 'bmkg_sync'`, `lastSuccessAt` |

---

## Panduan Instalasi & Menjalankan Sistem

### Prasyarat:
* Node.js versi 20+ (disarankan Node.js v26 LTS / versi terbaru).
* Docker & Docker Compose (untuk menjalankan container PostgreSQL & Redis).

### 1. Kloning Repositori & Instal Dependensi
```bash
git clone https://github.com/MuhammadFakhirAndito/Sigap.git
cd Sigap
npm install
```

### 2. Konfigurasi Lingkungan (`.env`)
Salin file konfigurasi contoh:
```bash
cp .env.example .env
```
Sesuaikan konfigurasi di dalam file `.env`:
```env
# PostgreSQL Database (Docker)
POSTGRES_USER="sigap_user"
POSTGRES_PASSWORD="sigap_password_secure"
POSTGRES_DB="sigap_gempa"
DATABASE_URL="postgresql://sigap_user:sigap_password_secure@localhost:5432/sigap_gempa?schema=public"

# Redis Cache
REDIS_PASSWORD="sigap_redis_password"
REDIS_URL="redis://:sigap_redis_password@localhost:6379"

# Google Gemini API
GEMINI_API_KEY="AIzaSy..."
GEMINI_BACKUP_API_KEY=""

# Keamanan Sinkronisasi & Web
BMKG_SYNC_SECRET="sigap_sync_secret_key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Jalankan Kontainer Docker (PostgreSQL & Redis)
```bash
docker compose up -d
```
> **Catatan Keamanan (PRD Bagian 6)**: Seluruh port database (5432) dan redis (6379) di-bind secara lokal (`127.0.0.1`) sehingga tidak terekspos ke internet publik.

### 4. Migrasi & Seeding Konten
Buat tabel basis data dan isi konten awal (artikel edukasi, sumber rujukan, FAQ, dan skenario preset):
```bash
npx prisma db push
npm run db:seed
```

### 5. Jalankan Aplikasi Web
**Mode Pengembangan (Development):**
```bash
npm run dev
```
Akses di peramban web: [http://localhost:3000](http://localhost:3000)

**Mode Produksi (Production Build):**
```bash
npm run build
npm start
```

---

## Skrip Otomasi & Pemeliharaan Shell (.sh)

SIGAP menyediakan kumpulan skrip shell UNIX di folder `scripts/` untuk otomasi pemeliharaan basis data, penjadwalan cron, dan deployment di lingkungan server/VPS:

| Skrip Shell | Perintah NPM | Fungsi & Kepatuhan PRD |
| :--- | :--- | :--- |
| `scripts/backup.sh` | `npm run db:backup` | **Backup Terjadwal (FR-DB-15)**: Eksekusi `pg_dump` dari container PostgreSQL, kompresi gzip (`.sql.gz`), dan rotasi otomatis berkas backup lebih dari 7 hari. |
| `scripts/restore.sh` | `npm run db:restore` | **Disaster Recovery (TC-DB-07, NFR-DB-05)**: Mengembalikan dump basis data ke PostgreSQL secara aman untuk pengujian pemulihan data. |
| `scripts/sync-cron.sh` | `npm run cron:sync` | **Pemicu Cron BMKG (FR-DB-01)**: Memicu pembaruan telemetri BMKG berkala via cURL dengan autentikasi Bearer token. |
| `scripts/cleanup-logs.sh` | - | **Retensi Metrik Chat (NFR-DB)**: Membersihkan rekaman `ChatLog` yang telah melampaui masa simpan 30 hari. |
| `scripts/deploy.sh` | `npm run deploy` | **Otomasi Deployment VPS (TC-DB-08)**: Memeriksa dependensi, menyalakan Docker Compose, menjalankan migrasi database, dan build aplikasi. |

---

## Spesifikasi Endpoint API

| Method | Endpoint | Deskripsi | Parameter Query / Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/gempa` | Riwayat gempa dari database | `page`, `limit`, `minMag`, `wilayah`, `jenis` |
| `GET` | `/api/gempa/terkini` | Data autogempa BMKG & 5 riwayat terbaru | - |
| `POST` | `/api/sync/bmkg` | Memicu sinkronisasi manual/cron ke BMKG | Header `Authorization: Bearer <SECRET>` |
| `GET` | `/api/simulasi/skenario` | Mengambil skenario gempa historis | - |
| `GET` | `/api/konten` | Mengambil artikel edukasi & berita | - |
| `POST` | `/api/chat` | Chatbot AI (RAG, rate limit, fallback) | Body: `{ "pertanyaan": "string" }` |
| `PATCH` | `/api/chat/feedback` | Mencatat penilaian umpan balik pengguna | Body: `{ "logId": "string", "isHelpful": boolean }` |
| `GET` | `/api/health` | Observabilitas status DB, Redis, & BMKG | - |

---

## Kriteria Pengujian & Penerimaan PRD (v0.2)

| ID Uji | Skenario Pengujian | Hasil yang Diharapkan | Status Implementasi |
| :---: | :--- | :--- | :---: |
| **TC-DB-01** | Sinkronisasi BMKG dua kali berturut-turut | Jumlah baris `Gempa` tidak bertambah untuk data yang sama | Lolos |
| **TC-DB-02** | Simulasi server BMKG padam | Halaman riwayat tetap menyajikan data lokal + stempel waktu sinkronisasi | Lolos |
| **TC-DB-03** | Simulasi PostgreSQL/Redis mati | Halaman utama berdegradasi anggun (tidak crash), `/api/health` mencatat *degraded* | Lolos |
| **TC-DB-04** | Mengirim 11 pesan chat dalam 1 menit | Pesan ke-11 ditolak dengan kode status 429 (*Rate Limit Exceeded*) | Lolos |
| **TC-DB-05** | Memaksa kuota Gemini habis | Otomatis beralih ke model cadangan, lalu ke modul FAQ rule-based | Lolos |
| **TC-DB-06** | Pengecekan port dari luar VPS | Port 5432 & 6379 tidak dapat diakses publik (bind ke 127.0.0.1) | Lolos |
| **TC-DB-07** | Restore backup ke database kosong | Data kembali lengkap via skrip `restore.sh` (NFR-DB-05) | Lolos |
| **TC-DB-08** | Migrasi database di server produksi | Eksekusi `prisma db push` / `prisma migrate deploy` di VPS via `deploy.sh` | Lolos |
| **TC-DB-09** | Pemindaian kredensial di repositori | `DATABASE_URL` dan API key tidak ditemukan (dilindungi `.gitignore`) | Lolos |
| **TC-DB-10** | Jalankan `prisma db seed` dua kali | Jumlah baris tidak bertambah (semua entitas idempoten) | Lolos |
| **TC-DB-11** | BMKG merevisi magnitudo gempa yang sama | Baris lama diperbarui berdasarkan `bmkgKey` waktu UTC murni, tidak ada duplikat | Lolos |
| **TC-DB-12** | Gempa muncul di `autogempa` lalu `terkini` | Satu baris data, kedua flag `isAuto` dan `isTerkini` aktif bersamaan | Lolos |
| **TC-DB-13** | Matikan Postgres, kirim pertanyaan chatbot | Chatbot dijawab dari FAQ statis (`src/data/fallback/faq.ts`) tanpa crash | Lolos |
| **TC-DB-14** | Panggil endpoint sinkronisasi tanpa `SYNC_SECRET` | Permintaan ditolak dengan kode HTTP 401 Unauthorized | Lolos |

---

## Struktur Direktori Proyek

```plaintext
SIGAP/
├── prisma/
│   ├── schema.prisma          # Skema deklaratif PostgreSQL (8 Model + Relasi)
│   └── seed.ts                # Skrip inisialisasi konten edukasi, FAQ, & skenario
├── public/                    # Aset statis & ikon
├── scripts/                   # Skrip otomasi Shell (.sh)
│   ├── backup.sh              # Backup database terjadwal (pg_dump + gzip + retensi)
│   ├── restore.sh             # Pemulihan database disaster recovery
│   ├── deploy.sh              # Otomasi deployment dan update di VPS
│   ├── sync-cron.sh           # Pemicu cron sinkronisasi BMKG periodik
│   └── cleanup-logs.sh        # Retensi dan pembersihan ChatLog berkala
├── src/
│   ├── app/
│   │   ├── api/               # Endpoint API (gempa, chat, health, sync, simulasi)
│   │   ├── edukasi/           # Halaman edukasi kebencanaan & daftar pustaka
│   │   ├── riwayat/           # Halaman arsip & filter riwayat gempabumi
│   │   ├── simulasi/          # Halaman simulator interaktif dampak seismik
│   │   ├── status/            # Dashboard observabilitas & healthcheck sistem
│   │   ├── layout.tsx         # Layout utama Next.js dengan Navbar & Chatbot
│   │   └── page.tsx           # Halaman Beranda (Hero autogempa & ringkasan)
│   ├── components/            # Komponen UI (Navbar, Footer, ChatbotWidget)
│   └── lib/
│       ├── bmkg.ts            # Layanan integrasi & sinkronisasi telemetri BMKG
│       ├── chatbot.ts         # Mesin Chatbot AI (RAG, fallback, rate limiting)
│       ├── prisma.ts          # Singleton Prisma Client
│       ├── redis.ts           # Client Redis dengan in-memory fallback
│       └── simulation.ts      # Mesin fisika seismik & kalkulasi MMI client-side
├── .env.example               # Template variabel lingkungan aman
├── docker-compose.yml         # Konfigurasi container PostgreSQL & Redis
├── package.json               # Dependensi & skrip proyek
└── README.md                  # Dokumentasi teknis sistem
```

---

## Lisensi & Hak Cipta

Proyek ini dikembangkan sebagai karya rekayasa sistem web kebencanaan dan bahan evaluasi akademik. Terbuka di bawah lisensi [MIT License](LICENSE).
