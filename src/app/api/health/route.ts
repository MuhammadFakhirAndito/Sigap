import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/redis';

export async function GET() {
  const startTime = Date.now();
  let dbStatus = { ok: false, latencyMs: 0, message: '' };
  let redisStatus = { ok: false, mode: 'memory', message: '' };
  let bmkgStatus = { ok: false, latencyMs: 0, message: '' };

  // 1. Cek Koneksi PostgreSQL
  const dbStart = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = {
      ok: true,
      latencyMs: Date.now() - dbStart,
      message: 'PostgreSQL terhubung',
    };
  } catch (err: any) {
    dbStatus = {
      ok: false,
      latencyMs: Date.now() - dbStart,
      message: err.message || 'Koneksi database gagal',
    };
  }

  // 2. Cek Koneksi Redis
  try {
    const r = await cacheService.getHealthStatus();
    redisStatus = {
      ok: r.available,
      mode: r.mode,
      message: r.message,
    };
  } catch (err: any) {
    redisStatus = {
      ok: false,
      mode: 'memory',
      message: err.message || 'Redis tidak terjangkau',
    };
  }

  // 3. Cek Keterjangkauan BMKG
  const bmkgStart = Date.now();
  try {
    const res = await fetch('https://data.bmkg.go.id/DataMKG/TEKTONIK/autogempa.json', {
      method: 'HEAD',
      signal: AbortSignal.timeout(3000),
    });
    bmkgStatus = {
      ok: res.ok,
      latencyMs: Date.now() - bmkgStart,
      message: res.ok ? 'BMKG API terjangkau' : `Status BMKG HTTP ${res.status}`,
    };
  } catch (err: any) {
    bmkgStatus = {
      ok: false,
      latencyMs: Date.now() - bmkgStart,
      message: err.message || 'Timeout/koneksi ke BMKG gagal',
    };
  }

  // 4. Ambil metadata SyncStatus
  let syncInfo = null;
  try {
    syncInfo = await prisma.syncStatus.findUnique({
      where: { id: 'bmkg_sync' },
    });
  } catch {}

  const isDegraded = !dbStatus.ok || !redisStatus.ok || !bmkgStatus.ok;
  const overallStatus = isDegraded ? 'degraded' : 'healthy';

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalLatencyMs: Date.now() - startTime,
    components: {
      database: dbStatus,
      cache: redisStatus,
      bmkgApi: bmkgStatus,
    },
    syncStatus: syncInfo,
  });
}

