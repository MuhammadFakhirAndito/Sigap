# SIGAP Gempa — Agent Rules

## Produk
Website informasi gempa bumi Indonesia: data BMKG + riwayat, simulasi dampak
(edukasi), chatbot kontekstual, edukasi mitigasi. Pengguna: masyarakat umum,
pelajar, mahasiswa. Juga bahan laporan kuliah. Bahasa UI: Indonesia. Waktu: WIB.
Koordinat: LS/BT. Tanpa login, tanpa halaman admin.

## Sumber kebenaran (baca sebelum menulis kode)
1. PRD-DATABASE.md (v1.1) — fitur, data, keputusan, uji. PRD.md hanyalah ringkasan
   produk yang DIBUAT ULANG (PRD utama asli tidak ada); butir bertanda [ASUMSI] di
   dalamnya harus ditanyakan ke saya. Jika bentrok, PRD-DATABASE.md menang.
2. DESIGN.md — token dan aturan visual. Jangan hardcode warna/radius/spacing.
3. docs/screens/*.md — layout per screen.
Jika sesuatu tidak ada di ketiganya: TANYA, jangan mengarang fitur, angka, atau rumus.

## Stack
Next.js (App Router) + TypeScript strict, Tailwind v4 (CSS-first `@theme`),
PostgreSQL + Prisma (singleton client), Redis opsional (fase 5), Docker Compose,
Caddy opsional. MySQL TIDAK dipakai. Ikuti dokumentasi resmi untuk versi
Prisma/Next.js yang terpasang; jangan menebak API dari ingatan.

## Fase (kerjakan berurutan, satu fase = satu task, plan dulu)
1 Docker+Postgres+Prisma, Gempa, SyncLog, sinkronisasi BMKG, halaman riwayat,
  fallback, /api/health
2 Konten: Berita, Artikel, Sumber, FaqGempa, seed idempoten, FAQ statis
3 Chatbot: fallback bertingkat, ChatLog, KuotaHarian, rate limit, konteks gempa, 👍/👎
4 Simulasi: SkenarioSimulasi, halaman simulasi, tautan riwayat <-> simulasi <-> chatbot
5 Redis (opsional, boleh dilewati)
6 Hardening: backup+restore, firewall, uji penerimaan TC-DB-01..20
Beranda dan design system dibangun bersama fase 1.

## Aturan data & keamanan (WAJIB)
- `autogempa` diambil langsung dari BMKG dengan cache (`revalidate`), bukan lewat DB.
- Upsert Gempa dengan kunci unik `bmkgKey` (= DateTime BMKG). Flag isAuto/isTerkini/
  isDirasakan hanya DINYALAKAN, tidak pernah ditimpa. Normalisasi defensif; simpan
  `potensiTeks` asli. Catat setiap sinkronisasi di SyncLog.
- `POST /api/sync` hanya dengan header SYNC_SECRET (401 jika tidak ada).
  `/api/health` publik hanya `healthy`/`degraded`; detail hanya dengan secret.
- Postgres/Redis tidak dibuka ke publik (bind 127.0.0.1 atau jaringan internal Docker;
  jangan mengandalkan ufw saja). User DB khusus `sigap`, bukan superuser.
- Rahasia di `.env`, tidak di-commit, tidak masuk bundel klien. IP chat disimpan
  sebagai HMAC (LOG_HMAC_SECRET). ChatLog dihapus setelah 30 hari (cron).
- Feedback 👍/👎: satu penilaian per `chatLogId` (cuid); tolak id palsu atau penilaian ganda.
- Seed idempoten (upsert). Angka preset simulasi hanya dari sumber resmi yang
  tercatat di `Sumber`; JANGAN mengisi angka dari ingatan — tandai TODO dan tanya.

## Aturan degradasi
- Beranda tetap tampil bila DB/Redis mati (tidak ada error layar penuh).
- Riwayat saat BMKG gagal: tampilkan data DB + "data terakhir disinkronkan <waktu>"
  dari baris SyncLog `OK` terbaru.
- Chatbot: model utama -> cadangan -> FAQ (DB) -> FAQ statis di `src/data/fallback`,
  dengan pesan jelas. Tangani 429. Rate limit 10 pesan/menit/IP.
- Zona waktu reset kuota Gemini = konstanta yang mudah diganti; BELUM diverifikasi.

## Aturan domain
- Semua data gempa menampilkan sumber "BMKG" + waktu pembaruan.
- Jangan pernah mengklaim sebagai peringatan dini resmi.
- Semua hasil simulasi berlabel "Estimasi edukasi, bukan data resmi BMKG".
- Hitungan simulasi 100% di klien; mengubah parameter tidak boleh memicu kueri DB.
- Rumus MMI belum dipilih: usulkan 1-2 kandidat berikut sitasi, tunggu persetujuan,
  lalu tulis di komentar kode + docs/rumus-simulasi.md.
- Dilarang lorem ipsum.

## Aturan desain (ringkas; detail di DESIGN.md)
Flat tanpa drop shadow/gradient dekoratif. Tanpa #000/#FFF murni. Spacing
kelipatan 4/8. Aksen primary hanya untuk keyword headline, magnitudo, status
penting. WCAG AA, focus ring jelas, target sentuh >=44px, status tidak hanya
warna. Skeleton untuk loading; state error + empty untuk tiap fetch. Hormati
`prefers-reduced-motion`.

## Cara kerja
- Satu fase/screen per task: tulis implementation plan + asumsi + pertanyaan,
  tunggu persetujuan saya.
- Komponen kecil di `components/`, logika di `lib/`, tanpa `any`.
- Jangan menambah dependency besar (mis. library chart/peta) tanpa izin.
- Selesai: lint + typecheck + uji terkait (TC-DB-xx), screenshot desktop (1440) dan
  mobile (390), bandingkan dengan spec, laporkan penyimpangan dengan jujur.
- Tulis keterbatasan yang ditemukan agar bisa masuk laporan.

## Skills (anti-slop, impeccable, hallmark)
Urutan otoritas: PRD-DATABASE.md > aturan domain/keamanan di file ini > DESIGN.md > skill.
Skill adalah FILTER dan PEMERIKSA, bukan pengarah desain. DESIGN.md sudah mengunci
arah visual; jangan biarkan skill mengganti token, font, atau layout.

- **antislop**: aktif sepanjang sesi, mode `during`. Terapkan pada UI, copy
  Indonesia, dan komentar kode (hapus komentar yang hanya mengulang kode; PERTAHANKAN
  komentar yang menjelaskan "kenapa", termasuk sumber rumus). Akhiri tiap fase/screen
  dengan Delivery Gate (laporan PASS/FAIL). Jika hasil terasa steril, itu berarti
  arahnya kurang (R-37): rujuk DESIGN.md, jangan menambah dekorasi.
- **impeccable**: PRODUCT.md dibuat dari PRD (jangan menanyakan ulang yang sudah ada di
  PRD). DESIGN.md sudah ada: JANGAN jalankan `document` atau menimpanya. Jangan
  memakai "roll"/pilihan visual world; arah sudah dikunci. `buildPath` = `code`.
  Per screen: `shape` → bangun → `npx impeccable detect src/` → `critique` → `audit`
  → `harden` (error, empty, overflow teks) → `polish`. Antigravity tidak punya hook
  otomatis impeccable, jadi `detect` dijalankan manual.
- **hallmark**: HANYA mode `audit` dan `sloplint --render` (delapan lebar layar) serta
  peninjau konteks-segar. JANGAN `build`, `redesign`, atau menarik tema dari katalog;
  itu menimpa DESIGN.md. Bila perlu memperbaiki temuan, pakai mode `polish` (hanya
  tanda khas AI). Jangan pakai pustaka foto hallmark.
- Maksimal 2 putaran perbaikan per screen. Sisa temuan dilaporkan, tidak dikejar tanpa batas.
- Jika temuan skill bertentangan dengan PRD/DESIGN.md/aturan domain: JANGAN menurut
  diam-diam dan JANGAN mengabaikan diam-diam. Catat di `docs/design-decisions.md`
  (temuan, alasan overrule, aturan yang menang) dan lanjutkan.
- Semua angka di UI berasal dari data, bukan dikarang (tanda khas AI sekaligus
  pelanggaran domain).
