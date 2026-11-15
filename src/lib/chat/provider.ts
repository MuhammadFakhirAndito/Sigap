import type { ModelTierConfig } from '@/lib/env';

export type ProviderErrorReason =
  | 'RATE_LIMIT'
  | 'MODEL_NOT_FOUND'
  | 'SERVER_ERROR'
  | 'TIMEOUT_OR_NETWORK'
  | 'EMPTY_RESPONSE'
  | 'BLOCKED'
  | 'MISSING_API_KEY'
  | 'BAD_REQUEST';

export class ProviderError extends Error {
  public readonly reason: ProviderErrorReason;
  public readonly statusCode?: number;
  public readonly model: string;

  constructor(
    reason: ProviderErrorReason,
    model: string,
    message: string,
    statusCode?: number
  ) {
    super(message);
    this.name = 'ProviderError';
    this.reason = reason;
    this.model = model;
    this.statusCode = statusCode;
  }
}

export interface ChatTurnMessage {
  role: 'user' | 'model';
  content: string;
}

export interface GenerateChatRequest {
  tier: ModelTierConfig;
  systemPrompt: string;
  history?: ChatTurnMessage[];
  userMessage: string;
  timeoutMs?: number;
}

export interface GenerateChatResponse {
  text: string;
  model: string;
  finishReason: string | null;
  truncatedByMaxTokens: boolean;
}

export interface ChatModelProvider {
  generate(req: GenerateChatRequest): Promise<GenerateChatResponse>;
}

const BLOCKED_FINISH_REASONS = new Set([
  'SAFETY',
  'RECITATION',
  'BLOCKLIST',
  'PROHIBITED_CONTENT',
  'SPII',
]);

export class GeminiRestProvider implements ChatModelProvider {
  private readonly apiKey: string;

  constructor(apiKey = process.env.GEMINI_API_KEY ?? '') {
    this.apiKey = apiKey.trim();
  }

