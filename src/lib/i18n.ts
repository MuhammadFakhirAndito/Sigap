export type UiLanguage = "id" | "en";

export const STORAGE_KEY = "sigap-lang";
export const LANG_EVENT = "sigap-lang-change";

const ID_TO_EN: Record<string, string> = {
  // Navbar & navigasi umum
  Beranda: "Home",
  Riwayat: "History",
  Simulasi: "Simulation",
  Chatbot: "Chatbot",
  Edukasi: "Education",
  "Navigasi utama": "Main navigation",
  "Panduan darurat": "Emergency guides",
  "Gempa terkini BMKG": "Latest BMKG earthquakes",
  "Data pemantauan bukan peringatan dini resmi": "Monitoring data, not an official early warning",
  "Cari wilayah di riwayat": "Search region in history",
  "Jalan pintas cepat:": "Quick shortcuts:",
  "Riwayat Gempa": "Earthquake History",
  "Panduan Saat Gempa": "During an Earthquake",
  "Jika Ada Tanda Tsunami": "Tsunami Warning Signs",
  "Tanya Chatbot SIGAP": "Ask SIGAP Chatbot",
  "Lihat semua di Riwayat": "View all in History",
  "Data gempa terbaru belum dapat dimuat saat ini.": "Latest earthquake data could not be loaded right now.",
  "Belum ada catatan gempa terbaru yang dapat ditampilkan.": "No recent earthquake records to display.",
  "Coba lagi": "Try again",
  Bahasa: "Language",

  // Beranda (Hero & bagian halaman depan)
  "Pantau gempa bumi": "Monitor earthquakes",
  untuk: "for",
  "kesiapsiagaan kita": "our preparedness",
  "Data resmi BMKG dan": "Official BMKG data and",
  "edukasi mitigasi terukur": "measurable mitigation guide",
  "Lihat riwayat": "View history",
  "Sumber resmi": "Official source",
  "Perhitungan fisik": "Physical estimate",
  Estimasi: "Estimate",
  "Asisten mitigasi": "Mitigation helper",
  magnitudo: "magnitude",
  "gempa terkini": "latest quake",
  "Data BMKG belum tersedia": "BMKG data unavailable",
  Pahami: "Understand",
  risiko: "earthquake",
  "gempa sebelum": "risk before",
  "guncangan datang": "the shaking arrives",
  "Data resmi BMKG, kalkulator intensitas MMI & gelombang P/S, serta panduan mitigasi berbasis rujukan.":
    "Official BMKG data, MMI & P/S wave intensity estimator, and reference-based mitigation guides.",
  "Riwayat BMKG": "BMKG History",
  "Simulasi MMI & P/S": "MMI & P/S Sim",
  "Tanya chatbot": "Ask chatbot",
  "catatan gempa": "quake records",
  "skenario simulasi": "sim scenarios",
  "modul edukasi": "edu modules",
  "Gempa terbaru": "Latest earthquake",
  "Data langsung BMKG": "Live BMKG feed",
  "Cadangan lokal": "Local fallback",
  Magnitudo: "Magnitude",
  "Tidak berpotensi tsunami": "No tsunami potential",
  "Potensi tsunami tidak dinyatakan": "Tsunami status unspecified",
  "Waktu (WIB)": "Time (WIB)",
  Kedalaman: "Depth",
  Koordinat: "Coordinates",
  Dirasakan: "Felt intensity",
  "Tidak tercatat dirasakan": "Not recorded as felt",
  "Simulasikan gempa ini": "Simulate this quake",
  "Koneksi data terputus": "Data connection lost",
  "Data gempa terbaru belum tersedia": "Latest earthquake data unavailable",
  "Buka riwayat": "Open history",
  "01 · Materi rujukan": "01 · Reference modules",
  "Modul edukasi": "Education modules",
  "Pahami mekanisme patahan bumi, kesiapsiagaan rumah tangga, dan tindakan lindungi diri dari rujukan resmi.":
    "Understand earth fault mechanics, household preparedness, and self-protection actions from official sources.",
  "Lihat semua modul": "View all modules",
  Pengertian: "Basics",
  "Proses Geologi": "Geological Process",
  Penanggulangan: "Emergency Response",
  "Mitigasi & Siaga": "Mitigation & Readiness",
  "Baca modul": "Read module",
  "02 · Simulasi dampak": "02 · Impact simulation",
  "Skenario simulasi sejarah": "Historical simulation scenarios",
  "Lanjutkan pemahaman materi ke estimasi guncangan MMI dan selisih waktu tiba gelombang P/S pada tiga peristiwa besar Indonesia.":
    "Apply your knowledge to MMI shaking estimates and P/S wave arrival intervals across three major Indonesian earthquakes.",
  "Buka simulasi": "Open simulation",
  "Lokasi laut": "Offshore",
  "Lokasi darat": "Onshore",
  "Ringkasan skenario": "Scenario summary",
  Simulasikan: "Simulate",
  "03 · Berita & konsultasi": "03 · News & consultation",
  "Berita & Chatbot SIGAP": "News & SIGAP Chatbot",
  "Ikuti ringkasan berita kebencanaan dari penerbit terverifikasi atau ajukan pertanyaan mitigasi kepada asisten SIGAP.":
    "Follow verified disaster news summaries or ask mitigation questions to the SIGAP assistant.",
  "Semua berita": "All news",
  "Buka chatbot": "Open chatbot",
  "Liputan media rujukan": "Referenced media coverage",
  "Tautan membuka situs penerbit asli": "Links open original publisher sites",
  "Berita belum tersedia.": "News not yet available.",
  "Asisten edukasi mitigasi berbasis rujukan": "Reference-based mitigation assistant",
  "Tanya langkah keselamatan & konteks gempa terkini":
    "Ask safety steps & latest earthquake context",
  "Ajukan pertanyaan tindakan darurat atau ringkasan data BMKG terbaru. Saat kuota AI terbatas, jawaban otomatis beralih ke FAQ lokal.":
    "Ask about emergency actions or the latest BMKG summary. When AI quota is limited, replies fall back to local FAQs.",
  "Mulai percakapan": "Start conversation",
  "Contoh pertanyaan": "Sample questions",
  "Apa yang harus dilakukan saat gempa terjadi?":
    "What should I do during an earthquake?",
  "Cara menyiapkan tas siaga bencana?":
    "How do I prepare an emergency go-bag?",
  "Apa arti skala MMI pada dampak gempa?":
    "What does the MMI scale mean for quake impact?",

  // Riwayat (/riwayat)
  "Riwayat gempa": "Earthquake history",
  "Data dari BMKG yang disimpan agar tetap bisa dilihat saat BMKG tidak dapat diakses.":
    "BMKG earthquake archive stored locally so records remain accessible even when BMKG feed is unavailable.",
  "Koneksi database lokal terputus": "Local database connection lost",
  "Sumber: BMKG · data lokal siap": "Source: BMKG · local archive ready",
  Filter: "Filter",
  "(aktif)": "(active)",
  "Hapus filter": "Clear filters",
  Wilayah: "Region",
  Cari: "Search",
  Semua: "All",
  Tanggal: "Date",
  "dari tanggal": "start date",
  sampai: "to",
  "sampai tanggal": "end date",
  "Total gempa": "Total quakes",
  "Magnitudo maks": "Max magnitude",
  "Puncak harian": "Daily peak",
  "Jumlah gempa per hari": "Earthquakes per day",
  "Potensi tsunami": "Tsunami potential",
  "Tidak berpotensi": "No tsunami threat",
  Berpotensi: "Tsunami potential",
  "Tidak dinyatakan": "Not specified",
  "Tidak ada gempa yang cocok dengan filter": "No earthquakes match the selected filters",
  "Gagal terhubung ke database": "Failed to connect to database",
  Reset: "Reset",
  Sebelumnya: "Previous",
  Berikutnya: "Next",

  // Simulasi (/simulasi)
  "Simulasi dampak gempa": "Earthquake impact simulation",
  "Atur parameter untuk melihat estimasi guncangan, waktu gelombang, dan potensi tsunami.":
    "Adjust parameters to estimate shaking intensity, wave arrival times, and tsunami criteria.",
  "Peta dampak": "Impact map",
  "Getaran 3D": "3D Shaking",
  "Estimasi edukasi, bukan data resmi BMKG": "Educational estimate, not official BMKG data",
  "Kedalaman hiposenter": "Hypocenter depth",
  "Jarak dari pusat gempa": "Distance from epicenter",
  "Tersinkron dengan posisi marker Anda di peta": "Synced with your marker position on the map",
  "Zona kalibrasi MMI": "MMI calibration zone",
  "Dalam zona kalibrasi MMI: Mw 5,0–7,9.": "Within MMI calibration range: Mw 5.0–7.9.",
  "Di luar kalibrasi MMI (Mw 5,0–7,9): estimasi hanya gambaran kasar.":
    "Outside MMI calibration (Mw 5.0–7.9): rough estimate only.",
  "Di luar rentang kalibrasi rumus, hasil hanya gambaran kasar.":
    "Outside formula calibration range; rough approximation only.",
  "Klik peta untuk memindah": "Click map to move",
  "Lokasi Anda": "Your location",
  "Pusat gempa": "Epicenter",
  "Gunakan GPS": "Use GPS",
  "Mencari GPS…": "Locating GPS…",
  Terasa: "Felt",
  "Merusak ringan": "Light damage",
  "Garis putus-putus: batas kalibrasi 300 km": "Dashed line: 300 km calibration limit",
  "dari pusat": "from epicenter",
  "Detail lanjutan": "Advanced details",
  "Tipe lokasi, kedalaman angka, input koordinat manual, energi, waktu rambat, tsunami, 12 tingkat MMI, & rumus":
    "Location type, exact depth, manual coordinates, energy, travel time, tsunami criteria, 12 MMI levels & formulas",
  "Tipe lokasi episentrum": "Epicenter location type",
  "Belum dipilih": "Not selected",
  Darat: "Onshore",
  Laut: "Offshore",
  "Kedalaman hiposenter angka (km)": "Hypocenter depth (km)",
  "Koordinat pusat gempa": "Epicenter coordinates",
  "Rekomendasi kesiapsiagaan": "Preparedness recommendations",
  "Tanyakan skenario ini ke chatbot": "Ask chatbot about this scenario",
  "Panduan edukasi": "Education guide",
  "Yang dilakukan saat gempa terjadi": "What to do during an earthquake",
  "Panduan praktis melindungi kepala di dalam bangunan, di luar ruangan, hingga di pantai.":
    "Practical steps to protect your head indoors, outdoors, and near coastal areas.",
  "Tindakan saat potensi tsunami": "Actions for tsunami potential",
  "Langkah evakuasi cepat ke tempat tinggi setelah guncangan kuat di wilayah pesisir.":
    "Rapid evacuation steps to high ground after strong shaking near the coast.",
  "Memahami skala MMI (I–XII)": "Understanding the MMI scale (I–XII)",
  "Arti tiap tingkat intensitas guncangan menurut rujukan resmi BMKG.":
    "Meaning of each shaking intensity level based on official BMKG references.",
  "Lihat yang harus dilakukan": "See safety actions",
  // Mode Getaran 3D
  "Ilustrasi edukasi (bukan simulasi kekuatan bangunan)":
    "Educational illustration (not a structural building simulation)",
  "Tekan Jeda jika kurang nyaman": "Press Pause if uncomfortable",
  "Mulai gempa": "Start quake",
  "Putar ulang": "Replay",
  Jeda: "Pause",
  Lanjutkan: "Resume",
  "Lambat 0,25×": "Slow 0.25×",
  "Getaran kamera": "Camera shake",
  "Tampilkan karakter": "Show character",
  "Siap diputar": "Ready",
  "Gelombang P tiba": "P-wave arrives",
  "Jeda menuju gelombang S": "Gap to S-wave",
  "Gelombang S: guncangan utama": "S-wave: main shaking",
  "Guncangan mereda": "Shaking subsides",
  Selesai: "Finished",
  Siap: "Ready",
  "Waspada (Gelombang P)": "Alert (P-wave)",
  "Drop (Merunduk)": "Drop",
  "Cover (Berlindung)": "Cover",
  "Hold On (Berpegangan)": "Hold On",
  "Aman Keluar": "Safe to exit",
  "1. Drop (Merunduk)": "1. Drop",
  "2. Cover (Berlindung)": "2. Cover",
  "3. Hold On (Berpegangan)": "3. Hold On",
  mereda: "subsiding",

  // Chatbot (/chatbot)
  "Tanya jawab gempa dan mitigasi": "Earthquake & mitigation Q&A",
  "Jawaban memakai data gempa terbaru BMKG dan FAQ resmi BMKG serta BNPB.":
    "Replies use the latest BMKG earthquake feed and official BMKG/BNPB FAQs.",
  "Asisten SIGAP": "SIGAP Assistant",
  "Basis data BMKG & panduan resmi BNPB": "BMKG database & official BNPB guides",
  "Percakapan baru": "New chat",
  "Asisten Kesiapsiagaan SIGAP": "SIGAP Preparedness Assistant",
  "Apa yang ingin Anda ketahui tentang gempa?": "What would you like to know about earthquakes?",
  "Tanyakan gempa terbaru BMKG, cara berlindung yang aman, tanda tsunami, atau arti skala MMI. Pilih pertanyaan di bawah untuk langsung memulai.":
    "Ask about the latest BMKG earthquake, safe shelter steps, tsunami signs, or the MMI scale. Pick a question below to begin.",
  "Gempa terkini": "Latest quake",
  "Saat darurat": "During emergency",
  "Persiapan & pengetahuan": "Preparedness & knowledge",
  "Gempa terakhir terjadi di mana?": "Where did the latest earthquake happen?",
  "Apakah gempa terbaru berpotensi tsunami?": "Does the latest earthquake pose a tsunami threat?",
  "Apa yang harus dilakukan saat gempa di dalam bangunan?":
    "What should I do during an earthquake inside a building?",
  "Apa yang harus dilakukan jika ada tanda tsunami di pantai?":
    "What should I do if there are tsunami signs at the beach?",
  "Apa isi tas siaga bencana?": "What goes in an emergency preparedness bag?",
  "Apa itu skala MMI?": "What is the MMI intensity scale?",
  "Tanyakan gempa ini": "Ask about this quake",
  Waktu: "Time",
  "Konteks BMKG": "BMKG context",
  "Dijawab dari FAQ": "Answered from FAQ",
  Salin: "Copy",
  Tersalin: "Copied",
  "Membantu?": "Helpful?",
  "Penilaian tercatat.": "Feedback recorded.",
  Ya: "Yes",
  "Kurang tepat": "Not helpful",
  "Pertanyaan lanjutan:": "Follow-up questions:",
  "Asisten SIGAP sedang menyusun jawaban...": "SIGAP Assistant is composing a reply...",
  "Lihat pesan terbaru": "Jump to latest message",
  Selengkapnya: "Details",
  Detail: "Details",
  Tutup: "Close",
  "Bukan peringatan dini resmi · Darurat:": "Not an official early warning · Emergency:",
  "· Jawaban dapat keliru": "· Answers may be inaccurate",
  "Untuk keadaan darurat, hubungi BMKG (Contact Center 196) atau BNPB/BPBD setempat. Jangan menulis data pribadi; percakapan disimpan selama 30 hari untuk evaluasi kualitas layanan.":
    "For emergencies, contact BMKG Contact Center 196 or local BNPB/BPBD. Do not enter personal data; conversations are stored for 30 days for quality evaluation.",

  // Edukasi (/edukasi)
  "Basis pengetahuan resmi BMKG, BNPB & PVMBG": "Official BMKG, BNPB & PVMBG knowledge base",
  "Edukasi mitigasi gempa": "Earthquake mitigation education",
  "Panduan langkah penyelamatan diri, pemahaman sesar dan mekanisme geologi, serta rujukan resmi kebencanaan nasional.":
    "Self-rescue step-by-step guides, fault & geological mechanics, and national disaster references.",
  "Apa yang harus dilakukan sekarang?": "What should I do right now?",
  "Mulai dari dasar": "Start with basics",
  "Materi panduan": "Guide modules",
  "Panduan kategori": "Category guides",
  "Sumber rujukan": "Reference sources",
  "Liputan terkait": "Related coverage",
  "Semua Kategori": "All Categories",
  Lainnya: "Others",
  "Panduan kesiapsiagaan": "Preparedness guides",
  "Semua materi panduan": "All guide modules",
  "Reset filter": "Reset filter",
  "Belum ada artikel di kategori ini.": "No articles in this category yet.",
  "Belum ada materi edukasi yang tersedia saat ini.": "No educational articles available yet.",
  "Lihat semua": "View all",
  "Sebelum, saat, dan sesudah gempa": "Before, during, and after an earthquake",
  "Memahami gempa & tsunami": "Understanding earthquakes & tsunamis",
  "Materi lainnya": "Other topics",
  "Panduan utama": "Essential guide",
  "Arsip pemberitaan": "News archive",
  "Berita terkait gempa & mitigasi": "Earthquake & mitigation news",
  "Liputan media massa terverifikasi terkait gempa, megathrust, dan mitigasi. Konten penuh tersedia di situs penerbit asli.":
    "Verified news coverage on earthquakes, megathrusts, and preparedness. Full articles open on publisher sites.",
  "Referensi terverifikasi": "Verified references",
  "Daftar pustaka & sumber rujukan": "Bibliography & reference sources",
  "Seluruh artikel edukasi di SIGAP Gempa mengacu pada publikasi lembaga kebencanaan, dokumen geofisika, serta liputan media yang mengutip keterangan resmi.":
    "All SIGAP Gempa guides cite disaster agency publications, geophysics papers, and media reports quoting official statements.",
  "Media & lainnya": "Media & others",
  "Tampilkan semua sumber": "Show all sources",

  // Footer
  "SIGAP Gempa: Sistem Informasi & Mitigasi Gempa Bumi Indonesia":
    "SIGAP Gempa: Indonesian Earthquake Information & Mitigation Portal",
  "Sumber Data:": "Data Source:",
  "Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)":
    "Indonesian Agency for Meteorology, Climatology, and Geophysics (BMKG)",
  "Situs ini bukan sistem peringatan dini resmi. Informasi disediakan untuk keperluan edukasi dan kesiapsiagaan masyarakat.":
    "This site is not an official early warning system. Information is provided for education and public preparedness.",
  "Daftar Pustaka": "References",
  "Simulasi Edukasi": "Edu Simulation",
  "Design System Token": "Design System Tokens",
};

