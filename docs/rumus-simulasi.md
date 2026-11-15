# Rumus & Asumsi Simulasi Dampak Gempa

Seluruh perhitungan simulasi pada `/simulasi` dijalankan **100% di sisi klien** (`src/lib/simulasi/` dan `src/lib/simulasi-visual/`) sebagai **estimasi edukasi, bukan data resmi BMKG** dan **bukan sistem peringatan dini resmi**.

---

## 1. Skala Intensitas MMI (*Allen, Wald & Worden, 2012 — Jarak Hiposenter*)

- **Sitasi:** Allen, T. I., Wald, D. J., & Worden, C. B. (2012). *Intensity attenuation for active crustal regions*. Journal of Seismology, 16(3), 409–433.
  - Abstrak & rentang kalibrasi: https://link.springer.com/article/10.1007/s10950-012-9278-7
  - Implementasi referensi OpenQuake Engine (`AllenEtAl2012Rhypo`): https://raw.githubusercontent.com/gem/oq-engine/master/openquake/hazardlib/gsim/allen_2012_ipe.py
- **Persamaan:**
  $$\text{MMI} = c_0 + c_1 M + c_2 \ln\!\left(\sqrt{R_{\text{hypo}}^2 + r_m^2}\right) + \begin{cases} c_4 \ln(R_{\text{hypo}} / 50) & \text{jika } R_{\text{hypo}} > 50\text{ km} \\ 0 & \text{jika } R_{\text{hypo}} \le 50\text{ km} \end{cases}$$
  dengan $r_m = m_1 + m_2 e^{M - 5}$ dan jarak hiposenter $R_{\text{hypo}} = \sqrt{R_{\text{epi}}^2 + d^2}$ (km).
- **Koefisien (`AllenEtAl2012Rhypo`):**
  $c_0 = 2{,}085$, $c_1 = 1{,}428$, $c_2 = -1{,}402$, $c_4 = 0{,}078$, $m_1 = -0{,}209$, $m_2 = 2{,}042$.
- **Rentang kalibrasi & keterbatasan:**
  - **Magnitudo:** $M_W\ 5{,}0\text{–}7{,}9$
  - **Jarak:** $< 300\text{ km}$
  - **Intensitas:** derajat II+
  - **Tektonik:** kerak aktif dangkal (*active crustal regions*), **bukan model subduksi/megathrust**.
  - Nilai $M$ di luar $5{,}0\text{–}7{,}9$ atau $R_{\text{hypo}} \ge 300\text{ km}$ tetap dihitung untuk MMI pada jarak pengamat dengan penanda eksplisit **"di luar rentang kalibrasi"**.
  - Hasil diskret dibulatkan dan dibatasi pada rentang skala I–XII (rujukan deskripsi BMKG).

---

## 2. Radius Guncangan (Pencarian Numerik *Bisection*)

- Dicari jarak episentrum $R_{\text{epi}} \in [0, 300]\text{ km}$ di mana $\text{MMI}_{\text{mentah}}(M, \sqrt{R_{\text{epi}}^2 + d^2})$ melintasi ambang:
  - **Radius terasa:** $\text{MMI} \ge \text{III}$ (3,0)
  - **Radius berpotensi merusak ringan:** $\text{MMI} \ge \text{VI}$ (6,0)
- **Aturan tampilan (diperketat):**
  - Jika $M \notin [5{,}0,\ 7{,}9]$: angka radius **tidak ditampilkan** → `"tidak dapat diperkirakan (di luar rentang kalibrasi)"`.
  - Jika $M \in [5{,}0,\ 7{,}9]$ dan pada $R_{\text{epi}} = 0\text{ km}$ nilai MMI sudah di bawah ambang → `"tidak terasa"` (untuk III) / `"tidak terasa (di bawah MMI VI)"` (untuk VI).
  - Jika $M \in [5{,}0,\ 7{,}9]$ dan pada $R_{\text{epi}} = 300\text{ km}$ nilai MMI masih $\ge$ ambang → `"> 300 km (di luar rentang kalibrasi)"` (tanpa menampilkan angka ekstrapolasi $> 300\text{ km}$). Pada peta, batas 300 km ditampilkan sebagai lingkaran garis putus-putus tanpa angka.
  - Jika $M \in [5{,}0,\ 7{,}9]$ dan lintasan ambang berada pada $[0, 300]\text{ km}$ → metode *bisection* 60 iterasi hingga konvergen.

---

## 3. Energi Seismik & Waktu Rambat Gelombang

- **Energi (Gutenberg–Richter, PRD-DATABASE.md §6):**
  $$\log_{10} E = 1{,}5 M + 4{,}8 \quad (\text{E dalam joule})$$
- **Jarak hiposenter:** $R_{\text{hypo}} = \sqrt{R_{\text{epi}}^2 + d^2}$ (km)
- **Waktu rambat rata-rata kerak:**
  $$t_P = \frac{R_{\text{hypo}}}{6{,}0\text{ km/s}}, \qquad t_S = \frac{R_{\text{hypo}}}{3{,}5\text{ km/s}}, \qquad \text{Golden time} = t_S - t_P$$
  Asumsi kecepatan konstan kerak rata-rata; tidak memperhitungkan variasi struktur geologi lokal maupun amplifikasi tanah (*Vs30*).

---

## 4. Indikator Kriteria Tsunami

- **Rujukan:** Buku Saku Tanggap Tangkas Tangguh Menghadapi Bencana (BNPB, 2012).
- **Syarat heuristik simulasi:** tipe lokasi `LAUT`, magnitudo $> 6{,}8$, dan kedalaman $\le 70\text{ km}$. Pada mode `Kustom`, tipe lokasi berawal pada keadaan `"belum dipilih"` hingga pengguna menentukan `Darat` atau `Laut`.
- **Keterbatasan penting:** Simulasi ini **tidak** memodelkan mekanisme sesar (naik/geser/turun), luas bidang patahan, atau potensi **longsor bawah laut** (seperti kejadian Palu 2018) maupun ruptur yang menjalar ke laut dari pusat di darat/dekat pantai (seperti Lombok 2018).

