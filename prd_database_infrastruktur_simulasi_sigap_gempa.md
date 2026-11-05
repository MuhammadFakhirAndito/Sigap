# PRD Tambahan: Database, Infrastruktur & Simulasi — SIGAP Gempa

Versi 0.3 · 2026-11-05 · Pelengkap `PRD.md` (bagian 1–13). Dokumen ini menggantikan asumsi lama "database belum wajib" serta menambahkan konsep fungsional fitur Simulasi Gempa dan penguatan teknis untuk bahan evaluasi laporan kuliah.

## 1. Ringkasan

SIGAP Gempa menambahkan lapisan data persisten: **PostgreSQL** (via **Prisma ORM**) sebagai database utama, dan **Redis** sebagai penyimpan data sementara. Keduanya berjalan di VPS milik sendiri menggunakan **Docker**. MySQL, yang juga tersedia di VPS, **tidak dipakai** di project ini.

### 1.1 Tujuan

1. Menyimpan **riwayat gempa** dari BMKG agar tetap bisa ditampilkan saat BMKG tidak dapat diakses, dan bisa difilter serta dibuat grafik.

2. Mengelola **konten** (berita, edukasi, sumber/daftar pustaka, FAQ chatbot) tanpa deploy ulang.

3. Membuat **chatbot hemat kuota & kontekstual**: rate limit tahan restart, penghitung kuota harian, fallback bertingkat, serta injeksi konteks data gempa terbaru ke prompt AI.

4. Menjadi bahan **laporan kuliah** yang terukur (arsitektur, ERD, observabilitas sistem, serta metrik evaluasi waktu respons dan kepuasan pengguna chatbot).

5. Menyediakan **fitur simulasi gempa interaktif** sebagai sarana edukasi dampak guncangan (skala MMI, radius dampak, potensi tsunami, dan ketahanan struktur) berdasarkan parameter kustom maupun data riwayat gempa nyata.

### 1.2 Bukan tujuan

* Login/akun pengguna dan peran admin (kecuali diputuskan lain, lihat bagian 11).

* Data realtime lewat database: `autogempa` tetap diambil langsung dari BMKG dengan cache.

* Memakai MySQL.

## 2. Keputusan teknologi

| Komponen | Keputusan | Alasan singkat | 
| ----- | ----- | ----- | 
| Database utama | PostgreSQL | Tipe data kaya (timestamp, array, JSON), cocok untuk riwayat dan konten | 
| ORM | Prisma | Skema deklaratif, migrasi, tipe TypeScript otomatis | 
| Cache/pembatas | Redis (opsional, fase 4) | `INCR` + `EXPIRE` untuk rate limit; TTL untuk cache dan kuota | 
| Kontainer | Docker + Docker Compose | Lingkungan dev dan produksi sama, mudah dipindah | 
| MySQL | Tidak dipakai | Tumpang tindih dengan Postgres | 

## 3. Kebutuhan fungsional

