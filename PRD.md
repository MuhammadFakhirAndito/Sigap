# PRD: SIGAP Gempa (Ringkasan Produk)

Versi 0.1 · 2026-11-11 · Dibuat dari PRD-DATABASE.md v1.1 dan percakapan perancangan.
Dokumen ini BUKAN PRD asli (PRD utama tidak ditemukan). Butir bertanda **[ASUMSI]**
belum dikonfirmasi pemilik proyek; agent harus menanyakannya sebelum membangun apa
pun yang bergantung padanya. Detail data, infrastruktur, dan uji ada di PRD-DATABASE.md
(v1.1), yang menang bila bertentangan dengan dokumen ini.

## 1. Ringkasan
SIGAP Gempa adalah website informasi gempa bumi Indonesia. Menampilkan gempa terbaru
dan riwayatnya dari BMKG, simulasi dampak gempa (edukasi), chatbot tanya-jawab, serta
konten edukasi mitigasi, supaya masyarakat paham cara menghadapi gempa. Proyek juga
menjadi bahan laporan kuliah.

## 2. Pengguna
- Masyarakat umum Indonesia yang ingin tahu info gempa terkini dan cara mitigasinya. **[ASUMSI]**
- Pelajar/mahasiswa yang belajar tentang gempa. **[ASUMSI]**
Perangkat utama: ponsel (uji wajib di 390px), lalu desktop.

## 3. Tujuan dan bukan tujuan
Tujuan: lihat PRD-DATABASE.md bagian 1.1.
Bukan tujuan: login/akun, halaman admin, prediksi gempa, peringatan dini resmi,
data realtime lewat database (autogempa langsung dari BMKG dengan cache).

## 4. Struktur halaman
| Rute | Halaman | Isi inti | Spec |
|---|---|---|---|
| `/` | Beranda | Gempa terbaru (autogempa), status data, jalan pintas, gempa dirasakan terbaru, blok edukasi | 01-beranda.md |
| `/riwayat` | Riwayat | Daftar dari DB, filter, paginasi, grafik, aksi "Simulasikan" | 02-riwayat.md |
| `/simulasi` | Simulasi | Parameter, MMI, energi, radius, waktu rambat, indikator tsunami | 03-simulasi.md |
| `/chatbot` | Chatbot | Tanya-jawab kontekstual, fallback bertingkat, 👍/👎 | 05-chatbot.md **[ASUMSI: halaman sendiri]** |
| `/edukasi` | Edukasi | Artikel per kategori, berita, daftar pustaka | 04-edukasi.md |
Navigasi utama: Beranda, Riwayat, Simulasi, Chatbot, Edukasi.

## 5. Sumber data
- BMKG open data: `autogempa` (terbaru), gempa terkini (M5+), gempa dirasakan.
  URL dan format diverifikasi agent di fase 1 dari dokumentasi/respons nyata; jangan menebak.
- Konten edukasi, FAQ, berita, sumber, dan preset simulasi: seed ke database (tanpa admin).
- Berita: input manual (tanpa scraping/RSS).

## 6. Aturan produk (tidak bisa ditawar)
1. Semua data gempa memuat sumber "BMKG" dan waktu pembaruan.
2. Situs bukan sistem peringatan dini resmi; jangan pernah tampil seperti itu.
3. Hasil simulasi berlabel "Estimasi edukasi, bukan data resmi BMKG".
4. Tidak ada angka, nama, atau klaim yang dikarang. Konten edukasi bersumber dan
   tercatat di `Sumber`.
5. Tetap berfungsi saat DB/Redis/BMKG gagal (degradasi anggun).
6. Bahasa Indonesia, waktu WIB, koordinat LS/BT.

## 7. Kriteria selesai
Semua kebutuhan **Wajib** di PRD-DATABASE.md terpenuhi dan uji TC-DB-01..20 lulus
untuk fase yang dikerjakan. Setiap screen lulus alur skill (AGENTS.md) dan diuji di
390px dan 1440px.

## 8. Hal yang belum diputuskan
- Pustaka peta (episentrum) dan pustaka grafik: **belum dipilih**; placeholder/SVG dulu.
- Domain untuk demo (menentukan Caddy/HTTPS).
- Rumus MMI dan angka preset simulasi (lihat PRD-DATABASE.md bagian 14).
- Konfirmasi semua butir **[ASUMSI]** di atas.
