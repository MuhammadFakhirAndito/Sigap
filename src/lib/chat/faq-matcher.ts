import { prisma } from '@/lib/prisma';
import { STATIC_FAQS } from '@/data/fallback/faq';
import type { EarthquakeContextResult } from './context';

export interface FaqCandidate {
  pertanyaan: string;
  jawaban: string;
  kataKunci: string[];
}

export interface FaqMatchResult {
  matched: boolean;
  score: number;
  faq: FaqCandidate | null;
  tier: 'FAQ_DB' | 'FAQ_STATIC' | 'NO_MATCH';
  answerText: string;
}

export const MIN_FAQ_MATCH_SCORE = 2;

const STOPWORDS = new Set([
  'apa',
  'apakah',
  'itu',
  'ini',
  'yang',
  'di',
  'ke',
  'dari',
  'dan',
  'atau',
  'untuk',
  'pada',
  'bagaimana',
  'kenapa',
  'mengapa',
  'berapa',
  'jika',
  'bila',
  'kalau',
  'adalah',
  'ialah',
  'dengan',
  'saja',
  'bisa',
  'dapat',
  'harus',
  'perlu',
  'boleh',
  'bolehkah',
  'dilakukan',
  'terjadi',
  'saat',
  'ketika',
  'sedang',
  'dalam',
  'oleh',
  'saya',
  'kita',
  'kami',
  'anda',
  'tolong',
  'jelaskan',
  'cara',
  'fungsi',
  'arti',
  'menurut',
  'menyebut',
  'menyarankan',
  'antara',
  'lain',
  'seperti',
  'karena',
  'sekitar',
  'biasanya',
  'pertama',
  'setelah',
  'sesudah',
  'sebelum',
  'jangan',
  'segera',
  'tempat',
  'daerah',
  'secara',
  'lebih',
  'tidak',
  'bukan',
  'masih',
  'mungkin',
  'ada',
]);

