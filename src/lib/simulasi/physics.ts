import { WAVE_SPEED_KM_PER_SEC } from "./constants";
import type { FormattedEnergy } from "./types";

export function formatIdNumber(value: number, decimals: number): string {
  return value.toFixed(decimals).replace(".", ",");
}

/**
 * Hubungan energi seismik Gutenberg-Richter (PRD-DATABASE.md bagian 6):
 * log10(E) = 1.5 * M + 4.8 (E dalam joule).
 */
export function calculateEnergyJoules(magnitudo: number): number {
  return Math.pow(10, 1.5 * magnitudo + 4.8);
}

export function formatScientificEnergy(joules: number): FormattedEnergy {
  if (!Number.isFinite(joules) || joules <= 0) {
    return { joules: 0, mantissa: "0,0", exponent: 0, text: "0,0 × 10⁰ J" };
  }

  let exponent = Math.floor(Math.log10(joules));
  let mantissaVal = joules / Math.pow(10, exponent);

  if (Number(mantissaVal.toFixed(1)) >= 10) {
    mantissaVal = mantissaVal / 10;
    exponent += 1;
  }

  const mantissa = formatIdNumber(mantissaVal, 1);
  return {
    joules,
    mantissa,
    exponent,
    text: `${mantissa} × 10^${exponent} J`,
  };
}

/**
 * Jarak hiposenter (km) = akar(jarak_episentrum^2 + kedalaman^2).
 */
export function calculateHypocentralDistanceKm(
  epicentralDistanceKm: number,
  depthKm: number
): number {
  return Math.hypot(epicentralDistanceKm, depthKm);
}

/**
 * Waktu rambat gelombang P dan S serta selisihnya (golden time) dalam detik.
 * Asumsi rata-rata kerak: vP = 6 km/s, vS = 3,5 km/s.
 */
export function calculateWaveTravelTimes(rhypoKm: number): {
  tpSeconds: number;
  tsSeconds: number;
  goldenTimeSeconds: number;
} {
  const tpSeconds = rhypoKm / WAVE_SPEED_KM_PER_SEC.P;
  const tsSeconds = rhypoKm / WAVE_SPEED_KM_PER_SEC.S;
  return {
    tpSeconds,
    tsSeconds,
    goldenTimeSeconds: tsSeconds - tpSeconds,
  };
}

