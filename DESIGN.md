---
name: SIGAP Gempa
description: Platform info gempa BMKG, riwayat, simulasi dampak, chatbot, dan edukasi mitigasi untuk masyarakat Indonesia.
version: 1.1
colors:
  primary: "#B7410E"
  primary-strong: "#9A3412"
  on-primary: "#FFFDFB"
  background: "#F6F4F1"
  surface: "#E8E4DF"
  surface-sunken: "#D8D3CC"
  surface-raised: "#FFFDFB"
  cta: "#1A1613"
  on-cta: "#FFFDFB"
  text-primary: "#1A1613"
  text-secondary: "#5E5750"
  border: "#C4BDB4"
  border-strong: "#7A726A"
  success: "#15803D"
  success-strong: "#166534"
  warning: "#B45309"
  warning-strong: "#92400E"
  error: "#B91C1C"
  error-strong: "#991B1B"
typography:
  display:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 4rem
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -0.03em
  h2:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 2.75rem
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -0.03em
  h3:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 2rem
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: -0.02em
  h4:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 1.25rem
    fontWeight: 600
    lineHeight: 1.4
  stat-xl:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 5rem
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  stat:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 3.5rem
    fontWeight: 600
    lineHeight: 1
    fontFeature: "tnum"
  body-lg:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 1.125rem
    fontWeight: 400
    lineHeight: 1.75
  body-md:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.5
  body-sm:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 0.875rem
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans"
    fontSize: 0.75rem
    fontWeight: 500
    lineHeight: 1.33
    letterSpacing: 0.01em
rounded:
  sm: 8px
  md: 16px
  lg: 28px
  xl: 40px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 80px
motion:
  fast: 150ms
  base: 200ms
  slow: 300ms
  easing: "cubic-bezier(0.2, 0, 0, 1)"
components:
  button-cta:
    backgroundColor: "{colors.cta}"
    textColor: "{colors.on-cta}"
    rounded: "{rounded.full}"
    padding: "16px 32px"
    minHeight: 48px
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-strong}"
    rounded: "{rounded.full}"
    padding: "12px 24px"
    minHeight: 44px
  icon-button:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.full}"
    size: 44px
  panel-hero:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  card-raised:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    padding: "{spacing.lg}"
  chip:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.md}"
    padding: "16px"
  input:
    backgroundColor: "{colors.surface-raised}"
    textColor: "{colors.text-primary}"
    borderColor: "{colors.border-strong}"
    rounded: "{rounded.full}"
    padding: "12px 20px"
    minHeight: 44px
  badge:
    rounded: "{rounded.full}"
    padding: "4px 12px"
---

## Overview

SIGAP Gempa menyajikan informasi kebencanaan. Antarmukanya harus **tenang, editorial, dan tepercaya**: data jadi pusat perhatian, ruang kosong banyak, dan tidak ada elemen yang bernada panik. Pengguna utama adalah masyarakat umum Indonesia serta pelajar/mahasiswa, jadi bahasa visualnya bersih dan mudah dipindai, bukan dashboard teknis yang padat.

Arah visual: Minimalist / Editorial dengan kartu lembut bergaya bento, canvas abu-abu hangat, panel besar yang melengkung (pillowy), navbar berbentuk notch, satu headline dua warna di Beranda, dan satu aksen rust-orange. Mood: calm, trustworthy, educational. Aksen hijau dihindari karena terbaca "aman" dan tidak cocok untuk konteks gempa.

## Colors