| ID | Kebutuhan | Prioritas | 
| ----- | ----- | ----- | 
| FR-DB-01 | Sistem menyimpan data gempa dari BMKG ke tabel `Gempa` dengan **upsert**; kunci unik = `DateTime` + `Coordinates`. | Wajib | 
| FR-DB-02 | Halaman riwayat gempa membaca dari database (filter magnitudo, rentang tanggal, wilayah) dengan paginasi. | Wajib | 
| FR-DB-03 | Jika BMKG gagal diakses, halaman menampilkan data terakhir dari database dengan keterangan akurat "data terakhir diperbarui `<waktu>`" berdasarkan log sinkronisasi terakhir yang berhasil. | Wajib | 
| FR-DB-04 | Pembaruan data BMKG berjalan terjadwal atau saat diakses (strategi dipilih di bagian 11); tidak membuat duplikat dan mencatat status waktu sinkronisasi terakhir. | Wajib | 
| FR-DB-05 | Berita disimpan di tabel `Berita` (judul, sumber, tanggal, URL, ringkasan singkat). Hanya metadata, bukan isi penuh artikel. | Wajib | 
| FR-DB-06 | Konten edukasi (pengertian, proses, penanggulangan, mitigasi) disimpan di `Artikel` per kategori dan slug. | Wajib | 
| FR-DB-07 | Setiap `Artikel` dapat terhubung ke satu atau lebih `Sumber`; daftar pustaka dihasilkan dari tabel ini. | Wajib | 
| FR-DB-08 | Fallback chatbot membaca `FaqGempa` (kata kunci → jawaban) dari database. | Wajib | 
| FR-DB-09 | Setiap percakapan chatbot dicatat di `ChatLog` (pertanyaan, jawaban, sumber `LLM`/`FALLBACK`, model, durasi waktu respons `responseTimeMs`, umpan balik pengguna `isHelpful`, waktu). IP tidak disimpan mentah. | Disarankan | 
| FR-DB-10 | Rate limit chatbot per IP memakai Redis (`INCR` + `EXPIRE`). Tanpa Redis, kembali ke in-memory. | Disarankan | 
| FR-DB-11 | Penghitung kuota Gemini harian per model; jika kuota habis, langsung ke model cadangan lalu FAQ tanpa menunggu error 429. | Disarankan | 
| FR-DB-12 | Fallback bertingkat chatbot: model utama → model cadangan → FAQ rule-based, dengan pesan jelas ke pengguna. | Wajib | 
| FR-DB-13 | Cache respons chatbot untuk pertanyaan identik (opsional). | Opsional | 
| FR-DB-14 | Seed awal: FAQ, artikel edukasi, sumber, berita contoh, dan preset skenario simulasi lewat skrip `prisma db seed`. | Wajib | 
| FR-DB-15 | Backup database terjadwal (`pg_dump`) dengan retensi terbatas. | Wajib | 
| FR-DB-16 | Sistem menyediakan fitur **Simulasi Gempa** di mana pengguna dapat mengatur parameter masukan (magnitudo, kedalaman, dan titik koordinat episentrum) atau memilih skenario preset gempa bersejarah dari database. | Disarankan | 
| FR-DB-17 | Sistem menghitung dan menampilkan estimasi dampak secara *client-side* meliputi: konversi skala intensitas (MMI I–XII), perkiraan energi yang dilepaskan, radius guncangan terhadap wilayah sekitar, waktu rambat gelombang P & S (*Golden Time*), serta indikator potensi tsunami. | Disarankan | 
| FR-DB-18 | Sistem menampilkan perbandingan respons dampak antara struktur bangunan standar (tanpa perkuatan) dan bangunan tahan gempa, serta menyediakan rekomendasi tindakan keselamatan yang terhubung dengan konten edukasi. | Opsional | 
| FR-DB-19 | Halaman riwayat gempa (`Gempa`) memiliki aksi untuk memuat data baris gempa tertentu langsung ke dalam parameter halaman Simulasi, serta opsi meneruskan konteks skenario simulasi ke Chatbot untuk penjelasan mitigasi lebih lanjut. | Opsional | 
| FR-DB-20 | **Injeksi Konteks Gempa Terkini ke Chatbot (Lightweight RAG):** Saat memanggil LLM, backend otomatis menyisipkan ringkasan data `autogempa` terbaru dan 3 riwayat gempa terakhir dari database ke dalam *system prompt* agar chatbot dapat menjawab pertanyaan seputar kejadian gempa terkini secara faktual. | Disarankan | 
| FR-DB-21 | **Umpan Balik Evaluasi Chatbot:** Pengguna dapat memberikan penilaian sederhana (👍 / 👎) pada jawaban chatbot yang akan memperbarui kolom `isHelpful` di `ChatLog` sebagai data kuantitatif evaluasi chatbot pada laporan kuliah. | Disarankan | 
| FR-DB-22 | **Endpoint Healthcheck Terpadu (`GET /api/health`):** Menyediakan status kesehatan komponen sistem (PostgreSQL, Redis, keterjangkauan API BMKG, dan waktu sinkronisasi terakhir) untuk mempermudah pemantauan serta pengujian skenario degradasi. | Disarankan | 

