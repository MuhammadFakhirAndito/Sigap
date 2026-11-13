# Screen 02 — Riwayat Gempa  (/riwayat)   Fase 1

Tujuan: menelusuri riwayat gempa dari DATABASE (bukan langsung BMKG), dengan
filter, paginasi, grafik, dan aksi "Simulasikan". Kebutuhan: FR-DB-02, 03, 19; NFR-DB-01.

## Layout (desktop 1440, tonal flat, sesuai DESIGN.md)
1. NotchNavbar (item "Riwayat" aktif).
2. Header terpusat: H2 satu warna "Riwayat gempa", subcopy
   abu-abu: "Data dari BMKG yang disimpan agar tetap bisa dilihat saat BMKG tidak dapat diakses."
3. Baris status sinkronisasi (pill kecil, surface-raised):
   - Normal: titik hijau + "Sumber: BMKG · disinkronkan {waktu relatif}".
   - Degraded (BMKG gagal): ikon peringatan + "BMKG tidak dapat diakses. Data terakhir
     disinkronkan {tanggal WIB}". Pakai warna warning + ikon + teks.
4. Filter bar (panel surface, radius 28, padding 24): magnitudo minimum (select/segmented:
   Semua, ≥3, ≥4, ≥5, ≥6), rentang tanggal (dua input), pencarian wilayah
   (input pill, ikon search), tombol outline "Reset". Aplikasikan via query string
   (?mag=&dari=&sampai=&wilayah=&hal=) agar bisa dibagikan.
5. Grafik ringkas di atas daftar (card surface): jumlah gempa per hari ATAU magnitudo
   terhadap waktu untuk hasil terfilter. Tanpa library baru kecuali disetujui
   (usulan awal: SVG/CSS sederhana). Wajib ada teks alternatif/tabel ringkas untuk a11y.
6. Daftar (baris, bukan grid): per baris -> badge magnitudo (angka tabular, primary),
   wilayah (H3 kecil), waktu "10 Nov 2026, 07:42 WIB", kedalaman "10 km", koordinat
   "7,12 LS, 106,88 BT", StatusBadge tsunami (ikon+teks: "Tidak berpotensi tsunami" /
   "Berpotensi tsunami" / "Tidak dinyatakan"), tombol outline pill "Simulasikan"
   -> /simulasi?m={magnitudo}&d={kedalamanKm}&lat={lat}&lon={lon}.
   Baris bisa di-hover (surface -> surface-raised, 200ms).
7. Paginasi 15 baris/halaman (prev/next + nomor ringkas, tombol >=44px).
8. Footer disclaimer: "Sumber: BMKG. Situs ini bukan sistem peringatan dini resmi."

## State
- Loading: skeleton 5 baris.  - Empty: "Tidak ada gempa yang cocok dengan filter" + tombol Reset.
- Error DB: ErrorState dengan tombol coba lagi.

## Mobile (390)
Filter menjadi panel collapsible ("Filter"); baris menjadi kartu bertumpuk
(magnitudo kiri atas, tombol Simulasikan di bawah, lebar penuh).

## Data
GET /api/gempa (filter, paginasi). Fixture dev: >=10.000 baris sintetis lewat skrip
untuk uji NFR-DB-01 (<300 ms/halaman). Index pg_trgm pada `wilayah` via migrasi SQL manual.