Tiga lapisan permukaan menggantikan shadow: `background` (#F6F4F1) → `surface` (#E8E4DF) → `surface-raised` (#FFFDFB). `surface-sunken` (#D8D3CC) dipakai untuk trek slider dan segmen skala yang belum terisi.

- **primary** (rust-orange) dipakai HANYA untuk: kata kunci headline, angka magnitudo/MMI, dan penanda status penting. Bukan untuk dekorasi dan bukan untuk CTA.
- **cta** (#1A1613) adalah warna semua aksi utama (tombol pill hitam, tombol ↗ bulat).
- Teks kecil (<18px reguler) berwarna aksen memakai `primary-strong`, bukan `primary`, agar lolos AA di atas `surface`.
- Semantic color dipakai hanya untuk status data (sinkronisasi, tsunami, error). Di atas `surface`, teks status memakai varian `*-strong`; varian dasar hanya untuk ikon, titik, dan teks di atas `surface-raised`/`background`.
- Status tidak boleh dibedakan hanya dengan warna: selalu sertakan ikon + teks.

Rasio kontras terukur (WCAG, dihitung dari token ini):

| Pasangan | Rasio | Catatan |
|---|---|---|
| text-primary di background / surface / raised | 16.4 / 14.2 / 17.7 | AAA |
| text-secondary di background / surface / raised | 6.5 / 5.6 / 7.0 | AA |
| primary-strong di background / surface / raised | 6.7 / 5.8 / 7.2 | AA, aman untuk teks kecil |
| primary di background / raised | 5.1 / 5.5 | AA |
| primary di surface | 4.4 | HANYA teks besar (≥24px / ≥18.66px bold) |
| on-primary di primary | 5.5 | AA |
| on-cta di cta | 17.7 | AAA |
| success / warning di raised | 4.9 / 5.0 | AA |
| success / warning di surface | 4.0 / 4.0 | gunakan `*-strong` (≥5.6) untuk teks |
| border-strong di raised / surface / sunken | 4.7 / 3.7 / 3.2 | memenuhi 3:1 untuk batas kontrol |

Semua netral memiliki tint hangat tipis (mengarah ke hue aksen) supaya tidak terbaca sebagai abu-abu murni. Rasio di atas dihitung ulang dari nilai token ini.

`border` (#C4BDB4, ~1.7:1) hanya untuk garis dekoratif (pemisah). Batas tombol outline dan input memakai `border-strong` agar terlihat jelas.

## Typography

Satu keluarga: **Plus Jakarta Sans** (dimuat lewat `next/font`, fallback `system-ui, sans-serif`). Headline besar memakai tracking negatif. Pola **dua warna** (sebagian kata `primary`, sisanya `text-primary`) dipakai MAKSIMAL SATU kali per halaman, hanya pada H1 Beranda, dan bagian berwarnanya harus frasa ≥2 kata (contoh: "**Pantau gempa terkini,** siap menghadapi yang berikutnya"). Semua H2 dan H3 satu warna. Alasan: kata tunggal berwarna di setiap heading adalah tanda khas desain buatan AI.

- Semua angka data (magnitudo, kedalaman, koordinat, energi, waktu rambat, MMI) memakai tabular figures (`font-variant-numeric: tabular-nums`).
- Body minimal weight 400 dan 16px; teks tipis (<400) tidak dipakai agar mudah dibaca di layar ponsel.
- Skala heading mengecil ke ponsel: display 40px, H2 32px, H3 24px, stat-xl 64px.
- Format lokal Indonesia: tanggal "10 Nov 2026", jam "07:42 WIB", desimal koma ("5,2"), koordinat "7,12 LS, 106,88 BT". Energi memakai notasi ilmiah ("2,0 × 10¹⁵ J").

## Spacing & Layout

Grid 4px; skala 4 / 8 / 16 / 24 / 32 / 48 / 80. Lebar konten maksimum 1280px dengan kolom 12 (desktop), 8 (tablet), 4 (ponsel). Panel hero berlebar ±1220px di tengah canvas. Padding kartu 24px, gap antar kartu 20px, padding hero 32px, jarak antar section 80px (48px di ponsel).

Layout asimetris dengan satu titik fokus per screen (Beranda: kartu gempa terbaru; Riwayat: daftar; Simulasi: kartu MMI). Hierarki dibuat lewat ukuran, kontras, dan posisi, bukan dekorasi. Jarak di atas heading selalu lebih besar daripada di bawahnya. Paragraf memakai satu sistem pemisah (gap), bukan campuran indent dan gap.

Breakpoint: sm 640, md 768, lg 1024, xl 1280. Desktop-first; ponsel adalah target utama pengguna umum, sehingga semua screen wajib diuji di 390px.

## Shapes

Hierarki radius: container besar (40px) → kartu (28px) → chip (16px) → kontrol (pill). Semakin besar container, semakin besar radius. Radius elemen di dalam kartu mengikuti `radius kartu − padding`, minimum 8px. Tombol, input, badge, dan tombol ikon selalu pill/lingkaran.

## Elevation & Depth

Flat. Tidak ada drop shadow dan tidak ada gradient dekoratif. Kedalaman hanya dari lapisan warna surface. Satu-satunya pengecualian: scrim gelap di bawah foto/peta yang memuat teks agar kontras terjaga. Hairline 1px `border` boleh untuk pemisah.

## Components

**NotchNavbar.** Pill putih yang menyatu dengan sisi atas panel hero (bentuk cutout/notch). Logo kiri (ikon gelombang seismik dalam lingkaran + "SIGAP Gempa"), tautan tengah: Beranda, Riwayat, Simulasi, Chatbot, Edukasi. Link aktif bold. Kanan: tombol ikon. Di ponsel menjadi hamburger dengan panel penuh; tautan tetap berurutan sama.

**Tombol.** CTA hitam pill (boleh memuat thumbnail bulat di ujung kanan), outline pill dengan `border-strong`, tombol ikon bulat 44px (putih di atas abu-abu, hitam di atas foto/kartu abu). Tombol ↗ pada kartu: bulat, hitam, 44px.

**QuakeCard.** Kartu `surface` radius 28. Nama lokasi kiri bawah, waktu atau nilai kanan bawah, badge magnitudo, tombol ↗ kanan atas. Hover: berubah ke `surface-raised`, tombol ↗ membesar 1.05, 200ms.

**MagnitudeBadge.** Angka magnitudo tabular dalam `primary` pada `surface-raised`; ukuran mengikuti konteks (stat-xl di kartu gempa terbaru).

**StatusBadge.** Pill dengan ikon + teks. Varian: sinkron OK (success), data lama/BMKG gagal (warning), tsunami "Tidak berpotensi" (success), "Berpotensi tsunami" (error), "Tidak dinyatakan" (netral). Teks status di atas `surface` memakai varian `*-strong`.

**FilterBar.** Panel `surface` radius 28. Select/segmented untuk magnitudo, dua input tanggal, input pencarian wilayah (pill, ikon search), tombol Reset (outline). Di ponsel menjadi panel collapsible.

**HistoryRow.** Baris dalam daftar (bukan grid): magnitudo, wilayah, waktu, kedalaman, koordinat, StatusBadge tsunami, tombol outline "Simulasikan". Pemisah antar baris berupa jarak dan lapisan warna, bukan garis tebal.

**Pagination.** Prev/next + nomor ringkas; target ≥44px; halaman aktif hitam pill.

**Slider & Input angka (Simulasi).** Trek `surface-sunken`, bagian terisi `cta`, handle putih dengan batas `border-strong`, nilai terbaca di input angka tabular di sampingnya. Wajib bisa dipakai keyboard (panah, Home/End) dan memiliki `aria-valuetext` yang menyertakan satuan.

**MmiCard.** Kartu fokus Simulasi: angka Romawi sangat besar (stat-xl, `primary`), deskripsi dampak dalam teks, dan skala 12 segmen. Segmen terisi `primary`, sisanya `surface-sunken`, setiap segmen berlabel teks (I–XII) sehingga tidak bergantung pada warna.

**TravelTimeCard.** Dua bar horizontal (gelombang P dan S) dengan angka detik dan "Golden time" besar. Animasi bar bersifat opsional dan dimatikan jika `prefers-reduced-motion`.

**ChatBubble.** Bubble pengguna `cta` dengan teks putih; bubble chatbot SIGAP `surface-raised`. Radius 20px dengan sudut kecil 8px di sisi pengirim. Tombol 👍/👎 pill kecil di bawah jawaban, ≥44px, hanya satu penilaian per jawaban (setelah dipilih, tombol terkunci dan diberi tanda). Tampilkan indikator "dijawab dari FAQ" bila `source = FALLBACK` agar pengguna paham asalnya.

**ArticleCard / BeritaItem.** Mengikuti QuakeCard; kategori sebagai chip; tautan sumber selalu terlihat dengan nama penerbit dan tanggal.

**Skeleton, EmptyState, ErrorState.** Wajib untuk setiap data fetch. Skeleton memakai blok `surface-sunken` berbentuk elemen aslinya (bukan spinner). EmptyState berisi satu kalimat penjelas dan satu aksi. ErrorState menyebut apa yang gagal dan menyediakan tombol coba lagi; tidak pernah layar penuh jika sebagian data masih bisa ditampilkan.

**Disclaimer & atribusi.** Setiap blok data memuat "Sumber: BMKG · diperbarui {waktu}". Footer: "Situs ini bukan sistem peringatan dini resmi." Hasil simulasi memuat pill tetap "Estimasi edukasi, bukan data resmi BMKG" di area hasil (bukan tooltip).

## Motion & Interaction

Durasi: 150ms (micro), 200ms (hover/transisi kartu), 300ms (panel). Easing `cubic-bezier(0.2, 0, 0, 1)`. Gerak dipakai hanya untuk memberi umpan balik (hover, fokus, perubahan nilai), tidak untuk dekorasi. Semua animasi dimatikan atau disederhanakan saat `prefers-reduced-motion: reduce`. Tidak ada animasi berkedip atau bergetar yang menyerupai alarm. Fokus keyboard: ring 2px `primary-strong`, offset 2px, terlihat di semua elemen interaktif.

## Accessibility

Target WCAG 2.2 AA. Teks ≥4.5:1 (≥3:1 untuk teks besar); batas kontrol dan ikon fungsional ≥3:1. Target sentuh ≥44×44px. HTML semantik (`header`, `nav`, `main`, `section`, `footer`, `button`). Grafik memiliki alternatif teks atau tabel ringkas. Perubahan hasil simulasi diumumkan ke pembaca layar dengan `aria-live="polite"` yang dibatasi frekuensinya (debounce). Bahasa dokumen `lang="id"`.

## Do's and Don'ts

- Jangan pakai drop shadow atau gradient dekoratif.
- Jangan pakai #000, #FFF, atau abu-abu netral murni. Semua netral memakai token bertint hangat di atas.
- Jangan menaruh kartu di dalam kartu kecuali kartu fokus di dalam panel hero (dan StatusBadge/chip yang kecil). Jangan membungkus semuanya dengan kartu.
- Jangan pakai angka, persentase, atau klaim yang dikarang di UI; semua angka berasal dari data (BMKG/DB) atau dihitung klien.
- Jangan menyajikan konten sebagai peringatan dini resmi; selalu sertakan atribusi BMKG.
- Jangan menampilkan hasil simulasi tanpa label "Estimasi edukasi".
- Jangan memakai warna sebagai satu-satunya pembeda status.
- Jangan memakai primary untuk CTA atau dekorasi.
- Jangan memakai lorem ipsum; gunakan data riil atau fixture realistis.
- Jangan menaruh teks di atas foto tanpa scrim gelap yang menjaga kontras ≥4.5:1.
- Jangan membuat animasi yang berkedip atau berkesan alarm.
