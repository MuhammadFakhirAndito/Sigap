# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack
Next.js (App Router), TypeScript (strict), Tailwind CSS v4 (@theme), PostgreSQL (Prisma ORM singleton), Docker Compose, Caddy (opsional), Redis (opsional, fase 5). MySQL tidak dipakai.

## Users
1. **Masyarakat umum Indonesia** (terutama wilayah rawan bencana): Memerlukan informasi gempa terkini/terbaru yang tepercaya, pemantauan riwayat gempa saat BMKG tidak terjangkau/down, serta panduan edukasi & mitigasi bencana praktis.
2. **Pelajar dan mahasiswa**: Mempelajari karakteristik seismik/gempa bumi serta melakukan simulasi dampak fisik (MMI, energi, waktu rambat gelombang P/S, potensi tsunami) sebagai bahan studi atau laporan kuliah.
*(Perangkat utama: Mobile web diuji wajib 390px, lalu desktop 1440px).*

## Product Purpose
Menyediakan portal informasi gempa bumi Indonesia yang tenang, editorial, dan kredibel tanpa kepanikan. Menyajikan:
- Data `autogempa` real-time langsung dari BMKG (dengan cache revalidate).
- Riwayat gempa persisten di PostgreSQL yang tetap dapat diakses saat BMKG offline.
- Simulasi edukasi dampak gempa interaktif 100% di sisi klien.
- Chatbot kontekstual yang hemat kuota dengan fallback bertingkat (LLM utama → LLM cadangan → FAQ database → FAQ statis lokal).
- Konten edukasi & mitigasi bencana yang tervalidasi ke sumber resmi.
- Bukti terukur untuk laporan kuliah (log sinkronisasi, evaluasi performa, metrik kepuasan).

## Positioning
Portal independen berbasis data terbuka BMKG yang menggabungkan keandalan akses (data tetap tersedia saat BMKG down via sinkronisasi DB), simulasi edukasi interaktif berbasis rumus empiris, dan asisten cerdas kontekstual yang tahan terhadap kuota terbatas. Menegaskan batasan: bukan sistem peringatan dini resmi (BMKG adalah otoritas resmi tunggal).

## Operating Context
- Web application responsif (pengujian ketat pada 390px dan 1440px).
- Berjalan di satu VPS dengan Docker Compose (Next.js, Postgres, Redis opsional, Caddy opsional). Port Postgres/Redis tidak dibuka ke publik (bind 127.0.0.1 atau internal docker).
- Tanpa sistem login/akun pengguna dan tanpa halaman admin (manajemen konten lewat seed idempoten dan Prisma Studio via SSH tunnel).
- Format lokal Indonesia: Bahasa Indonesia, waktu WIB, koordinat LS/BT, desimal koma ("5,2"), energi dalam notasi ilmiah ("2,0 × 10¹⁵ J").
- Menjamin degradasi halus (graceful degradation) saat BMKG, DB, atau Redis tidak terjangkau tanpa error layar penuh.

## Capabilities and Constraints
### Fitur Terkonfirmasi
- **Beranda (`/`)**: Autogempa real-time BMKG (cache revalidate), status data & sinkronisasi, gempa dirasakan terbaru dari DB, slot peta episentrum (placeholder), jalan pintas fitur, blok edukasi singkat.
- **Riwayat (`/riwayat`)**: Pembacaan data dari DB dengan filter (magnitudo, tanggal, wilayah via pg_trgm), paginasi (15 item/halaman), grafik ringkas (SVG/CSS), aksi "Simulasikan".
- **Simulasi (`/simulasi`)**: Hitungan 100% di klien tanpa query DB saat slider/input berubah (magnitudo, kedalaman, koordinat, jarak pengamat) menghasilkan MMI (I–XII), energi Gutenberg-Richter, jarak hiposenter, waktu rambat P/S & golden time, dan indikator tsunami. Skenario gempa bersejarah dimuat dari DB. Tautan meneruskan skenario ke chatbot.
- **Edukasi (`/edukasi`, `/edukasi/[slug]`)**: Artikel edukasi mitigasi per kategori, daftar metadata berita terkurasi, dan daftar pustaka dari relasi `Sumber`.
- **Chatbot (`/chatbot`)**: Tanya-jawab kontekstual dengan injeksi ringkasan gempa terkini ke system prompt, fallback 4 tingkat, rate limit 10 pesan/menit/IP (HMAC hash), kuota harian, feedback 👍/👎 (1 kali per `chatLogId`), retensi ChatLog 30 hari.
- **API & Background**: `GET /api/gempa`, `POST /api/sync` (dilindungi `SYNC_SECRET`), `POST /api/chat/feedback`, `GET /api/health` (publik hanya healthy/degraded; detail hanya dengan secret).