## 4. Model data (rancangan, diterjemahkan sendiri ke `schema.prisma`)

### 4.1 Gempa

| Kolom | Tipe | Catatan | 
| ----- | ----- | ----- | 
| id | String (cuid) | PK | 
| bmkgKey | String | **Unik**: `${DateTime}_${Coordinates}` | 
| waktuUtc | DateTime | Dari `DateTime` BMKG (UTC) | 
| lat, lon | Float | Pisahkan dari string `Coordinates` ("lat,lon") | 
| magnitudo | Float | BMKG mengirim string | 
| kedalamanKm | Float | Buang " km" | 
| wilayah | String |  | 
| potensiTeks | String | Teks asli | 
| statusTsunami | Enum | `AMAN`, `BERPOTENSI`, `TIDAK_DINYATAKAN` | 
| dirasakan | String? | Hanya ada di sebagian data | 
| shakemapUrl | String? | Pola URL perlu diverifikasi | 
| jenis | Enum | `TERKINI` (M5+), `DIRASAKAN`, `AUTO` | 
| createdAt | DateTime |  | 
| Index: `waktuUtc` (desc), `magnitudo`. |  |  | 

### 4.2 Berita

`id`, `judul`, `sumber`, `url` (unik), `tanggalTerbit`, `ringkasan?`, `createdAt`.

### 4.3 Artikel

`id`, `slug` (unik), `judul`, `kategori` (enum: `PENGERTIAN`, `PROSES`, `PENANGGULANGAN`, `MITIGASI`, `LAINNYA`), `isi` (teks/markdown), `urutan`, `updatedAt`.

### 4.4 Sumber

`id`, `judul`, `penerbit` (BMKG/BNPB/PVMBG/lainnya), `url`, `tanggalAkses`; relasi many-to-many ke `Artikel`.

### 4.5 FaqGempa

`id`, `kataKunci` (String\[\]), `pertanyaan`, `jawaban`, `aktif` (Boolean).

### 4.6 ChatLog

| Kolom | Tipe | Catatan | 
| ----- | ----- | ----- | 
| id | String (cuid) | PK | 
| pertanyaan | String | Input pengguna | 
| jawaban | String | Respons yang diberikan | 
| source | Enum | `LLM`, `FALLBACK`, `CACHE` | 
| model | String? | Nama model Gemini yang menjawab (null jika `FALLBACK`) | 
| responseTimeMs | Int? | Waktu pemrosesan respons dalam milidetik (untuk analisis performa di laporan) | 
| isHelpful | Boolean? | Penilaian kepuasan pengguna (👍 = `true`, 👎 = `false`, belum dinilai = `null`) | 
| ipHash | String? | Hash satu arah dari IP (bukan IP mentah) | 
| createdAt | DateTime | Waktu percakapan | 

Pertimbangkan batas retensi (misalnya hapus setelah 30–60 hari selesai evaluasi laporan) karena pertanyaan pengguna bisa memuat data pribadi.

### 4.7 SkenarioSimulasi (Opsional)

`id`, `nama`, `magnitudo` (Float), `kedalamanKm` (Float), `lat` (Float), `lon` (Float), `tipeLokasi` (enum `DARAT`, `LAUT`), `deskripsiSingkat?`, `urutan` (Int).

### 4.8 SyncStatus (Metadata Sinkronisasi BMKG)

`id` (String, misal `"bmkg_sync"`), `lastSuccessAt` (DateTime?), `lastAttemptAt` (DateTime), `lastStatus` (enum `SUCCESS`, `FAILED`), `errorMessage?` (String), `updatedAt` (DateTime).
Digunakan untuk mencatat kapan terakhir kali sistem berhasil menarik data dari BMKG secara akurat untuk kebutuhan `FR-DB-03`.

