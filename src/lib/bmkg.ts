import { prisma } from './prisma';
import { cacheService } from './redis';
import { StatusTsunami, SyncResultStatus } from '@prisma/client';

export interface BmkgGempaRaw {
  Tanggal: string;
  Jam: string;
  DateTime: string;
  Coordinates: string;
  Lintang: string;
  Bujur: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi?: string;
  Dirasakan?: string;
  Shakemap?: string;
}

export interface BmkgResponse {
  Infogempa: {
    gempa: BmkgGempaRaw | BmkgGempaRaw[];
  };
}

const BMKG_BASE_URL = 'https://data.bmkg.go.id/DataMKG/TEKTONIK';

/**
 * Normalisasi data gempa mentah dari BMKG ke skema database SIGAP (PRD v0.2 Bagian 6.1)
 * bmkgKey = DateTime BMKG murni agar revisi koordinat/magnitudo memperbarui baris lama (TC-DB-11)
 */
export function normalizeBmkgGempa(raw: BmkgGempaRaw) {
  const [latStr, lonStr] = (raw.Coordinates || '0,0').split(',');
  const lat = parseFloat(latStr.trim());
  const lon = parseFloat(lonStr.trim());
  const magnitudo = parseFloat(raw.Magnitude);
  const kedalamanKm = parseFloat((raw.Kedalaman || '10').replace(/[^0-9.]/g, ''));
  const bmkgKey = raw.DateTime ? raw.DateTime.trim() : `${raw.Tanggal}_${raw.Jam}`;

  // Tentukan status tsunami berdasarkan teks potensi
  let statusTsunami: StatusTsunami = StatusTsunami.TIDAK_DINYATAKAN;
  const potensiLower = (raw.Potensi || '').toLowerCase();
  if (potensiLower.includes('tidak berpotensi tsunami') || potensiLower.includes('tidak ada potensi tsunami')) {
    statusTsunami = StatusTsunami.AMAN;
  } else if (potensiLower.includes('berpotensi tsunami')) {
    statusTsunami = StatusTsunami.BERPOTENSI;
  }

  // Shakemap URL
  let shakemapUrl: string | null = null;
  if (raw.Shakemap) {
    shakemapUrl = raw.Shakemap.startsWith('http')
      ? raw.Shakemap
      : `${BMKG_BASE_URL}/${raw.Shakemap}`;
  }

  return {
    bmkgKey,
    waktuUtc: new Date(raw.DateTime),
    lat: isNaN(lat) ? 0 : lat,
    lon: isNaN(lon) ? 0 : lon,
    magnitudo: isNaN(magnitudo) ? 0 : magnitudo,
    kedalamanKm: isNaN(kedalamanKm) ? 10 : kedalamanKm,
    wilayah: raw.Wilayah || 'Wilayah tidak diketahui',
    potensiTeks: raw.Potensi || 'Tidak ada data potensi',
    statusTsunami,
    dirasakan: raw.Dirasakan || null,
    shakemapUrl,
  };
}

/**
 * Upsert gempa dengan mempertahankan dan menyalakan flag sumber (isAuto, isTerkini, isDirasakan)
 * Sesuai PRD v0.2: satu gempa bisa muncul di autogempa lalu terkini, kedua flag menyala (TC-DB-12)
 */
async function upsertGempaItem(
  normalized: ReturnType<typeof normalizeBmkgGempa>,
  sourceFlag: 'isAuto' | 'isTerkini' | 'isDirasakan'
): Promise<'created' | 'updated'> {
  const existing = await prisma.gempa.findUnique({
    where: { bmkgKey: normalized.bmkgKey },
  });

  if (existing) {
    await prisma.gempa.update({
      where: { bmkgKey: normalized.bmkgKey },
      data: {
        ...normalized,
        [sourceFlag]: true,
      },
    });
    return 'updated';
  } else {
    await prisma.gempa.create({
      data: {
        ...normalized,
        isAuto: sourceFlag === 'isAuto',
        isTerkini: sourceFlag === 'isTerkini',
        isDirasakan: sourceFlag === 'isDirasakan',
      },
    });
    return 'created';
  }
}

/**
 * Sinkronisasi data dari BMKG ke PostgreSQL dengan penanganan toleransi error & SyncLog (FR-DB-01, FR-DB-04)
 */
