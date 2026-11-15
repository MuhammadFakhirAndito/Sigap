import type { MmiScaleLevelInfo, SimulasiInput } from "./types";

export const SIMULASI_LIMITS = {
  MAG_MIN: 1.0,
  MAG_MAX: 9.5,
  MAG_STEP: 0.1,
  DEPTH_MIN: 1,
  DEPTH_MAX: 700,
  DIST_MIN: 0,
  DIST_MAX: 300,
  DIST_DEFAULT: 50,
  LAT_MIN: -90,
  LAT_MAX: 90,
  LON_MIN: -180,
  LON_MAX: 180,
} as const;

/**
 * Rentang kalibrasi empiris Allen, Wald & Worden (2012):
 * "moments magnitude Mw 5.0-7.9 and intensities of degree II and greater
 *  for distances less than 300 km for active crustal regions".
 */
export const ALLEN_2012_CALIBRATION = {
  MAG_MIN: 5.0,
  MAG_MAX: 7.9,
  DIST_MAX_KM: 300,
} as const;

/**
 * Kecepatan rata-rata gelombang seismik di kerak (acuan PRD-DATABASE.md bagian 6).
 */
export const WAVE_SPEED_KM_PER_SEC = {
  P: 6.0,
  S: 3.5,
} as const;

export const DEFAULT_SIMULASI_INPUT: SimulasiInput = {
  magnitudo: 6.0,
  kedalamanKm: 10,
  lat: -6.84,
  lon: 107.0,
  jarakPengamatKm: SIMULASI_LIMITS.DIST_DEFAULT,
  tipeLokasi: "DARAT",
};

/**
 * Ringkasan tingkat skala MMI I-XII merujuk pada skala MMI BMKG
 * (konsisten dengan artikel edukasi `content/skala-mmi.md`).
 */
export const MMI_SCALE_INFO: readonly MmiScaleLevelInfo[] = [
  {
    level: 1,
    roman: "I",
    label: "Tidak terasa",
    description: "Getaran tidak dirasakan kecuali dalam keadaan luar biasa oleh beberapa orang.",
  },
  {
    level: 2,
    roman: "II",
    label: "Sangat lemah",
    description: "Dirasakan oleh beberapa orang yang sedang diam; benda ringan yang digantung bergoyang.",
  },
  {
    level: 3,
    roman: "III",
    label: "Lemah (terasa)",
    description: "Getaran dirasakan nyata di dalam rumah, terasa seakan-akan ada truk berlalu.",
  },
  {
    level: 4,
    roman: "IV",
    label: "Ringan",
    description: "Pada siang hari dirasakan banyak orang di dalam rumah; gerabah pecah, jendela dan pintu berderik.",
  },
  {
    level: 5,
    roman: "V",
    label: "Sedang",
    description: "Getaran dirasakan hampir semua penduduk; banyak orang terbangun, barang terpelanting, tiang dan benda besar tampak bergoyang.",
  },
  {
    level: 6,
    roman: "VI",
    label: "Kuat (merusak ringan)",
    description: "Getaran dirasakan semua penduduk; kebanyakan terkejut dan lari ke luar, plester dinding jatuh, kerusakan ringan terjadi.",
  },
  {
    level: 7,
    roman: "VII",
    label: "Sangat kuat",
    description: "Semua orang ke luar rumah; kerusakan ringan pada bangunan konstruksi baik, konstruksi kurang baik mulai retak hingga rusak.",
  },
  {
    level: 8,
    roman: "VIII",
    label: "Rusak sedang",
    description: "Kerusakan ringan pada bangunan khusus; cukup berat pada bangunan biasa dengan kemungkinan roboh sebagian.",
  },
  {
    level: 9,
    roman: "IX",
    label: "Rusak berat",
    description: "Kerusakan pada bangunan konstruksi kuat; rangka rumah miring atau lepas dari pondasi, tanah dapat retak.",
  },
  {
    level: 10,
    roman: "X",
    label: "Sangat merusak",
    description: "Sebagian besar bangunan pasangan dan rangka rusak beserta pondasinya; tanah terbelah dan longsor berpotensi terjadi.",
  },
  {
    level: 11,
    roman: "XI",
    label: "Ekstrem",
    description: "Hanya sedikit bangunan yang tetap berdiri; jembatan hancur dan jalur tanah retak lebar.",
  },
  {
    level: 12,
    roman: "XII",
    label: "Kehancuran total",
    description: "Kerusakan total di permukaan; gelombang tampak pada permukaan tanah dan benda terlempar ke udara.",
  },
] as const;

