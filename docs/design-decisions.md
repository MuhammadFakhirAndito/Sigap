# Catatan Keputusan Desain (Design Decisions Log)

Dokumen ini mencatat setiap pertentangan atau perbedaan antara temuan skill (`antislop`, `impeccable`, `hallmark`) dengan acuan proyek (`PRD-DATABASE.md`, `DESIGN.md`, `AGENTS.md`, atau aturan domain).

| Temuan | Aturan yang Menang | Alasan |
|---|---|---|
| Hallmark sloplint FAIL 20: *No Hallmark stamp on the first non-empty line of any CSS* | `DESIGN.md` & `AGENTS.md` | Desain sistem dan token CSS-first `@theme` telah dikunci sepenuhnya oleh `DESIGN.md`. Penambahan Hallmark stamp watermark tidak diperkenankan karena sistem tidak menggunakan tema katalog eksternal Hallmark. |

