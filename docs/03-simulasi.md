# Screen 03 — Simulasi Dampak Gempa  (/simulasi)   Fase 4

Tujuan: edukasi interaktif. SEMUA hitungan di klien (NFR-DB-06, TC-DB-15/16/17).
Kebutuhan: FR-DB-14, 16, 17, 19. (**FR-DB-18 perbandingan bangunan DITUNDA**, tidak dibangun di fase ini.)
Label WAJIB selalu terlihat di area hasil:
"Estimasi edukasi, bukan data resmi BMKG" (banner pill, bukan tooltip).

## Layout (desktop 1440, 2 kolom)
Header: H2/title satu warna "Simulasi dampak gempa" + subcopy "Atur parameter dan lihat
perkiraan guncangan, waktu rambat gelombang, dan potensi tsunami."

Kolom kiri (≈40%) — Panel kontrol (surface, radius 28, padding 24):
- Preset: select "Pilih gempa bersejarah" dari SkenarioSimulasi (dimuat sekali di server;
  mengganti preset TIDAK memanggil API) + opsi "Kustom".
- Magnitudo: slider 1,0–9,5 langkah 0,1 + input angka tabular.
- Kedalaman (km): slider 1–700 + input angka.
- Koordinat episentrum: input lat/lon (LS/BT) + tipe lokasi (Darat / Laut). Catat secara eksplisit
  di UI bahwa lintang dan bujur hanya sebagai konteks dan tidak memengaruhi hasil hitungan.
- Jarak pengamat dari episentrum (km): slider/input 0–300 km (default 50; dipakai untuk MMI & waktu rambat).
- Catatan kalibrasi: nilai di luar rentang kalibrasi rumus MMI (Mw 5,0–7,9; R < 300 km) tetap
  dihitung, tetapi diberi catatan jelas "di luar rentang kalibrasi".
- Tombol outline "Reset". Parameter dari URL (?m=&d=&lat=&lon=&jarak=) mengisi form saat load
  dan divalidasi (nilai tidak valid di URL ditolak dengan pesan, bukan crash).
- Label slider eksplisit, nilai terbaca screen reader (aria-valuetext).

Kolom kanan (≈60%) — Hasil (diperbarui langsung saat input berubah):
1. Kartu MMI (focal point): angka Romawi sangat besar (I–XII, `text-primary` netral gelap,
   bukan hijau/primary), deskripsi teks dampak (rujukan skala MMI BMKG), skala bar 12 segmen
   (dengan label teks I–XII, memakai warna netral gelap `cta`/`text-primary`).
   Sertakan catatan eksplisit bahwa rumus MMI berlaku untuk kerak aktif dangkal, bukan model subduksi.
2. Baris kartu ringkas: Energi (notasi ilmiah, joule), Jarak hiposenter (km), dan Radius guncangan:
   - Radius terasa (MMI >= III, km)
   - Radius berpotensi merusak ringan (MMI >= VI, km)
   Jika ambang MMI tak pernah tercapai bahkan pada jarak episentrum 0 km, tampilkan "tidak terasa"
   (atau "tidak tercapai").
3. Kartu Waktu Rambat: tP, tS (detik, 1 desimal), dan "Golden time = tS − tP" besar.
   Visual: dua bar horizontal berjalan; animasi opsional, nonaktif bila prefers-reduced-motion.
4. Kartu Potensi Tsunami: StatusBadge (ikon+teks) "Berpotensi memenuhi kriteria simulasi" bila
   tipe lokasi LAUT, M > 6,8, dan kedalaman <= 70 km (Buku Saku BNPB 2012; jenis sesar tidak dipakai);
   selain itu "Tidak memenuhi kriteria simulasi". Teks tetap:
   "Indikator edukasi. Peringatan tsunami resmi hanya dari BMKG."
5. Rekomendasi keselamatan: tautan ke Artikel/FaqGempa terkait + tombol CTA hitam
   "Tanyakan skenario ini ke chatbot" (meneruskan parameter ke `/chatbot?m=&d=&wilayah=&mmi=`).
6. Bagian/panel "Lihat rumus & asumsi" -> menampilkan ringkas rumus, sitasi, dan batasannya.

## Rumus (lib/simulasi, fungsi murni + unit test)
- log10 E = 1,5 M + 4,8 (J)
- jarak hiposenter = √(jarak² + kedalaman²)
- tP = jarak_hiposenter / 6 ; tS = jarak_hiposenter / 3,5 (km/s), golden time = tS − tP
- MMI: Allen, Wald & Worden (2012) versi jarak hiposenter (`AllenEtAl2012Rhypo`), dibatasi I–XII.
- Radius MMI >= III dan MMI >= VI: pencarian numerik (bisection) atas fungsi MMI mentah terhadap jarak episentrum.
- Verifikasi dengan TC-DB-15/16: M7,0, jarak episentrum 100 km, kedalaman 10 km -> E ≈ 2,0×10^15 J;
  tP ≈ 16,8 dtk; tS ≈ 28,7 dtk (±5%).

## State
Input tidak valid (di luar rentang): pesan inline, hasil tidak berubah. Parameter URL tidak valid:
pesan peringatan dan kembali ke nilai aman/default. Preset gagal dimuat dari DB: tetap bisa pakai mode Kustom.

## Mobile (390)
Kontrol di atas, hasil di bawah; kartu hasil bertumpuk; ringkasan MMI + golden time
sticky di bawah layar saat menggeser slider.
