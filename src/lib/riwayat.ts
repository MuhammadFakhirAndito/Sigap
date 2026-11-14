export interface DailyCount {
  hari: string; // YYYY-MM-DD (WIB)
  jumlah: number;
}

export const CHART_DAYS = 30;

export function wibDayKey(date: Date): string {
  // en-CA menghasilkan format YYYY-MM-DD
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function shiftDay(key: string, delta: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Awal jendela grafik (UTC) = 00:00 WIB pada hari ke-(days-1) sebelum hari terakhir. */
export function windowStartUtc(endDayKey: string, days = CHART_DAYS): Date {
  const startKey = shiftDay(endDayKey, -(days - 1));
  return new Date(`${startKey}T00:00:00+07:00`);
}

/** Lengkapi deret harian agar hari tanpa gempa tetap muncul sebagai 0. */
export function fillDailySeries(
  rows: DailyCount[],
  endDayKey: string,
  days = CHART_DAYS,
  startDayKey?: string,
): DailyCount[] {
  const map = new Map(rows.map((r) => [r.hari, r.jumlah]));
  const out: DailyCount[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const key = shiftDay(endDayKey, -i);
    if (startDayKey && key < startDayKey) continue;
    out.push({ hari: key, jumlah: map.get(key) ?? 0 });
  }
  return out;
}

export type PageItem = number | "gap";

/** Nomor paginasi ringkas: 1 … 4 5 6 … 669 */
export function paginationItems(current: number, total: number): PageItem[] {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set<number>([1, total, current - 1, current, current + 1]);
  if (current <= 2) [2, 3].forEach((p) => pages.add(p));
  if (current >= total - 1) [total - 2, total - 1].forEach((p) => pages.add(p));
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out: PageItem[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push("gap");
    out.push(p);
  });
  return out;
}

export type TsunamiStatus = "AMAN" | "BERPOTENSI" | "TIDAK_DINYATAKAN";

export function tsunamiShortLabel(status: TsunamiStatus): string {
  if (status === "AMAN") return "Tidak berpotensi";
  if (status === "BERPOTENSI") return "Berpotensi tsunami";
  return "Tidak dinyatakan";
}

