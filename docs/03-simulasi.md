# Screen 03 — Simulasi Dampak Gempa  (/simulasi)   Fase 4

Tujuan: edukasi interaktif. SEMUA hitungan di klien (NFR-DB-06, TC-DB-15/16/17).
Kebutuhan: FR-DB-16, 17, 18, 19. Label WAJIB selalu terlihat di area hasil:
"Estimasi edukasi, bukan data resmi BMKG" (banner pill, bukan tooltip).

## Layout (desktop 1440, 2 kolom)
Header: H2 satu warna "Simulasi dampak gempa" + subcopy "Atur parameter dan lihat
perkiraan guncangan, waktu rambat gelombang, dan potensi tsunami."

Kolom kiri (≈40%) — Panel kontrol (surface, radius 28, padding 24):
- Preset: select "Pilih gempa bersejarah" dari SkenarioSimulasi (dimuat sekali di server;
  mengganti preset TIDAK memanggil API) + opsi "Kustom".
- Magnitudo: slider 1,0–9,5 langkah 0,1 + input angka tabular.
- Kedalaman (km): slider 1–700 + input angka.
- Koordinat episentrum: input lat/lon (LS/BT) + tipe lokasi (Darat / Laut).
- Jarak pengamat dari episentrum (km): slider/input (dipakai untuk MMI & waktu rambat).
- Tombol outline "Reset". Parameter dari URL (?m=&d=&lat=&lon=) mengisi form saat load.
- Label slider eksplisit, nilai terbaca screen reader (aria-valuetext).

Kolom kanan (≈60%) — Hasil (diperbarui langsung saat input berubah):
1. Kartu MMI (focal point): angka Romawi sangat besar (I–XII, primary), deskripsi
   teks dampak (mis. "Guncangan kuat"), skala bar 12 segmen (dengan label teks).
2. Baris 3 kartu kecil: Energi (notasi ilmiah, joule), Radius guncangan (km),
   Jarak hiposenter (km).
3. Kartu Waktu Rambat: tP, tS (detik, 1 desimal), dan "Golden time = tS − tP" besar.
   Visual: dua bar horizontal berjalan; animasi opsional, nonaktif bila reduced-motion.
4. Kartu Potensi Tsunami: StatusBadge (ikon+teks) "Berpotensi" bila LAUT, M≥7,
   kedalaman ≤70 km; selain itu "Tidak memenuhi kriteria simulasi". Teks tetap:
   "Indikator edukasi. Peringatan tsunami resmi hanya dari BMKG."
5. (Opsional FR-DB-18) Perbandingan bangunan standar vs tahan gempa: KUALITATIF,
   dua kolom, tiap klaim menautkan Sumber (SNI/BNPB). Jangan menulis angka tanpa sumber.
6. Rekomendasi keselamatan: tautan ke Artikel/FaqGempa terkait + tombol CTA hitam
   "Tanyakan skenario ini ke chatbot" (meneruskan parameter sebagai konteks).
7. Tautan "Lihat rumus & asumsi" -> menampilkan ringkas rumus dari PRD bagian 6.

## Rumus (lib/simulasi, fungsi murni + unit test)
- log10 E = 1,5 M + 4,8 (J)
- jarak hiposenter = √(jarak² + kedalaman²)
- tP = jarak/6 ; tS = jarak/3,5 (km/s), golden time = tS − tP
- MMI: persamaan atenuasi empiris, dibatasi I–XII — BELUM dipilih. Agent: usulkan
  kandidat + sitasi dulu, jangan menebak. Verifikasi dengan TC-DB-15/16:
  M7,0, 100 km, kedalaman 10 km -> E ≈ 2,0×10^15 J; tP ≈ 16,8 dtk; tS ≈ 28,7 dtk (±5%).
  Tulis unit test untuk angka ini.

## State
Input tidak valid (di luar rentang): pesan inline, hasil tidak berubah. Preset gagal
dimuat: tetap bisa pakai mode Kustom.

## Mobile (390)
Kontrol di atas, hasil di bawah; kartu hasil bertumpuk; ringkasan MMI + golden time
sticky di bawah layar saat menggeser slider.
