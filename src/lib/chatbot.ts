import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';
import { cacheService } from './redis';
import { ChatSource } from '@prisma/client';

export interface ChatRequestOptions {
  pertanyaan: string;
  ip?: string;
}

export interface ChatResponseResult {
  logId?: string;
  jawaban: string;
  source: 'LLM' | 'FALLBACK' | 'CACHE';
  model?: string;
  responseTimeMs: number;
  rateLimitExceeded?: boolean;
}

const PRIMARY_MODEL = 'gemini-1.5-flash';
const BACKUP_MODEL = 'gemini-1.5-flash-8b';
const DAILY_QUOTA_LIMIT = 20; // Batas kuota gratis Google Gemini

/**
 * Hash IP satu arah agar privasi pengguna terjaga (PRD FR-DB-09)
 */
export function hashIp(ip: string): string {
  const salt = process.env.IP_SALT || 'sigap_secure_salt_2026';
  return crypto.createHash('sha256').update(ip + salt).digest('hex').substring(0, 16);
}

/**
 * Normalisasi dan hash pertanyaan untuk pengecekan cache respons identik
 */
export function hashQuery(query: string): string {
  return crypto.createHash('md5').update(query.trim().toLowerCase()).digest('hex');
}

/**
 * Ambil konteks data gempa terbaru dari database (Lightweight RAG)
 */
async function getLatestEarthquakeContext(): Promise<string> {
  try {
    const latestQuakes = await prisma.gempa.findMany({
      orderBy: { waktuUtc: 'desc' },
      take: 4,
    });

    if (!latestQuakes || latestQuakes.length === 0) {
      return 'Saat ini belum ada data riwayat gempa tersimpan di database lokal.';
    }

    const [auto, ...recents] = latestQuakes;

    let context = `--- DATA GEMPA TERKINI BMKG (FAKTUAL & REALTIME) ---\n`;
    context += `1. GEMPA TERKINI/UTAMA (M${auto.magnitudo}):\n`;
    context += `   - Waktu (UTC): ${auto.waktuUtc.toISOString()}\n`;
    context += `   - Koordinat: ${auto.lat}, ${auto.lon} (${auto.wilayah})\n`;
    context += `   - Kedalaman: ${auto.kedalamanKm} km\n`;
    context += `   - Potensi Tsunami: ${auto.potensiTeks}\n`;
    if (auto.dirasakan) {
      context += `   - Dirasakan: ${auto.dirasakan}\n`;
    }

    if (recents.length > 0) {
      context += `\n2. RIWAYAT 3 GEMPA SEBELUMNYA:\n`;
      recents.forEach((g, idx) => {
        context += `   ${idx + 1}. M${g.magnitudo} - ${g.wilayah} (${g.kedalamanKm} km) - ${g.waktuUtc.toLocaleDateString('id-ID')}\n`;
      });
    }
    context += `----------------------------------------------------`;
    return context;
  } catch (err) {
    console.warn('⚠️ Gagal mengambil konteks gempa untuk RAG:', err);
    return 'Data gempa lokal sedang tidak dapat diakses.';
  }
}

/**
 * Pencarian FAQ berbasis aturan (Rule-based Fallback)
 */
async function searchFaqFallback(pertanyaan: string): Promise<string | null> {
  try {
    const faqs = await prisma.faqGempa.findMany({
      where: { aktif: true },
    });

    if (faqs.length === 0) return null;

    const lowerQ = pertanyaan.toLowerCase();
    const words = lowerQ.split(/[\s,?.!]+/).filter((w) => w.length > 2);

    let bestFaq: (typeof faqs)[0] | null = null;
    let highestScore = 0;

    for (const faq of faqs) {
      let score = 0;
      // Cek kecocokan kata kunci
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
      return `[Mode Cadangan FAQ SIGAP]\n\n${bestFaq.jawaban}`;
    }
  } catch (err) {
    console.warn('⚠️ Gagal mengakses FaqGempa di database:', err);
  }

  return `[Mode Tanggap Darurat SIGAP]\n\nMohon maaf, layanan AI SIGAP sedang sibuk atau offline. Jika Anda merasakan gempa bumi saat ini:
1. Lakukan protokol Drop, Cover, and Hold On (Merunduk, Berlindung di bawah meja kokoh, Pegang erat kaki meja).
2. Hindari kaca dan jangan gunakan lift.
3. Waspadai gempa susulan dan ikuti panduan resmi BMKG atau BPBD setempat.`;
}

/**
 * Eksekusi panggilan chatbot dengan alur fallback bertingkat & logging
 */
