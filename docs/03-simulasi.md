# Screen 03 — Simulasi Dampak Gempa (/simulasi) — Dua Mode (Revisi Fase 4)

Tujuan: edukasi interaktif. **Semua kalkulasi dijalankan 100% di sisi klien** (`src/lib/simulasi` dan `src/lib/simulasi-visual`, memenuhi NFR-DB-06, TC-DB-15/16/17) tanpa permintaan ke API maupun database saat parameter berubah.
Kebutuhan: FR-DB-16, FR-DB-17, FR-DB-19. (**FR-DB-18 perbandingan bangunan tetap ditunda**.)

Label **WAJIB** selalu tampil di kedua mode pada area hasil:
**"Estimasi edukasi, bukan data resmi BMKG"** (pill tetap, bukan tooltip).

---

## 1. Kontrol Bersama (3 Kontrol Utama + Pemilih Preset)

Panel kontrol (`surface`, radius 28, padding 24) berisi:
1. **Preset gempa bersejarah** (`select` dari `SkenarioSimulasi`, dimuat sekali di server; mengganti preset tidak memanggil API) + opsi **Kustom** + tombol outline **Reset**. Saat database tidak tersedia, mode **Kustom** tetap berfungsi penuh.
2. **Magnitudo** (`slider` 1,0–9,5 langkah 0,1 + input angka tabular).
3. **Kedalaman** (`Dangkal 10 km` | `Menengah 70 km` | `Dalam 200 km`). Preset ber-kedalaman khusus (mis. Aceh 30 km, Palu 20 km) menampilkan nilai aktual secara ringkas dan dapat diubah presisi (`1–700 km`) di **Detail lanjutan**.
4. **Jarak dari pusat gempa** (`slider` 0–300 km + input angka tabular), tersinkron dua arah dengan marker **"Anda"** pada mode *Peta dampak*.

---

## 2. Pemilih Mode & Ringkasan Hasil Bersama

Di atas area hasil terdapat:
- **Pemilih mode** (`tablist` segmented, dapat dioperasikan keyboard `Tab`, `ArrowLeft`/`ArrowRight`, `Home`/`End`):
  1. **`Peta dampak`** *(mode bawaan)*
  2. **`Getaran 3D`** *(chunk `three` hanya dimuat via `next/dynamic(..., { ssr: false })` saat mode ini dibuka)*
- **Ringkasan hasil bersama** (tampil di kedua mode):
  - Kalimat dampak awam sesuai kutipan resmi skala MMI BMKG untuk jarak terpilih.
  - Angka **MMI kecil** berwarna **netral gelap** (`text-primary`, tanpa hijau dan tanpa token `success`).
  - Jarak pengamat aktual (menampilkan angka sebenarnya, mis. `"412 km"`, ketika marker `"Anda"` ditempatkan `> 300 km` di luar rentang kalibrasi).
  - Label wajib **"Estimasi edukasi, bukan data resmi BMKG"**.

---

## 3. Mode 1 — Peta Dampak (Default)

- Dibangun dengan **Leaflet** (`next/dynamic`, `ssr: false`), tile OpenStreetMap standar yang dikonfigurasi lewat `NEXT_PUBLIC_MAP_TILE_URL` dan `NEXT_PUBLIC_MAP_TILE_ATTRIBUTION`.
- Atribusi **"© OpenStreetMap contributors"** (tautan ke `https://www.openstreetmap.org/copyright`) **wajib terlihat** di pojok kanan bawah peta dan tidak boleh disembunyikan.
- Memakai marker **`L.divIcon` SVG kustom** (tidak memakai aset ikon bawaan Leaflet):
  - **Pusat gempa**: mengikuti koordinat preset atau diubah lewat klik/geser di peta (otomatis masuk mode **Kustom**).
  - **Marker "Anda"**: dapat digeser, dipilih dengan klik peta, digerakkan dengan kontrol keyboard (tombol arah N/S/E/W + `Arrow` pada marker), maupun diatur manual lewat Lintang/Bujur di *Detail lanjutan*. Jarak dihitung menggunakan **Haversine** dan tersinkronisasi dua arah dengan slider `0–300 km`.
- **Lingkaran berskala meter nyata (`L.circle`)** berwarna **netral gelap** berbeda opasitas (tanpa hijau dan tanpa merah untuk data kebahayaan):
  - **Radius terasa (`MMI >= III`)** dan **merusak ringan (`MMI >= VI`)**:
    - `M` dalam `5,0–7,9` dan radius `<= 300 km`: gambar lingkaran sesuai hasil bisection.
    - Radius `> 300 km`: tampil **"> 300 km (di luar rentang kalibrasi)"** dan gambar **lingkaran putus-putus di 300 km** tanpa angka ekstrapolasi.
    - `M` di luar `5,0–7,9` (`M < 5,0` atau `M > 7,9`): **tidak menggambar lingkaran** dan menampilkan **"tidak dapat diperkirakan (di luar rentang kalibrasi)"**.
    - Jika ambang tidak tercapai di jarak `0 km`: tampil **"tidak terasa"**.