const PLACEHOLDER_ID_TO_EN: Record<string, string> = {
  "Cari nama kota, provinsi, atau pulau…": "Search city, province, or island…",
  "misal: Bengkulu": "e.g. Bengkulu",
  "Tulis pertanyaan tentang gempa atau mitigasi...": "Ask a question about earthquakes or mitigation...",
  "Cari judul atau lembaga": "Search title or agency",
};

const recordedOriginalText = new WeakMap<Text, string>();
const trackedNodes = new Set<Text>();
const recordedOriginalPlaceholder = new WeakMap<HTMLInputElement | HTMLTextAreaElement, string>();
const trackedPlaceholders = new Set<HTMLInputElement | HTMLTextAreaElement>();

let isApplyingTranslation = false;

export function isTranslationMutating(): boolean {
  return isApplyingTranslation;
}

function translateDynamicPattern(trimmed: string): string | null {
  const modulCount = trimmed.match(/^Lihat semua \((\d+) modul\)$/);
  if (modulCount) return `View all (${modulCount[1]} modules)`;

  const depthMatch = trimmed.match(/^Kedalaman\s+(.+)$/);
  if (depthMatch) return `Depth ${depthMatch[1]}`;

  const articlesCount = trimmed.match(/^(\d+) artikel$/);
  if (articlesCount) return `${articlesCount[1]} articles`;

  const materisCount = trimmed.match(/^(\d+) materi$/);
  if (materisCount) return `${materisCount[1]} modules`;

  const mediaCount = trimmed.match(/^(\d+) liputan media$/);
  if (mediaCount) return `${mediaCount[1]} news reports`;

  const docsCount = trimmed.match(/^(\d+) dokumen sumber$/);
  if (docsCount) return `${docsCount[1]} source documents`;

  const docCount = trimmed.match(/^(\d+) dokumen$/);
  if (docCount) return `${docCount[1]} docs`;

  const readMins = trimmed.match(/^(\d+) menit baca$/);
  if (readMins) return `${readMins[1]} min read`;

  const openPublisher = trimmed.match(/^Buka di (.+)$/);
  if (openPublisher) return `Read on ${openPublisher[1]}`;

  const categoryHeader = trimmed.match(/^Kategori:\s*(.+)$/);
  if (categoryHeader) {
    const label = ID_TO_EN[categoryHeader[1]] ?? categoryHeader[1];
    return `Category: ${label}`;
  }

  const chartMeta = trimmed.match(/^(\d+) hari terakhir · (.+) gempa$/);
  if (chartMeta) return `Last ${chartMeta[1]} days · ${chartMeta[2]} quakes`;

  const syncMatch = trimmed.match(/^Sumber: BMKG · disinkronkan (.+)$/);
  if (syncMatch) return `Source: BMKG · synced ${syncMatch[1]}`;

  const mmiDesc = trimmed.match(/^Skala MMI ([IVX]+) \(BMKG\):$/);
  if (mmiDesc) return `MMI Scale ${mmiDesc[1]} (BMKG):`;

  const realTime = trimmed.match(/^Waktu nyata: P (.+) dtk · S (.+) dtk · Golden time (.+) dtk$/);
  if (realTime) return `Real time: P ${realTime[1]} s · S ${realTime[2]} s · Golden time ${realTime[3]} s`;

  return null;
}

