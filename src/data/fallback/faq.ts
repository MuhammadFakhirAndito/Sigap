export interface StaticFaq {
  pertanyaan: string;
  jawaban: string;
  kataKunci: string[];
  aktif: boolean;
  sumber?: Array<{
    penerbit: string;
    url: string;
    tanggalAkses: string;
  }>;
}

/**
 * FAQ statis cadangan inti SIGAP Gempa.
 * Digunakan sebagai fallback terakhir ketika database tidak dapat dijangkau
 * (FR-DB-08, FR-DB-12, TC-DB-13).
 */
export const STATIC_FAQS: StaticFaq[] = [
  {
    kataKunci: ["gempa", "apa itu gempa", "pengertian"],
    pertanyaan: "Apa itu gempa bumi?",
    jawaban:
      "Gempa bumi adalah getaran atau guncangan tanah yang terjadi secara alami. Menurut BNPB, sumbernya bisa berupa patahan akibat aktivitas tektonik, letusan gunung api, hantaman benda langit, atau ledakan buatan manusia.",
    aktif: true,
    sumber: [
      {
        penerbit: "BNPB",
        url: "https://www.bnpb.go.id/storage/app/media/uploads/migration/pubs/478.pdf",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["penyebab", "kenapa gempa", "sebab"],
    pertanyaan: "Apa penyebab gempa bumi?",
    jawaban:
      "BNPB menyebut penyebabnya antara lain pergerakan lempeng tektonik, aktivitas sesar, pergerakan tanah secara lokal seperti runtuhan, aktivitas gunung api, dan ledakan nuklir.",
    aktif: true,
    sumber: [
      {
        penerbit: "BNPB",
        url: "https://www.bnpb.go.id/storage/app/media/uploads/migration/pubs/478.pdf",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["saat gempa", "di dalam rumah", "berlindung"],
    pertanyaan: "Apa yang harus dilakukan saat gempa di dalam bangunan?",
    jawaban:
      "Lindungi kepala dan badan, misalnya dengan berlindung di bawah meja, dan cari tempat paling aman dari reruntuhan. Jangan memakai lift. BMKG juga menyebut keluar berlari bila masih memungkinkan.",
    aktif: true,
    sumber: [
      {
        penerbit: "BMKG",
        url: "https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["di luar", "lapangan", "terbuka"],
    pertanyaan: "Bagaimana jika gempa terjadi saat di luar bangunan?",
    jawaban:
      "Jauhi gedung, tiang listrik, dan pohon, serta perhatikan tanah yang bisa merekah. Menurut BNPB, kaca dan papan reklame di kawasan perkantoran juga berbahaya.",
    aktif: true,
    sumber: [
      {
        penerbit: "BMKG",
        url: "https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["mobil", "kendaraan"],
    pertanyaan: "Apa yang dilakukan jika gempa terjadi saat berkendara?",
    jawaban:
      "BMKG menyarankan keluar dan menjauh dari mobil. BNPB menyarankan untuk gempa besar menjauhi persimpangan dan berhenti di tempat terbuka. Jika harus mengungsi, segera keluar dari mobil.",
    aktif: true,
    sumber: [
      {
        penerbit: "BMKG dan BNPB",
        url: "https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["pantai", "tsunami", "laut surut"],
    pertanyaan: "Apa yang dilakukan jika gempa terjadi saat di pantai?",
    jawaban:
      "Segera jauhi pantai. Jika merasakan guncangan atau air laut surut tiba-tiba, lari ke tempat tinggi seperti bukit atau bangunan tinggi, dan jangan turun ke tempat rendah setelah gelombang pertama karena gelombang berikutnya biasanya datang.",
    aktif: true,
    sumber: [
      {
        penerbit: "BNPB dan BMKG",
        url: "https://www.bnpb.go.id/storage/app/media/uploads/migration/pubs/478.pdf",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["setelah gempa", "sesudah gempa"],
    pertanyaan: "Apa yang dilakukan setelah gempa?",
    jawaban:
      "Keluar dengan tertib tanpa lift, periksa keluarga dan beri P3K, periksa kebakaran, kebocoran gas, dan arus pendek, lalu jauhi bangunan yang retak. Tunggu informasi dari sumber resmi.",
    aktif: true,
    sumber: [
      {
        penerbit: "BMKG",
        url: "https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["gempa susulan"],
    pertanyaan: "Apakah gempa susulan masih mungkin terjadi?",
    jawaban:
      "Ya. BMKG mengingatkan gempa susulan masih mungkin terjadi di sekitar daerah gempa, jadi jangan berjalan di sekitar lokasi atau masuk ke bangunan yang baru terkena gempa.",
    aktif: true,
    sumber: [
      {
        penerbit: "BMKG",
        url: "https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["tas siaga", "perlengkapan", "persiapan"],
    pertanyaan: "Apa isi tas siaga bencana?",
    jawaban:
      "BMKG menyebut isinya perlengkapan darurat seperti dokumen penting, makanan, air, obat-obatan, dan alat komunikasi untuk bertahan pada 72 jam pertama setelah bencana.",
    aktif: true,
    sumber: [
      {
        penerbit: "BMKG",
        url: "https://www.bmkg.go.id/gempabumi/mitigasi/edukasi-gempabumi-tsunami",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["p3k", "alat", "senter", "radio"],
    pertanyaan: "Peralatan apa yang sebaiknya tersedia di rumah?",
    jawaban:
      "Menurut BMKG: kotak P3K, senter atau lampu baterai, radio, serta makanan dan air.",
    aktif: true,
    sumber: [
      {
        penerbit: "BMKG",
        url: "https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["mmi", "skala mmi", "mercalli"],
    pertanyaan: "Apa itu skala MMI?",
    jawaban:
      "MMI (Modified Mercalli Intensity) adalah skala 12 tingkat (I sampai XII) yang menggambarkan dampak guncangan dan kerusakan. Menurut BMKG skala ini subjektif karena berdasar pengalaman dan kerusakan yang diamati.",
    aktif: true,
    sumber: [
      {
        penerbit: "BMKG",
        url: "https://www.bmkg.go.id/gempabumi/skala-mmi",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["tsunami", "penyebab tsunami"],
    pertanyaan: "Apa penyebab tsunami?",
    jawaban:
      "BNPB menyebut tsunami dapat disebabkan gempa di bawah laut, letusan gunung api bawah laut, longsor bawah laut, atau hantaman meteor di laut.",
    aktif: true,
    sumber: [
      {
        penerbit: "BNPB",
        url: "https://www.bnpb.go.id/storage/app/media/uploads/migration/pubs/478.pdf",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["syarat tsunami", "kriteria tsunami"],
    pertanyaan: "Gempa seperti apa yang dapat memicu tsunami?",
    jawaban:
      "Menurut Buku Saku BNPB (edisi 2012): berpusat di laut, magnitudo lebih dari 6,8, kedalaman tidak lebih dari 70 km, dan berpola sesar naik atau turun.",
    aktif: true,
    sumber: [
      {
        penerbit: "BNPB",
        url: "https://www.bnpb.go.id/storage/app/media/uploads/migration/pubs/478.pdf",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["lift", "tangga"],
    pertanyaan: "Bolehkah memakai lift saat gempa?",
    jawaban:
      "Tidak. BNPB dan BMKG menyarankan tidak memakai lift saat atau sesudah gempa. Gunakan tangga biasa, dan jika terjebak hubungi pengelola gedung lewat interphone bila ada.",
    aktif: true,
    sumber: [
      {
        penerbit: "BNPB dan BMKG",
        url: "https://www.bnpb.go.id/storage/app/media/uploads/migration/pubs/478.pdf",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["hoaks", "isu", "informasi resmi"],
    pertanyaan: "Bagaimana menyikapi kabar gempa yang beredar?",
    jawaban:
      "BMKG menyarankan mendengarkan informasi resmi dan tidak mudah terpancing isu atau berita yang tidak jelas sumbernya.",
    aktif: true,
    sumber: [
      {
        penerbit: "BMKG",
        url: "https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
  {
    kataKunci: ["peringatan dini", "resmi", "bmkg"],
    pertanyaan: "Apakah SIGAP Gempa adalah peringatan dini resmi?",
    jawaban:
      "Bukan. SIGAP Gempa menampilkan data BMKG untuk informasi dan edukasi. Untuk informasi dan peringatan resmi, rujuk BMKG (Contact Center 196).",
    aktif: true,
    sumber: [
      {
        penerbit: "BMKG",
        url: "https://www.bmkg.go.id/gempabumi/mitigasi/antisipasi-gempabumi",
        tanggalAkses: "2026-11-14",
      },
    ],
  },
];
