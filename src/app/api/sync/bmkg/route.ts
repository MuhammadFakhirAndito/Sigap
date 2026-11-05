import { NextRequest, NextResponse } from 'next/server';
import { syncBmkgData } from '@/lib/bmkg';

export async function POST(req: NextRequest) {
  // Verifikasi secret token untuk keamanan pemanggilan cron di VPS
  const authHeader = req.headers.get('authorization');
  const secretParam = req.nextUrl.searchParams.get('secret');
  const expectedSecret = process.env.BMKG_SYNC_SECRET;

  const token = authHeader?.replace('Bearer ', '') || secretParam;

  if (expectedSecret && token !== expectedSecret) {
    // Izinkan jika dipanggil dari localhost
    const host = req.headers.get('host') || '';
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');

    if (!isLocal) {
      return NextResponse.json(
        { error: 'Akses ditolak: Secret token sinkronisasi tidak valid' },
        { status: 401 }
      );
    }
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
    timestamp: result.timestamp,
  });
}

export async function GET(req: NextRequest) {
  // Mendukung GET request untuk webhook atau cron sederhana
  return POST(req);
}

