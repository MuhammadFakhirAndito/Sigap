import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import {
  buildChatbotHandoffUrl,
  calculateEnergyJoules,
  calculateHypocentralDistanceKm,
  calculateWaveTravelTimes,
  computeAllen2012RhypoRaw,
  estimateMmiRadius,
  evaluateMmiAtObserver,
  evaluateTsunamiIndicator,
  parseSimulasiSearchParams,
  runSimulasiCalculation,
  SIMULASI_LIMITS,
  validateSimulasiInput,
} from "../src/lib/simulasi";

describe("FASE 4 — Pure client simulation math & rules (TC-DB-15, TC-DB-16, TC-DB-17)", () => {
  it("TC-DB-15: src/lib/simulasi murni di klien tanpa dependensi DB atau fetch jaringan", () => {
    const simulasiDir = path.resolve(process.cwd(), "src/lib/simulasi");
    const files = fs.readdirSync(simulasiDir).filter((f) => f.endsWith(".ts"));
    expect(files.length).toBeGreaterThan(0);

    for (const file of files) {
      const content = fs.readFileSync(path.join(simulasiDir, file), "utf-8");
      expect(content).not.toMatch(/prisma/i);
      expect(content).not.toMatch(/\bfetch\s*\(/);
      expect(content).not.toMatch(/axios/i);
    }
  });

  it("TC-DB-16: M 7,0, jarak episentrum 100 km, kedalaman 10 km -> E ~ 2,0e15 J, tP ~ 16,8 s, tS ~ 28,7 s (±5%)", () => {
    const result = runSimulasiCalculation({
      magnitudo: 7.0,
      kedalamanKm: 10,
      lat: -7.0,
      lon: 107.0,
      jarakPengamatKm: 100,
      tipeLokasi: "DARAT",
    });

    const expectedE = 2.0e15;
    const expectedRhypo = Math.sqrt(100 * 100 + 10 * 10);
    const expectedTp = expectedRhypo / 6.0;
    const expectedTs = expectedRhypo / 3.5;

    expect(Math.abs(result.energy.joules - expectedE) / expectedE).toBeLessThan(0.05);
    expect(result.energy.text).toBe("2,0 × 10^15 J");
    expect(Math.abs(result.tpSeconds - 16.8) / 16.8).toBeLessThan(0.05);
    expect(Math.abs(result.tsSeconds - 28.7) / 28.7).toBeLessThan(0.05);
    expect(result.tpSeconds).toBeCloseTo(expectedTp, 5);
    expect(result.tsSeconds).toBeCloseTo(expectedTs, 5);
    expect(result.goldenTimeSeconds).toBeCloseTo(expectedTs - expectedTp, 5);
  });

  it("OpenQuake AllenEtAl2012Rhypo cocok persis dengan fixture resmi AWW_IPE_RHYPO_MEAN.csv", () => {
    const fixtures: Array<[number, number, number]> = [
      [5.0, 1.0, 8.1928149],
      [5.0, 50.0, 3.7394023],
      [5.0, 300.0, 1.368028],
      [6.0, 10.0, 7.2488079],
      [6.0, 100.0, 4.2486195],
      [7.0, 1.0, 8.2924672],
      [7.0, 50.0, 6.5368604],
      [7.0, 300.0, 4.2223319],
    ];

    for (const [m, rhypo, expectedMmi] of fixtures) {
      expect(computeAllen2012RhypoRaw(m, rhypo)).toBeCloseTo(expectedMmi, 6);
    }
  });

  it("Batas rentang input: M 1,0 & 9,5; kedalaman 1 & 700 km; jarak 0 & 300 km", () => {
    const minRes = runSimulasiCalculation({
      magnitudo: SIMULASI_LIMITS.MAG_MIN,
      kedalamanKm: SIMULASI_LIMITS.DEPTH_MIN,
      lat: 0,
      lon: 110,
      jarakPengamatKm: SIMULASI_LIMITS.DIST_MIN,
      tipeLokasi: "DARAT",
    });
    expect(minRes.rhypoKm).toBe(1);
    expect(minRes.mmi.clampedLevel).toBeGreaterThanOrEqual(1);
    expect(minRes.mmi.clampedLevel).toBeLessThanOrEqual(12);
    expect(minRes.mmi.outsideMagRange).toBe(true);

    const maxRes = runSimulasiCalculation({
      magnitudo: SIMULASI_LIMITS.MAG_MAX,
      kedalamanKm: SIMULASI_LIMITS.DEPTH_MAX,
      lat: -6,
      lon: 105,
      jarakPengamatKm: SIMULASI_LIMITS.DIST_MAX,
      tipeLokasi: "LAUT",
    });
    expect(maxRes.rhypoKm).toBeCloseTo(Math.hypot(300, 700), 6);
    expect(maxRes.mmi.clampedLevel).toBeGreaterThanOrEqual(1);
    expect(maxRes.mmi.clampedLevel).toBeLessThanOrEqual(12);
    expect(maxRes.mmi.outsideMagRange).toBe(true);
    expect(maxRes.mmi.outsideDistRange).toBe(true);
    expect(calculateEnergyJoules(9.5)).toBeCloseTo(Math.pow(10, 1.5 * 9.5 + 4.8), 6);
    expect(calculateHypocentralDistanceKm(0, 700)).toBe(700);
    expect(calculateWaveTravelTimes(700).goldenTimeSeconds).toBeCloseTo(700 / 3.5 - 700 / 6, 5);
  });

  describe("Tiga aturan tampilan radius guncangan (diperketat)", () => {
    it("Kasus 1: M dalam 5,0-7,9 dan radius <= 300 km -> tampilkan angka terhitung", () => {
      // Cianjur 2022: M 5,6, kedalaman 10 km -> radius III ≈ 166,7 km, radius VI ≈ 15,0 km
      const r3 = estimateMmiRadius(5.6, 10, 3.0, "tidak terasa");
      const r6 = estimateMmiRadius(5.6, 10, 6.0, "tidak terasa (di bawah MMI VI)");
      expect(r3.status).toBe("in_range");
      expect(r3.radiusKm).toBeCloseTo(166.7, 1);
      expect(r3.displayText).toMatch(/km$/);
      expect(r6.status).toBe("in_range");
      expect(r6.radiusKm).toBeCloseTo(15.0, 1);

      // M 5,0, kedalaman 150 km -> pada jarak 0 km MMI < 3,0 => "tidak terasa"
      const rNotFelt = estimateMmiRadius(5.0, 150, 3.0, "tidak terasa");
      expect(rNotFelt.status).toBe("not_reached");
      expect(rNotFelt.radiusKm).toBeNull();
      expect(rNotFelt.displayText).toBe("tidak terasa");
    });

    it("Kasus 2: M dalam 5,0-7,9 tetapi radius > 300 km -> tampilkan '> 300 km (di luar rentang kalibrasi)' tanpa angka bisection > 300", () => {
      // Palu 2018: M 7,5, kedalaman 20 km -> radius III melewati 300 km, radius VI tetap <= 300 km
      const r3 = estimateMmiRadius(7.5, 20, 3.0, "tidak terasa");
      expect(r3.status).toBe("beyond_300");
      expect(r3.radiusKm).toBeNull();
      expect(r3.displayText).toBe("> 300 km (di luar rentang kalibrasi)");
      expect(r3.displayText).not.toContain("1296");

      const r6 = estimateMmiRadius(7.5, 20, 6.0, "tidak terasa (di bawah MMI VI)");
      expect(r6.status).toBe("in_range");
      expect(r6.radiusKm).toBeCloseTo(130.6, 1);
    });

    it("Kasus 3: M di luar 5,0-7,9 (M < 5,0 atau M > 7,9) -> tanpa angka radius, tulis 'tidak dapat diperkirakan (di luar rentang kalibrasi)'", () => {
      for (const m of [4.9, 3.2, 8.0, 9.1]) {
        const r3 = estimateMmiRadius(m, 30, 3.0, "tidak terasa");
        const r6 = estimateMmiRadius(m, 30, 6.0, "tidak terasa (di bawah MMI VI)");
        expect(r3.status).toBe("out_of_mag_calibration");
        expect(r3.radiusKm).toBeNull();
        expect(r3.displayText).toBe("tidak dapat diperkirakan (di luar rentang kalibrasi)");
        expect(r6.status).toBe("out_of_mag_calibration");
        expect(r6.radiusKm).toBeNull();
        expect(r6.displayText).toBe("tidak dapat diperkirakan (di luar rentang kalibrasi)");

        // MMI pengamat tetap dihitung dengan catatan di luar kalibrasi
        const mmi = evaluateMmiAtObserver(m, 30, 50);
        expect(mmi.outsideMagRange).toBe(true);
        expect(mmi.calibrationNotes.length).toBeGreaterThan(0);
      }
    });
  });

  it("Kriteria tsunami BNPB (2012): LAUT, M > 6,8, dan kedalaman <= 70 km", () => {
    expect(evaluateTsunamiIndicator("LAUT", 6.8, 30).meetsCriteria).toBe(false);
    expect(evaluateTsunamiIndicator("LAUT", 6.9, 30).meetsCriteria).toBe(true);
    expect(evaluateTsunamiIndicator("LAUT", 7.6, 70).meetsCriteria).toBe(true);
    expect(evaluateTsunamiIndicator("LAUT", 7.6, 71).meetsCriteria).toBe(false);
    expect(evaluateTsunamiIndicator("DARAT", 7.5, 20).meetsCriteria).toBe(false);
  });

  it("TC-DB-17 & validasi: URL param valid terisi, param tidak valid ditolak dengan peringatan, input invalid terdeteksi", () => {
    const valid = parseSimulasiSearchParams({
      m: "6.4",
      d: "15",
      lat: "-7.25",
      lon: "106.8",
      jarak: "80",
      wilayah: "Sukabumi",
    });
    expect(valid.appliedFromUrl).toBe(true);
    expect(valid.warnings).toHaveLength(0);
    expect(valid.input).toMatchObject({
      magnitudo: 6.4,
      kedalamanKm: 15,
      lat: -7.25,
      lon: 106.8,
      jarakPengamatKm: 80,
      wilayah: "Sukabumi",
    });

    const invalid = parseSimulasiSearchParams({
      m: "bukan-angka",
      d: "-10",
      lat: "120",
      lon: "999",
      jarak: "500",
      lokasi: "ANTARIKSA",
    });
    expect(invalid.warnings.length).toBe(6);
    expect(invalid.input.magnitudo).toBe(6.0);
    expect(invalid.input.kedalamanKm).toBe(10);

    const err = validateSimulasiInput({
      magnitudo: 10.5,
      kedalamanKm: 0,
      lat: -95,
      lon: 200,
      jarakPengamatKm: 350,
      tipeLokasi: "DARAT",
    });
    expect(Object.keys(err)).toHaveLength(5);

    const chatUrl = buildChatbotHandoffUrl({
      magnitudo: 6.4,
      kedalamanKm: 15,
      wilayah: "Sukabumi",
      mmiRoman: "VI",
    });
    expect(chatUrl).toContain("/chatbot?");
    expect(chatUrl).toContain("m=6.4");
    expect(chatUrl).toContain("d=15");
    expect(chatUrl).toContain("wilayah=Sukabumi");
    expect(chatUrl).toContain("mmi=VI");
  });
});

