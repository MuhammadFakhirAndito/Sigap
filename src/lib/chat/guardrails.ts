export const MAX_USER_MESSAGE_LENGTH = 500;

export const PROMPT_INJECTION_REFUSAL_MESSAGE =
  'Maaf, saya tidak dapat mengikuti instruksi untuk mengubah aturan atau peran sistem. Saya adalah asisten edukasi SIGAP Gempa yang hanya melayani pertanyaan seputar gempa bumi, tsunami, data BMKG, dan langkah mitigasi bencana.';

export const OFF_TOPIC_REFUSAL_MESSAGE =
  'Maaf, saya hanya dapat menjawab pertanyaan seputar gempa bumi, tsunami, informasi resmi BMKG, dan langkah mitigasi bencana. Silakan ajukan pertanyaan terkait kesiapsiagaan gempa bumi.';

/**
 * Catatan Keamanan (Defense-in-Depth):
 * Deteksi frasa injeksi di bawah ini HANYALAН pelapis tambahan (auxiliary filter)
 * untuk menolak pola eksplisit secara cepat tanpa memakan kuota model.
 * Pertahanan utama terhadap prompt injection (termasuk versi diparafrase) tetap
 * bertumpu pada:
 * 1. Pembungkusan input pengguna sebagai data murni di dalam tag <pesan_pengguna>,
 * 2. Instruksi system prompt yang memperlakukan isi <pesan_pengguna> sebagai data
 *    yang tidak boleh mengubah aturan sistem, serta
 * 3. Pembatasan sumber fakta dan penyaringan topik domain kebencanaan.
 */
const INJECTION_PATTERNS: readonly RegExp[] = [
  // Bahasa Indonesia (langsung & diparafrase)
  /abaikan\s+(semua\s+|seluruh\s+)?(instruksi|aturan|perintah|pedoman|batasan)(\s+sebelumnya|\s+di\s+atas|\s+awal)?/i,
  /lupakan\s+(semua\s+|seluruh\s+)?(instruksi|aturan|perintah|pedoman|batasan|konteks)/i,
  /kesampingkan\s+(semua\s+|seluruh\s+|dulu\s+)?(instruksi|aturan|perintah|pedoman|batasan|ketentuan)/i,
  /tidak\s+(usah|perlu)\s+(mengikuti|mematuhi|memedulikan|peduli\s+pada)\s+(instruksi|aturan|perintah|pedoman|batasan)/i,
  /anggap\s+(semua\s+)?(instruksi|aturan|perintah|pedoman|batasan)\s+(sebelumnya|di\s+atas|sistem)\s+tidak\s+berlaku/i,
  /(kamu|anda)\s+sekarang\s+(adalah|menjadi|berperan\s+sebagai)\s+(?!asisten\s+edukasi\s+sigap)/i,
  /mulai\s+sekarang\s+(kamu|anda)\s+(adalah|menjadi|berperan\s+sebagai|bertindak\s+sebagai)/i,
  /(berpura-puralah|bertindaklah|berperanlah)\s+(menjadi|sebagai)\s+/i,
  /(tampilkan|bocorkan|cetak|ulangi|salin)\s+(seluruh\s+|isi\s+)?(system\s+prompt|instruksi\s+sistem|aturan\s+sistem|prompt\s+asli)/i,

  // Bahasa Inggris (langsung & diparafrase)
  /ignore\s+(all\s+|any\s+|the\s+|your\s+)?(previous|prior|above|earlier|preceding|system|initial)\s+(instructions|rules|prompts|guidelines|directions|constraints)/i,
  /disregard\s+(all\s+|any\s+|the\s+|your\s+)?(previous|prior|above|earlier|preceding|system|initial)\s+(instructions|rules|prompts|guidelines|directions|constraints)/i,
  /forget\s+(everything|all|what)\s+(you\s+were\s+told|above|before|prior|previously|in\s+your\s+instructions)/i,
  /set\s+aside\s+(your|all|the|previous|prior)\s+(instructions|rules|guidelines|constraints|system\s+role)/i,
  /do\s+not\s+follow\s+(your|the|any)\s+(previous|prior|system|initial)\s+(instructions|rules|guidelines|constraints)/i,
  /override\s+(your|the|all|system|previous|safety)\s+(instructions|rules|prompt|settings|guidelines|restrictions)/i,
  /(you\s+are\s+now|from\s+now\s+on\s+you\s+are|pretend\s+to\s+be|act\s+as\s+a|roleplay\s+as)\s+/i,
  /(reveal|show|print|output|repeat|leak|dump)\s+(your\s+|the\s+|full\s+|exact\s+)?(system\s+prompt|hidden\s+instructions|initial\s+prompt|developer\s+message)/i,
  /<\s*\/?\s*(system|developer|instruction)\s*>/i,
];

