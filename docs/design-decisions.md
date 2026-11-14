# Catatan Keputusan Desain (Design Decisions Log)

Dokumen ini mencatat setiap pertentangan atau perbedaan antara temuan skill (`antislop`, `impeccable`, `hallmark`) dengan acuan proyek (`PRD-DATABASE.md`, `DESIGN.md`, `AGENTS.md`, atau aturan domain).

| Temuan | Aturan yang Menang | Alasan |
|---|---|---|
| Hallmark sloplint FAIL 20: *No Hallmark stamp on the first non-empty line of any CSS* | `DESIGN.md` & `AGENTS.md` | Desain sistem dan token CSS-first `@theme` telah dikunci sepenuhnya oleh `DESIGN.md`. Penambahan Hallmark stamp watermark tidak diperkenankan karena sistem tidak menggunakan tema katalog eksternal Hallmark. |
| Baris daftar (`HistoryRow`) vs Grid kartu kartu identik | `docs/02-riwayat.md` & `AGENTS.md` | Riwayat gempa disajikan dalam format baris terstruktur di desktop dan kartu vertikal bertumpuk di mobile, bukan grid kartu identik (menghindari visual repetitif/slop). |
| Visualisasi grafik distribusi magnitudo | `AGENTS.md` & `docs/02-riwayat.md` | Dibuat dengan SVG dan CSS native tanpa library grafik pihak ketiga untuk performa maksimal (<300 ms) dan ukuran bundel ringan, dilengkapi tabel semantik `sr-only` untuk a11y. |
| Degradasi anggun database padam (TC-DB-03) | `PRD-DATABASE.md` & `AGENTS.md` | Saat database tidak terjangkau, Riwayat menampilkan komponen `ErrorState` lokal di dalam kontainer utama dengan tombol muat ulang, tanpa merusak navbar atau menyebabkan error 500 layar penuh. |



## Fase 2 — Halaman Edukasi & Seed Konten

| Aspek | Temuan Skill / Audit | Aturan / Konteks yang Menang | Keputusan |
| --- | --- | --- | --- |
| Tipografi (`overused-font`) | `impeccable detect` menandai `Plus Jakarta Sans` 100% sebagai font umum. | `AGENTS.md`: `DESIGN.md > skill` & konsistensi lintas halaman dengan Fase 1 (`src/app/layout.tsx`). | **Overrule**: Pertahankan kombinasi `Outfit` + `Plus Jakarta Sans` dari Fase 1 agar tipografi konsisten antara Beranda, Riwayat, dan Edukasi. |
| Token Permukaan & Kontras Komponen Bersama | `impeccable detect` & `audit` menemukan `#6f6f68` pada `#f1f1ee` (`4.47:1`, di bawah `4.5:1`) di `Footer` serta `--color-surface: #EBEBE6` vs `DESIGN.md` (`#F5F5F1`). | Batasan cakupan Fase 2 (hindari regresi komponen bersama Fase 1 tanpa persetujuan lintas fase) & WCAG 2.2 AA pada komponen Edukasi. | **Scoped Fix + Log**: Komponen/state baru Edukasi menggunakan `--color-surface-strong` (`#FFFFFF`, rasio `5.06:1`), focus ring `--color-primary-hover` (`#5A8C00`, `>=3.88:1`), dan border kontrol `--color-text-muted` (`#8B8B85`, `>=3.28:1`). Temuan pada `Footer.tsx`, `NotchNavbar.tsx`, dan `globals.css` dicatat sebagai temuan terbuka. |
| Lebar Kolom Baca (`line-length`) | `impeccable detect` masih menandai ~87 karakter pada 2 dari 5 baris render pada `/edukasi/apa-itu-gempa-bumi` setelah diturunkan dari ~92 menjadi `max-w-[58ch]`. | `docs/04-edukasi.md` (`<=72ch`) & batas maksimal 2 putaran perbaikan di `AGENTS.md`. | **Diterima dengan Batas**: Container prose dikunci pada `max-w-[58ch]` (`18px` desktop). Karena lebar glif huruf kecil `Plus Jakarta Sans` lebih sempit daripada `'0'` (`1ch`), beberapa baris padat masih mencapai ~87 karakter; diselesaikan di Putaran 2 tanpa over-narrowing. |
| Tautan CTA ke `/chatbot` sebelum Fase 3 | `antislop` R-24/R-26 melarang tautan menuju rute yang belum ada (`404`). | `docs/04-edukasi.md` mewajibkan tombol outline `"Tanyakan ke chatbot"` ke `/chatbot?q={judul}` & pola Fase 1 (`/simulasi`). | **Selaras Pola Fase 1**: Menambahkan halaman placeholder ringan `src/app/chatbot/page.tsx` yang menerima query `?q=` hingga modul chatbot dibangun pada Fase 3. |
| Heading Halaman Utama Edukasi | `docs/04-edukasi.md` menyebut "Judul halaman (H2, satu warna)" sedangkan WCAG/`antislop` R-39 mewajibkan satu `<h1>` per halaman. | WCAG 2.2 A / `antislop` R-39 (semantik) + skala visual `docs/04-edukasi.md`. | **Semantik + Visual Match**: Memakai elemen semantik `<h1>` dengan skala tampilan H2/display satu warna (`text-[var(--color-text-primary)]`). |
| Render Tier `hallmark sloplint` | `sloplint --render` gagal menjalankan Puppeteer internal karena `puppeteer-core` tidak terpasang. | `AGENTS.md`: dilarang menambah dependency besar tanpa izin. | **Alternatif Observasi**: Melaksanakan audit render 8 lebar layar (`320`–`1440`) langsung via skrip CDP Chrome (`scripts/capture-edukasi-states.js`) dan mencatat limitasi `sloplint --render` secara jujur. |
