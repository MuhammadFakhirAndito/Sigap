# Screen 01 — Beranda  (/)   Fase 1

Tujuan: dalam sekali lihat, pengguna tahu gempa terbaru, sumber dan kesegaran datanya,
dan ke mana melanjutkan (riwayat, simulasi, chatbot, edukasi). Kebutuhan: autogempa
langsung dari BMKG (cache), degradasi halus bila DB/Redis/BMKG gagal.

## Aturan data (WAJIB)
Tidak ada angka, lokasi, atau waktu yang ditulis manual di komponen. Semuanya dari
`autogempa` BMKG atau kueri DB. Contoh pada spec ini hanya ilustrasi bentuk, bukan isi.
Fixture dev boleh ada, tapi harus berlabel jelas dan tidak tampil di produksi.

## Layout (desktop 1440)
Canvas `background`. Satu panel hero besar (`surface`, radius 40, ±1220px, di tengah).
1. NotchNavbar menyatu dengan sisi atas panel. Logo "SIGAP Gempa"; link: Beranda
   (aktif), Riwayat, Simulasi, Chatbot, Edukasi; tombol ikon: cari.
2. Hero kiri (titik fokus): kartu "Gempa terbaru" (`surface-raised`, radius 28):
   - Magnitudo sangat besar (stat-xl, primary), label "Magnitudo".
   - Baris status: titik status + "Sumber: BMKG · diperbarui {waktu relatif}".
   - 4 baris data: Waktu (WIB), Kedalaman, Wilayah (teks BMKG), Koordinat (LS/BT).
   - StatusBadge tsunami dari field `potensi` BMKG (ikon+teks; "Tidak dinyatakan" bila kosong).
   - Slot peta episentrum (placeholder; pustaka peta menunggu keputusan). Jangan kartu
     di dalam kartu: 4 baris data memakai pemisah jarak, bukan kartu kecil.
3. Hero kanan: H1 dua warna (SATU-SATUNYA di situs): "**Pantau gempa terkini,** siap
   menghadapi yang berikutnya". Subcopy satu kalimat, abu-abu. CTA hitam pill
   "Lihat riwayat gempa" + tautan teks "Coba simulasi dampak".
4. Di bawah hero: tiga jalan pintas (Riwayat, Simulasi, Tanya chatbot) sebagai tautan
   dengan ikon, bukan tiga kartu fitur identik. Boleh diberi ukuran/porsi berbeda.
5. Section "Gempa dirasakan terbaru": H2 satu warna, tombol outline "Lihat semua".
   Daftar 3-5 QuakeCard dari tabel Gempa (isDirasakan). Tombol ↗ mengarah ke /riwayat
   dengan filter terkait.
6. Satu blok edukasi singkat (1-2 artikel terbaru dari DB, bila ada). Bila kosong:
   EmptyState jujur, bukan konten karangan.
7. Footer: sumber BMKG, "Situs ini bukan sistem peringatan dini resmi", tautan
   Sumber/Daftar pustaka.

## State
- Loading: skeleton kartu gempa terbaru + 3 baris daftar.
- BMKG gagal: kartu gempa terbaru menampilkan data DB terakhir + StatusBadge warning
  "BMKG tidak dapat diakses. Data terakhir {tanggal WIB}".
- DB gagal: bagian daftar menampilkan ErrorState lokal; kartu gempa terbaru (langsung
  dari BMKG) tetap tampil. Tidak boleh ada error layar penuh.
- Kedua gagal: satu ErrorState jelas dengan tombol coba lagi dan tautan ke bmkg.go.id.

## Mobile (390)
Urutan: H1 → kartu gempa terbaru → CTA → jalan pintas → daftar (carousel/stack) → edukasi.
Navbar jadi hamburger. Target sentuh ≥44px.

## Hindari (tanda khas desain buatan AI)
Eyebrow kecil di atas setiap heading, label huruf kapital ber-tracking, kartu fitur tiga
serangkai yang identik, statistik karangan, form langganan email, ikon dalam kotak
berpojok bulat di atas tiap judul.
