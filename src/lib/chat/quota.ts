import { prisma } from '@/lib/prisma';

// Dokumentasi resmi (/rate-limits) menyebut reset kuota harian pada "midnight Pacific time"
// tanpa menulis identifier IANA secara eksplisit; konstanta ini dapat diganti lewat env.
export const DEFAULT_QUOTA_RESET_TIMEZONE = 'America/Los_Angeles';

export function getQuotaResetTimezone(customEnv: NodeJS.ProcessEnv = process.env): string {
  return (customEnv.GEMINI_QUOTA_RESET_TIMEZONE || DEFAULT_QUOTA_RESET_TIMEZONE).trim();
}

export function getQuotaDateString(
  now: Date = new Date(),
  timeZone: string = getQuotaResetTimezone()
): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value ?? '2026';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function getQuotaDateUtc(
  now: Date = new Date(),
  timeZone: string = getQuotaResetTimezone()
): Date {
  const dateStr = getQuotaDateString(now, timeZone);
  return new Date(`${dateStr}T00:00:00.000Z`);
}

export interface QuotaReservationResult {
  allowed: boolean;
  dbAvailable: boolean;
}

// Menaikkan penghitung kuota secara atomik sebelum memanggil model agar permintaan
// paralel tidak melampaui batas harian lokal.
export async function reserveModelQuotaAtomically(
  model: string,
  dailyQuota: number,
  now: Date = new Date()
): Promise<QuotaReservationResult> {
  if (dailyQuota <= 0) {
    return { allowed: false, dbAvailable: true };
  }

  const tanggal = getQuotaDateUtc(now);

  try {
    await prisma.kuotaHarian.upsert({
      where: {
        model_tanggal: {
          model,
          tanggal,
        },
      },
      create: {
        model,
        tanggal,
        jumlah: 0,
      },
      update: {},
    });

    const updated = await prisma.kuotaHarian.updateMany({
      where: {
        model,
        tanggal,
        jumlah: {
          lt: dailyQuota,
        },
      },
      data: {
        jumlah: {
          increment: 1,
        },
      },
    });

    return {
      allowed: updated.count > 0,
      dbAvailable: true,
    };
  } catch {
    // Jika DB tidak dapat dijangkau, kuota tidak dapat dinaikkan secara atomik
    // sehingga sistem langsung jatuh ke fallback (autogempa BMKG / FAQ statis).
    return {
      allowed: false,
      dbAvailable: false,
    };
  }
}

export async function markModelQuotaExhausted(
  model: string,
  dailyQuota: number,
  now: Date = new Date()
): Promise<void> {
  const tanggal = getQuotaDateUtc(now);
  try {
    await prisma.kuotaHarian.upsert({
      where: {
        model_tanggal: {
          model,
          tanggal,
        },
      },
      create: {
        model,
        tanggal,
        jumlah: dailyQuota,
      },
      update: {
        jumlah: dailyQuota,
      },
    });
  } catch {
    // Abaikan kegagalan tulis kuota saat DB sedang tidak dapat dijangkau.
  }
}

