import {
  ALLEN_2012_CALIBRATION,
  SIMULASI_LIMITS,
  formatIdNumber,
  runSimulasiCalculation,
  type RadiusEstimate,
  type SimulasiInput,
  type SimulasiResult,
  type TipeLokasiSimulasi,
} from "@/lib/simulasi";
import {
  DEFAULT_OBSERVER_BEARING_DEG,
  calculateBearingDeg,
  calculateHaversineKm,
  destinationPointFromBearingKm,
  type GeoPoint,
} from "./haversine";

export type SimulasiMode = "peta" | "3d";
export type UiTipeLokasi = "BELUM_DIPILIH" | TipeLokasiSimulasi;

export interface KedalamanPresetOption {
  label: string;
  valueKm: 10 | 70 | 200;
  shortNote: string;
}

export const KEDALAMAN_PRESETS: readonly KedalamanPresetOption[] = [
  { label: "Dangkal", valueKm: 10, shortNote: "10 km" },
  { label: "Menengah", valueKm: 70, shortNote: "70 km" },
  { label: "Dalam", valueKm: 200, shortNote: "200 km" },
] as const;

export const DEFAULT_OSM_TILE_URL = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
export const DEFAULT_OSM_ATTRIBUTION_HTML =
  '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap contributors</a>';

export interface MapTileConfig {
  url: string;
  attributionHtml: string;
  hasOsmCopyrightText: boolean;
}

export function getMapTileConfig(): MapTileConfig {
  const url =
    process.env.NEXT_PUBLIC_MAP_TILE_URL?.trim() || DEFAULT_OSM_TILE_URL;
  const rawAttr =
    process.env.NEXT_PUBLIC_MAP_TILE_ATTRIBUTION?.trim() ||
    DEFAULT_OSM_ATTRIBUTION_HTML;
  const hasOsmCopyrightText = /OpenStreetMap contributors/i.test(rawAttr);
  const attributionHtml = hasOsmCopyrightText
    ? rawAttr
    : `${rawAttr} · ${DEFAULT_OSM_ATTRIBUTION_HTML}`;

  return {
    url,
    attributionHtml,
    hasOsmCopyrightText: true,
  };
}

export interface DistanceSyncState {
  actualDistanceKm: number;
  sliderDistanceKm: number;
  isBeyondCalibratedRange: boolean;
  formattedActualDistance: string;
}

/**
 * Menyinkronkan jarak Haversine peta ke rentang slider 0–300 km sekaligus mempertahankan
 * jarak aktual ketika marker "Anda" ditempatkan > 300 km dari episentrum.
 */
export function syncDistanceFromPoints(
  epicenter: GeoPoint,
  observer: GeoPoint
): DistanceSyncState {
  const rawDistanceKm = calculateHaversineKm(epicenter, observer);
  const roundedActual = Math.round(rawDistanceKm * 10) / 10;
  // Toleransi 0,05 km mencegah selisih pembulatan Haversine pada jarak batas 300 km memicu status luar kalibrasi.
  const isBeyondCalibratedRange = roundedActual > ALLEN_2012_CALIBRATION.DIST_MAX_KM;
  const actualDistanceKm =
    !isBeyondCalibratedRange && rawDistanceKm > ALLEN_2012_CALIBRATION.DIST_MAX_KM
      ? ALLEN_2012_CALIBRATION.DIST_MAX_KM
      : rawDistanceKm;
  const sliderDistanceKm = Math.min(
    SIMULASI_LIMITS.DIST_MAX,
    Math.max(SIMULASI_LIMITS.DIST_MIN, Math.round(actualDistanceKm))
  );

  const shouldRoundWhole =
    actualDistanceKm >= 100 &&
    (!isBeyondCalibratedRange ||
      Math.round(actualDistanceKm) > ALLEN_2012_CALIBRATION.DIST_MAX_KM);

  const formattedActualDistance = shouldRoundWhole
    ? `${formatIdNumber(Math.round(actualDistanceKm), 0)} km`
    : `${formatIdNumber(roundedActual, 1)} km`;

  return {
    actualDistanceKm,
    sliderDistanceKm,
    isBeyondCalibratedRange,
    formattedActualDistance,
  };
}

/** Memindahkan posisi marker "Anda" berdasarkan nilai slider jarak (0–300 km) mengikuti bearing terkini. */
export function syncObserverPointFromSlider(
  epicenter: GeoPoint,
  currentObserver: GeoPoint,
  sliderKm: number
): GeoPoint {
  const bearing = calculateBearingDeg(epicenter, currentObserver);
  const clampedKm = Math.min(
    SIMULASI_LIMITS.DIST_MAX,
    Math.max(SIMULASI_LIMITS.DIST_MIN, sliderKm)
  );
  return destinationPointFromBearingKm(
    epicenter,
    clampedKm,
    Number.isFinite(bearing) ? bearing : DEFAULT_OBSERVER_BEARING_DEG
  );
}

/** Mengembalikan state awal TipeLokasi pada UI: Kustom mulai sebagai BELUM_DIPILIH kecuali URL menyertakan ?lokasi=. */
export function getInitialUiTipeLokasi(params: {
  hasExplicitUrlLokasi: boolean;
  urlLokasi?: TipeLokasiSimulasi;
}): UiTipeLokasi {
  if (params.hasExplicitUrlLokasi && params.urlLokasi) {
    return params.urlLokasi;
  }
  return "BELUM_DIPILIH";
}

export function formatAwamRadiusSummary(
  prefix: string,
  estimate: RadiusEstimate
): string {
  if (estimate.status === "in_range" && estimate.radiusKm !== null) {
    return `${prefix} sampai ± ${formatIdNumber(Math.round(estimate.radiusKm), 0)} km`;
  }
  if (estimate.status === "beyond_300") {
    return `${prefix} > 300 km (di luar rentang kalibrasi)`;
  }
  if (estimate.status === "out_of_mag_calibration") {
    return `${prefix}: tidak dapat diperkirakan (di luar rentang kalibrasi)`;
  }
  return `${prefix}: tidak terasa`;
}

/** Menjalankan perhitungan lengkap memakai jarak aktual pengamat (menerima > 300 km dengan penanda luar kalibrasi). */
export function runVisualSimulasiCalculation(
  baseInput: SimulasiInput,
  actualObserverDistanceKm: number,
  uiTipeLokasi: UiTipeLokasi
): SimulasiResult {
  const effectiveLokasi: TipeLokasiSimulasi =
    uiTipeLokasi === "BELUM_DIPILIH" ? "DARAT" : uiTipeLokasi;

  return runSimulasiCalculation({
    ...baseInput,
    jarakPengamatKm: Math.max(0, actualObserverDistanceKm),
    tipeLokasi: effectiveLokasi,
  });
}

export function formatKoordinatId(lat: number, lon: number): string {
  const latDir = lat < 0 ? "LS" : "LU";
  const lonDir = lon < 0 ? "BB" : "BT";
  return `${formatIdNumber(Math.abs(lat), 2)}° ${latDir}, ${formatIdNumber(Math.abs(lon), 2)}° ${lonDir}`;
}
