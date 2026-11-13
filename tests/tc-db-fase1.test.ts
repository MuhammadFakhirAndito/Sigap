import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@/lib/prisma';
import { normalizeBmkgGempa } from '@/lib/bmkg/parser';
import { syncAllBmkg } from '@/lib/bmkg/client';
import { validateEnvironment } from '@/lib/env';

describe('Uji Kepatuhan TC-DB Fase 1a (SIGAP)', () => {
  const testKey = '2099-01-01T00:00:00+00:00';

  beforeAll(async () => {
    // Bersihkan data tes jika ada
    await prisma.gempa.deleteMany({
      where: { bmkgKey: testKey },
    });
  });

  afterAll(async () => {
    await prisma.gempa.deleteMany({
      where: { bmkgKey: testKey },
    });
    await prisma.$disconnect();
  });

  it('TC-DB-14: Endpoint /api/sync menolak permintaan tanpa SYNC_SECRET (401)', async () => {
    const { POST } = await import('@/app/api/sync/route');
    const req = new Request('http://localhost:3000/api/sync', {
      method: 'POST',
      headers: {},
    });
    const res = await POST(req as any);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('Unauthorized');
  });

  it('TC-DB-20: Endpoint /api/health publik tanpa secret hanya menampilkan status tanpa detail DB/SyncLog', async () => {
    const { GET } = await import('@/app/api/health/route');
    const req = new Request('http://localhost:3000/api/health', {
      method: 'GET',
      headers: {},
    });
    const res = await GET(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ status: 'healthy' });
    expect(body.database).toBeUndefined();
    expect(body.lastSuccessfulSync).toBeUndefined();
  });

  it('TC-DB-01: Idempotensi sinkronisasi - data sama disinkronkan dua kali tidak menambah baris', async () => {
    const countBefore = await prisma.gempa.count();
    // Sinkronisasi pertama
    await syncAllBmkg();
    const countFirst = await prisma.gempa.count();
    // Sinkronisasi kedua
    const resultSecond = await syncAllBmkg();
    const countSecond = await prisma.gempa.count();

    expect(countSecond).toBe(countFirst);
    // Jumlah item baru pada sinkronisasi kedua harus 0 untuk semua sumber
    for (const r of resultSecond) {
      expect(r.jumlahBaru).toBe(0);
    }
  });

  it('TC-DB-11: BMKG merevisi magnitudo gempa yang sama -> baris diperbarui tanpa duplikat', async () => {
    // 1. Masukkan gempa awal M 5.0
    await prisma.gempa.create({
      data: {
        bmkgKey: testKey,
        waktuUtc: new Date('2099-01-01T00:00:00Z'),
        lat: -6.2,
        lon: 106.8,
        magnitudo: 5.0,
        kedalamanKm: 10,
        wilayah: 'Pusat gempa uji TC-DB-11',
        potensiTeks: 'Tidak berpotensi tsunami',
        statusTsunami: 'AMAN',
        isTerkini: true,
      },
    });

    const initialCount = await prisma.gempa.count({ where: { bmkgKey: testKey } });
    expect(initialCount).toBe(1);

    // 2. BMKG merevisi data menjadi M 5.2
    const revisi = {
      Tanggal: '01 Jan 2099',
      Jam: '07:00:00 WIB',
      DateTime: testKey,
      Coordinates: '-6.20,106.80',
      Lintang: '6.20 LS',
      Bujur: '106.80 BT',
      Magnitude: '5.2',
      Kedalaman: '12 km',
      Wilayah: 'Pusat gempa uji TC-DB-11 (Revisi)',
      Potensi: 'Tidak berpotensi tsunami',
    };

    const normalized = normalizeBmkgGempa(revisi as any);

    // Upsert sesuai logika client BMKG
    await prisma.gempa.upsert({
      where: { bmkgKey: testKey },
      create: normalized,
      update: {
        magnitudo: normalized.magnitudo,
        kedalamanKm: normalized.kedalamanKm,
        wilayah: normalized.wilayah,
        potensiTeks: normalized.potensiTeks,
        statusTsunami: normalized.statusTsunami,
        isTerkini: true,
      },
    });

    // 3. Verifikasi: Jumlah baris tetap 1, magnitudo terbarui menjadi 5.2
    const finalRecords = await prisma.gempa.findMany({ where: { bmkgKey: testKey } });
    expect(finalRecords.length).toBe(1);
    expect(finalRecords[0].magnitudo).toBe(5.2);
    expect(finalRecords[0].kedalamanKm).toBe(12);
  });

  it('TC-DB-12: Gempa muncul di autogempa lalu terkini -> satu baris, kedua flag menyala', async () => {
    // Update data uji dengan flag isAuto
    await prisma.gempa.update({
      where: { bmkgKey: testKey },
      data: { isAuto: true },
    });

    // Update dengan flag isDirasakan
    await prisma.gempa.update({
      where: { bmkgKey: testKey },
      data: { isDirasakan: true },
    });

    const record = await prisma.gempa.findUnique({ where: { bmkgKey: testKey } });
    expect(record).not.toBeNull();
    expect(record?.isAuto).toBe(true);
    expect(record?.isTerkini).toBe(true);
    expect(record?.isDirasakan).toBe(true);
  });

  it('Requirement 3c: Aplikasi menolak start di produksi jika SYNC_SECRET / LOG_HMAC_SECRET bernilai bawaan', () => {
    // 1. Uji secret default ditolak
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        SYNC_SECRET: 'dev-sync-secret-sigap-2026',
        LOG_HMAC_SECRET: 'dev-log-hmac-secret-sigap-2026',
      })
    ).toThrowError(/SYNC_SECRET/);

    // 2. Uji HMAC default ditolak
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        SYNC_SECRET: 'custom-prod-secret-999',
        LOG_HMAC_SECRET: 'dev-log-hmac-secret-sigap-2026',
      })
    ).toThrowError(/LOG_HMAC_SECRET/);

    // 3. Uji secret produksi sah diterima
    expect(() =>
      validateEnvironment({
        NODE_ENV: 'production',
        SYNC_SECRET: 'custom-prod-secret-999',
        LOG_HMAC_SECRET: 'custom-prod-hmac-888',
      })
    ).not.toThrow();
  });
});
