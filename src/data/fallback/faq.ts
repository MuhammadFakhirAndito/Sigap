/**
 * SIGAP - Static Emergency FAQ Fallback (FR-DB-08, TC-DB-13)
 * FAQ statis inti yang disematkan langsung di dalam kode aplikasi.
 * Berfungsi sebagai garis pertahanan terakhir ketika database PostgreSQL offline / tidak terjangkau.
 */

export interface StaticFaqItem {
  id: string;
  kataKunci: string[];
  pertanyaan: string;
  jawaban: string;
}

export const STATIC_FALLBACK_FAQS: StaticFaqItem[] = [
  {
    id: 'static-drop-cover-hold',
    kataKunci: ['drop', 'cover', 'hold on', 'lindung', 'merunduk', 'meja', 'dalam ruangan', 'saat gempa', 'protokol'],
    pertanyaan: 'Apa protokol keselamatan Drop, Cover, and Hold On?',
    jawaban: `Protokol keselamatan internasional saat merasakan guncangan gempa bumi:
1. **DROP (Merunduk)**: Segera turunkan posisi tubuh ke lantai sebelum guncangan menjatuhkan Anda.
2. **COVER (Berlindung)**: Lindungi kepala dan leher Anda. Masuklah ke bawah meja yang kokoh. Jika tidak ada meja, lindungi kepala dengan lengan di sudut ruangan yang jauh dari kaca.
3. **HOLD ON (Pegang Erat)**: Pegang kaki meja atau pelindung Anda dengan kuat hingga guncangan benar-benar berhenti.
Hindari penggunaan lift, jauhi jendela kaca, dan jangan langsung berlari panik ke luar gedung tinggi saat guncangan masih berlangsung.`,
  },
  {
    id: 'static-tsunami-risk',
    kataKunci: ['tsunami', 'potensi tsunami', 'kapan tsunami', 'syarat tsunami', 'pantai', 'air laut surut'],
    pertanyaan: 'Kapan gempa bumi berpotensi memicu gelombang tsunami?',
    jawaban: `Gempa bumi berpotensi tsunami umumnya memenuhi kriteria berikut:
1. **Magnitudo Kuat**: Berkekuatan M 7.0 ke atas.
2. **Pusat Hiposentrum Dangkal**: Kedalaman hiposentrum kurang dari 60–70 km di bawah kerak bumi.
3. **Pusat Gempa di Dasar Laut**: Episentrum berada di laut atau wilayah pesisir pantai.
4. **Mekanisme Patahan Vertikal**: Terjadi pergeseran sesar naik (thrust fault) atau sesar turun (normal fault) yang mengubah volume dasar laut secara mendadak.
Tanda alami di pantai: Air laut surut secara cepat dan tidak wajar, atau terdengar suara gemuruh keras dari arah laut. Segera evakuasi ke tempat tinggi tanpa menunggu sirene resmi.`,
  },
  {
    id: 'static-tas-siaga',
    kataKunci: ['tas siaga', 'tsb', 'perbekalan', 'perlengkapan', 'isi tas', 'darurat keluarga'],
    pertanyaan: 'Apa saja barang yang wajib ada di dalam Tas Siaga Bencana (TSB)?',
    jawaban: `Tas Siaga Bencana (TSB) disiapkan untuk bertahan hidup mandiri minimal 72 jam (3 hari pertama):
1. **Dokumen Penting**: Fotokopi KTP, KK, akta, surat tanah, ijazah dalam kantong plastik kedap air.
2. **Logistik Dasar**: Air mineral botol (minimal 2 liter/orang) dan makanan siap saji tahan lama (biskuit, kornet, abon).
3. **Kotak P3K & Obat Pribadi**: Perban, plester, antiseptik, parasetamol, dan obat rutin keluarga.
4. **Penerangan & Komunikasi**: Senter LED cadangan, baterai ekstra, peluit darurat untuk meminta pertolongan, dan power bank.
5. **Perlengkapan Higienis & Pakaian**: Masker medis, hand sanitizer, sabun, pakaian ganti hangat, dan jas hujan plastik.
6. **Uang Tunai**: Pecahan kecil secukupnya untuk transaksi darurat saat listrik/ATM padam.`,
  },
  {
    id: 'static-nomor-darurat',
    kataKunci: ['nomor darurat', 'telepon penting', 'kontak bantuan', 'bnpb', 'basarnas', 'ambulans', 'polisi'],
    pertanyaan: 'Berapa nomor telepon darurat kebencanaan di Indonesia?',
    jawaban: `Daftar nomor darurat resmi di Indonesia:
- **112**: Nomor Panggilan Darurat Terpadu Nasional (Bebas Pulsa)
- **115**: BASARNAS (Pencarian dan Pertolongan Nasional)
- **117**: BNPB (Pusat Pengendalian Operasi Kebencanaan)
- **119**: Ambulans & Layanan Gawat Darurat Medis
- **110**: Kepolisian Republik Indonesia
- **113**: Pemadam Kebakaran`,
  },
  {
    id: 'static-setelah-gempa',
    kataKunci: ['setelah gempa', 'pasca gempa', 'susulan', 'evaluasi', 'keluar ruangan', 'gas bocor'],
    pertanyaan: 'Apa yang harus dilakukan setelah guncangan gempa berhenti?',
    jawaban: `Langkah aman setelah guncangan gempa berhenti:
1. **Evakuasi Teratur**: Segera keluar dari bangunan melalui tangga darurat dengan tertib, jangan menggunakan lift.
2. **Periksa Jalur Utilitas**: Matikan kompor gas, regulator LPG, dan sekring listrik utama untuk mencegah kebakaran.
3. **Waspadai Bahaya Sekunder**: Hindari tiang listrik miring, dinding retak, dan baliho reklame.
4. **Antisipasi Gempa Susulan**: Jangan buru-buru masuk kembali ke dalam bangunan yang sudah retak struktur.
5. **Akses Informasi Valid**: Pantau informasi resmi hanya dari aplikasi/kanal resmi BMKG, BNPB, dan BPBD setempat.`,
  },
];

