import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '15', 10)));
  const skip = (page - 1) * limit;

  const minMagStr = searchParams.get('minMag');
  const maxMagStr = searchParams.get('maxMag');
  const wilayah = searchParams.get('wilayah');
  const jenis = searchParams.get('jenis');
  const startDateStr = searchParams.get('startDate');
  const endDateStr = searchParams.get('endDate');

  const where: any = {};

  if (minMagStr || maxMagStr) {
    where.magnitudo = {};
    if (minMagStr) where.magnitudo.gte = parseFloat(minMagStr);
    if (maxMagStr) where.magnitudo.lte = parseFloat(maxMagStr);
  }

  if (startDateStr || endDateStr) {
    where.waktuUtc = {};
    if (startDateStr) where.waktuUtc.gte = new Date(startDateStr);
    if (endDateStr) where.waktuUtc.lte = new Date(endDateStr);
  }

  if (wilayah) {
    where.wilayah = {
      contains: wilayah,
      mode: 'insensitive',
    };
  }

  // Filter berdasarkan flag sumber (PRD v0.2 Bagian 6.1)
  if (jenis) {
    const jenisUpper = jenis.toUpperCase();
    if (jenisUpper === 'TERKINI') where.isTerkini = true;
    else if (jenisUpper === 'DIRASAKAN') where.isDirasakan = true;
    else if (jenisUpper === 'AUTO') where.isAuto = true;
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
        lastStatus: syncStatus?.lastStatus || 'UNINITIALIZED',
      },
    });
  } catch (err: any) {
    console.warn('⚠️ Gagal mengambil riwayat gempa dari database:', err);
    return NextResponse.json(
      {
        data: [],
        pagination: { page: 1, limit, totalCount: 0, totalPages: 1, hasNextPage: false, hasPrevPage: false },
        sync: null,
        error: 'Database sedang offline atau belum diinisialisasi',
      },
      { status: 200 }
    );
  }
}