---

## 5. Jarak Geodesik Haversine (Mode Peta Dampak)

Pada mode **Peta dampak**, jarak horizontal di permukaan bumi antara titik pusat gempa $(\phi_1, \lambda_1)$ dan posisi marker `"Anda"` $(\phi_2, \lambda_2)$ dihitung di klien menggunakan **rumus Haversine** dengan jari-jari rata-rata bumi $R_{\oplus} = 6.371\text{ km}$:
$$d = 2 R_{\oplus} \arcsin\!\left(\sqrt{\sin^2\!\left(\frac{\phi_2 - \phi_1}{2}\right) + \cos\phi_1 \cos\phi_2 \sin^2\!\left(\frac{\lambda_2 - \lambda_1}{2}\right)}\right)$$

---

## 6. Pemetaan Ilustratif Skala MMI ke Animasi Ruangan 3D (`src/lib/simulasi-visual/mmi3dMapping.ts`)

> **Pemisahan Atribusi Wajib:**
> * **Kolom (a) Deskripsi Dampak** adalah rujukan/kutipan **Skala MMI BMKG** ([BMKG](https://www.bmkg.go.id/gempabumi/skala-mmi) dan `content/skala-mmi.md`).
> * **Kolom (b) Efek Animasi 3D** adalah **pilihan ilustratif visual SIGAP Gempa semata** — **BUKAN teks resmi BMKG** dan **BUKAN simulasi fisika rekayasa struktur bangunan**.

Adegan low-poly sudut ruangan menggerakkan objek dan ruangan (bukan kamera), dengan urutan durasi **12 detik**: `0–3 dtk` (getaran lemah ilustratif gelombang P, amplop ~24%) → `3–9,6 dtk` (guncangan utama ilustratif gelombang S) → `9,6–12 dtk` (redaman kosinus). Amplitudo ruangan dikunci maksimum `0,065 unit` dan ayunan lampu maksimum `0,32 rad`. Saat `prefers-reduced-motion: reduce` aktif, amplitudo diturunkan ke `0,2x` dan frekuensi ke `0,45x`. Tidak ada adegan bangunan runtuh atau korban.

| Pita MMI | (a) Deskripsi Dampak Menurut Skala MMI BMKG | (b) Efek Animasi 3D (Pilihan Ilustratif SIGAP, bukan fisika/teks BMKG) |
| :--- | :--- | :--- |
| **I – II** | **I:** Tidak dirasakan kecuali kondisi luar biasa oleh beberapa orang.<br>**II:** Dirasakan beberapa orang yang diam; benda ringan yang digantung bergoyang (`MMI_SCALE_INFO` BMKG). | Lampu gantung berayun halus (I: ayunan mikro `0,01 rad`; II: `0,04 rad`, `1,1 Hz`), ruangan nyaris diam–getar mikro (`0–0,004 unit`), gelas dan benda rak tetap di tempat. |
| **III – IV** | **III:** Dirasakan nyata di dalam rumah, terasa seakan-akan ada truk berlalu.<br>**IV:** Pada siang hari dirasakan banyak orang di dalam rumah; gerabah pecah, jendela dan pintu berderik (`MMI_SCALE_INFO` BMKG). | Ruangan bergetar ringan–sedang (`0,012–0,020 unit`, `2,4–3,0 Hz`), lampu berayun sedang (`0,08–0,13 rad`), serta gelas di meja dan benda ringan di rak dianimasikan bergeser di tempat tanpa terjatuh (`0,04–0,12 unit`). |
| **V – VI** | **V:** Dirasakan hampir semua penduduk; banyak orang terbangun, barang terpelanting, tiang dan benda besar tampak bergoyang.<br>**VI:** Dirasakan semua penduduk; kebanyakan terkejut dan lari ke luar, plester dinding jatuh, kerusakan ringan terjadi (`MMI_SCALE_INFO` BMKG). | Ruangan bergetar lebih kuat (`0,032–0,045 unit`, `3,5–4,0 Hz`), lampu berayun `0,19–0,25 rad`, benda di rak jatuh ke lantai (2 benda pada V; 3 benda + gelas pada VI), dan meja/rak mulai sedikit bergeser (`0,025–0,045 unit`). |
| **VII – VIII** | **VII:** Semua orang ke luar rumah; kerusakan ringan pada bangunan konstruksi baik, konstruksi kurang baik retak/rusak.<br>**VIII:** Kerusakan ringan bangunan khusus; cukup berat pada bangunan biasa dengan kemungkinan roboh sebagian (`MMI_SCALE_INFO` BMKG). | Perabot utama (meja, kursi, rak) bergeser di lantai (`0,085–0,11 unit` + rotasi kecil), seluruh benda rak & gelas terjatuh pada fase S, ayunan lampu & getaran ruangan mencapai batas aman maksimum (`0,32 rad` dan `0,065 unit`) **tanpa** keruntuhan dinding/korban. |
| **IX – XII** | **IX–XII:** Kerusakan bangunan konstruksi kuat, rangka lepas dari pondasi, tanah retak, hingga kerusakan total dan gelombang tanah tampak (`MMI_SCALE_INFO` BMKG). | Parameter gerak ruangan dan ayunan lampu **tetap dikunci pada batas aman maksimum (`0,065 unit` / `0,32 rad`)** untuk kenyamanan visual; dampak kerusakan berat IX–XII dijelaskan melalui kutipan teks BMKG di luar adegan. |