function normalizeText(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenizeContentWords(input: string): string[] {
  const norm = normalizeText(input);
  if (!norm) return [];
  return norm.split(' ').filter((w) => w.length >= 2 && !STOPWORDS.has(w));
}

export function scoreFaqCandidate(query: string, item: FaqCandidate): number {
  const normQuery = normalizeText(query);
  if (!normQuery) return 0;

  const queryTokens = new Set(tokenizeContentWords(query));
  let score = 0;

  for (const rawKey of item.kataKunci) {
    const normKey = normalizeText(rawKey);
    if (!normKey) continue;
    const keyWords = normKey.split(' ').filter(Boolean);

    if (keyWords.length >= 2) {
      if (normQuery.includes(normKey)) {
        score += 2;
      }
    } else {
      const singleWord = keyWords[0]!;
      if (normQuery.split(' ').includes(singleWord)) {
        // Kata "gempa" tunggal terlalu umum sehingga diberi bobot 0.5 kecuali disertai kata kunci lain.
        score += singleWord === 'gempa' ? 0.5 : 1;
      }
    }
  }

  const questionTokens = new Set(
    tokenizeContentWords(item.pertanyaan).filter(
      (token) => token !== 'gempa' && token !== 'bumi'
    )
  );
  for (const qToken of questionTokens) {
    if (queryTokens.has(qToken)) {
      score += 1;
    }
  }

  const answerTokens = new Set(
    tokenizeContentWords(item.jawaban).filter(
      (token) =>
        token !== 'gempa' &&
        token !== 'bumi' &&
        token !== 'bmkg' &&
        token !== 'bnpb' &&
        !questionTokens.has(token)
    )
  );
  for (const aToken of answerTokens) {
    if (queryTokens.has(aToken)) {
      score += 1;
    }
  }

  if (normalizeText(item.pertanyaan) === normQuery) {
    score += 3;
  }

  return score;
}

export function findBestFaqFromList(
  query: string,
  candidates: FaqCandidate[],
  minScore: number = MIN_FAQ_MATCH_SCORE
): { faq: FaqCandidate | null; score: number } {
  let bestFaq: FaqCandidate | null;
  bestFaq = null;
  let bestScore = 0;

  for (const item of candidates) {
    const s = scoreFaqCandidate(query, item);
    if (s > bestScore) {
      bestScore = s;
      bestFaq = item;
    }
  }

  if (!bestFaq || bestScore < minScore) {
    return { faq: null, score: bestScore };
  }

  return { faq: bestFaq, score: bestScore };
}

function isLatestQuakeQuery(query: string): boolean {
  const norm = normalizeText(query);
  return (
    norm.includes('gempa terakhir') ||
    norm.includes('gempa terbaru') ||
    norm.includes('gempa terkini') ||
    norm.includes('autogempa') ||
    (norm.includes('gempa') && norm.includes('terakhir') && norm.includes('mana'))
  );
}

export const NO_FAQ_MATCH_MESSAGE =
  'Maaf, saat ini asisten AI sedang tidak tersedia dan kami belum menemukan jawaban yang cocok di daftar FAQ untuk pertanyaan tersebut. Silakan telusuri materi lengkap di halaman Edukasi (/edukasi) atau hubungi kanal resmi BMKG (Contact Center 196).';

export async function matchFaqFallback(
  query: string,
  options: {
    quakeContext?: EarthquakeContextResult;
    forceDbFailure?: boolean;
    includeFallbackNotice?: boolean;
  } = {}
): Promise<FaqMatchResult> {
  const { quakeContext, forceDbFailure = false, includeFallbackNotice = true } = options;

  if (isLatestQuakeQuery(query) && quakeContext?.autogempa) {
    const g = quakeContext.autogempa;
    const prefix = includeFallbackNotice
      ? 'Layanan model AI sedang penuh, berikut data langsung dari BMKG: '
      : '';
    const answerText = `${prefix}Berdasarkan data BMKG (${g.waktuWib}), gempa terbaru berkekuatan M ${g.magnitudo.toFixed(
      1
    )} terjadi di ${g.wilayah} (koordinat ${g.koordinat}) dengan kedalaman ${
      g.kedalamanKm
    } km. Status: ${g.potensiTeks}.`;
    return {
      matched: true,
      score: 5,
      faq: {
        pertanyaan: 'Gempa terakhir BMKG',
        jawaban: answerText,
        kataKunci: ['gempa terakhir', 'bmkg'],
      },
      tier: 'FAQ_STATIC',
      answerText,
    };
  }

  // Tingkat 3: Coba tabel FaqGempa di PostgreSQL terlebih dahulu.
  try {
    if (forceDbFailure) {
      throw new Error('Simulasi DB gagal pada FaqGempa');
    }

    const dbFaqs = await prisma.faqGempa.findMany({
      where: { aktif: true },
      select: {
        pertanyaan: true,
        jawaban: true,
        kataKunci: true,
      },
    });

    if (dbFaqs.length > 0) {
      const { faq, score } = findBestFaqFromList(query, dbFaqs, MIN_FAQ_MATCH_SCORE);
      if (faq) {
        const prefix = includeFallbackNotice
          ? 'Kuota asisten AI sedang penuh atau layanan model sedang mengalami gangguan. Berikut jawaban dari FAQ SIGAP:\n\n'
          : '';
        return {
          matched: true,
          score,
          faq,
          tier: 'FAQ_DB',
          answerText: `${prefix}${faq.jawaban}`,
        };
      }
      return {
        matched: false,
        score,
        faq: null,
        tier: 'NO_MATCH',
        answerText: NO_FAQ_MATCH_MESSAGE,
      };
    }
  } catch {
    // Jika DB mati, lanjut ke Tingkat 4 (STATIC_FAQS).
  }

  // Tingkat 4: Gunakan STATIC_FAQS di src/data/fallback/faq.ts.
  const activeStatic = STATIC_FAQS.filter((f) => f.aktif);
  const { faq, score } = findBestFaqFromList(query, activeStatic, MIN_FAQ_MATCH_SCORE);

  if (faq) {
    const prefix = includeFallbackNotice
      ? 'Kuota asisten AI sedang penuh atau layanan model sedang mengalami gangguan. Berikut jawaban dari FAQ SIGAP:\n\n'
      : '';
    return {
      matched: true,
      score,
      faq,
      tier: 'FAQ_STATIC',
      answerText: `${prefix}${faq.jawaban}`,
    };
  }

  return {
    matched: false,
    score,
    faq: null,
    tier: 'NO_MATCH',
    answerText: NO_FAQ_MATCH_MESSAGE,
  };
}
