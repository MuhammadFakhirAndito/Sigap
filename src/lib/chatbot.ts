import crypto from 'crypto';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { prisma } from './prisma';
import { cacheService } from './redis';
import { ChatSource } from '@prisma/client';
import { getStaticFaqFallback } from '@/data/fallback/faq';

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
const DAILY_QUOTA_LIMIT = 20; // Batas kuota gratis harian Google Gemini

/**
 * Hash IP menggunakan HMAC-SHA256 untuk perlindungan privasi (PRD v0.2 FR-DB-09, Bagian 6.7)
 */
export function hashIp(ip: string): string {
  const secret = process.env.LOG_HMAC_SECRET || process.env.IP_SALT || 'sigap_hmac_secret_2026';
  return crypto.createHmac('sha256', secret).update(ip).digest('hex').substring(0, 16);
}

/**
 * Normalisasi dan hash pertanyaan untuk pengecekan cache respons identik (FR-DB-13)
 */
export function hashQuery(query: string): string {
  return crypto.createHash('md5').update(query.trim().toLowerCase()).digest('hex');
}

/**
 * Catat dan periksa kuota harian di tabel KuotaHarian PostgreSQL (FR-DB-11)
 */
async function checkAndIncrementQuota(modelName: string, dateStr: string, limit: number): Promise<boolean> {
  // 1. Coba periksa di database (PostgreSQL)
  try {
    const existing = await prisma.kuotaHarian.findUnique({
      where: { model_tanggal: { model: modelName, tanggal: dateStr } },
    });

    if (existing && existing.jumlah >= limit) {
      return false; // Kuota habis
    }

    await prisma.kuotaHarian.upsert({
      where: { model_tanggal: { model: modelName, tanggal: dateStr } },
      update: { jumlah: { increment: 1 } },
      create: { model: modelName, tanggal: dateStr, jumlah: 1 },
    });

    return true;
  } catch (dbErr) {
    console.warn('⚠️ Gagal mencatat KuotaHarian di DB, fallback ke Redis/Memory:', dbErr);
  }

  // 2. Fallback ke Redis / in-memory cache
  const quotaKey = `quota:gemini:${modelName}:${dateStr}`;
  const used = parseInt((await cacheService.get(quotaKey)) || '0', 10);
  if (used >= limit) {
    return false;
  }
  await cacheService.incr(quotaKey, 86400);
  return true;
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
 * Pencarian FAQ bertingkat: FaqGempa (DB) -> FAQ Statis di kode (src/data/fallback/faq.ts)
 * Sesuai FR-DB-08, FR-DB-12, TC-DB-13
 */
async function searchFaqFallback(pertanyaan: string): Promise<string> {
  // 1. Coba cari di FaqGempa (Database PostgreSQL)
  try {
    const faqs = await prisma.faqGempa.findMany({
      where: { aktif: true },
    });

    if (faqs.length > 0) {
      const lowerQ = pertanyaan.toLowerCase();
      const words = lowerQ.split(/[\s,?.!]+/).filter((w) => w.length > 2);

      let bestFaq: (typeof faqs)[0] | null = null;
      let highestScore = 0;

      for (const faq of faqs) {
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
        return `[Mode Cadangan FAQ SIGAP (Database)]\n\n${bestFaq.jawaban}`;
      }
    }
  } catch (dbErr) {
    console.warn('⚠️ Database FaqGempa offline, beralih ke FAQ statis di kode (TC-DB-13):', dbErr);
  }

  // 2. Garis Pertahanan Terakhir: FAQ Statis di kode (src/data/fallback/faq.ts)
  const staticAnswer = getStaticFaqFallback(pertanyaan);
  return staticAnswer || `[Pusat Siaga Bencana SIGAP]\n\nMohon maaf, layanan AI SIGAP sedang offline. Jika Anda merasakan gempa:
1. Lakukan protokol Drop, Cover, and Hold On (Merunduk, Berlindung, Pegang Erat).
2. Hindari kaca dan jangan gunakan lift.
3. Hubungi nomor darurat 112 atau 115 (Basarnas).`;
}

/**
 * Eksekusi panggilan chatbot dengan alur fallback bertingkat & logging (FR-DB-12)
 */
export async function askChatbot(options: ChatRequestOptions): Promise<ChatResponseResult> {
  const startTime = Date.now();
  const { pertanyaan, ip = '127.0.0.1' } = options;
  const ipHash = hashIp(ip);

  // 1. Rate Limit per IP (10 pesan per menit, TC-DB-04, FR-DB-10)
  const rateLimitKey = `rl:chat:${ipHash}`;
  const currentCount = await cacheService.incr(rateLimitKey, 60);

  if (currentCount > 10) {
    return {
      jawaban: 'Batas interaksi terlampaui. Demi kenyamanan bersama, silakan tunggu 1 menit sebelum mengirim pertanyaan kembali.',
      source: 'FALLBACK',
      responseTimeMs: Date.now() - startTime,
      rateLimitExceeded: true,
    };
  }

  // 2. Cek Cache Pertanyaan Identik (FR-DB-13)
  const queryHash = hashQuery(pertanyaan);
  const cacheKey = `chat:cache:${queryHash}`;
  const cachedAnswer = await cacheService.get(cacheKey);

  if (cachedAnswer) {
    return {
      jawaban: cachedAnswer,
      source: 'CACHE',
      responseTimeMs: Date.now() - startTime,
    };
  }

  // 3. Persiapan Konteks RAG
  const gempaContext = await getLatestEarthquakeContext();
  const systemPrompt = `Anda adalah Asisten Virtual SIGAP (Sistem Informasi dan Peringatan Dini Kebencanaan).
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
    const quotaAllowed = await checkAndIncrementQuota(PRIMARY_MODEL, todayStr, DAILY_QUOTA_LIMIT);

    if (quotaAllowed) {
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
      } catch (err: any) {
        console.warn('⚠️ Gagal memanggil Primary Gemini model (TC-DB-05):', err.message);
      }
    } else {
      console.log('ℹ️ Kuota harian model utama habis, mencoba model cadangan...');
    }
  }

  // 5. Coba Model Cadangan (Backup LLM) jika model utama gagal / kuota habis
  if (!answer && backupKey) {
    const quotaAllowedBackup = await checkAndIncrementQuota(BACKUP_MODEL, todayStr, DAILY_QUOTA_LIMIT);

    if (quotaAllowedBackup) {
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
      } catch (err: any) {
        console.warn('⚠️ Gagal memanggil Backup Gemini model:', err.message);
      }
    }
  }

  // 6. Fallback Rule-Based (FaqGempa DB -> FAQ Statis di kode) (FR-DB-12, TC-DB-13)
  if (!answer) {
    answer = await searchFaqFallback(pertanyaan);
    source = 'FALLBACK';
    usedModel = null;
  }

  const finalAnswer = answer;
  const responseTimeMs = Date.now() - startTime;

  // 7. Simpan Cache Respons (TTL 1 Jam)
  if (finalAnswer && source === 'LLM') {
    await cacheService.set(cacheKey, finalAnswer, 3600);
  }

  // 8. Log ke tabel ChatLog untuk bahan evaluasi kuliah (FR-DB-09)
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
  } catch (logErr) {
    console.warn('⚠️ ChatLog database offline, respon tetap dikirim ke pengguna:', logErr);
  }

  return {
    logId,
    jawaban: finalAnswer,
    source,
    model: usedModel || undefined,
    responseTimeMs,
  };
}