- `fitBounds` otomatis menjaga kedua marker dan lingkaran tampak utuh di viewport.
- **Perlindungan gulir halaman pada layar sentuh (`390px`)**: di perangkat sentuh, peta tidak langsung merebut gulir halaman satu jari; pengguna dapat mengaktifkan mode geser peta lewat tombol/sentuhan peta atau memakai gerakan dua jari.
- **Degradasi & aksesibilitas**: ringkasan teks (pusat, titik "Anda", jarak, radius `"Terasa sampai ± X km"` & `"Mulai merusak ringan sampai ± Y km"`) selalu tampil di **luar peta**. Jika tile gagal dimuat atau offline, tampil pesan **"Peta tidak dapat dimuat"** sementara ringkasan teks dan seluruh hitungan tetap berfungsi normal.

---

## 4. Mode 2 — Getaran 3D (Lazy-Loaded)

- Dibangun dengan **`three` murni** (`next/dynamic`, `ssr: false`, tanpa `@react-three/*`), hanya dimuat saat pengguna membuka tab **Getaran 3D**.
- Adegan low-poly sudut ruangan (lantai, dua dinding, lampu gantung, rak dengan benda ringan, meja dengan gelas, perabot samping) memakai warna netral sesuai [DESIGN.md](../DESIGN.md) tanpa warna hijau.
- Profil getaran dipetakan secara **ilustratif** (bukan fisika struktur dan bukan teks BMKG) berdasarkan MMI pada jarak terpilih:
  - Yang digetarkan adalah **benda dan ruangan**, **BUKAN kamera**; tanpa kedipan cahaya, tanpa audio, amplitudo dibatasi batas aman maksimum, tanpa adegan bangunan runtuh maupun korban.
- Pengguna menekan **"Mulai getaran"** (tidak berjalan otomatis) dan dapat menekan **"Berhenti"** kapan saja. Durasi urutan **± 12 detik** (getaran lemah gelombang P → getaran utama gelombang S → mereda).
- Menampilkan teks **"Jeda gelombang P ke S di jarak ini: ± X detik"** (dari `goldenTimeSeconds` engine).
- Menyertakan peringatan kecil **"Animasi getaran. Hentikan jika tidak nyaman."** dan label tetap di area adegan **"Ilustrasi getaran, bukan simulasi kekuatan bangunan"**.
- **`prefers-reduced-motion`**: tidak ada animasi otomatis; saat diputar, amplitudo dan frekuensi diturunkan jauh disertai keterangan teks.
- **Performa & Fallback WebGL**: `devicePixelRatio` maksimal `2`, render hanya saat animasi berlangsung atau adegan berubah, berhenti saat tab tidak terlihat (`visibilityState === "hidden"`), geometri/material/renderer dibuang (`dispose()`) saat unmount. Jika WebGL tidak tersedia, tampil pesan aman beserta ringkasan teks dampak tanpa error.
- **Pemisahan atribusi**: kutipan dampak resmi BMKG (`MMI_SCALE_INFO`) dan deskripsi pilihan efek ilustratif 3D ditampilkan terpisah secara eksplisit.

---

## 5. Detail Lanjutan (Tertutup secara Default)

Bagian `<details>` tertutup secara default saat halaman dimuat dan berisi:
- **`Tipe lokasi episentrum` dengan 3 keadaan**:
  - Otomatis `DARAT` / `LAUT` saat memakai preset atau parameter URL `?lokasi=`.
  - Awalnya **"Belum dipilih"** pada mode `Kustom` (indikator tsunami menampilkan **"Pilih tipe lokasi untuk melihat indikator tsunami"**, bukan default Darat).
- **Input manual koordinat** (Lintang & Bujur untuk pusat gempa serta posisi `"Anda"`) dan **Kedalaman presisi (`1–700 km`)**.
- **Indikator kriteria tsunami** (BNPB 2012 + catatan keterbatasan kasus **Palu 2018 & Lombok 2018**).
- **Energi seismik**, **Jarak hiposenter**, **Waktu rambat P & S + Golden time**, **Skala 12 tingkat MMI lengkap**, **Rekomendasi kesiapsiagaan + tautan ke Chatbot**, serta **Rumus & asumsi simulasi**.

---

## 6. Mobile (`390px`)

Kontrol di atas, bilah ringkasan sticky atas (`MMI` + `Golden time`, agar tidak menutupi slider kontrol di layar awal), pemilih mode + strip ringkasan hasil bersama, kanvas mode aktif, dan Detail lanjutan tertutup di bawah. Peta tidak menghalangi gulir vertikal layar sentuh.
