# Catatan Keputusan Desain (Design Decisions Log)

Dokumen ini mencatat setiap pertentangan atau perbedaan antara temuan skill (`antislop`, `impeccable`, `hallmark`) dengan acuan proyek (`PRD-DATABASE.md`, `DESIGN.md`, `AGENTS.md`, atau aturan domain).

| Temuan | Aturan yang Menang | Alasan |
|---|---|---|
| Hallmark sloplint FAIL 20: *No Hallmark stamp on the first non-empty line of any CSS* | `DESIGN.md` & `AGENTS.md` | Desain sistem dan token CSS-first `@theme` telah dikunci sepenuhnya oleh `DESIGN.md`. Penambahan Hallmark stamp watermark tidak diperkenankan karena sistem tidak menggunakan tema katalog eksternal Hallmark. |
| Baris daftar (`HistoryRow`) vs Grid kartu kartu identik | `docs/02-riwayat.md` & `AGENTS.md` | Riwayat gempa disajikan dalam format baris terstruktur di desktop dan kartu vertikal bertumpuk di mobile, bukan grid kartu identik (menghindari visual repetitif/slop). |
| Visualisasi grafik distribusi magnitudo | `AGENTS.md` & `docs/02-riwayat.md` | Dibuat dengan SVG dan CSS native tanpa library grafik pihak ketiga untuk performa maksimal (<300 ms) dan ukuran bundel ringan, dilengkapi tabel semantik `sr-only` untuk a11y. |
| Degradasi anggun database padam (TC-DB-03) | `PRD-DATABASE.md` & `AGENTS.md` | Saat database tidak terjangkau, Riwayat menampilkan komponen `ErrorState` lokal di dalam kontainer utama dengan tombol muat ulang, tanpa merusak navbar atau menyebabkan error 500 layar penuh. |

