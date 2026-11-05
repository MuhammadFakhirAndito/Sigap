import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redisClient: Redis | undefined;
};

let redis: Redis | null = null;
let isRedisAvailable = false;

// Fallback in-memory store bila Redis tidak tersedia / offline
const memoryStore = new Map<string, { value: string; expiry: number | null }>();

function getRedisInstance(): Redis | null {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    return null;
  }

  if (globalForRedis.redisClient) {
    return globalForRedis.redisClient;
  }

  try {
    const client = new Redis(redisUrl, {
      maxRetriesPerRequest: 1,
      connectTimeout: 3000,
      lazyConnect: true,
      retryStrategy(times) {
        if (times > 3) {
          return null; // Berhenti mencoba jika gagal berkali-kali untuk menghindari blocking
        }
        return Math.min(times * 200, 1000);
      },
    });

    client.on('connect', () => {
      isRedisAvailable = true;
      console.log('✅ Terhubung ke Redis');
    });

    client.on('error', (err) => {
      isRedisAvailable = false;
      console.warn('⚠️ Peringatan Redis (berjalan dengan fallback in-memory):', err.message);
    });

    client.connect().catch((err) => {
      isRedisAvailable = false;
      console.warn('⚠️ Gagal inisiasi koneksi Redis:', err.message);
    });

    if (process.env.NODE_ENV !== 'production') {
      globalForRedis.redisClient = client;
    }

    return client;
  } catch (err) {
    console.warn('⚠️ Error inisiasi Redis:', err);
    return null;
  }
}

redis = getRedisInstance();

export const cacheService = {
  async get(key: string): Promise<string | null> {
    try {
      if (redis && isRedisAvailable) {
        return await redis.get(key);
      }
    } catch {
      // Degrade gracefully to in-memory
    }

    // In-Memory Fallback
    const item = memoryStore.get(key);
    if (!item) return null;
    if (item.expiry && Date.now() > item.expiry) {
      memoryStore.delete(key);
      return null;
    }
    return item.value;
  },

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    try {
      if (redis && isRedisAvailable) {
        if (ttlSeconds) {
          await redis.set(key, value, 'EX', ttlSeconds);
        } else {
          await redis.set(key, value);
        }
        return;
      }
    } catch {
      // Degrade gracefully to in-memory
    }

    // In-Memory Fallback
    const expiry = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    memoryStore.set(key, { value, expiry });
  },

  async incr(key: string, ttlSecondsIfNew = 60): Promise<number> {
    try {
      if (redis && isRedisAvailable) {
        const val = await redis.incr(key);
        if (val === 1 && ttlSecondsIfNew) {
          await redis.expire(key, ttlSecondsIfNew);
        }
        return val;
      }
    } catch {
      // Degrade gracefully to in-memory
    }

    // In-Memory Fallback
    const item = memoryStore.get(key);
    let val = 1;
    if (item && (!item.expiry || Date.now() <= item.expiry)) {
      val = parseInt(item.value, 10) + 1;
    }
    const expiry = Date.now() + ttlSecondsIfNew * 1000;
    memoryStore.set(key, { value: val.toString(), expiry });
    return val;
  },

  async getHealthStatus(): Promise<{ available: boolean; mode: 'redis' | 'memory'; message: string }> {
    if (!redis) {
      return { available: false, mode: 'memory', message: 'REDIS_URL belum dikonfigurasi' };
    }
    try {
      const pong = await redis.ping();
      return { available: pong === 'PONG', mode: 'redis', message: 'Terhubung ke Redis' };
    } catch (e: any) {
      return { available: false, mode: 'memory', message: e.message || 'Gagal ping Redis' };
    }
  },
};

export default cacheService;

