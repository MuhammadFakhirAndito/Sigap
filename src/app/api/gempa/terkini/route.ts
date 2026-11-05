import { NextResponse } from 'next/server';
import { getLatestEarthquakeData } from '@/lib/bmkg';
import { prisma } from '@/lib/prisma';

export async function GET() {
  const latest = await getLatestEarthquakeData();

  // Ambil juga 5 gempa terakhir dari database
  let recentList: any[] = [];
  try {
    recentList = await prisma.gempa.findMany({
      orderBy: { waktuUtc: 'desc' },
      take: 5,
    });
  } catch {}

  return NextResponse.json({
    latest: latest.data,
    source: latest.source,
    recent: recentList,
  });
}

