import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cacheService } from '@/lib/redis';

export async function GET(req: NextRequest) {
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

  const isDegraded = !dbStatus.ok || !redisStatus.ok || !bmkgStatus.ok;
  const overallStatus = isDegraded ? 'degraded' : 'healthy';

  // Verifikasi apakah pemanggil menyertakan SYNC_SECRET (PRD v1.1 Keputusan #11, FR-DB-22, TC-DB-20)
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  const secretHeader =
    req.headers.get('SYNC_SECRET') ||
    req.headers.get('sync_secret') ||
    req.headers.get('x-sync-secret') ||
    req.nextUrl.searchParams.get('secret');

  const token = secretHeader || authHeader;
  const expectedSecret = process.env.SYNC_SECRET || process.env.BMKG_SYNC_SECRET || 'sigap_sync_secret_key_change_me';
  const hasValidSecret = Boolean(token && token === expectedSecret);

  // Jika tanpa secret yang valid, kembalikan hanya status ringkas tanpa membocorkan detail infrastruktur (TC-DB-20)
  if (!hasValidSecret) {
    return NextResponse.json({
      status: overallStatus,
    });
  }

  // Ambil sinkronisasi sukses terakhir dari SyncLog (PRD v1.1 Keputusan #9 & 7.2)
  let lastSuccessfulSync = null;
  try {
    lastSuccessfulSync = await prisma.syncLog.findFirst({
      where: { status: 'OK' },
      orderBy: { createdAt: 'desc' },
    });
  } catch {}

  // Respons penuh untuk pemanggil berwenang dengan SYNC_SECRET
  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    totalLatencyMs: Date.now() - startTime,
    components: {
      database: dbStatus,
      cache: redisStatus,
      bmkgApi: bmkgStatus,
    },
    syncLogTerakhir: lastSuccessfulSync
      ? {
          waktuSukses: lastSuccessfulSync.createdAt,
          sumber: lastSuccessfulSync.sumber,
          jumlahBaru: lastSuccessfulSync.jumlahBaru,
          jumlahDiperbarui: lastSuccessfulSync.jumlahDiperbarui,
          durasiMs: lastSuccessfulSync.durasiMs,
        }
      : null,
  });
}