## 5. Desain Redis (opsional)

| Key | Isi | TTL | 
| ----- | ----- | ----- | 
| `rl:chat:{ipHash}` | Counter permintaan | 60 detik | 
| `quota:gemini:{model}:{tanggal}` | Counter pemakaian harian | Sampai pergantian hari (verifikasi zona waktu reset kuota Google; umumnya tengah malam Pacific) | 
| `bmkg:autogempa` | JSON terakhir | 60 detik | 
| `bmkg:terkini` | JSON terakhir | 300 detik | 
| `bmkg:last_sync_at` | Timestamp ISO sinkronisasi BMKG terakhir yang sukses | Tanpa TTL / diperbarui tiap sinkronisasi | 
| `chat:cache:{hashPertanyaan}` | Jawaban | 1 jam | 

Redis hanya untuk data yang boleh hilang. Data permanen ada di PostgreSQL.

## 6. Infrastruktur & keamanan

1. **Docker Compose**: service `postgres` (image resmi) dengan **volume bernama**, `healthcheck`, dan env `POSTGRES_USER/PASSWORD/DB`. `redis` bila dipakai, dengan `requirepass`.

2. **Jaringan**: Postgres dan Redis **tidak dibuka ke publik**. Bind ke `127.0.0.1` atau gunakan jaringan Docker internal. Akses dari lokal lewat **SSH tunnel**.

3. **Firewall** (`ufw`): hanya 22, 80, 443.

4. **User dan database khusus** `sigap` dengan hak terbatas; jangan pakai superuser `postgres` untuk aplikasi.

5. **Rahasia**: `DATABASE_URL`, `REDIS_URL` di `.env` (tidak di-commit); password di-URL-encode bila ada karakter khusus.

6. **Backup**: `pg_dump` terjadwal (cron), disimpan di luar container, uji restore minimal sekali.

7. **Migrasi**: `prisma migrate dev` di lokal, `prisma migrate deploy` di VPS.

## 7. Kebutuhan non-fungsional

| ID | Kebutuhan | 
| ----- | ----- | 
| NFR-DB-01 | Kueri riwayat gempa (15 baris/halaman) kurang dari 300 ms pada data uji 10.000 baris. | 
| NFR-DB-02 | Aplikasi tetap menampilkan halaman utama walau database/Redis mati (degradasi anggun, bukan error layar penuh). | 
| NFR-DB-03 | Tidak ada kredensial di repositori atau di bundel klien. | 
| NFR-DB-04 | Prisma Client memakai satu instance (singleton) agar hot reload tidak membocorkan koneksi. | 
| NFR-DB-05 | Backup dapat dipulihkan (dibuktikan dengan satu kali uji restore). | 

## 8. Dampak ke `PRD.md` utama

* Bagian arsitektur: tambahkan PostgreSQL dan Redis; sumber konten statis dipindah dari `src/data/` ke database (seed).

* Bagian fitur utama: tambahkan modul **Simulasi Dampak Gempa** yang terhubung dengan riwayat `Gempa` dan Chatbot.

* Bagian chatbot: rate limit in-memory menjadi Redis (bila dipakai); tambahkan fallback bertingkat, penghitung kuota, **injeksi konteks gempa terbaru ke prompt**, serta **umpan balik evaluasi (`isHelpful` & `responseTimeMs`)**.

* Bagian pertanyaan terbuka: "perlu database/login?" terjawab: **database ya, login belum**.

* Bagian API: tambahkan `GET /api/gempa` (riwayat dari DB), `PATCH /api/chat/feedback` (penilaian jawaban chatbot), dan `GET /api/health` (pemantauan status DB, Redis, dan sinkronisasi BMKG).

## 9. Kriteria penerimaan / uji

