import { describe, it, expect } from "vitest";
import {
  CALIBRATION_ZONE_PERCENT,
  buildIntensityBands,
  depthFraction,
  isMagnitudeOutsideCalibration,
  magnitudeIntensity,
  magnitudePercent,
  magnitudeTicks,
  mmiIntensityStep,
  presetDisplayName,
  ringDiameterPx,
} from "@/lib/simulasi-visual";

describe("magnitudeIntensity", () => {
  it("memetakan magnitudo ke kelas deskriptor", () => {
    expect(magnitudeIntensity(2.9).label).toBe("Mikro");
    expect(magnitudeIntensity(3).label).toBe("Ringan");
    expect(magnitudeIntensity(4.9).label).toBe("Ringan");
    expect(magnitudeIntensity(5).label).toBe("Sedang");
    expect(magnitudeIntensity(6).label).toBe("Kuat");
    expect(magnitudeIntensity(7.9).label).toBe("Besar");
    expect(magnitudeIntensity(8).label).toBe("Dahsyat");
    expect(magnitudeIntensity(9.5).label).toBe("Dahsyat");
  });

  it("tidak jatuh ke kelas bawah akibat galat float", () => {
    expect(magnitudeIntensity(5.999999999)).toMatchObject({ label: "Kuat" });
    expect(magnitudeIntensity(0.1 + 0.2 + 4.7)).toMatchObject({ label: "Sedang" });
  });
});

describe("mmiIntensityStep", () => {
  it("menaik monoton dari 1 sampai 6", () => {
    const steps = Array.from({ length: 12 }, (_, i) => mmiIntensityStep(i + 1));
    expect(steps[0]).toBe(1);
    expect(steps[11]).toBe(6);
    for (let i = 1; i < steps.length; i++) {
      expect(steps[i]!).toBeGreaterThanOrEqual(steps[i - 1]!);
    }
  });
});

describe("posisi di track slider", () => {
  it("memetakan 1,0 ke 0% dan 9,5 ke 100%, dan menjepit di luar rentang", () => {
    expect(magnitudePercent(1)).toBe(0);
    expect(magnitudePercent(9.5)).toBe(100);
    expect(magnitudePercent(0)).toBe(0);
    expect(magnitudePercent(12)).toBe(100);
  });

  it("zona kalibrasi 5,0-7,9 berada di dalam track dan berurutan", () => {
    expect(CALIBRATION_ZONE_PERCENT.start).toBeCloseTo(((5 - 1) / 8.5) * 100, 6);
    expect(CALIBRATION_ZONE_PERCENT.end).toBeCloseTo(((7.9 - 1) / 8.5) * 100, 6);
    expect(CALIBRATION_ZONE_PERCENT.start).toBeLessThan(CALIBRATION_ZONE_PERCENT.end);
  });

  it("mengenali magnitudo di luar kalibrasi MMI", () => {
    expect(isMagnitudeOutsideCalibration(4.9)).toBe(true);
    expect(isMagnitudeOutsideCalibration(5)).toBe(false);
    expect(isMagnitudeOutsideCalibration(7.9)).toBe(false);
    expect(isMagnitudeOutsideCalibration(8)).toBe(true);
  });

  it("membuat tick bulat 1 sampai 9", () => {
    const ticks = magnitudeTicks();
    expect(ticks.map((t) => t.value)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(ticks[0]!.percent).toBe(0);
  });

  it("pita warna memuat enam kelas dan berakhir di 100%", () => {
    const bands = buildIntensityBands();
    for (let n = 1; n <= 6; n++) expect(bands).toContain(`var(--color-intensity-${n})`);
    expect(bands.endsWith("100%)")).toBe(true);
  });
});

describe("visual mini", () => {
  it("kedalaman ditahan di dasar penampang", () => {
    expect(depthFraction(0)).toBe(0);
    expect(depthFraction(10)).toBeCloseTo(0.04, 6);
    expect(depthFraction(700)).toBe(1);
  });

  it("diameter cincin melebar sesuai jarak", () => {
    expect(ringDiameterPx(0, 12, 72)).toBe(12);
    expect(ringDiameterPx(300, 12, 72)).toBe(72);
    expect(ringDiameterPx(150, 12, 72)).toBe(42);
    expect(ringDiameterPx(999, 12, 72)).toBe(72);
  });
});

describe("presetDisplayName", () => {
  it("membuang akhiran magnitudo yang redundan saja", () => {
    expect(presetDisplayName("Aceh 2004 (M 9,1)")).toBe("Aceh 2004");
    expect(presetDisplayName("Yogyakarta 2006 (M 6,3)")).toBe("Yogyakarta 2006");
    expect(presetDisplayName("Gempa Lombok 2018")).toBe("Gempa Lombok 2018");
    expect(presetDisplayName("(M 5,0)")).toBe("(M 5,0)");
  });
});
