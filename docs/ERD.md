# Entity Relationship Diagram (ERD) — SIGAP Gempa

Dokumentasi skema basis data PostgreSQL SIGAP Gempa sesuai [prisma/schema.prisma](../prisma/schema.prisma).

## Gambar ERD

![ERD SIGAP Gempa](./ERD.png)

> Versi vektor juga tersedia di [ERD.svg](./ERD.svg) dan versi PNG resolusi tinggi di [ERD.png](./ERD.png).

## Diagram ERD (Mermaid)

```mermaid
erDiagram
    sumber {
        string id PK "cuid()"
        string judul
        string penerbit
        string url UK
        datetime tanggalAkses
    }

    artikel {
        string id PK "cuid()"
        string slug UK
        string judul
        string ringkasan "nullable"
        KategoriArtikel kategori
        text isi
        int urutan "default 0"
        datetime updatedAt
    }

    skenario_simulasi {
        string id PK "cuid()"
        string nama UK
        float magnitudo
        float kedalamanKm
        float lat
        float lon
        TipeLokasi tipeLokasi
        string deskripsiSingkat "nullable"
        int urutan "default 0"
        string sumberId FK "nullable"
    }

    gempa {
        string id PK "cuid()"
        string bmkgKey UK "DateTime BMKG"
        datetime waktuUtc "indexed DESC"
        float lat
        float lon
        float magnitudo "indexed"
        float kedalamanKm
        string wilayah
        string potensiTeks
        StatusTsunami statusTsunami "default TIDAK_DINYATAKAN"
        string dirasakan "nullable"
        string shakemapUrl "nullable"
        boolean isAuto "default false"
        boolean isTerkini "default false"
        boolean isDirasakan "default false"
        datetime createdAt
        datetime updatedAt
    }

    sync_log {
        string id PK "cuid()"
        string sumber
        string status
        int jumlahBaru "default 0"
        int jumlahDiperbarui "default 0"
        string pesanError "nullable"
        int durasiMs
        datetime createdAt "indexed DESC"
    }

    berita {
        string id PK "cuid()"
        string judul
        string sumber
        string url UK
        datetime tanggalTerbit
        string ringkasan "nullable"
        datetime createdAt
    }

    faq_gempa {
        string id PK "cuid()"
        string_array kataKunci "text[]"
        string pertanyaan UK
        text jawaban
        boolean aktif "default true"
    }

    chat_log {
        string id PK "cuid()"
        text pertanyaan
        text jawaban
        ChatSource source
        string model "nullable"
        int responseTimeMs "nullable"
        boolean isHelpful "nullable"
        string ipHash "nullable HMAC"
        datetime createdAt "indexed DESC"
    }

    kuota_harian {
        string id PK "cuid()"
        string model UK "composite unique"
        date tanggal UK "composite unique"
        int jumlah "default 0"
    }

    artikel }o--o{ sumber : "merujuk (_ArtikelSumber)"
    sumber |o--o{ skenario_simulasi : "menjadi rujukan"
```

## Ringkasan Relasi

| Relasi | Kardinalitas | Implementasi di PostgreSQL |
| :--- | :---: | :--- |
| `artikel` ↔ `sumber` | Many-to-Many (`0..*` : `0..*`) | Tabel penghubung implisit Prisma `_ArtikelSumber` (`A` → `artikel.id`, `B` → `sumber.id`). |
| `sumber` → `skenario_simulasi` | One-to-Many opsional (`0..1` : `0..*`) | Foreign key opsional `skenario_simulasi.sumberId` mengacu ke `sumber.id`. |
| `gempa`, `sync_log`, `berita`, `faq_gempa`, `chat_log`, `kuota_harian` | Entitas mandiri | Tidak memiliki foreign key ke tabel lain; dipakai oleh fitur sinkronisasi BMKG, arsip berita, dan chatbot. |

## Enum

- **`StatusTsunami`:** `AMAN`, `BERPOTENSI`, `TIDAK_DINYATAKAN`
- **`KategoriArtikel`:** `PENGERTIAN`, `PROSES`, `PENANGGULANGAN`, `MITIGASI`, `LAINNYA`
- **`TipeLokasi`:** `DARAT`, `LAUT`
- **`ChatSource`:** `LLM`, `FALLBACK`

## Indeks & Kunci Unik Penting

- **`gempa`:** `UNIQUE(bmkgKey)`, `INDEX(waktuUtc DESC)`, `INDEX(magnitudo)`
- **`sync_log`:** `INDEX(createdAt DESC)`
- **`chat_log`:** `INDEX(createdAt DESC)`
- **`kuota_harian`:** `UNIQUE(model, tanggal)`
- **`artikel`, `sumber`, `berita`, `faq_gempa`, `skenario_simulasi`:** masing-masing memiliki kunci unik (`slug`, `url`, `pertanyaan`, `nama`) untuk mendukung `upsert` seed idempoten.