/**
 * Cari jawaban FAQ dari data statis di kode jika database tidak aktif
 */
export function getStaticFaqFallback(pertanyaan: string): string | null {
  const lowerQ = pertanyaan.toLowerCase();
  const words = lowerQ.split(/[\s,?.!]+/).filter((w) => w.length > 2);

  let bestFaq: StaticFaqItem | null = null;
  let highestScore = 0;

  for (const faq of STATIC_FALLBACK_FAQS) {
    let score = 0;
    for (const kw of faq.kataKunci) {
      const kwLower = kw.toLowerCase();
      if (lowerQ.includes(kwLower)) {
        score += 3;
      } else {
        for (const word of words) {
          if (kwLower.includes(word) || word.includes(kwLower)) {
            score += 1;
          }
        }
      }
    }

    if (score > highestScore) {
      highestScore = score;
      bestFaq = faq;
    }
  }

  if (bestFaq && highestScore >= 2) {
    return `[FAQ Tanggap Darurat Statis SIGAP]\n\n${bestFaq.jawaban}`;
  }

  return `[Pusat Siaga Bencana SIGAP - Mode Statis]\n\nLayanan basis data saat ini sedang offline, namun Anda tetap dilindungi panduan darurat mandiri:
1. Segera lakukan prosedur Drop, Cover, and Hold On bila guncangan kembali terasa.
2. Jauhi bangunan bertingkat retak dan kawasan lereng rawan longsor.
3. Segera evakuasi ke dataran tinggi jika Anda berada di bibir pantai dan merasakan gempa bumi kuat (M7+).
4. Hubungi nomor darurat 112 (Panggilan Darurat) atau 115 (Basarnas).`;
}

