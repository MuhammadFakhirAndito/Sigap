# Keterbatasan Sistem SIGAP Gempa

Dokumen ini mencatat keterbatasan teknis, ilmiah, dan operasional sistem secara transparan untuk bahan laporan dan evaluasi pengguna.

---

## 1. Domain & Layanan Data Eksternal

1. **Bukan Sistem Peringatan Dini Resmi**: SIGAP Gempa adalah platform informasi, edukasi, dan simulasi berbasis rujukan BMKG dan BNPB. Aplikasi ini tidak menerbitkan peringatan dini resmi maupun instruksi evakuasi otoritatif.
2. **Ketergantungan API BMKG (`data.bmkg.go.id`)**: Pengambilan data langsung (`autogempa`) dan sinkronisasi (`gempaterkini`, `gempadirasakan`) bergantung pada ketersediaan endpoint publik BMKG. Jika BMKG mengembalikan HTTP `403`, batas laju, atau *timeout*, halaman Riwayat dan endpoint internal jatuh anggun ke salinan terakhir di PostgreSQL disertai penanda waktu sinkronisasi `OK` terakhir (`SyncLog`).
3. **Retensi Berita Statis Terkurasi**: Konten `Berita`, `Artikel`, `FaqGempa`, dan `SkenarioSimulasi` dikelola melalui berkas rujukan repositori (`prisma/seed.ts` dan `content/`) karena tidak tersedia halaman admin/CMS.

---

## 2. Chatbot AI & Kuota API Gemini

1. **Batas Kuota Harian (`GEMINI_*_DAILY_QUOTA`)**: Batas default pada `.env.example` disetel konservatif (`20` permintaan/hari per model) sebagai penghitung lokal sebelum memanggil API Google. Angka aktual kuota tingkat gratis dapat berubah sewaktu-waktu sesuai kebijakan Google AI Studio dan perlu dicocokkan berkala di dasbor API pengguna.
2. **Zona Waktu Reset Kuota (`America/Los_Angeles`) — Belum Terverifikasi Penuh**: Dokumentasi resmi Google Gemini hanya menyebut batas harian (*RPD*) di-reset pada *"midnight Pacific time"* tanpa menyebut pengenal IANA secara eksplisit. Nilai `America/Los_Angeles` dipakai sebagai konstanta konfigurasi yang mudah diganti di `.env`, namun ketepatan persisnya terhadap akun proyek tertentu belum diverifikasi otomatis.
3. **Status Model Cadangan (`gemini-4-hydrogen`)**: Model seri `gemini-4-*` menggunakan token berpikir internal (`thinkingLevel`) dan menolak parameter *sampling* (`temperature`/`top_p`/`top_k`), sehingga kontrol variasi jawaban model cadangan bergantung pada *system prompt*.
4. **Rate Limiter Proses Tunggal**: Pembatasan `10` pesan/menit per *HMAC-IP* di Fase 3 memakai penyimpanan memori proses Node.js (`in-memory`, karena Fase 5 Redis bersifat opsional dan belum diaktifkan). Pada arsitektur *multi-instance* di belakang *load balancer*, kuota rate limit berjalan terpisah per instance.

---

## 3. Model Fisika & Simulasi Dampak (`/simulasi`)

1. **Model MMI Terkalibrasi untuk Kerak Dangkal (`M 5,0–7,9`, `< 300 km`)**: Persamaan atenuasi *Allen, Wald & Worden (2012)* (`AllenEtAl2012Rhypo`) dikalibrasi untuk gempa kerak aktif dangkal, **bukan zona subduksi/megathrust**. Pada skenario historis raksasa seperti **Aceh 2004 (M 9,1)** dan **Nias 2005 (M 8,6)**, aplikasi tetap menghitung perkiraan titik pengamat dengan penanda eksplisit *"di luar rentang kalibrasi"* dan menyembunyikan angka radius guncangan.
2. **Abaikan Variasi Struktur Geologi Lokal (`Vs30`)**: Estimasi waktu tiba gelombang P ($v_P = 6{,}0\text{ km/dtk}$) dan gelombang S ($v_S = 3{,}5\text{ km/dtk}$) menggunakan kecepatan rata-rata homogen tanpa memodelkan efek penguatan tanah lunak (*site amplification* / *Vs30*), topografi cekungan, maupun direktivitas sesar.
3. **Heuristik Indikator Tsunami (BNPB, 2012)**: Penilaian `LAUT`, $M > 6{,}8$, dan kedalaman $\le 70\text{ km}$ adalah aturan penyaringan edukatif sederhana. Simulasi **tidak** memodelkan jenis sesar (naik/geser/turun), luas bidang patahan, gempa memicu longsor bawah laut (seperti Palu 2018), maupun penjalaran patahan dari darat ke laut.
4. **Animasi Getaran 3D Bersifat Ilustratif**: Adegan sudut ruangan Three.js menggunakan pergerakan prosedural terbatas (`<= 0,065 unit` / `<= 0,32 rad`) sebagai alat bantu visual pemahaman skala MMI BMKG, **bukan** analisis teknik sipil atau simulasi ketahanan struktur bangunan nyata. Sejak perombakan 18 Nov 2026, gerakannya berfase (P vertikal kecil, jeda, S horizontal, peluruhan), deterministik per MMI, dan jeda P ke S **dipercepat** (jeda asli dibagi 3, dibatasi 1,2–5 detik); nilai asli tP/tS/golden time tetap ditampilkan. Benda jatuh, retakan, dan debu memakai lintasan skrip sederhana, bukan mesin fisika.
5. **MMI IX–XII Tidak Tercapai dari Parameter Halaman**: Dengan rumus Allen dkk. (2012) dan batas slider (M ≤ 9,5), MMI maksimum yang dihasilkan halaman sekitar VIII (contoh: M 9,5, jarak 0 km, kedalaman 10 km memberi MMI mentah ±8,3). Efek 3D untuk MMI IX–XII (debu, jam jatuh, retakan penuh) sudah dibuat dan diuji unit, tetapi tidak akan terlihat dari slider selama rumus MMI tidak berubah.

---

## 4. Lingkup Pengujian Lokal vs Produksi VPS

- Pengujian isolasi jaringan eksternal (`TC-DB-06`: memastikan port `5432` tidak terjangkau dari internet) dan verifikasi aturan firewall `ufw` serta TLS domain Caddy hanya dapat divalidasi secara nyata setelah di-deploy di **VPS publik**.
- Kerentanan dependensi npm yang dilaporkan oleh `npm audit` (termasuk paket pengembang/`next` di versi minor sekarang) perlu dipantau berkala dan ditingkatkan bila tersedia rilis pemeliharaan non-breaking.
