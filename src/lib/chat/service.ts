import { prisma } from '@/lib/prisma';
import { getGeminiModelsConfig, type ModelTierConfig } from '@/lib/env';
import {
  GeminiRestProvider,
  ProviderError,
  type ChatModelProvider,
  type ChatTurnMessage,
} from './provider';
import {
  markModelQuotaExhausted,
  reserveModelQuotaAtomically,
} from './quota';
import {
  buildEarthquakeContext,
  buildSystemPrompt,
  type BuildContextOptions,
} from './context';
import { matchFaqFallback } from './faq-matcher';
import {
  MAX_USER_MESSAGE_LENGTH,
  OFF_TOPIC_REFUSAL_MESSAGE,
  PROMPT_INJECTION_REFUSAL_MESSAGE,
  detectOffTopicQuery,
  detectPromptInjection,
  wrapUserMessageAsData,
} from './guardrails';

export interface ProcessChatInput {
  message: string;
  history?: ChatTurnMessage[];
  pageContextNote?: string;
  ipHash: string;
  provider?: ChatModelProvider;
  modelsConfig?: ModelTierConfig[];
  contextOptions?: BuildContextOptions;
  now?: Date;
}

export interface ProcessChatResult {
  status: number;
  reply?: string;
  source?: 'LLM' | 'FALLBACK';
  model?: string | null;
  chatLogId?: string | null;
  quotaExhausted?: boolean;
  contextAvailable?: boolean;
  faqMatched?: boolean;
  truncatedByMaxTokens?: boolean;
  error?: string;
}

async function saveChatLogSafe(
  data: {
    pertanyaan: string;
    jawaban: string;
    source: 'LLM' | 'FALLBACK';
    model: string | null;
    responseTimeMs: number;
    ipHash: string;
  },
  forceDbFailure = false
): Promise<string | null> {
  if (forceDbFailure) {
    return null;
  }
  try {
    const created = await prisma.chatLog.create({
      data: {
        pertanyaan: data.pertanyaan,
        jawaban: data.jawaban,
        source: data.source,
        model: data.model,
        responseTimeMs: data.responseTimeMs,
        ipHash: data.ipHash,
      },
      select: { id: true },
    });
    return created.id;
  } catch {
    return null;
  }
}