export async function askChatbot(options: ChatRequestOptions): Promise<ChatResponseResult> {
  const startTime = Date.now();
  const { pertanyaan, ip = '127.0.0.1' } = options;
  const ipHash = hashIp(ip);

  // 1. Rate Limit per IP (10 pesan per menit, TC-DB-04)
  const rateLimitKey = `rl:chat:${ipHash}`;
  const requestCount = await cacheService.incr(rateLimitKey, 60);

  if (requestCount > 10) {
    const elapsed = Date.now() - startTime;
    return {
      jawaban: 'Terlalu banyak permintaan dalam waktu singkat (maksimal 10 pesan/menit). Harap tunggu beberapa saat sebelum mengirim pesan lagi.',
      source: 'FALLBACK',
      responseTimeMs: elapsed,
      rateLimitExceeded: true,
    };
  }

  // 2. Cek Cache Pertanyaan Identik (FR-DB-13)
  const queryHash = hashQuery(pertanyaan);
  const cacheKey = `chat:cache:${queryHash}`;
  const cachedAnswer = await cacheService.get(cacheKey);

  if (cachedAnswer) {
    const elapsed = Date.now() - startTime;
    return {
      jawaban: cachedAnswer,
      source: 'CACHE',
      responseTimeMs: elapsed,
    };
  }

  // 3. Persiapan Konteks RAG
  const gempaContext = await getLatestEarthquakeContext();
  const systemPrompt = `Anda adalah Asisten Virtual SIGAP Gempa (Sistem Informasi Gempabumi dan Peringatan Dini Indonesia).
Tugas Anda:
1. Menjawab pertanyaan pengguna seputar gempa bumi, tsunami, mitigasi bencana, persiapan tas siaga, dan keselamatan dengan ramah, akurat, dan menenangkan.
2. Gunakan data faktual gempa terbaru di bawah ini untuk menjawab jika pengguna menanyakan kejadian gempa terkini:
${gempaContext}
3. Berikan jawaban dalam bahasa Indonesia yang ringkas, mudah dipahami masyarakat umum, serta selalu utamakan keselamatan jiwa.`;

  const primaryKey = process.env.GEMINI_API_KEY;
  const backupKey = process.env.GEMINI_BACKUP_API_KEY || primaryKey;
  const todayStr = new Date().toISOString().split('T')[0];

  let answer: string | null = null;
  let usedModel: string | null = null;
  let source: 'LLM' | 'FALLBACK' = 'FALLBACK';

  // 4. Coba Model Utama (Primary LLM)
  if (primaryKey) {
    const quotaKeyPrimary = `quota:gemini:${PRIMARY_MODEL}:${todayStr}`;
    const usedPrimary = parseInt((await cacheService.get(quotaKeyPrimary)) || '0', 10);

    if (usedPrimary < DAILY_QUOTA_LIMIT) {
      try {
        const genAI = new GoogleGenerativeAI(primaryKey);
        const model = genAI.getGenerativeModel({
          model: PRIMARY_MODEL,
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(pertanyaan);
        answer = result.response.text();
        usedModel = PRIMARY_MODEL;
        source = 'LLM';
        await cacheService.incr(quotaKeyPrimary, 86400);
      } catch (err: any) {
        console.warn('⚠️ Gagal memanggil Primary Gemini model:', err.message);
      }
    }
  }

  // 5. Coba Model Cadangan (Backup LLM) jika model utama gagal / kuota habis
  if (!answer && backupKey) {
    const quotaKeyBackup = `quota:gemini:${BACKUP_MODEL}:${todayStr}`;
    const usedBackup = parseInt((await cacheService.get(quotaKeyBackup)) || '0', 10);

    if (usedBackup < DAILY_QUOTA_LIMIT) {
      try {
        console.log('🔄 Beralih ke Backup Gemini model...');
        const genAI = new GoogleGenerativeAI(backupKey);
        const model = genAI.getGenerativeModel({
          model: BACKUP_MODEL,
          systemInstruction: systemPrompt,
        });

        const result = await model.generateContent(pertanyaan);
        answer = result.response.text();
        usedModel = BACKUP_MODEL;
        source = 'LLM';
        await cacheService.incr(quotaKeyBackup, 86400);
      } catch (err: any) {
        console.warn('⚠️ Gagal memanggil Backup Gemini model:', err.message);
      }
    }
  }

  // 6. Fallback Rule-Based (FaqGempa dari DB) jika kedua model gagal / API key kosong
  if (!answer) {
    answer = (await searchFaqFallback(pertanyaan)) || 'Layanan sedang tidak tersedia. Harap ikuti protokol keselamatan bencana dari BMKG dan BNPB.';
    source = 'FALLBACK';
    usedModel = null;
  }

  const finalAnswer = answer;
  const responseTimeMs = Date.now() - startTime;

  // 7. Simpan Cache Respons (TTL 1 Jam)
  if (finalAnswer && source === 'LLM') {
    await cacheService.set(cacheKey, finalAnswer, 3600);
  }

  // 8. Log ke tabel ChatLog untuk bahan evaluasi kuliah (FR-DB-09, FR-DB-21)
  let logId: string | undefined;
  try {
    const chatLog = await prisma.chatLog.create({
      data: {
        pertanyaan,
        jawaban: finalAnswer,
        source: source as ChatSource,
        model: usedModel,
        responseTimeMs,
        ipHash,
      },
    });
    logId = chatLog.id;
  } catch (err) {
    console.warn('⚠️ Tidak dapat mencatat ChatLog ke database:', err);
  }

  return {
    logId,
    jawaban: finalAnswer,
    source,
    model: usedModel || undefined,
    responseTimeMs,
  };
}
