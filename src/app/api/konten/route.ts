import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const [artikels, sumbers, beritas] = await Promise.all([
      prisma.artikel.findMany({
        include: { sumber: true },
        orderBy: { urutan: 'asc' },
      }),
      prisma.sumber.findMany(),
      prisma.berita.findMany({
        orderBy: { tanggalTerbit: 'desc' },
        take: 10,
      }),
    ]);

    return NextResponse.json({ artikels, sumbers, beritas });
  } catch (err: any) {
    console.error('⚠️ Gagal mengambil konten edukasi/berita:', err);
    return NextResponse.json(
      { error: 'Database sementara tidak tersedia', message: err.message },
      { status: 503 }
    );
  }
}

