import { DEFAULT_SIMULASI_INPUT, SIMULASI_LIMITS } from "./constants";
import type {
  ParsedSimulasiUrlResult,
  SimulasiInput,
  SimulasiValidationErrors,
  TipeLokasiSimulasi,
} from "./types";

export function validateSimulasiInput(input: SimulasiInput): SimulasiValidationErrors {
  const errors: SimulasiValidationErrors = {};

  if (!Number.isFinite(input.magnitudo) || input.magnitudo < SIMULASI_LIMITS.MAG_MIN || input.magnitudo > SIMULASI_LIMITS.MAG_MAX) {
    errors.magnitudo = "Magnitudo harus antara 1,0 hingga 9,5.";
  }
  if (!Number.isFinite(input.kedalamanKm) || input.kedalamanKm < SIMULASI_LIMITS.DEPTH_MIN || input.kedalamanKm > SIMULASI_LIMITS.DEPTH_MAX) {
    errors.kedalamanKm = "Kedalaman harus antara 1 hingga 700 km.";
  }
  if (!Number.isFinite(input.jarakPengamatKm) || input.jarakPengamatKm < SIMULASI_LIMITS.DIST_MIN || input.jarakPengamatKm > SIMULASI_LIMITS.DIST_MAX) {
    errors.jarakPengamatKm = "Jarak pengamat harus antara 0 hingga 300 km.";
  }
  if (!Number.isFinite(input.lat) || input.lat < SIMULASI_LIMITS.LAT_MIN || input.lat > SIMULASI_LIMITS.LAT_MAX) {
    errors.lat = "Lintang harus antara -90° hingga 90°.";
  }
  if (!Number.isFinite(input.lon) || input.lon < SIMULASI_LIMITS.LON_MIN || input.lon > SIMULASI_LIMITS.LON_MAX) {
    errors.lon = "Bujur harus antara -180° hingga 180°.";
  }

  return errors;
}

function parseBoundedNumber(
  raw: string | undefined,
  min: number,
  max: number,
  fieldLabel: string,
  warnings: string[]
): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const normalized = raw.trim().replace(",", ".");
  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
    warnings.push(`Parameter URL "${fieldLabel}" (${raw}) tidak valid atau di luar rentang (${min}–${max}); dikembalikan ke nilai default.`);
    return null;
  }
  return parsed;
}

export function parseSimulasiSearchParams(params: {
  m?: string;
  d?: string;
  lat?: string;
  lon?: string;
  jarak?: string;
  lokasi?: string;
  wilayah?: string;
}): ParsedSimulasiUrlResult {
  const warnings: string[] = [];
  const input: SimulasiInput = { ...DEFAULT_SIMULASI_INPUT };
  let appliedFromUrl = false;

  if (params.m !== undefined) {
    appliedFromUrl = true;
    const val = parseBoundedNumber(params.m, SIMULASI_LIMITS.MAG_MIN, SIMULASI_LIMITS.MAG_MAX, "m", warnings);
    if (val !== null) input.magnitudo = val;
  }
  if (params.d !== undefined) {
    appliedFromUrl = true;
    const val = parseBoundedNumber(params.d, SIMULASI_LIMITS.DEPTH_MIN, SIMULASI_LIMITS.DEPTH_MAX, "d", warnings);
    if (val !== null) input.kedalamanKm = val;
  }
  if (params.lat !== undefined) {
    appliedFromUrl = true;
    const val = parseBoundedNumber(params.lat, SIMULASI_LIMITS.LAT_MIN, SIMULASI_LIMITS.LAT_MAX, "lat", warnings);
    if (val !== null) input.lat = val;
  }
  if (params.lon !== undefined) {
    appliedFromUrl = true;
    const val = parseBoundedNumber(params.lon, SIMULASI_LIMITS.LON_MIN, SIMULASI_LIMITS.LON_MAX, "lon", warnings);
    if (val !== null) input.lon = val;
  }
  if (params.jarak !== undefined) {
    appliedFromUrl = true;
    const val = parseBoundedNumber(params.jarak, SIMULASI_LIMITS.DIST_MIN, SIMULASI_LIMITS.DIST_MAX, "jarak", warnings);
    if (val !== null) input.jarakPengamatKm = val;
  }
  if (params.lokasi !== undefined && params.lokasi.trim() !== "") {
    appliedFromUrl = true;
    const upper = params.lokasi.trim().toUpperCase();
    if (upper === "DARAT" || upper === "LAUT") {
      input.tipeLokasi = upper as TipeLokasiSimulasi;
    } else {
      warnings.push(`Parameter URL "lokasi" (${params.lokasi}) harus DARAT atau LAUT.`);
    }
  }

  const presetWilayah = params.wilayah?.trim() ? params.wilayah.trim() : null;
  if (presetWilayah) {
    appliedFromUrl = true;
    input.wilayah = presetWilayah;
  }

  return { input, warnings, appliedFromUrl, presetWilayah };
}

export function buildChatbotHandoffUrl(params: {
  magnitudo: number;
  kedalamanKm: number;
  wilayah?: string | null;
  mmiRoman?: string;
}): string {
  const qs = new URLSearchParams();
  qs.set("m", params.magnitudo.toFixed(1));
  qs.set("d", String(Math.round(params.kedalamanKm * 10) / 10));
  if (params.wilayah && params.wilayah.trim()) {
    qs.set("wilayah", params.wilayah.trim());
  }
  if (params.mmiRoman) {
    qs.set("mmi", params.mmiRoman);
  }
  return `/chatbot?${qs.toString()}`;
}