export async function syncBmkgData() {
  const syncStartTime = new Date();
  let success = false;
  let errorMsg: string | null = null;
  let totalBaru = 0;
  let totalDiperbarui = 0;

  try {
    // 1. Ambil autogempa (gempa terbaru)
    const autoRes = await fetch(`${BMKG_BASE_URL}/autogempa.json`, {
      next: { revalidate: 60 },
      headers: { 'User-Agent': 'SIGAP-Gempa/1.0' },
    });

    if (autoRes.ok) {
      const autoData: BmkgResponse = await autoRes.json();
      if (autoData.Infogempa?.gempa) {
        const item = autoData.Infogempa.gempa as BmkgGempaRaw;
        const normalized = normalizeBmkgGempa(item);
        const action = await upsertGempaItem(normalized, 'isAuto');
        if (action === 'created') totalBaru++;
        else totalDiperbarui++;

        // Simpan ke Redis cache
        await cacheService.set('bmkg:autogempa', JSON.stringify(item), 60);
      }
    }

    // 2. Ambil gempaterkini (M5.0+)
    const terkiniRes = await fetch(`${BMKG_BASE_URL}/gempaterkini.json`, {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'SIGAP-Gempa/1.0' },
    });

    if (terkiniRes.ok) {
      const terkiniData: BmkgResponse = await terkiniRes.json();
      const list = Array.isArray(terkiniData.Infogempa?.gempa)
        ? terkiniData.Infogempa.gempa
        : terkiniData.Infogempa?.gempa
        ? [terkiniData.Infogempa.gempa]
        : [];

      for (const item of list) {
        const normalized = normalizeBmkgGempa(item);
        const action = await upsertGempaItem(normalized, 'isTerkini');
        if (action === 'created') totalBaru++;
        else totalDiperbarui++;
      }

      await cacheService.set('bmkg:terkini', JSON.stringify(list), 300);
    }

    // 3. Ambil gempadirasakan
    const dirasakanRes = await fetch(`${BMKG_BASE_URL}/gempadirasakan.json`, {
      next: { revalidate: 300 },
      headers: { 'User-Agent': 'SIGAP-Gempa/1.0' },
    });

    if (dirasakanRes.ok) {
      const dirasakanData: BmkgResponse = await dirasakanRes.json();
      const list = Array.isArray(dirasakanData.Infogempa?.gempa)
        ? dirasakanData.Infogempa.gempa
        : dirasakanData.Infogempa?.gempa
        ? [dirasakanData.Infogempa.gempa]
        : [];

      for (const item of list) {
        const normalized = normalizeBmkgGempa(item);
        const action = await upsertGempaItem(normalized, 'isDirasakan');
        if (action === 'created') totalBaru++;
        else totalDiperbarui++;
      }
    }

    success = true;
    await cacheService.set('bmkg:last_sync_at', syncStartTime.toISOString());
  } catch (err: any) {
    console.error('❌ Gagal sinkronisasi data BMKG:', err);
    errorMsg = err.message || 'Unknown network error';
  } finally {
    const durasiMs = Date.now() - syncStartTime.getTime();

    // Catat ke tabel SyncLog (FR-DB-04)
    try {
      await prisma.syncLog.create({
        data: {
          sumber: 'all',
          status: success ? 'OK' : 'GAGAL',
          jumlahBaru: totalBaru,
          jumlahDiperbarui: totalDiperbarui,
          pesanError: errorMsg,
          durasiMs,
        },
      });
    } catch (logErr) {
      console.warn('⚠️ Tidak dapat mencatat SyncLog:', logErr);
    }

    // Catat ke tabel SyncStatus
    try {
      await prisma.syncStatus.upsert({
        where: { id: 'bmkg_sync' },
        update: {
          lastAttemptAt: syncStartTime,
          ...(success
            ? { lastSuccessAt: syncStartTime, lastStatus: SyncResultStatus.SUCCESS, errorMessage: null }
            : { lastStatus: SyncResultStatus.FAILED, errorMessage: errorMsg }),
        },
        create: {
          id: 'bmkg_sync',
          lastAttemptAt: syncStartTime,
          lastSuccessAt: success ? syncStartTime : null,
          lastStatus: success ? SyncResultStatus.SUCCESS : SyncResultStatus.FAILED,
          errorMessage: errorMsg,
        },
      });
    } catch (dbErr) {
      console.warn('⚠️ Tidak dapat mencatat status sinkronisasi ke DB:', dbErr);
    }
  }

  return {
    success,
    totalUpserted: totalBaru + totalDiperbarui,
    totalBaru,
    totalDiperbarui,
    timestamp: syncStartTime,
    errorMessage: errorMsg,
  };
}

/**
 * Mendapatkan data gempa terkini dengan strategi Cache -> DB fallback -> Direct BMKG
 */
export async function getLatestEarthquakeData() {
  // 1. Coba baca dari cache Redis
  try {
    const cached = await cacheService.get('bmkg:autogempa');
    if (cached) {
      return { data: JSON.parse(cached), source: 'CACHE' };
    }
  } catch {}

  // 2. Coba fetch dari BMKG
  try {
    const res = await fetch(`${BMKG_BASE_URL}/autogempa.json`, {
      next: { revalidate: 60 },
      signal: AbortSignal.timeout(4000),
    });
    if (res.ok) {
      const json: BmkgResponse = await res.json();
      if (json.Infogempa?.gempa) {
        return { data: json.Infogempa.gempa, source: 'BMKG' };
      }
    }
  } catch {
    console.warn('⚠️ Gagal mengambil autogempa langsung dari BMKG, mengambil dari DB fallback...');
  }

  // 3. Fallback Graceful ke Database
  try {
    const latestDb = await prisma.gempa.findFirst({
      orderBy: { waktuUtc: 'desc' },
    });
    if (latestDb) {
      return {
        data: {
          Tanggal: latestDb.waktuUtc.toLocaleDateString('id-ID'),
          Jam: latestDb.waktuUtc.toLocaleTimeString('id-ID'),
          DateTime: latestDb.waktuUtc.toISOString(),
          Coordinates: `${latestDb.lat}, ${latestDb.lon}`,
          Lintang: `${Math.abs(latestDb.lat)} ${latestDb.lat < 0 ? 'LS' : 'LU'}`,
          Bujur: `${Math.abs(latestDb.lon)} ${latestDb.lon < 0 ? 'BB' : 'BT'}`,
          Magnitude: latestDb.magnitudo.toString(),
          Kedalaman: `${latestDb.kedalamanKm} km`,
          Wilayah: latestDb.wilayah,
          Potensi: latestDb.potensiTeks,
          Dirasakan: latestDb.dirasakan || undefined,
          Shakemap: latestDb.shakemapUrl || undefined,
        },
        source: 'DATABASE_FALLBACK',
      };
    }
  } catch (e) {
    console.warn('⚠️ Gagal mengambil dari DB fallback:', e);
  }

  return { data: null, source: 'UNAVAILABLE' };
}