  async generate(req: GenerateChatRequest): Promise<GenerateChatResponse> {
    const { tier, systemPrompt, history = [], userMessage, timeoutMs = 15000 } = req;
    const modelName = tier.model;

    if (!this.apiKey) {
      throw new ProviderError(
        'MISSING_API_KEY',
        modelName,
        'GEMINI_API_KEY belum dikonfigurasi di server'
      );
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
      modelName
    )}:generateContent`;

    const contents = [
      ...history.slice(-6).map((item) => ({
        role: item.role,
        parts: [{ text: item.content }],
      })),
      {
        role: 'user',
        parts: [{ text: userMessage }],
      },
    ];

    const generationConfig: Record<string, unknown> = {
      maxOutputTokens: tier.maxOutputTokens,
      thinkingConfig: {
        thinkingLevel: tier.thinkingLevel,
      },
    };

    // Model seri gemini-4-* menolak nilai sampling di luar rentang dan mengabaikan temperature.
    if (
      tier.supportsTemperature &&
      !modelName.toLowerCase().startsWith('gemini-4-') &&
      typeof tier.temperature === 'number'
    ) {
      generationConfig.temperature = tier.temperature;
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': this.apiKey,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents,
          generationConfig,
        }),
        signal: AbortSignal.timeout(timeoutMs),
      });
    } catch (err) {
      throw new ProviderError(
        'TIMEOUT_OR_NETWORK',
        modelName,
        err instanceof Error ? err.message : 'Kegagalan jaringan atau batas waktu habis'
      );
    }

    if (res.status === 429) {
      throw new ProviderError(
        'RATE_LIMIT',
        modelName,
        `Kuota atau batas laju penyedia tercapai pada model ${modelName}`,
        429
      );
    }

    if (res.status === 404) {
      console.error(
        `[SIGAP Chat] Kesalahan konfigurasi model: "${modelName}" mengembalikan HTTP 404 (model tidak ditemukan atau sudah dihentikan).`
      );
      throw new ProviderError(
        'MODEL_NOT_FOUND',
        modelName,
        `Model ${modelName} tidak ditemukan (404)`,
        404
      );
    }

    if (res.status >= 500) {
      throw new ProviderError(
        'SERVER_ERROR',
        modelName,
        `Layanan model ${modelName} mengalami gangguan (${res.status})`,
        res.status
      );
    }

    if (!res.ok) {
      throw new ProviderError(
        'BAD_REQUEST',
        modelName,
        `Permintaan ke model ${modelName} ditolak (${res.status})`,
        res.status
      );
    }

    let payload: Record<string, unknown>;
    try {
      payload = (await res.json()) as Record<string, unknown>;
    } catch {
      throw new ProviderError(
        'SERVER_ERROR',
        modelName,
        `Respons dari model ${modelName} bukan JSON yang sah`,
        res.status
      );
    }

    const promptFeedback = payload.promptFeedback as Record<string, unknown> | undefined;
    if (promptFeedback?.blockReason) {
      throw new ProviderError(
        'BLOCKED',
        modelName,
        `Permintaan diblokir oleh filter keamanan (${String(promptFeedback.blockReason)})`
      );
    }

    const candidates = Array.isArray(payload.candidates)
      ? (payload.candidates as Array<Record<string, unknown>>)
      : [];

    if (candidates.length === 0) {
      throw new ProviderError(
        'EMPTY_RESPONSE',
        modelName,
        `Model ${modelName} tidak mengembalikan kandidat jawaban`
      );
    }

    const first = candidates[0] ?? {};
    const finishReason =
      typeof first.finishReason === 'string' ? first.finishReason : null;

    if (finishReason && BLOCKED_FINISH_REASONS.has(finishReason)) {
      throw new ProviderError(
        'BLOCKED',
        modelName,
        `Jawaban diblokir oleh kebijakan keamanan (${finishReason})`
      );
    }

    const contentObj =
      (first.content as Record<string, unknown> | undefined) ?? {};
    const parts = Array.isArray(contentObj.parts)
      ? (contentObj.parts as Array<Record<string, unknown>>)
      : [];

    const text = parts
      .filter((part) => !part.thought && typeof part.text === 'string')
      .map((part) => part.text as string)
      .join('')
      .trim();

    if (!text) {
      throw new ProviderError(
        'EMPTY_RESPONSE',
        modelName,
        finishReason === 'MAX_TOKENS'
          ? `Model ${modelName} kehabisan batas token sebelum menghasilkan teks jawaban`
          : `Model ${modelName} mengembalikan teks kosong`
      );
    }

    const truncatedByMaxTokens = finishReason === 'MAX_TOKENS';
    if (truncatedByMaxTokens) {
      const usage = (payload.usageMetadata as Record<string, unknown> | undefined) ?? {};
      console.warn(
        `[SIGAP Chat] Jawaban model "${modelName}" terpotong oleh MAX_TOKENS (thoughtsTokenCount=${String(
          usage.thoughtsTokenCount ?? 0
        )}, candidatesTokenCount=${String(usage.candidatesTokenCount ?? 0)}).`
      );
    }

    return {
      text,
      model: modelName,
      finishReason,
      truncatedByMaxTokens,
    };
  }
}

export type MockModelHandler =
  | { type: 'success'; text: string; finishReason?: string }
  | {
      type: 'error';
      reason: ProviderErrorReason;
      statusCode?: number;
      message?: string;
    }
  | ((req: GenerateChatRequest) => Promise<GenerateChatResponse> | GenerateChatResponse);

export class MockChatProvider implements ChatModelProvider {
  private readonly handlers: Record<string, MockModelHandler>;
  public readonly calls: GenerateChatRequest[] = [];

  constructor(handlers: Record<string, MockModelHandler> = {}) {
    this.handlers = handlers;
  }

  async generate(req: GenerateChatRequest): Promise<GenerateChatResponse> {
    this.calls.push(req);
    const modelName = req.tier.model;
    const handler = this.handlers[modelName] ?? this.handlers['*'];

    if (!handler) {
      return {
        text: `Jawaban simulasi dari ${modelName}.`,
        model: modelName,
        finishReason: 'STOP',
        truncatedByMaxTokens: false,
      };
    }

    if (typeof handler === 'function') {
      return await handler(req);
    }

    if (handler.type === 'error') {
      if (handler.reason === 'MODEL_NOT_FOUND') {
        console.error(
          `[SIGAP Chat] Kesalahan konfigurasi model: "${modelName}" mengembalikan HTTP 404 (model tidak ditemukan atau sudah dihentikan).`
        );
      }
      throw new ProviderError(
        handler.reason,
        modelName,
        handler.message ?? `Mock error ${handler.reason} pada ${modelName}`,
        handler.statusCode
      );
    }

    const trimmed = handler.text.trim();
    const finishReason = handler.finishReason ?? 'STOP';
    if (!trimmed) {
      throw new ProviderError(
        'EMPTY_RESPONSE',
        modelName,
        finishReason === 'MAX_TOKENS'
          ? `Model ${modelName} kehabisan batas token sebelum menghasilkan teks jawaban`
          : `Model ${modelName} mengembalikan teks kosong`
      );
    }

    const truncatedByMaxTokens = finishReason === 'MAX_TOKENS';
    if (truncatedByMaxTokens) {
      console.warn(
        `[SIGAP Chat] Jawaban model "${modelName}" terpotong oleh MAX_TOKENS.`
      );
    }

    return {
      text: trimmed,
      model: modelName,
      finishReason,
      truncatedByMaxTokens,
    };
  }
}

