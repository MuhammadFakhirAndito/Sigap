import { NextRequest, NextResponse } from 'next/server';
import { syncBmkgData } from '@/lib/bmkg';

export async function POST(req: NextRequest) {
  // Verifikasi secret token untuk keamanan pemanggilan cron di VPS (PRD v0.2 Bagian 8.8 & TC-DB-14)
  const expectedSecret = process.env.SYNC_SECRET || process.env.BMKG_SYNC_SECRET || 'sigap_secure_sync_token_2026';
  
  const providedSecret =
    req.headers.get('SYNC_SECRET') ||
    req.headers.get('sync_secret') ||
    req.headers.get('x-sync-secret') ||
    req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ||
    req.nextUrl.searchParams.get('secret');

  if (!providedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json(
      { error: 'Akses ditolak (401): Header SYNC_SECRET wajib disertakan dan harus valid (TC-DB-14)' },
      { status: 401 }
    );
  }

  const result = await syncBmkgData();

  if (!result.success) {
    return NextResponse.json(
      {
        message: 'Gagal melakukan sinkronisasi data dari BMKG',
        error: result.errorMessage,
        timestamp: result.timestamp,
      },
      { status: 502 }
    );
  }

  return NextResponse.json({
    message: 'Sinkronisasi data BMKG berhasil',
    totalUpserted: result.totalUpserted,
    totalBaru: result.totalBaru,
    totalDiperbarui: result.totalDiperbarui,
    timestamp: result.timestamp,
  });
}

export async function GET(req: NextRequest) {
  return POST(req);
}
