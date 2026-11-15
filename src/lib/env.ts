export type ThinkingLevel = 'MINIMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'XHIGH';

export interface ModelTierConfig {
  model: string;
  thinkingLevel: ThinkingLevel;
  maxOutputTokens: number;
  supportsTemperature: boolean;
  temperature?: number;
  dailyQuota: number;
}

const FORBIDDEN_SECRETS = [
  'dev-sync-secret-sigap-2026',
  'dev-log-hmac-secret-sigap-2026',
  'ganti-dengan-rahasia-acak-panjang-di-produksi',
  'ganti-dengan-rahasia-hmac-panjang-di-produksi',
  'ganti-dengan-gemini-api-key-anda',
  'your-gemini-api-key',
  'changeme',
  'secret',
  'default',
  'password',
  'test',
];

const VALID_THINKING_LEVELS: readonly ThinkingLevel[] = [
  'MINIMAL',
  'LOW',
  'MEDIUM',
  'HIGH',
  'XHIGH',
];

function parseThinkingLevel(raw: string | undefined, fallback: ThinkingLevel): ThinkingLevel {
  const upper = raw?.trim().toUpperCase() as ThinkingLevel | undefined;
  if (upper && VALID_THINKING_LEVELS.includes(upper)) {
    return upper;
  }
  return fallback;
}

function parsePositiveInt(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(raw ?? '', 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parseTemperature(raw: string | undefined, fallback: number): number {
  const parsed = Number.parseFloat(raw ?? '');
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 2 ? parsed : fallback;
}

// Model seri gemini-4-* menolak atau mengabaikan parameter sampling temperature/top_p/top_k.
function modelSupportsTemperature(modelName: string, rawFlag: string | undefined, defaultFlag: boolean): boolean {
  if (modelName.toLowerCase().startsWith('gemini-4-')) {
    return false;
  }
  if (rawFlag !== undefined) {
    return rawFlag.trim().toLowerCase() === 'true';
  }
  return defaultFlag;
}

export function getGeminiModelsConfig(
  customEnv: NodeJS.ProcessEnv = process.env
): ModelTierConfig[] {
  const defaultTemp = parseTemperature(customEnv.GEMINI_TEMPERATURE, 0.2);

  if (customEnv.GEMINI_MODELS_CONFIG) {
    try {
      const parsed = JSON.parse(customEnv.GEMINI_MODELS_CONFIG) as Array<Partial<ModelTierConfig>>;
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .filter((item) => typeof item.model === 'string' && item.model.trim() !== '')
          .map((item) => {
            const model = item.model!.trim();
            const isGemini4 = model.toLowerCase().startsWith('gemini-4-');
            const supportsTemp = isGemini4 ? false : Boolean(item.supportsTemperature ?? true);
            return {
              model,
              thinkingLevel: parseThinkingLevel(item.thinkingLevel, isGemini4 ? 'LOW' : 'MINIMAL'),
              maxOutputTokens:
                typeof item.maxOutputTokens === 'number' && item.maxOutputTokens > 0
                  ? item.maxOutputTokens
                  : isGemini4
                    ? 2048
                    : 1024,
              supportsTemperature: supportsTemp,
              temperature: supportsTemp ? (item.temperature ?? defaultTemp) : undefined,
              dailyQuota:
                typeof item.dailyQuota === 'number' && item.dailyQuota > 0
                  ? item.dailyQuota
                  : 20,
            };
          });
      }
    } catch {
      // Jatuh ke konfigurasi variabel env berurutan bila JSON tidak valid.
    }
  }

  const primaryModel = (customEnv.GEMINI_PRIMARY_MODEL || 'gemini-3.5-flash-lite').trim();
  const primarySupportsTemp = modelSupportsTemperature(
    primaryModel,
    customEnv.GEMINI_PRIMARY_SUPPORTS_TEMPERATURE,
    true
  );

  const fallbackModel = (customEnv.GEMINI_FALLBACK_MODEL || 'gemini-4-hydrogen').trim();
  const fallbackSupportsTemp = modelSupportsTemperature(
    fallbackModel,
    customEnv.GEMINI_FALLBACK_SUPPORTS_TEMPERATURE,
    false
  );

  return [
    {
      model: primaryModel,
      thinkingLevel: parseThinkingLevel(customEnv.GEMINI_PRIMARY_THINKING_LEVEL, 'MINIMAL'),
      maxOutputTokens: parsePositiveInt(
        customEnv.GEMINI_PRIMARY_MAX_OUTPUT_TOKENS ?? customEnv.GEMINI_MAX_OUTPUT_TOKENS,
        1024
      ),
      supportsTemperature: primarySupportsTemp,
      temperature: primarySupportsTemp ? defaultTemp : undefined,
      dailyQuota: parsePositiveInt(customEnv.GEMINI_PRIMARY_DAILY_QUOTA, 20),
    },
    {
      model: fallbackModel,
      thinkingLevel: parseThinkingLevel(customEnv.GEMINI_FALLBACK_THINKING_LEVEL, 'LOW'),
      maxOutputTokens: parsePositiveInt(customEnv.GEMINI_FALLBACK_MAX_OUTPUT_TOKENS, 2048),
      supportsTemperature: fallbackSupportsTemp,
      temperature: fallbackSupportsTemp ? defaultTemp : undefined,
      dailyQuota: parsePositiveInt(customEnv.GEMINI_FALLBACK_DAILY_QUOTA, 20),
    },
  ];
}

export function validateEnvironment(customEnv?: {
  NODE_ENV?: string;
  SYNC_SECRET?: string;
  LOG_HMAC_SECRET?: string;
  GEMINI_API_KEY?: string;
}): void {
  const env = customEnv || process.env;
  const nodeEnv = env.NODE_ENV;
  const syncSecret = env.SYNC_SECRET;
  const logHmacSecret = env.LOG_HMAC_SECRET;
  const shouldCheckGeminiKey = !customEnv || 'GEMINI_API_KEY' in customEnv;
  const geminiApiKey = env.GEMINI_API_KEY;

  if (nodeEnv === 'production') {
    if (!syncSecret || FORBIDDEN_SECRETS.includes(syncSecret.trim().toLowerCase())) {
      throw new Error(
        'FATAL [SIGAP]: SYNC_SECRET tidak boleh kosong atau menggunakan nilai bawaan di lingkungan produksi!'
      );
    }
    if (!logHmacSecret || FORBIDDEN_SECRETS.includes(logHmacSecret.trim().toLowerCase())) {
      throw new Error(
        'FATAL [SIGAP]: LOG_HMAC_SECRET tidak boleh kosong atau menggunakan nilai bawaan di lingkungan produksi!'
      );
    }
    if (
      shouldCheckGeminiKey &&
      (!geminiApiKey || FORBIDDEN_SECRETS.includes(geminiApiKey.trim().toLowerCase()))
    ) {
      throw new Error(
        'FATAL [SIGAP]: GEMINI_API_KEY tidak boleh kosong atau menggunakan nilai bawaan di lingkungan produksi!'
      );
    }
  }
}