const DOMAIN_TERMS: readonly RegExp[] = [
  // Istilah seismologi & geologi
  /\bgempa\b/i,
  /\btsunami\b/i,
  /\bseismik\b/i,
  /\bseismograf\b/i,
  /\bseismometer\b/i,
  /\btektonik\b/i,
  /\bvulkanik\b/i,
  /\bsesar\b/i,
  /\bpatahan\b/i,
  /\blempeng\b/i,
  /\bsubduksi\b/i,
  /\bmegathrust\b/i,
  /\blikuefaksi\b/i,
  /\bepisentrum\b/i,
  /\bhiposentrum\b/i,
  /\bmagnitudo\b/i,
  /\bricht(er)?\b/i,
  /\bskala\b/i,
  /\bmmi\b/i,
  /\bmercalli\b/i,
  /\bintensitas\b/i,
  /\bgetaran\b/i,
  /\bguncangan\b/i,
  /\bberguncang\b/i,
  /\bbergetar\b/i,
  /\bbergoyang\b/i,
  /\bkedalaman\b/i,
  /\bkoordinat\b/i,
  /\bautogempa\b/i,
  /\bsusulan\b/i,
  /\breruntuhan\b/i,
  /\bruntuh\b/i,
  /\broboh\b/i,
  /\bmerekah\b/i,
  /\blongsor\b/i,

  // Tanda-tanda tsunami & pesisir
  /\blaut\s+surut\b/i,
  /\bair\s+laut\b/i,
  /\bpantai\b/i,
  /\bpesisir\b/i,
  /\bgelombang\b/i,
  /\btempat\s+tinggi\b/i,
  /\bdataran\s+tinggi\b/i,

  // Kesiapsiagaan, perlengkapan darurat, dan respons keselamatan
  /\bmitigasi\b/i,
  /\bevakuasi\b/i,
  /\bsiaga\b/i,
  /\bbencana\b/i,
  /\bdarurat\b/i,
  /\bkesiapsiagaan\b/i,
  /\bp3k\b/i,
  /\bsenter\b/i,
  /\bradio\b/i,
  /\b72\s*jam\b/i,
  /\bberlindung\b/i,
  /\bbawah\s+meja\b/i,
  /\blindungi\s+kepala\b/i,
  /\blift\b/i,
  /\btangga\s+darurat\b/i,
  /\btiang\s+listrik\b/i,
  /\bpapan\s+reklame\b/i,
  /\blapangan\s+terbuka\b/i,
  /\btitik\s+kumpul\b/i,
  /\bmengungsi\b/i,
  /\bpengungsian\b/i,
  /\bposko\b/i,
  /\bkebocoran\s+gas\b/i,
  /\barus\s+pendek\b/i,
  /\bberkendara\b/i,
  /\bmengemudi\b/i,
  /\bterjebak\b/i,

  // Lembaga resmi, peringatan dini, dan verifikasi informasi
  /\bbmkg\b/i,
  /\bbnpb\b/i,
  /\bbpbd\b/i,
  /\bbasarnas\b/i,
  /\b196\b/,
  /\b117\b/,
  /\b115\b/,
  /\b112\b/,
  /\bperingatan\s+dini\b/i,
  /\bearly\s+warning\b/i,
  /\binatews\b/i,
  /\bsigap\b/i,
  /\bhoaks\b/i,
  /\bsimulasi\b/i,
];

const EXPLICIT_OFF_TOPIC_PATTERNS: readonly RegExp[] = [
  /\bresep\b/i,
  /\bnasi\s+goreng\b/i,
  /\bmasak(an)?\b/i,
  /\bkue\s+bolu\b/i,
  /\bsepak\s*bola\b/i,
  /\bliga\s+(inggris|spanyol|champions|indonesia)\b/i,
  /\bskor\s+pertandingan\b/i,
  /\bsaham\b/i,
  /\bkripto\b/i,
  /\bbitcoin\b/i,
  /\bforex\b/i,
  /\bbuatkan\s+(kode|program|script)\b/i,
  /\bpython\b/i,
  /\bjavascript\b/i,
  /\bfilm\s+bioskop\b/i,
  /\blagu\s+populer\b/i,
  /\bpolitik\b/i,
  /\bpilpres\b/i,
  /\bselebriti\b/i,
  /\bkucing\b/i,
  /\banjing\b/i,
  /\blaptop\s+gaming\b/i,
];

export function detectPromptInjection(message: string): boolean {
  const normalized = message.trim();
  return INJECTION_PATTERNS.some((pattern) => pattern.test(normalized));
}

export function hasEarthquakeDomainTerm(message: string): boolean {
  return DOMAIN_TERMS.some((pattern) => pattern.test(message));
}

export interface OffTopicCheckOptions {
  history?: ReadonlyArray<{ role: 'user' | 'model'; content: string }>;
  pageContextNote?: string;
}

export function detectOffTopicQuery(
  message: string,
  options?: OffTopicCheckOptions
): boolean {
  const normalized = message.trim();
  if (!normalized) return false;
  if (EXPLICIT_OFF_TOPIC_PATTERNS.some((pattern) => pattern.test(normalized))) {
    return true;
  }
  if (hasEarthquakeDomainTerm(normalized)) {
    return false;
  }

  // Jika pengguna sedang melakukan percakapan lanjutan (multi-turn, mis. "kira-kira berapa beratnya?",
  // "berapa lama?", "kenapa bisa begitu?") atau datang dari konteks halaman Edukasi/Simulasi,
  // periksa apakah riwayat percakapan atau konteks halaman masih berada di domain gempa.
  if (options?.pageContextNote && hasEarthquakeDomainTerm(options.pageContextNote)) {
    return false;
  }
  if (options?.history && options.history.length > 0) {
    const recentHistoryHasDomain = options.history.some((turn) =>
      hasEarthquakeDomainTerm(turn.content)
    );
    if (recentHistoryHasDomain) {
      return false;
    }
  }

  return true;
}

export function wrapUserMessageAsData(message: string): string {
  const sanitized = message
    .replace(/<\/?pesan_pengguna>/gi, '')
    .trim();
  return `<pesan_pengguna>\n${sanitized}\n</pesan_pengguna>`;
}
