import { PrismaClient, KategoriArtikel, TipeLokasi, SyncResultStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai proses seeding database SIGAP Gempa...');

  // 1. Seed Sumber Pustaka
  const sumberBmkg = await prisma.sumber.upsert({
    where: { id: 'sumber-bmkg-portal' },
    update: {},
    create: {
      id: 'sumber-bmkg-portal',
      judul: 'Portal Data Gempabumi dan Tsunami Real-Time',
      penerbit: 'BMKG (Badan Meteorologi, Klimatologi, dan Geofisika)',
      url: 'https://www.bmkg.go.id/gempabumi-dirasakan.bmkg',
      tanggalAkses: new Date('2026-11-01T00:00:00Z'),
    },
  });

  const sumberBnpb = await prisma.sumber.upsert({
    where: { id: 'sumber-bnpb-mitigasi' },
    update: {},
    create: {
      id: 'sumber-bnpb-mitigasi',
      judul: 'Panduan Kesiapsiagaan Bencana Gempa Bumi',
      penerbit: 'BNPB (Badan Nasional Penanggulangan Bencana)',
      url: 'https://bnpb.go.id/buku-saku-bencana',
      tanggalAkses: new Date('2026-11-01T00:00:00Z'),
    },
  });

  const sumberPvmbg = await prisma.sumber.upsert({
    where: { id: 'sumber-pvmbg-geologi' },
    update: {},
    create: {
      id: 'sumber-pvmbg-geologi',
      judul: 'Peta Kawasan Rawan Bencana Gempa Bumi Indonesia',
      penerbit: 'PVMBG (Pusat Vulkanologi dan Mitigasi Bencana Geologi)',
      url: 'https://vsi.esdm.go.id',
      tanggalAkses: new Date('2026-11-01T00:00:00Z'),
    },
  });

  console.log('✅ Sumber pustaka berhasil di-seed.');

  // 2. Seed Konten Edukasi (Artikel)
  await prisma.artikel.upsert({
    where: { slug: 'pengertian-gempa-bumi-dan-jenisnya' },
    update: {},
    create: {
      slug: 'pengertian-gempa-bumi-dan-jenisnya',
      judul: 'Pengertian Gempa Bumi dan Jenis-Jenisnya Berdasarkan Sumbernya',
      kategori: KategoriArtikel.PENGERTIAN,
      urutan: 1,
      isi: `## Apa Itu Gempa Bumi?
Gempa bumi adalah getaran atau guncangan yang terjadi di permukaan bumi akibat pelepasan energi secara tiba-tiba dari dalam mantel atau kerak bumi. Pelepasan energi ini menciptakan gelombang seismik yang merambat ke segala arah.

### Klasifikasi Gempa Berdasarkan Penyebab
1. **Gempa Tektonik**: Terjadi akibat pergeseran lempeng tektonik di sepanjang zona sesar (fault). Jenis gempa ini merupakan yang paling sering terjadi dan berdampak paling luas di Indonesia karena letak kepulauan yang berada di pertemuan tiga lempeng besar (Indo-Australia, Eurasia, dan Pasifik).
2. **Gempa Vulkanik**: Terjadi akibat aktivitas magma di dalam gunung berapi aktif menjelang atau saat erupsi.
3. **Gempa Runtuhan (Terban)**: Terjadi di daerah pertambangan bawah tanah atau gua kapur yang runtuh.
4. **Gempa Tumbukan**: Diakibatkan oleh jatuhnya meteor atau benda langit ke permukaan bumi (sangat jarang terjadi).`,
      sumber: {
        connect: [{ id: sumberBmkg.id }, { id: sumberPvmbg.id }],
      },
    },
  });

  await prisma.artikel.upsert({
    where: { slug: 'proses-terjadinya-gempa-dan-gelombang-seismik' },
    update: {},
    create: {
      slug: 'proses-terjadinya-gempa-dan-gelombang-seismik',
      judul: 'Proses Terjadinya Gempa Bumi & Mengenal Gelombang P dan S (Golden Time)',
      kategori: KategoriArtikel.PROSES,
      urutan: 2,
      isi: `## Bagaimana Gempa Terjadi?
Gaya tektonik terus-menerus menekan bebatuan di sepanjang bidang patahan. Ketika tekanan melampaui ambang batas gesekan batuan, terjadi patahan mendadak (*elastic rebound*). Titik mula rekahan di kedalaman bumi disebut **Hiposentrum**, sedangkan titik proyeksinya di permukaan bumi disebut **Episentrum**.

### Gelombang Seismik & Konsep Golden Time
Saat gempa melepaskan energi, ada dua jenis gelombang tubuh utama yang dipancarkan:
1. **Gelombang Primer (Gelombang P)**: Gelombang kompresional longitudinal yang merambat paling cepat (sekitar 5–7 km/detik). Gelombang ini biasanya dirasakan sebagai sentakan halus ke atas-bawah terlebih dahulu dan jarang merusak bangunan.
2. **Gelombang Sekunder (Gelombang S)**: Gelombang transversal geser yang merambat lebih lambat (sekitar 3–4 km/detik). Gelombang S membawa energi destruktif yang mengguncang bangunan secara horizontal ke kiri dan ke kanan.

Selisih waktu antara tibanya Gelombang P dan Gelombang S dikenal sebagai **Golden Time** (waktu penyelamatan emas). Deteksi dini gelombang P memberi waktu beberapa detik hingga puluhan detik berharga bagi masyarakat untuk berlindung sebelum guncangan kuat gelombang S menerpa.`,
      sumber: {
        connect: [{ id: sumberBmkg.id }],
      },
    },
  });

  await prisma.artikel.upsert({
    where: { slug: 'mitigasi-dan-kesiapsiagaan-sebelum-gempa' },
    update: {},
    create: {
      slug: 'mitigasi-dan-kesiapsiagaan-sebelum-gempa',
      judul: 'Mitigasi Bencana: Panduan Kesiapsiagaan Sebelum Gempa Terjadi',
      kategori: KategoriArtikel.MITIGASI,
      urutan: 3,
      isi: `## Kesiapsiagaan Sebelum Bencana Terjadi
Kesiapan keluarga dan lingkungan tempat tinggal adalah kunci utama mengurangi risiko korban jiwa akibat gempa bumi.

### 1. Menyiapkan Tas Siaga Bencana (TSB)
Simpan tas tahan air di lokasi yang mudah diraih saat evakuasi mendadak. Isi tas meliputi:
* Air minum botol dan makanan tahan lama (minimal untuk 3 hari).
* Kotak P3K standar dan obat-obatan pribadi rutin.
* Senter LED, radio baterai/engkol, peluit darurat, dan power bank.
* Salinan dokumen penting (KTP, KK, akta, surat tanah) dalam wadah plastik kedap air.
* Uang tunai pecahan kecil dan pakaian ganti secukupnya.

### 2. Mengamankan Lingkungan Rumah
* Pasang perabot berat (lemari, rak buku) menempel kuat ke dinding dengan *bracket* atau paku sekrup.
* Jangan gantung bingkai foto atau cermin berat di atas tempat tidur.
* Simpan bahan mudah terbakar di tempat yang benar-benar stabil dan terkunci rapat.
* Ketahui secara tepat letak tuas sakelar utama listrik, kran sumber air, dan regulator tabung gas.`,
      sumber: {
        connect: [{ id: sumberBnpb.id }],
      },
    },
  });

  await prisma.artikel.upsert({
    where: { slug: 'tindakan-saat-dan-setelah-gempa' },
    update: {},
    create: {
      slug: 'tindakan-saat-dan-setelah-gempa',
      judul: 'Protokol Drop, Cover, Hold On: Tindakan Saat dan Pasca Gempa Bumi',
      kategori: KategoriArtikel.PENANGGULANGAN,
      urutan: 4,
      isi: `## Saat Gempa Terjadi

### Bila Anda di Dalam Ruangan:
Terapkan prinsip keselamatan internasional **Drop, Cover, and Hold On**:
1. **Drop (Merunduk)**: Segera jatuhkan tubuh ke lantai sebelum guncangan menjatuhkan Anda.
2. **Cover (Lindungi)**: Lindungi kepala dan leher Anda. Berlindunglah di bawah meja kokoh. Jika tidak ada meja, lindungi kepala dengan tas atau bantal di dekat dinding bagian dalam ruangan.
3. **Hold On (Pegang)**: Pegang erat kaki meja penutup hingga guncangan mereda.

*Hindari penggunaan lift*, dan jangan tergesa-gesa berlari keluar saat guncangan puncak berlangsung karena bahaya reruntuhan kaca atau fasad bangunan.

### Setelah Gempa Selesai:
1. Periksa adanya potensi kebocoran gas dan hubungan pendek arus listrik. Matikan sakelar jika ragu.
2. Waspadai gempa susulan (*aftershock*) yang sering terjadi beberapa menit hingga hari setelah gempa utama.
3. Segera evakuasi ke tempat terbuka dan jauh dari tiang listrik, pohon tinggi, serta lereng terjal.
4. Jika gempa terasa kuat (> 20 detik) di kawasan pesisir, segera lari ke tempat tinggi tanpa menunggu peringatan sirine tsunami resmi (*20-20-20 rule*).`,
      sumber: {
        connect: [{ id: sumberBnpb.id }, { id: sumberBmkg.id }],
      },
    },
  });

  console.log('✅ Artikel edukasi berhasil di-seed.');

  // 3. Seed FAQ Gempa (Chatbot Fallback Rule-Based)
  const faqData = [
    {
      kataKunci: ['drop', 'cover', 'hold on', 'saat gempa', 'apa yang harus dilakukan', 'tindakan', 'berlindung'],
      pertanyaan: 'Apa yang harus dilakukan pertama kali saat gempa terjadi?',
      jawaban: 'Segera lakukan Drop, Cover, and Hold On: Merunduklah ke lantai, lindungi kepala dan leher di bawah meja kokoh, lalu pegang erat kaki meja hingga guncangan berhenti. Jauhi jendela kaca dan jangan gunakan lift.',
    },
    {
      kataKunci: ['tsunami', 'potensi tsunami', 'syarat tsunami', 'kapan tsunami', 'kriteria'],
      pertanyaan: 'Kapan suatu gempa bumi berpotensi memicu terjadinya tsunami?',
      jawaban: 'Gempa umumnya berpotensi memicu tsunami jika memenuhi syarat: (1) Pusat gempa berada di dasar laut, (2) Kedalaman hiposentrum dangkal (< 60 km), (3) Magnitudo cukup besar (biasanya M > 7.0), dan (4) Memiliki mekanisme patahan sesar naik (thrust) atau sesar turun (normal) yang mengubah elevasi dasar laut secara vertikal mendadak.',
    },
    {
      kataKunci: ['hiposentrum', 'episentrum', 'beda', 'perbedaan', 'pusat gempa'],
      pertanyaan: 'Apa perbedaan antara hiposentrum dan episentrum?',
      jawaban: 'Hiposentrum (fokus gempa) adalah titik rekahan batuan asal mula terjadinya gempa yang berada di dalam kerak bumi. Sedangkan Episentrum adalah titik koordinat di permukaan bumi yang berada tepat vertikal di atas hiposentrum.',
    },
    {
      kataKunci: ['mmi', 'skala mercalli', 'intensitas', 'satuan gempa', 'skala mmi'],
      pertanyaan: 'Apa itu Skala Mercalli (MMI) dan bedanya dengan Magnitudo?',
      jawaban: 'Magnitudo mengukur jumlah energi murni yang dilepaskan di pusat gempa (angka mutlak, misal M 6.5). Sedangkan Skala MMI (Modified Mercalli Intensity, I–XII) mengukur dampak atau tingkat intensitas guncangan yang dirasakan manusia dan kerusakan struktur di suatu lokasi spesifik yang semakin melemah seiring bertambahnya jarak dari episentrum.',
    },
    {
      kataKunci: ['aftershock', 'gempa susulan', 'kenapa gempa lagi', 'penyebab gempa susulan'],
      pertanyaan: 'Mengapa gempa susulan (aftershock) kerap terjadi setelah gempa utama?',
      jawaban: 'Gempa susulan terjadi karena batuan dan lempeng bumi di sekitar bidang sesar yang patah sedang melakukan penyesuaian tekanan (redistribusi stres) kembali ke posisi seimbang yang baru. Intensitas dan frekuensi gempa susulan umumnya makin menurun seiring waktu.',
    },
    {
      kataKunci: ['tas siaga', 'tsb', 'perbekalan', 'darurat', 'tas siaga bencana'],
      pertanyaan: 'Apa saja barang wajib yang harus ada di dalam Tas Siaga Bencana (TSB)?',
      jawaban: 'Barang penting di TSB antara lain: Air minum & ransum darurat minimal 3 hari, kotak P3K + obat rutin keluarga, senter LED + baterai cadangan, peluit sinyal penyelamat, power bank/radio baterai, salinan dokumen penting dalam plastik kedap air, pakaian ganti, dan uang tunai secukupnya.',
    },
  ];

  for (const faq of faqData) {
    await prisma.faqGempa.create({
      data: faq,
    });
  }

  console.log(`✅ ${faqData.length} FAQ Gempa berhasil di-seed.`);

  // 4. Seed Skenario Simulasi Gempa
  const skenarioData = [
    {
      id: 'skenario-megathrust-selat-sunda',
      nama: 'Gempa Megathrust Selat Sunda',
      magnitudo: 8.7,
      kedalamanKm: 15.0,
      lat: -6.50,
      lon: 105.20,
      tipeLokasi: TipeLokasi.LAUT,
      deskripsiSingkat: 'Simulasi skenario gempa megathrust berpotensi tsunami tinggi di pesisir Banten dan Lampung.',
      urutan: 1,
    },
    {
      id: 'skenario-sesar-lembang',
      nama: 'Gempa Sesar Lembang (Bandung)',
      magnitudo: 6.8,
      kedalamanKm: 10.0,
      lat: -6.80,
      lon: 107.60,
      tipeLokasi: TipeLokasi.DARAT,
      deskripsiSingkat: 'Simulasi gempa kerak dangkal di daratan sesar aktif Lembang dengan intensitas guncangan tinggi di kawasan Bandung Raya.',
      urutan: 2,
    },
    {
      id: 'skenario-palu-donggala',
      nama: 'Gempa Palu - Donggala 2018',
      magnitudo: 7.5,
      kedalamanKm: 10.0,
      lat: -0.178,
      lon: 119.840,
      tipeLokasi: TipeLokasi.LAUT,
      deskripsiSingkat: 'Gempa sesar mendatar mendalam di Teluk Palu yang memicu tsunami lokal dan likuefaksi tanah masif.',
      urutan: 3,
    },
    {
      id: 'skenario-jogja-opak',
      nama: 'Gempa Yogyakarta (Sesar Opak) 2006',
      magnitudo: 5.9,
      kedalamanKm: 10.0,
      lat: -7.962,
      lon: 110.458,
      tipeLokasi: TipeLokasi.DARAT,
      deskripsiSingkat: 'Gempa darat dangkal di sepanjang sungai Opak yang mengakibatkan kerusakan berat pada bangunan non-tahan gempa.',
      urutan: 4,
    },
  ];

  for (const skenario of skenarioData) {
    await prisma.skenarioSimulasi.upsert({
      where: { id: skenario.id },
      update: skenario,
      create: skenario,
    });
  }

  console.log(`✅ ${skenarioData.length} Preset Skenario Simulasi berhasil di-seed.`);

  // 5. Seed Berita Referensi
  const beritaData = [
    {
      judul: 'BMKG Tambah Jaringan Sensor Seismograf di Zona Megathrust Selatan Jawa',
      sumber: 'BMKG News',
      url: 'https://www.bmkg.go.id/berita/sensor-megathrust-jawa',
      tanggalTerbit: new Date('2026-10-15T08:00:00Z'),
      ringkasan: 'Langkah penguatan deteksi dini guncangan gempa bumi dan pemutakhiran model peringatan tsunami oleh BMKG.',
    },
    {
      judul: 'BNPB Gencarkan Edukasi Kesiapsiagaan Bencana Gempa Berbasis Komunitas Sekolah',
      sumber: 'BNPB Terkini',
      url: 'https://bnpb.go.id/berita/edukasi-gempa-sekolah-2026',
      tanggalTerbit: new Date('2026-10-20T10:30:00Z'),
      ringkasan: 'Simulasi tanggap darurat Drop-Cover-Hold On diperkenalkan ke ribuan sekolah di jalur patahan aktif nusantara.',
    },
    {
      judul: 'Riset Ketahanan Bangunan Tahan Gempa: Pentingnya Kolom Praktis dan Ikatan Struktur',
      sumber: 'Puslitbang PUPR',
      url: 'https://pu.go.id/berita/riset-struktur-gempa-2026',
      tanggalTerbit: new Date('2026-10-25T14:15:00Z'),
      ringkasan: 'Studi menunjukkan rumah dengan perkuatan tulangan memiliki peluang bertahan hingga 80% lebih tinggi dari keruntuhan total.',
    },
  ];

  for (const b of beritaData) {
    await prisma.berita.upsert({
      where: { url: b.url },
      update: {},
      create: b,
    });
  }

  console.log(`✅ ${beritaData.length} Berita Referensi berhasil di-seed.`);

  // 6. Inisialisasi SyncStatus
  await prisma.syncStatus.upsert({
    where: { id: 'bmkg_sync' },
    update: {},
    create: {
      id: 'bmkg_sync',
      lastStatus: SyncResultStatus.SUCCESS,
      lastAttemptAt: new Date(),
    },
  });

  console.log('✅ Inisialisasi status sinkronisasi selesai.');
  console.log('🎉 Seeding database SIGAP Gempa berhasil sepenuhnya!');
}

main()
  .catch((e) => {
    console.error('❌ Gagal menjalankan seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

