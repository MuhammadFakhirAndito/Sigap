# SIGAP Gempa
**Sistem Informasi Gempabumi, Simulasi Dampak Seismik & Mitigasi Cerdas**

SIGAP Gempa adalah platform web komprehensif untuk pemantauan data gempabumi real-time BMKG, simulasi estimasi dampak kerusakan gempa berbasis sains seismologi (*client-side*), serta asisten chatbot mitigasi cerdas bertenaga AI dengan mekanisme *multi-tier fallback*.

Dirancang dengan lapisan data persisten berkeandalan tinggi menggunakan **PostgreSQL (Prisma ORM)** dan **Redis** yang diisolasi dalam container **Docker**.

---

## 🏗️ Arsitektur & Teknologi

* **Frontend & Backend**: Next.js 16 (App Router, TypeScript) + Tailwind CSS + Lucide Icons.
* **Basis Data**: PostgreSQL 16 (melalui Prisma ORM) sebagai penyimpan riwayat gempa, artikel edukasi, berita rujukan, FAQ rule-based, dan log percakapan.
* **Penyimpan Sementara (Cache & Limiter)**: Redis 7 untuk pembatas laju percakapan (*rate limit* IP), kuota harian model Gemini, dan caching respons. Dilengkapi **Graceful Degradation In-Memory** jika Redis offline.
* **AI & NLP**: Google Gemini API terintegrasi *Lightweight RAG* (injeksi data faktual gempa terbaru BMKG ke *system prompt*).
* **Infrastruktur**: `docker-compose.yml` terisolasi (port database dan redis dibind ke `127.0.0.1` demi keamanan).

---

## 📋 Fitur Utama

### 1. Sinkronisasi Data BMKG & Ketahanan Data
* Mengambil data gempa M5.0+, gempa dirasakan, dan autogempa dari BMKG secara otomatis.
* Mencegah duplikasi data menggunakan mekanisme **Upsert** dengan kunci unik `bmkgKey` (`${DateTime}_${Coordinates}`).
* **Graceful Fallback**: Jika server BMKG mengalami gangguan/padam, sistem tetap menyajikan riwayat terakhir dari database lokal lengkap dengan keterangan waktu sinkronisasi sukses terakhir.

### 2. Simulator Dampak Gempa Interaktif
* Pengguna dapat mengatur parameter magnitudo (3.0 – 9.5), kedalaman hiposentrum (5 – 300 km), koordinat, serta tipe lokasi (darat/laut), atau memilih skenario preset gempa nyata (Megathrust Selat Sunda, Sesar Lembang, Palu 2018, Yogyakarta 2006).
* Perhitungan otomatis *client-side*:
  * **Intensitas Episentrum (Skala MMI I–XII)** dengan rumus redaman kedalaman Esteva & Rosenblueth.
  * **Pelepasan Energi Seismik** berdasarkan formula Gutenberg-Richter (dikonversi ke ekuivalen Ton/Megaton TNT).
  * **Radius Isoseismal** sebaran kerusakan berat (MMI VI+), guncangan nyata (MMI IV-V), dan getaran lemah.
  * **Golden Time (Waktu Emas Penyelamatan)**: Selisih waktu rambat Gelombang Primer ($V_p \approx 6.0$ km/s) dan Gelombang Sekunder perusak ($V_s \approx 3.5$ km/s).
  * **Indikator Risiko Tsunami**: Matriks kombinasi magnitudo, kedalaman dangkal, dan lokasi dasar laut.
  * **Analisis Komparasi Struktur Bangunan**: Perbandingan respons kerusakan bangunan non-rekayasa vs bangunan tahan gempa (SNI 1726).

### 3. Chatbot AI Mitigasi dengan Fallback Bertingkat
* **Lightweight RAG**: Sistem otomatis menyuntikkan ringkasan gempa terkini dan riwayat gempa terakhir ke *system prompt*.
* **Fallback Bertingkat**: Model Gemini Utama $\rightarrow$ Model Gemini Cadangan $\rightarrow$ FAQ Rule-Based (`FaqGempa` dari DB) saat kuota habis atau error 429.
* **Metrik Evaluasi Kuliah**: Setiap respons dicatat di `ChatLog` beserta waktu pemrosesan (`responseTimeMs`), model penjawab, dan tombol feedback kepuasan pengguna (👍 / 👎).
* **Rate Limiter**: Dibatasi maksimal 10 pesan per menit per IP (dengan hash SHA-256 demi privasi).

