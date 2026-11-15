export * from "./types";
export * from "./constants";
export * from "./physics";
export * from "./mmi";
export * from "./tsunami";
export * from "./url";

import {
  calculateEnergyJoules,
  calculateHypocentralDistanceKm,
  calculateWaveTravelTimes,
  formatScientificEnergy,
} from "./physics";
import { evaluateMmiAtObserver, estimateMmiRadius } from "./mmi";
import { evaluateTsunamiIndicator } from "./tsunami";
import type { SimulasiInput, SimulasiResult } from "./types";

/**
 * Menjalankan seluruh kalkulasi simulasi gempa secara deterministik di sisi klien.
 * Tidak memanggil jaringan atau database sama sekali (TC-DB-15).
 */
export function runSimulasiCalculation(input: SimulasiInput): SimulasiResult {
  const joules = calculateEnergyJoules(input.magnitudo);
  const energy = formatScientificEnergy(joules);
  const rhypoKm = calculateHypocentralDistanceKm(
    input.jarakPengamatKm,
    input.kedalamanKm
  );
  const { tpSeconds, tsSeconds, goldenTimeSeconds } =
    calculateWaveTravelTimes(rhypoKm);
  const mmi = evaluateMmiAtObserver(
    input.magnitudo,
    input.kedalamanKm,
    input.jarakPengamatKm
  );
  const radiusFeltIII = estimateMmiRadius(
    input.magnitudo,
    input.kedalamanKm,
    3.0,
    "tidak terasa"
  );
  const radiusDamagingVI = estimateMmiRadius(
    input.magnitudo,
    input.kedalamanKm,
    6.0,
    "tidak terasa (di bawah MMI VI)"
  );
  const tsunami = evaluateTsunamiIndicator(
    input.tipeLokasi,
    input.magnitudo,
    input.kedalamanKm
  );

  return {
    energy,
    rhypoKm,
    tpSeconds,
    tsSeconds,
    goldenTimeSeconds,
    mmi,
    radiusFeltIII,
    radiusDamagingVI,
    tsunami,
  };
}