export async function processChatTurn(
  input: ProcessChatInput
): Promise<ProcessChatResult> {
  const startMs = performance.now();
  const trimmed = (input.message ?? '').trim();

  if (!trimmed) {
    return {
      status: 400,
      error: 'Pesan tidak boleh kosong.',
    };
  }

  if (trimmed.length > MAX_USER_MESSAGE_LENGTH) {
    return {
      status: 400,
      error: `Pesan terlalu panjang. Maksimal ${MAX_USER_MESSAGE_LENGTH} karakter.`,
    };
  }

  const forceDbFailure = Boolean(input.contextOptions?.forceDbFailure);

  if (detectPromptInjection(trimmed)) {
    const responseTimeMs = Math.max(1, Math.round(performance.now() - startMs));
    const chatLogId = await saveChatLogSafe(
      {
        pertanyaan: trimmed,
        jawaban: PROMPT_INJECTION_REFUSAL_MESSAGE,
        source: 'FALLBACK',
        model: 'guardrail-injection',
        responseTimeMs,
        ipHash: input.ipHash,
      },
      forceDbFailure
    );
    return {
      status: 200,
      reply: PROMPT_INJECTION_REFUSAL_MESSAGE,
      source: 'FALLBACK',
      model: 'guardrail-injection',
      chatLogId,
      quotaExhausted: false,
      contextAvailable: true,
      faqMatched: false,
    };
  }

  if (
    detectOffTopicQuery(trimmed, {
      history: input.history,
      pageContextNote: input.pageContextNote,
    })
  ) {
    const responseTimeMs = Math.max(1, Math.round(performance.now() - startMs));
    const chatLogId = await saveChatLogSafe(
      {
        pertanyaan: trimmed,
        jawaban: OFF_TOPIC_REFUSAL_MESSAGE,
        source: 'FALLBACK',
        model: 'guardrail-offtopic',
        responseTimeMs,
        ipHash: input.ipHash,
      },
      forceDbFailure
    );
    return {
      status: 200,
      reply: OFF_TOPIC_REFUSAL_MESSAGE,
      source: 'FALLBACK',
      model: 'guardrail-offtopic',
      chatLogId,
      quotaExhausted: false,
      contextAvailable: true,
      faqMatched: false,
    };
  }

  const quakeContext = await buildEarthquakeContext(input.contextOptions);
  const systemPrompt = buildSystemPrompt(quakeContext, input.pageContextNote);
  const provider = input.provider ?? new GeminiRestProvider();
  const tiers = input.modelsConfig ?? getGeminiModelsConfig();
  const now = input.now ?? new Date();

  let anyQuotaExhausted = false;

  for (const tier of tiers) {
    const reservation = forceDbFailure
      ? { allowed: false, dbAvailable: false }
      : await reserveModelQuotaAtomically(tier.model, tier.dailyQuota, now);

    if (!reservation.allowed) {
      anyQuotaExhausted = true;
      continue;
    }

    try {
      const llmRes = await provider.generate({
        tier,
        systemPrompt,
        history: input.history,
        userMessage: wrapUserMessageAsData(trimmed),
      });

      let finalReply = llmRes.text;
      if (
        !quakeContext.contextAvailable &&
        !finalReply.toLowerCase().includes('tidak tersedia')
      ) {
        finalReply = `${finalReply}\n\nCatatan: Data gempa terbaru dari BMKG dan basis data lokal sedang tidak tersedia saat ini.`;
      }

      const responseTimeMs = Math.max(1, Math.round(performance.now() - startMs));
      const chatLogId = await saveChatLogSafe(
        {
          pertanyaan: trimmed,
          jawaban: finalReply,
          source: 'LLM',
          model: tier.model,
          responseTimeMs,
          ipHash: input.ipHash,
        },
        forceDbFailure
      );

      return {
        status: 200,
        reply: finalReply,
        source: 'LLM',
        model: tier.model,
        chatLogId,
        quotaExhausted: false,
        contextAvailable: quakeContext.contextAvailable,
        truncatedByMaxTokens: llmRes.truncatedByMaxTokens,
      };
    } catch (err) {
      if (err instanceof ProviderError && err.reason === 'RATE_LIMIT') {
        anyQuotaExhausted = true;
        if (!forceDbFailure) {
          await markModelQuotaExhausted(tier.model, tier.dailyQuota, now);
        }
      }
      // Semua kegagalan penyedia (429, 404, 5xx, jaringan/timeout, teks kosong, diblokir)
      // langsung jatuh ke tingkat berikutnya.
    }
  }

  // Tingkat 3 (FaqGempa DB) -> Tingkat 4 (STATIC_FAQS di src/data/fallback/faq.ts)
  const faqResult = await matchFaqFallback(trimmed, {
    quakeContext,
    forceDbFailure,
    includeFallbackNotice: true,
  });

  let fallbackReply = faqResult.answerText;
  if (
    !quakeContext.contextAvailable &&
    !fallbackReply.toLowerCase().includes('data gempa terbaru')
  ) {
    fallbackReply = `${fallbackReply}\n\nCatatan: Data gempa terbaru sedang tidak tersedia saat ini.`;
  }

  const responseTimeMs = Math.max(1, Math.round(performance.now() - startMs));
  const chatLogId = await saveChatLogSafe(
    {
      pertanyaan: trimmed,
      jawaban: fallbackReply,
      source: 'FALLBACK',
      model: faqResult.tier.toLowerCase(),
      responseTimeMs,
      ipHash: input.ipHash,
    },
    forceDbFailure
  );

  return {
    status: 200,
    reply: fallbackReply,
    source: 'FALLBACK',
    model: faqResult.tier.toLowerCase(),
    chatLogId,
    quotaExhausted: anyQuotaExhausted,
    contextAvailable: quakeContext.contextAvailable,
    faqMatched: faqResult.matched,
  };
}

export interface FeedbackResult {
  status: number;
  success: boolean;
  error?: string;
}

export async function submitChatFeedback(
  chatLogId: string,
  isHelpful: boolean
): Promise<FeedbackResult> {
  const id = (chatLogId ?? '').trim();
  if (!id || id.length < 10 || id.length > 64 || typeof isHelpful !== 'boolean') {
    return {
      status: 400,
      success: false,
      error: 'Parameter chatLogId atau penilaian tidak valid.',
    };
  }

  const existing = await prisma.chatLog.findUnique({
    where: { id },
    select: { id: true, isHelpful: true },
  });

  if (!existing) {
    return {
      status: 404,
      success: false,
      error: 'Catatan percakapan tidak ditemukan.',
    };
  }

  if (existing.isHelpful !== null) {
    return {
      status: 409,
      success: false,
      error: 'Penilaian untuk jawaban ini sudah pernah dikirim.',
    };
  }

  const updated = await prisma.chatLog.updateMany({
    where: {
      id,
      isHelpful: null,
    },
    data: {
      isHelpful,
    },
  });

  if (updated.count === 0) {
    return {
      status: 409,
      success: false,
      error: 'Penilaian untuk jawaban ini sudah pernah dikirim.',
    };
  }

  return {
    status: 200,
    success: true,
  };
}

export async function cleanupExpiredChatLogs(
  retentionDays = 30,
  now: Date = new Date()
): Promise<{ deletedCount: number; cutoffDate: Date }> {
  const cutoffDate = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
  const res = await prisma.chatLog.deleteMany({
    where: {
      createdAt: {
        lt: cutoffDate,
      },
    },
  });
  return {
    deletedCount: res.count,
    cutoffDate,
  };
}

