import { ALLEN_2012_CALIBRATION, MMI_SCALE_INFO } from "./constants";
import { calculateHypocentralDistanceKm, formatIdNumber } from "./physics";
import type { MmiResult, RadiusEstimate } from "./types";

/**
 * Koefisien AllenEtAl2012Rhypo dari implementasi OpenQuake Engine:
 * https://raw.githubusercontent.com/gem/oq-engine/master/openquake/hazardlib/gsim/allen_2012_ipe.py
 * Merujuk: Allen, T. I., Wald, D. J., & Worden, C. B. (2012),
 * "Intensity attenuation for active crustal regions", Journal of Seismology, 16, 409-433.
 */
const ALLEN_2012_RHYPO_COEFFS = {
  c0: 2.085,
  c1: 1.428,
  c2: -1.402,
  c4: 0.078,
  m1: -0.209,
  m2: 2.042,
} as const;

/**
 * Menghitung intensitas MMI mentah berdasarkan Allen, Wald & Worden (2012)
 * versi jarak hiposenter (R_hypo dalam km).
 * Catatan implementasi: fungsi logaritma memakai logaritma natural (ln / Math.log),
 * diverifikasi tepat terhadap berkas uji OpenQuake `AWW_IPE_RHYPO_MEAN.csv`.
 */
export function computeAllen2012RhypoRaw(magnitudo: number, rhypoKm: number): number {
  const safeRhypo = Math.max(rhypoKm, 1e-6);
  const { c0, c1, c2, c4, m1, m2 } = ALLEN_2012_RHYPO_COEFFS;

  const rM = m1 + m2 * Math.exp(magnitudo - 5.0);
  let distanceTerm = c2 * Math.log(Math.sqrt(safeRhypo * safeRhypo + rM * rM));

  // Suku atenuasi anelastik ditambahkan di atas 50 km sesuai OpenQuake `rhypo > 50.0`.
  if (safeRhypo > 50.0) {
    distanceTerm += c4 * Math.log(safeRhypo / 50.0);
  }

  return c0 + c1 * magnitudo + distanceTerm;
}

export function evaluateMmiAtObserver(
  magnitudo: number,
  depthKm: number,
  epicentralDistanceKm: number
): MmiResult {
  const rhypoKm = calculateHypocentralDistanceKm(epicentralDistanceKm, depthKm);
  const raw = computeAllen2012RhypoRaw(magnitudo, rhypoKm);
  const clampedLevel = Math.min(12, Math.max(1, Math.round(raw)));
  const info = MMI_SCALE_INFO[clampedLevel - 1] ?? MMI_SCALE_INFO[0]!;

  const outsideMagRange =
    magnitudo < ALLEN_2012_CALIBRATION.MAG_MIN || magnitudo > ALLEN_2012_CALIBRATION.MAG_MAX;
  const outsideDistRange = rhypoKm >= ALLEN_2012_CALIBRATION.DIST_MAX_KM;

  const calibrationNotes: string[] = [];
  if (outsideMagRange) {
    calibrationNotes.push(
      `Magnitudo M ${formatIdNumber(magnitudo, 1)} berada di luar rentang kalibrasi rumus (Mw 5,0–7,9); nilai tetap dihitung sebagai ilustrasi.`
    );
  }
  if (outsideDistRange) {
    calibrationNotes.push(
      `Jarak hiposenter ${formatIdNumber(rhypoKm, 1)} km berada di luar rentang kalibrasi rumus (< 300 km).`
    );
  }

  return {
    raw,
    clampedLevel,
    roman: info.roman,
    label: info.label,
    description: info.description,
    outsideMagRange,
    outsideDistRange,
    calibrationNotes,
  };
}

/**
 * Mengestimasi radius episentrum (km) di mana MMI mentah >= thresholdMmi
 * menggunakan pencarian numerik (bisection) pada interval [0, 300] km.
 *
 * Aturan tampilan yang diperketat:
 * 1. Jika M di luar 5,0-7,9: jangan tampilkan angka radius; kembalikan status
 *    "tidak dapat diperkirakan (di luar rentang kalibrasi)".
 * 2. Jika pada jarak episentrum 0 km MMI < thresholdMmi: ambang tak tercapai
 *    ("tidak terasa" atau pesan ambang tidak tercapai).
 * 3. Jika pada jarak episentrum 300 km MMI masih >= thresholdMmi: radius > 300 km,
 *    kembalikan "> 300 km (di luar rentang kalibrasi)" tanpa angka bisection di atas 300 km.
 * 4. Jika M dalam 5,0-7,9 dan radius <= 300 km: hitung via bisection dan tampilkan angka.
 */
export function estimateMmiRadius(
  magnitudo: number,
  depthKm: number,
  thresholdMmi: number,
  notReachedText: string = "tidak terasa"
): RadiusEstimate {
  if (magnitudo < ALLEN_2012_CALIBRATION.MAG_MIN || magnitudo > ALLEN_2012_CALIBRATION.MAG_MAX) {
    return {
      status: "out_of_mag_calibration",
      radiusKm: null,
      displayText: "tidak dapat diperkirakan (di luar rentang kalibrasi)",
    };
  }

  const mmiAtZero = computeAllen2012RhypoRaw(
    magnitudo,
    calculateHypocentralDistanceKm(0, depthKm)
  );
  if (mmiAtZero < thresholdMmi) {
    return {
      status: "not_reached",
      radiusKm: null,
      displayText: notReachedText,
    };
  }

  const maxCalibratedEpiKm = ALLEN_2012_CALIBRATION.DIST_MAX_KM;
  const mmiAtMaxDist = computeAllen2012RhypoRaw(
    magnitudo,
    calculateHypocentralDistanceKm(maxCalibratedEpiKm, depthKm)
  );
  if (mmiAtMaxDist >= thresholdMmi) {
    return {
      status: "beyond_300",
      radiusKm: null,
      displayText: "> 300 km (di luar rentang kalibrasi)",
    };
  }

  let lo: number = 0;
  let hi: number = maxCalibratedEpiKm;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const mmiMid = computeAllen2012RhypoRaw(
      magnitudo,
      calculateHypocentralDistanceKm(mid, depthKm)
    );
    if (mmiMid >= thresholdMmi) {
      lo = mid;
    } else {
      hi = mid;
    }
  }

  const radiusKm = (lo + hi) / 2;
  return {
    status: "in_range",
    radiusKm,
    displayText: `${formatIdNumber(radiusKm, 1)} km`,
  };
}