export function getSavedLanguage(): UiLanguage {
  if (typeof window === "undefined") return "id";
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "en" ? "en" : "id";
  } catch {
    return "id";
  }
}

export function applyPageLanguage(lang: UiLanguage): void {
  if (typeof document === "undefined" || !document.body) return;
  isApplyingTranslation = true;
  try {
    document.documentElement.lang = lang;

    if (lang === "id") {
      for (const node of trackedNodes) {
        if (!node.isConnected) {
          trackedNodes.delete(node);
          continue;
        }
        const original = recordedOriginalText.get(node);
        if (original !== undefined && node.nodeValue !== original) {
          node.nodeValue = original;
        }
      }
      for (const field of trackedPlaceholders) {
        if (!field.isConnected) {
          trackedPlaceholders.delete(field);
          continue;
        }
        const originalPh = recordedOriginalPlaceholder.get(field);
        if (originalPh !== undefined && field.placeholder !== originalPh) {
          field.placeholder = originalPh;
        }
      }
      return;
    }

    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let current: Node | null;
    while ((current = walker.nextNode())) {
      const textNode = current as Text;
      const parent = textNode.parentElement;
      if (!parent) continue;
      const tag = parent.tagName;
      if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") continue;
      if (parent.closest("[data-no-translate='true']")) continue;

      const raw = textNode.nodeValue ?? "";
      const trimmed = raw.trim();
      if (!trimmed) continue;

      const translated = ID_TO_EN[trimmed] ?? translateDynamicPattern(trimmed);
      if (!translated) continue;

      if (!recordedOriginalText.has(textNode)) {
        recordedOriginalText.set(textNode, raw);
        trackedNodes.add(textNode);
      }

      const leading = raw.match(/^\s*/)?.[0] ?? "";
      const trailing = raw.match(/\s*$/)?.[0] ?? "";
      const nextValue = `${leading}${translated}${trailing}`;
      if (textNode.nodeValue !== nextValue) {
        textNode.nodeValue = nextValue;
      }
    }

    const inputs = document.body.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      "input[placeholder], textarea[placeholder]"
    );
    for (const field of inputs) {
      if (field.closest("[data-no-translate='true']")) continue;
      const ph = field.placeholder;
      const translatedPh = PLACEHOLDER_ID_TO_EN[ph];
      if (!translatedPh) continue;
      if (!recordedOriginalPlaceholder.has(field)) {
        recordedOriginalPlaceholder.set(field, ph);
        trackedPlaceholders.add(field);
      }
      if (field.placeholder !== translatedPh) {
        field.placeholder = translatedPh;
      }
    }
  } finally {
    isApplyingTranslation = false;
  }
}

export function setPageLanguage(nextLang: UiLanguage): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, nextLang);
  } catch {
    // Abaikan bila localStorage diblokir.
  }
  applyPageLanguage(nextLang);
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent<UiLanguage>(LANG_EVENT, { detail: nextLang }));
  }
}
