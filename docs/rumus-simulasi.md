# Rumus & Asumsi Simulasi Dampak Gempa

Seluruh perhitungan simulasi pada `/simulasi` dijalankan **100% di sisi klien** (`src/lib/simulasi/`) sebagai **estimasi edukasi, bukan data resmi BMKG** dan **bukan sistem peringatan dini resmi**.

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
  - Jika $M \in [5{,}0,\ 7{,}9]$ dan pada $R_{\text{epi}} = 300\text{ km}$ nilai MMI masih $\ge$ ambang → `"> 300 km (di luar rentang kalibrasi)"` (tanpa menampilkan angka ekstrapolasi $> 300\text{ km}$).
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
- **Syarat heuristik simulasi:** tipe lokasi `LAUT`, magnitudo $> 6{,}8$, dan kedalaman $\le 70\text{ km}$.
- **Keterbatasan penting:** Simulasi ini **tidak** memodelkan mekanisme sesar (naik/geser/turun), luas bidang patahan, atau potensi **longsor bawah laut** (seperti kejadian Palu 2018) maupun ruptur yang menjalar ke laut dari pusat di darat/dekat pantai (seperti Lombok 2018).