### Batasan dan Aturan Ketat
- `autogempa` diambil langsung dari BMKG dengan cache `revalidate`, tidak melalui DB.
- Upsert gempa menggunakan kunci unik `bmkgKey` (= `DateTime` BMKG). Flag status hanya dinyalakan, tidak pernah ditimpa.
- Semua data gempa memuat atribusi "Sumber: BMKG · diperbarui <waktu>".
- Semua hasil simulasi berlabel permanen: "Estimasi edukasi, bukan data resmi BMKG".
- Tidak pernah mengklaim sebagai peringatan dini resmi.
- Dilarang keras membuat angka, metrik, atau konten karangan (lorem ipsum dilarang).
- Desain flat sesuai DESIGN.md, tanpa drop shadow / gradient dekoratif, tanpa #000/#FFF murni, target sentuh ≥44px, status tidak hanya warna, WCAG AA.

### Hal yang Belum Diputuskan / Perlu Verifikasi
- Pemilihan rumus spesifik atenuasi MMI (kandidat empiris yang valid beserta sitasi).
- Angka parameter preset gempa bersejarah dari sumber resmi (akan ditandai TODO/diverifikasi di Sumber).
- Pola pasti URL `shakemapUrl` BMKG.
- Zona waktu reset dan angka kuota harian Gemini resmi.
- Pustaka visual peta episentrum dan grafik (sementara SVG/CSS tanpa dependensi besar).
- Kepastian domain publik untuk konfigurasi Caddy/HTTPS.

## Brand Commitments
- **Nama**: SIGAP Gempa
- **Nada & Vibe**: Tenang, editorial, tepercaya, edukatif, dan siap siaga (calm, trustworthy, educational). Menghindari kepanikan atau alarm visual.
- **Identitas Visual**: Sesuai token DESIGN.md v1.1. Minimalist/Editorial bento card lembut, canvas abu-abu hangat (#F6F4F1), permukaan berlapis (surface #E8E4DF, surface-raised #FFFDFB), aksen rust-orange (primary #B7410E) khusus magnitudo/MMI/status (bukan untuk CTA/dekorasi), CTA hitam pill (#1A1613), font Plus Jakarta Sans, NotchNavbar.

## Evidence on Hand
- `PRD-DATABASE.md` v1.1 (sumber kebenaran utama arsitektur, ERD, dan kriteria uji TC-DB-01..20).
- `DESIGN.md` (spesifikasi token warna, hierarki radius, tipografi, dan komponen).
- Dokumen per layar: `docs/01-beranda.md` s/d `docs/05-chatbot.md`.
- Dokumentasi open data BMKG (format autogempa, gempa terkini M5+, gempa dirasakan).

## Product Principles
1. **Otoritas & Transparansi**: Data bersumber jelas dari BMKG dengan kesegaran waktu terpampang; batasan simulasi dan chatbot diakui secara terbuka tanpa manipulasi klaim.
2. **Keandalan Berlapis (Graceful Degradation)**: Kegagalan salah satu komponen sistem (BMKG, PostgreSQL, atau API LLM) tidak boleh meruntuhkan antarmuka pengguna; fallback yang jujur dan fungsional selalu disajikan.
3. **Ketenangan Editorial**: Antarmuka dirancang untuk memberi kejelasan informasi dalam situasi darurat tanpa menimbulkan kepanikan atau sensasi visual yang tidak perlu.
4. **Integritas Data Tanpa Fabrikasi**: Seluruh angka, parameter, dan referensi berakar dari data aktual BMKG atau literatur ilmiah/resmi yang tercatat di tabel `Sumber`.

## Accessibility & Inclusion
- Standar kepatuhan WCAG 2.2 AA (kontras teks reguler ≥4.5:1, teks besar & kontrol interaktif ≥3:1).
- Target sentuh (touch target) minimum 44×44px di seluruh kontrol interaktif dan tombol aksi.
- Navigasi keyboard penuh dengan focus ring 2px `primary-strong` (offset 2px).
- Penghormatan terhadap `prefers-reduced-motion: reduce` (animasi bar/transisi dimatikan atau disederhanakan).
- Dukungan pembaca layar: `role="log"` dan `aria-live="polite"` pada chatbot dan pembaruan hasil simulasi, `aria-valuetext` pada slider simulasi, serta tabel ringkas/teks alternatif untuk visualisasi grafik.
- Atribut dokumen `lang="id"`, dengan penanggalan WIB dan format angka Indonesia.

