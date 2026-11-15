export interface GeoPoint {
  lat: number;
  lon: number;
}

/** Jari-jari rata-rata bumi (km) untuk perhitungan geodesik Haversine. */
export const EARTH_MEAN_RADIUS_KM = 6371;

/** Arah azimut awal marker pengamat ("Anda") dari episentrum: timur (90°). */
export const DEFAULT_OBSERVER_BEARING_DEG = 90;

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;
const MAX_SAFE_MERCATOR_LAT = 85;

function clampLatitude(lat: number): number {
  return Math.max(-MAX_SAFE_MERCATOR_LAT, Math.min(MAX_SAFE_MERCATOR_LAT, lat));
}

export function normalizeLongitude(lon: number): number {
  let normalized = ((lon + 180) % 360 + 360) % 360 - 180;
  if (normalized === -180 && lon > 0) {
    normalized = 180;
  }
  return normalized;
}

/** Menghitung jarak permukaan bumi antara dua koordinat (km) menggunakan rumus Haversine. */
export function calculateHaversineKm(a: GeoPoint, b: GeoPoint): number {
  if (a.lat === b.lat && a.lon === b.lon) {
    return 0;
  }

  const lat1 = a.lat * DEG_TO_RAD;
  const lat2 = b.lat * DEG_TO_RAD;
  const dLat = (b.lat - a.lat) * DEG_TO_RAD;
  const dLon = (b.lon - a.lon) * DEG_TO_RAD;

  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h =
    sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLon * sinLon;
  const c = 2 * Math.atan2(Math.sqrt(Math.max(0, Math.min(1, h))), Math.sqrt(Math.max(0, 1 - h)));

  return EARTH_MEAN_RADIUS_KM * c;
}

/** Menghitung bearing awal (derajat searah jarum jam dari utara, 0–360) dari titik asal ke tujuan. */
export function calculateBearingDeg(from: GeoPoint, to: GeoPoint): number {
  const latDiff = Math.abs(from.lat - to.lat);
  const lonDiff = Math.abs(from.lon - to.lon);
  if (latDiff < 1e-9 && lonDiff < 1e-9) {
    return DEFAULT_OBSERVER_BEARING_DEG;
  }

  const phi1 = from.lat * DEG_TO_RAD;
  const phi2 = to.lat * DEG_TO_RAD;
  const dLambda = (to.lon - from.lon) * DEG_TO_RAD;

  const y = Math.sin(dLambda) * Math.cos(phi2);
  const x =
    Math.cos(phi1) * Math.sin(phi2) -
    Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);

  const deg = Math.atan2(y, x) * RAD_TO_DEG;
  return (deg + 360) % 360;
}

/** Menentukan koordinat tujuan pada jarak dan azimuth tertentu dari titik asal di bola bumi. */
export function destinationPointFromBearingKm(
  origin: GeoPoint,
  distanceKm: number,
  bearingDeg: number
): GeoPoint {
  const safeDistance = Math.max(0, distanceKm);
  if (safeDistance === 0) {
    return {
      lat: clampLatitude(origin.lat),
      lon: normalizeLongitude(origin.lon),
    };
  }

  const delta = safeDistance / EARTH_MEAN_RADIUS_KM;
  const theta = bearingDeg * DEG_TO_RAD;
  const phi1 = origin.lat * DEG_TO_RAD;
  const lambda1 = origin.lon * DEG_TO_RAD;

  const sinPhi1 = Math.sin(phi1);
  const cosPhi1 = Math.cos(phi1);
  const sinDelta = Math.sin(delta);
  const cosDelta = Math.cos(delta);

  const sinPhi2 = sinPhi1 * cosDelta + cosPhi1 * sinDelta * Math.cos(theta);
  const phi2 = Math.asin(Math.max(-1, Math.min(1, sinPhi2)));

  const lambda2 =
    lambda1 +
    Math.atan2(
      Math.sin(theta) * sinDelta * cosPhi1,
      cosDelta - sinPhi1 * Math.sin(phi2)
    );

  return {
    lat: clampLatitude(phi2 * RAD_TO_DEG),
    lon: normalizeLongitude(lambda2 * RAD_TO_DEG),
  };
}

/** Menggeser koordinat sebesar langkah utara-selatan dan timur-barat (km) untuk kontrol keyboard marker. */
export function nudgePointByKm(
  point: GeoPoint,
  deltaNorthKm: number,
  deltaEastKm: number
): GeoPoint {
  const kmPerDegLat = (Math.PI * EARTH_MEAN_RADIUS_KM) / 180;
  const cosLat = Math.max(0.15, Math.cos(point.lat * DEG_TO_RAD));
  const kmPerDegLon = kmPerDegLat * cosLat;

  return {
    lat: clampLatitude(point.lat + deltaNorthKm / kmPerDegLat),
    lon: normalizeLongitude(point.lon + deltaEastKm / kmPerDegLon),
  };
}