### 4. Observabilitas Sistem & Healthcheck
* Endpoint `GET /api/health` memantau konektivitas database PostgreSQL, Redis, keterjangkauan API BMKG, serta status sinkronisasi terakhir secara terpadu.

---

## 🚀 Panduan Instalasi & Menjalankan Proyek

### 1. Salin Pengaturan Lingkungan
Salin file konfigurasi `.env.example` menjadi `.env`:
```bash
cp .env.example .env
```

Isi `GEMINI_API_KEY` pada file `.env` jika ingin mengaktifkan model AI Google Gemini (opsional, chatbot otomatis beralih ke FAQ rule-based jika API key kosong).

### 2. Jalankan PostgreSQL & Redis via Docker
Pastikan Docker terpasang di komputer/VPS Anda, lalu jalankan:
```bash
docker compose up -d
```
> *Catatan Keamanan*: Port 5432 dan 6379 hanya di-bind ke `127.0.0.1` sehingga tidak terekspos ke internet publik.

### 3. Jalankan Migrasi & Seeding Basis Data
Jalankan migrasi skema dan inisialisasi data bawaan (artikel edukasi, FAQ gempa, berita rujukan, preset skenario):
```bash
npx prisma db push
npm run db:seed
```

### 4. Jalankan Aplikasi Next.js
Mode Pengembangan:
```bash
npm run dev
```
Buka browser pada tautan [http://localhost:3000](http://localhost:3000).

Mode Produksi:
```bash
npm run build
npm start
```

---

## 📡 Daftar Endpoint API

| Method | Endpoint | Keterangan |
| :--- | :--- | :--- |
| `GET` | `/api/gempa` | Riwayat gempa dengan filter magnitudo, wilayah, jenis, dan paginasi |
| `GET` | `/api/gempa/terkini` | Data autogempa terkini dan 5 gempa terbaru |
| `POST` | `/api/sync/bmkg` | Memicu sinkronisasi data dari BMKG ke PostgreSQL (dapat dipanggil cron) |
| `GET` | `/api/simulasi/skenario` | Mengambil preset skenario gempa bersejarah |
| `GET` | `/api/konten` | Konten artikel edukasi, sumber rujukan, dan berita |
| `POST` | `/api/chat` | Chatbot AI mitigasi (RAG, fallback bertingkat, rate limit) |
| `PATCH` | `/api/chat/feedback` | Mencatat penilaian kepuasan respons chatbot (👍 / 👎) |
| `GET` | `/api/health` | Healthcheck terpadu status DB, Redis, dan BMKG |

---

## 🧪 Validasi Pengujian Kebutuhan (Test Cases)

* **TC-DB-01 (Idempotensi Sinkronisasi)**: Sinkronisasi ganda tidak menghasilkan baris duplikat berkat kunci unik `bmkgKey`.
* **TC-DB-02 (BMKG Padam)**: Halaman riwayat tetap menyajikan data tersimpan di DB dengan penanda waktu sinkronisasi terakhir.
* **TC-DB-03 (Graceful Degradation)**: Halaman utama tetap beroperasi normal dan `/api/health` melaporkan status `degraded` jika DB/Redis mati.
* **TC-DB-04 (Rate Limit)**: Permintaan pesan ke-11 dalam 1 menit dari IP yang sama otomatis ditolak dengan kode status 429.
* **TC-DB-05 (Fallback Bertingkat)**: Jika model utama error 429 atau kuota habis, chatbot beralih ke model cadangan, lalu ke modul FAQ.
* **TC-DB-10 (Kalkulasi Simulasi)**: Perubahan slider magnitudo & kedalaman memperbarui skala MMI, radius, dan indikator tsunami secara instan di sisi klien.
* **TC-DB-11 (Aksi Simulasikan)**: Tombol "Simulasikan" pada baris tabel riwayat gempa otomatis mengisi parameter pada halaman simulator.
* **TC-DB-12 (Evaluasi Chatbot)**: Tombol feedback 👍 / 👎 memperbarui kolom `isHelpful` pada tabel `ChatLog`.
