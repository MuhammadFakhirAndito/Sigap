# Screen 05 — Chatbot  (/chatbot)   Fase 3

Tujuan: tanya-jawab seputar gempa dan mitigasi, hemat kuota, jujur tentang batasannya.
Kebutuhan: FR-DB-09, 11, 12, 20, 21; TC-DB-04, 05, 13, 18, 19.

## Perilaku (bukan sekadar tampilan)
- Alur jawaban: model utama -> model cadangan -> FAQ (DB) -> FAQ statis (`src/data/fallback`).
  Setiap jawaban membawa `source` (LLM/FALLBACK) dan, bila FALLBACK, label
  "Dijawab dari FAQ" yang terlihat oleh pengguna.
- Sebelum memanggil model: sisipkan ringkasan autogempa terbaru + 3 gempa terakhir
  ke system prompt (lightweight RAG). Bila DB mati, ambil autogempa langsung dari BMKG.
- Rate limit 10 pesan/menit/IP (in-memory dulu). Pesan ditolak: "Terlalu banyak pesan.
  Coba lagi dalam {n} detik." (jangan menyalahkan pengguna).
- Chatbot tidak memberi prediksi gempa dan tidak mengaku sebagai peringatan resmi.
  Untuk darurat: arahkan ke BMKG/BNPB dan nomor darurat setempat. Nomor/kontak
  hanya dari sumber resmi di tabel Sumber; jangan mengarang.
- Konteks dari halaman lain (Simulasi, Edukasi) masuk lewat parameter dan ditampilkan
  sebagai pesan pembuka yang bisa diedit pengguna sebelum dikirim.

## Layout (desktop 1440)
1. NotchNavbar ("Chatbot" aktif).
2. Panel percakapan (surface, radius 28, lebar baca ≤760px, di tengah), tinggi mengisi layar.
   Bubble pengguna `cta`; bubble chatbot `surface-raised`.
3. Awal percakapan (kosong): satu kalimat pengantar + 3-4 contoh pertanyaan sebagai tombol
   pill ("Gempa terakhir di mana?", "Apa yang harus dilakukan saat gempa?", ...).
   Contoh pertanyaan boleh dari FaqGempa aktif.
4. Di bawah tiap jawaban chatbot: 👍/👎 (tombol ≥44px). Setelah dipilih, terkunci dan
   diberi tanda; kirim `chatLogId` ke POST /api/chat/feedback. Satu penilaian per jawaban.
5. Input pill + tombol kirim; Enter kirim, Shift+Enter baris baru. Batas panjang pesan
   dengan penghitung saat mendekati batas.
6. Catatan kecil permanen di bawah input: "Jawaban dapat keliru. Rujuk BMKG untuk informasi resmi."

## State
- Mengetik: indikator "sedang menjawab" (teks + animasi halus, hormati reduced-motion).
- Kuota habis: pesan jelas "Model utama sedang dibatasi, dijawab dari FAQ."
- Rate limit, jaringan putus, dan error server: pesan inline di percakapan + tombol "Coba lagi".
- Percakapan dimuat dari state klien; tidak ada riwayat lintas sesi (tanpa login).

## Aksesibilitas
Area pesan `role="log"` dengan `aria-live="polite"`; fokus kembali ke input setelah kirim;
tombol contoh pertanyaan berurutan fokus logis.

## Mobile (390)
Panel menjadi layar penuh; input menempel di bawah dan tidak tertutup keyboard
(visualViewport). Contoh pertanyaan jadi baris geser horizontal.

## Privasi
Jangan menampilkan IP. Peringatan singkat: "Jangan menulis data pribadi. Percakapan disimpan 30 hari untuk evaluasi."
