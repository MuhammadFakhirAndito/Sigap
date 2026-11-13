# Screen 04 — Edukasi & Berita  (/edukasi, /edukasi/[slug])   Fase 2

Tujuan: konten mitigasi yang bisa dipercaya, selalu bersumber. Kebutuhan: FR-DB-05, 06, 07, 14.
Semua isi dari database (seed). Dilarang mengarang isi: bila konten seed belum ada,
tampilkan EmptyState jujur dan tandai TODO untuk pemilik proyek. Setiap klaim fakta
mengacu ke `Sumber` (BNPB/BMKG/PVMBG/lainnya).

## Layout (desktop 1440)
1. NotchNavbar ("Edukasi" aktif). Header: H2 satu warna "Edukasi mitigasi gempa" + subcopy satu kalimat.
2. Pemilih kategori: segmented/pill (Semua, Pengertian, Proses, Penanggulangan, Mitigasi, Lainnya)
   -> query string ?kategori=. Target ≥44px.
3. Daftar artikel: baris atau kartu berukuran bervariasi (artikel pertama di kategori boleh lebih besar,
   bukan grid identik). Per item: judul, kategori (chip), ringkasan 1-2 baris, jumlah sumber.
4. Bagian "Berita terkait gempa": daftar metadata (judul, penerbit, tanggal, tautan keluar,
   ringkasan singkat). Tautan buka tab baru dengan label jelas "Buka di {penerbit}".
   Hanya metadata; jangan menyalin isi artikel pihak lain.
5. Bagian "Daftar pustaka": dihasilkan dari tabel Sumber (penerbit, judul, tanggal akses, tautan).

## Halaman artikel (/edukasi/[slug])
Lebar baca ≤72 karakter, body-lg, heading hierarkis semantik. Isi dari markdown di DB (render aman:
tanpa HTML mentah). Di akhir: "Sumber artikel ini" (dari relasi Artikel-Sumber), tombol outline
"Tanyakan ke chatbot" (meneruskan judul artikel sebagai konteks), dan artikel terkait.
Tidak ada gambar dekoratif karangan; ilustrasi hanya bila ada aset sah.

## State
Loading: skeleton daftar. Kosong per kategori: "Belum ada artikel di kategori ini." + tombol "Lihat semua".
DB gagal: ErrorState lokal; navigasi tetap hidup.

## Mobile (390)
Pemilih kategori menjadi baris yang bisa digeser horizontal. Daftar satu kolom.
