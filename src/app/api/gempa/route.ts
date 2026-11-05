import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { JenisGempa } from '@prisma/client';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));
  const skip = (page - 1) * limit;

  const minMagStr = searchParams.get('minMag');
  const maxMagStr = searchParams.get('maxMag');
  const wilayah = searchParams.get('wilayah');
  const jenis = searchParams.get('jenis') as JenisGempa | null;

  const where: any = {};

  if (minMagStr || maxMagStr) {
    where.magnitudo = {};
    if (minMagStr) where.magnitudo.gte = parseFloat(minMagStr);
    if (maxMagStr) where.magnitudo.lte = parseFloat(maxMagStr);
  }

  if (wilayah) {
    where.wilayah = {
      contains: wilayah,
      mode: 'insensitive',
    };
  }

  if (jenis && Object.values(JenisGempa).includes(jenis)) {
    where.jenis = jenis;
  }

  try {
    const [items, totalCount, syncStatus] = await Promise.all([
      prisma.gempa.findMany({
        where,
        orderBy: { waktuUtc: 'desc' },
        skip,
        take: limit,
      }),
      prisma.gempa.count({ where }),
      prisma.syncStatus.findUnique({
        where: { id: 'bmkg_sync' },
      }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      data: items,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      sync: {
        lastSuccessAt: syncStatus?.lastSuccessAt || null,
        lastAttemptAt: syncStatus?.lastAttemptAt || null,
        lastStatus: syncStatus?.lastStatus || 'UNKNOWN',
      },
    });
  } catch (err: any) {
    console.error('⚠️ Gagal mengambil data riwayat gempa dari database:', err);
    return NextResponse.json(
      {
        error: 'Database sementara tidak tersedia',
        message: err.message,
        data: [],
        pagination: { page: 1, limit, totalCount: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
        sync: null,
      },
      { status: 503 }
    );
  }
}

