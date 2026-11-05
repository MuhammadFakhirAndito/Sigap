import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const presets = await prisma.skenarioSimulasi.findMany({
      orderBy: { urutan: 'asc' },
    });

    return NextResponse.json({ presets });
  } catch (err: any) {
    console.error('⚠️ Gagal mengambil skenario simulasi dari database:', err);
    // Fallback static presets bila database offline
    return NextResponse.json({
      presets: [
        {
          id: 'preset-megathrust-sunda',
          nama: 'Gempa Megathrust Selat Sunda',
          magnitudo: 8.7,
          kedalamanKm: 15.0,
          lat: -6.5,
          lon: 105.2,
          tipeLokasi: 'LAUT',
          deskripsiSingkat: 'Simulasi skenario gempa megathrust berpotensi tsunami tinggi di pesisir Banten dan Lampung.',
        },
        {
          id: 'preset-lembang-bandung',
          nama: 'Gempa Sesar Lembang (Bandung)',
          magnitudo: 6.8,
          kedalamanKm: 10.0,
          lat: -6.8,
          lon: 107.6,
          tipeLokasi: 'DARAT',
          deskripsiSingkat: 'Simulasi gempa kerak dangkal di daratan sesar aktif Lembang dengan intensitas guncangan tinggi di Bandung Raya.',
        },
        {
          id: 'preset-palu-2018',
          nama: 'Gempa Palu - Donggala 2018',
          magnitudo: 7.5,
          kedalamanKm: 10.0,
          lat: -0.178,
          lon: 119.84,
          tipeLokasi: 'LAUT',
          deskripsiSingkat: 'Gempa sesar mendatar di Teluk Palu yang memicu tsunami lokal dan likuefaksi tanah.',
        },
      ],
      fallback: true,
    });
  }
}

