import type { TipeLokasiSimulasi, TsunamiIndicator } from "./types";

/**
 * Heuristik edukasi potensi tsunami merujuk Buku Saku Tanggap Tangkas Tangguh
 * Menghadapi Bencana (BNPB, 2012):
 * episentrum di LAUT, magnitudo > 6,8, dan kedalaman <= 70 km.
 * Jenis mekanisme sesar dan longsor bawah laut tidak dimodelkan.
 */
export function evaluateTsunamiIndicator(
  tipeLokasi: TipeLokasiSimulasi,
  magnitudo: number,
  depthKm: number
): TsunamiIndicator {
  const isSea = tipeLokasi === "LAUT";
  const isMagHigh = magnitudo > 6.8;
  const isShallow = depthKm <= 70;
  const meetsCriteria = isSea && isMagHigh && isShallow;

  const ruleText =
    "Kriteria Buku Saku BNPB (2012): pusat gempa di laut, magnitudo > 6,8, dan kedalaman ≤ 70 km. Jenis sesar dan longsor bawah laut tidak dimodelkan.";

  if (meetsCriteria) {
    return {
      meetsCriteria: true,
      badgeLabel: "Berpotensi memenuhi kriteria simulasi",
      explanation:
        "Kombinasi parameter (laut, M > 6,8, kedalaman ≤ 70 km) memenuhi ambang edukasi pembentukan tsunami.",
      ruleText,
    };
  }

  const unmetReasons: string[] = [];
  if (!isSea) unmetReasons.push("episentrum tercatat di darat");
  if (!isMagHigh) unmetReasons.push("magnitudo ≤ 6,8");
  if (!isShallow) unmetReasons.push("kedalaman > 70 km");

  return {
    meetsCriteria: false,
    badgeLabel: "Tidak memenuhi kriteria simulasi",
    explanation: `Parameter saat ini (${unmetReasons.join(", ")}) tidak memenuhi syarat dasar kriteria simulasi, tetapi tetap bukan jaminan nihil bahaya lokal.`,
    ruleText,
  };
}

