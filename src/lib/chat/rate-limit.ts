import { createHmac, createHash, timingSafeEqual } from 'node:crypto';

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSec: number;
  remaining: number;
  message?: string;
}

const rateLimitStore = new Map<string, number[]>();

export function resetRateLimiter(): void {
  rateLimitStore.clear();
}

export function hashClientIp(
  rawIp: string,
  secret: string = process.env.LOG_HMAC_SECRET || 'dev-log-hmac-secret-sigap-2026'
): string {
  const normalized = rawIp.trim() || '127.0.0.1';
  return createHmac('sha256', secret).update(normalized).digest('hex');
}

// Hanya percayai header proxy bila TRUST_PROXY=true agar klien tidak dapat memalsukan IP.
export function extractClientIp(
  headers: Headers,
  connectionIp = '127.0.0.1',
  trustProxy: boolean = process.env.TRUST_PROXY === 'true'
): string {
  if (trustProxy) {
    const xff = headers.get('x-forwarded-for');
    if (xff) {
      const first = xff.split(',')[0]?.trim();
      if (first) return first;
    }
    const realIp = headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;
  }
  return connectionIp.trim() || '127.0.0.1';
}

export function checkRateLimit(
  ipHash: string,
  nowMs: number = Date.now(),
  maxRequests = 10,
  windowMs = 60_000
): RateLimitResult {
  const cutoff = nowMs - windowMs;
  const existing = rateLimitStore.get(ipHash) ?? [];
  const active = existing.filter((ts) => ts > cutoff);

  if (active.length >= maxRequests) {
    rateLimitStore.set(ipHash, active);
    const oldest = active[0] ?? nowMs;
    const retryAfterSec = Math.max(1, Math.ceil((oldest + windowMs - nowMs) / 1000));
    return {
      allowed: false,
      retryAfterSec,
      remaining: 0,
      message: `Terlalu banyak pesan. Coba lagi dalam ${retryAfterSec} detik.`,
    };
  }

  active.push(nowMs);
  rateLimitStore.set(ipHash, active);

  // Bersihkan kunci kedaluwarsa bila peta membesar di memori.
  if (rateLimitStore.size > 2000) {
    for (const [key, list] of rateLimitStore.entries()) {
      const filtered = list.filter((ts) => ts > cutoff);
      if (filtered.length === 0) {
        rateLimitStore.delete(key);
      } else {
        rateLimitStore.set(key, filtered);
      }
    }
  }

  return {
    allowed: true,
    retryAfterSec: 0,
    remaining: Math.max(0, maxRequests - active.length),
  };
}

// Perbandingan waktu-konstan untuk mencegah serangan timing side-channel pada SYNC_SECRET.
export function constantTimeEqual(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (!provided || !expected) {
    return false;
  }
  const hashA = createHash('sha256').update(provided, 'utf8').digest();
  const hashB = createHash('sha256').update(expected, 'utf8').digest();
  const digestMatch = timingSafeEqual(hashA, hashB);
  return digestMatch && provided.length === expected.length;
}

