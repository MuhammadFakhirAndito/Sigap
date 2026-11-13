const FORBIDDEN_SECRETS = [
  'dev-sync-secret-sigap-2026',
  'dev-log-hmac-secret-sigap-2026',
  'changeme',
  'secret',
  'default',
  'password',
  'test',
];

export function validateEnvironment(customEnv?: {
  NODE_ENV?: string;
  SYNC_SECRET?: string;
  LOG_HMAC_SECRET?: string;
}): void {
  const env = customEnv || process.env;
  const nodeEnv = env.NODE_ENV;
  const syncSecret = env.SYNC_SECRET;
  const logHmacSecret = env.LOG_HMAC_SECRET;

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
  }
}