| ID | Skenario | Hasil yang diharapkan | 
| ----- | ----- | ----- | 
| TC-DB-01 | Jalankan sinkronisasi BMKG dua kali berturut-turut | Jumlah baris `Gempa` tidak bertambah untuk data yang sama, dan `lastSuccessAt` pada `SyncStatus` diperbarui | 
| TC-DB-02 | Matikan akses ke BMKG, buka halaman riwayat | Data terakhir tampil + keterangan waktu sinkronisasi sukses terakhir dari `SyncStatus`/Redis | 
| TC-DB-03 | Matikan container Postgres, buka beranda dan cek `/api/health` | Beranda tetap tampil (degradasi, tidak crash) dan `/api/health` melaporkan status `degraded` pada komponen database | 
| TC-DB-04 | Kirim 11 pesan chatbot dalam 1 menit dari IP yang sama | Pesan ke-11 ditolak dengan pesan rate limit | 
| TC-DB-05 | Paksa error 429 dari model utama | Beralih ke model cadangan, lalu ke FAQ, dengan pesan jelas | 
| TC-DB-06 | Cek port 5432 dan 6379 dari luar VPS | Tidak terjangkau | 
| TC-DB-07 | Restore backup ke database kosong | Data kembali lengkap | 
| TC-DB-08 | `prisma migrate deploy` di VPS | Berhasil tanpa mengubah data yang ada | 
| TC-DB-09 | Cari `DATABASE_URL` di repositori dan bundel klien | Tidak ditemukan | 
| TC-DB-10 | Ubah parameter magnitudo dan kedalaman pada halaman simulasi | Kalkulasi skala MMI, radius dampak, dan status potensi tsunami berubah secara dinamis sesuai rumus redaman kedalaman | 
| TC-DB-11 | Klik aksi "Simulasikan" pada salah satu baris di halaman Riwayat Gempa | Halaman simulasi terbuka dengan parameter magnitudo, kedalaman, dan koordinat sesuai baris data `Gempa` tersebut | 
| TC-DB-12 | Tanya ke chatbot tentang "Gempa terbaru hari ini terjadi di mana?" lalu beri penilaian 👍 | Chatbot menjawab sesuai data `autogempa`/DB terbaru, dan baris terkait di `ChatLog` mencatat `responseTimeMs` serta `isHelpful = true` | 

## 10. Risiko

| Risiko | Dampak | Mitigasi | 
| ----- | ----- | ----- | 
| Kuota Gemini 20 permintaan/hari/model | Chatbot sering jatuh ke FAQ | Fallback bertingkat, penghitung kuota, FAQ berkualitas | 
| Port database terbuka | Data bocor/disusupi | Bind lokal, firewall, SSH tunnel, password kuat | 
| Perubahan format BMKG | Sinkronisasi gagal | Normalisasi defensif, simpan `potensiTeks` asli, log error di `SyncStatus` | 
| VPS mati saat demo | Aplikasi tidak bisa diakses | Siapkan data demo/rekaman layar, uji sehari sebelumnya | 
| Versi Prisma berubah | Konfigurasi tidak cocok | Ikuti dokumentasi resmi versi yang terpasang | 

## 11. Pertanyaan terbuka

1. Pembaruan data BMKG: **terjadwal** (cron di VPS memanggil endpoint) atau **saat halaman diakses** (lazy refresh)?

2. Apakah perlu halaman **admin** untuk mengelola konten? Jika tidak, konten diubah lewat seed/Prisma Studio.

3. Next.js ikut di-Docker di VPS atau di-deploy di tempat lain (misalnya Vercel) dan hanya terhubung ke DB VPS? Jika Vercel, database harus terjangkau dari internet dengan aman.

4. Berapa lama `ChatLog` disimpan, dan apakah dosen/laporan butuh data evaluasi chatbot?

5. Zona waktu reset kuota harian Gemini (perlu dicek di dokumentasi resmi).

6. Perlu domain dan HTTPS (reverse proxy seperti Nginx/Caddy) untuk demo?