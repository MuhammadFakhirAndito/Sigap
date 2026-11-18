import { ALLEN_2012_CALIBRATION, SIMULASI_LIMITS } from "@/lib/simulasi";

/**
 * Kelas magnitudo untuk label bantu di panel kontrol (bukan bagian rumus MMI).
 * Enam istilah berasal dari pemilik proyek; BATAS ANGKA tiap kelas (3 / 5 / 6 / 7 / 8)
 * adalah usulan yang belum diverifikasi ke sumber resmi.
 * TODO: tanyakan pemilik proyek, lalu catat sumbernya di `Sumber` dan docs/rumus-simulasi.md.
 */
export interface IntensityStep {
  /** 1 (paling tenang) sampai 6 (paling kuat); sesuai token `--color-intensity-N`. */
  step: 1 | 2 | 3 | 4 | 5 | 6;
  label: "Mikro" | "Ringan" | "Sedang" | "Kuat" | "Besar" | "Dahsyat";
  /** Batas bawah magnitudo (inklusif) kelas ini. */
  from: number;
}

export const INTENSITY_STEPS: readonly IntensityStep[] = [
  { step: 1, label: "Mikro", from: 0 },
  { step: 2, label: "Ringan", from: 3 },
  { step: 3, label: "Sedang", from: 5 },
  { step: 4, label: "Kuat", from: 6 },
  { step: 5, label: "Besar", from: 7 },
  { step: 6, label: "Dahsyat", from: 8 },
] as const;

export function intensityVar(step: number): string {
  return `var(--color-intensity-${step})`;
}

/** Membulatkan ke 0,1 dulu agar 5,9999999 (galat float) tidak jatuh ke kelas bawah. */
export function magnitudeIntensity(magnitudo: number): IntensityStep {
  const m = Math.round(magnitudo * 10) / 10;
  let found = INTENSITY_STEPS[0]!;
  for (const s of INTENSITY_STEPS) {
    if (m >= s.from) found = s;
  }
  return found;
}

/** Tingkat MMI (1-12) ke langkah warna 1-6 yang sama dengan skala magnitudo. */
export function mmiIntensityStep(mmiLevel: number): IntensityStep["step"] {
  if (mmiLevel <= 2) return 1;
  if (mmiLevel <= 4) return 2;
  if (mmiLevel === 5) return 3;
  if (mmiLevel <= 7) return 4;
  if (mmiLevel <= 9) return 5;
  return 6;
}

/** Posisi 0-100 (persen) sebuah magnitudo pada track slider. */
export function magnitudePercent(magnitudo: number): number {
  const span = SIMULASI_LIMITS.MAG_MAX - SIMULASI_LIMITS.MAG_MIN;
  const pct = ((magnitudo - SIMULASI_LIMITS.MAG_MIN) / span) * 100;
  return Math.min(100, Math.max(0, pct));
}

export const CALIBRATION_ZONE_PERCENT = {
  start: magnitudePercent(ALLEN_2012_CALIBRATION.MAG_MIN),
  end: magnitudePercent(ALLEN_2012_CALIBRATION.MAG_MAX),
} as const;

export function isMagnitudeOutsideCalibration(magnitudo: number): boolean {
  return (
    magnitudo < ALLEN_2012_CALIBRATION.MAG_MIN || magnitudo > ALLEN_2012_CALIBRATION.MAG_MAX
  );
}

/** Tick bulat tiap 1,0 di dalam rentang slider (1 sampai 9). */
export function magnitudeTicks(): { value: number; percent: number }[] {
  const ticks: { value: number; percent: number }[] = [];
  for (let v = Math.ceil(SIMULASI_LIMITS.MAG_MIN); v <= SIMULASI_LIMITS.MAG_MAX; v++) {
    ticks.push({ value: v, percent: magnitudePercent(v) });
  }
  return ticks;
}

/**
 * Pita warna track magnitudo dengan batas keras di tiap kelas. Ini skala data,
 * bukan gradient dekoratif: setiap pita = satu kelas yang juga ditulis sebagai teks.
 */
export function buildIntensityBands(): string {
  const stops = INTENSITY_STEPS.map((s, i) => {
    const start = i === 0 ? 0 : magnitudePercent(s.from);
    const next = INTENSITY_STEPS[i + 1];
    const end = next ? magnitudePercent(next.from) : 100;
    return `${intensityVar(s.step)} ${start}% ${end}%`;
  });
  return `linear-gradient(to right, ${stops.join(", ")})`;
}

/** Peta kedalaman hiposenter (km) ke posisi 0-1 pada penampang mini; > 250 km ditahan di dasar. */
export const DEPTH_VIZ_MAX_KM = 250;

export function depthFraction(depthKm: number): number {
  return Math.min(1, Math.max(0, depthKm / DEPTH_VIZ_MAX_KM));
}

/** Diameter cincin terluar (px) untuk jarak pengamat 0-300 km pada visual mini. */
export function ringDiameterPx(distanceKm: number, minPx: number, maxPx: number): number {
  const frac = Math.min(1, Math.max(0, distanceKm / SIMULASI_LIMITS.DIST_MAX));
  return minPx + frac * (maxPx - minPx);
}

/** Membuang akhiran redundan "(M 9,1)" dari nama skenario, karena magnitudo ditampilkan sendiri. */
export function presetDisplayName(nama: string): string {
  const stripped = nama.replace(/\s*\(\s*M\s*[\d.,]+\s*\)\s*$/i, "").trim();
  return stripped || nama;
}
