import { describe, expect, it } from "vitest";
import {
  DEFAULT_SIMULASI_INPUT,
  MMI_SCALE_INFO,
  runSimulasiCalculation,
  type RadiusEstimate,
} from "@/lib/simulasi";
import {
  ANIMATION_TOTAL_DURATION_SEC,
  MAX_SAFE_LAMP_SWAY_RAD,
  MAX_SAFE_ROOM_AMPLITUDE,
  calculateBearingDeg,
  calculateHaversineKm,
  destinationPointFromBearingKm,
  formatAwamRadiusSummary,
  getInitialUiTipeLokasi,
  getMapTileConfig,
  getVibrationProfileForMmi,
  nudgePointByKm,
  runVisualSimulasiCalculation,
  sampleVibrationFrame,
  syncDistanceFromPoints,
  syncObserverPointFromSlider,
} from "@/lib/simulasi-visual";

describe("Haversine & Sinkronisasi Peta Simulasi", () => {
  it("mengembalikan 0 km untuk koordinat identik dan simetris antar dua titik", () => {
    const a = { lat: -6.836, lon: 106.9968 };
    const b = { lat: -7.2575, lon: 112.7521 };
    expect(calculateHaversineKm(a, a)).toBe(0);
    expect(calculateHaversineKm(a, b)).toBeCloseTo(calculateHaversineKm(b, a), 8);
  });

  it("menghitung jarak referensi khatulistiwa 1 derajat bujur sekitar 111,2 km", () => {
    const dist = calculateHaversineKm({ lat: 0, lon: 100 }, { lat: 0, lon: 101 });
    expect(dist).toBeGreaterThan(110.9);
    expect(dist).toBeLessThan(111.5);
  });

  it("menjaga konsistensi destinationPointFromBearingKm dan nudgePointByKm", () => {
    const origin = { lat: -6.84, lon: 107.0 };
    const east50 = destinationPointFromBearingKm(origin, 50, 90);
    expect(calculateHaversineKm(origin, east50)).toBeCloseTo(50, 1);

    const movedNorth = nudgePointByKm(origin, 20, 0);
    expect(movedNorth.lat).toBeGreaterThan(origin.lat);
    expect(calculateHaversineKm(origin, movedNorth)).toBeCloseTo(20, 1);
  });

  it("menyinkronkan marker Anda -> slider & mempertahankan jarak aktual > 300 km (mis. 412 km)", () => {
    const epicenter = { lat: -6.84, lon: 107.0 };
    const observer412 = destinationPointFromBearingKm(epicenter, 412, 90);

    const sync = syncDistanceFromPoints(epicenter, observer412);
    expect(sync.actualDistanceKm).toBeCloseTo(412, 0);
    expect(sync.sliderDistanceKm).toBe(300);
    expect(sync.isBeyondCalibratedRange).toBe(true);
    expect(sync.formattedActualDistance).toContain("412 km");

    // Tarik kembali lewat slider 120 km harus mempertahankan bearing awal
    const backTo120 = syncObserverPointFromSlider(epicenter, observer412, 120);
    expect(calculateHaversineKm(epicenter, backTo120)).toBeCloseTo(120, 0);
    expect(calculateBearingDeg(epicenter, backTo120)).toBeCloseTo(90, 0);
  });

  it("mesin simulasi menerima jarak > 300 km dengan penanda di luar kalibrasi", () => {
    const directRes = runSimulasiCalculation({
      ...DEFAULT_SIMULASI_INPUT,
      magnitudo: 6.8,
      kedalamanKm: 15,
      jarakPengamatKm: 412,
    });
    expect(Number.isFinite(directRes.mmi.raw)).toBe(true);
    expect(directRes.mmi.outsideDistRange).toBe(true);
    expect(directRes.mmi.calibrationNotes.some((n) => n.includes("300 km"))).toBe(true);

    const visualRes = runVisualSimulasiCalculation(
      { ...DEFAULT_SIMULASI_INPUT, magnitudo: 6.8, kedalamanKm: 15 },
      412,
      "BELUM_DIPILIH"
    );
    expect(visualRes.mmi.outsideDistRange).toBe(true);
    expect(visualRes.mmi.raw).toBeCloseTo(directRes.mmi.raw, 6);
  });
});

describe("Aturan UI Peta, Status Lokasi 3 Keadaan, & Ringkasan Radius Awam", () => {
  it("Kustom dimulai sebagai BELUM_DIPILIH kecuali URL menyertakan ?lokasi=DARAT|LAUT", () => {
    expect(
      getInitialUiTipeLokasi({ hasExplicitUrlLokasi: false, urlLokasi: "DARAT" })
    ).toBe("BELUM_DIPILIH");
    expect(
      getInitialUiTipeLokasi({ hasExplicitUrlLokasi: true, urlLokasi: "LAUT" })
    ).toBe("LAUT");
  });

  it("memformat seluruh 4 status RadiusEstimate dengan teks bahasa awam yang tepat", () => {
    const inRange: RadiusEstimate = {
      status: "in_range",
      radiusKm: 64.2,
      displayText: "~64 km",
    };
    const beyond300: RadiusEstimate = {
      status: "beyond_300",
      radiusKm: null,
      displayText: "> 300 km",
    };
    const outMag: RadiusEstimate = {
      status: "out_of_mag_calibration",
      radiusKm: null,
      displayText: "di luar kalibrasi",
    };
    const notReached: RadiusEstimate = {
      status: "not_reached",
      radiusKm: 0,
      displayText: "tidak terasa",
    };

    expect(formatAwamRadiusSummary("Terasa", inRange)).toBe("Terasa sampai ± 64 km");
    expect(formatAwamRadiusSummary("Terasa", beyond300)).toBe(
      "Terasa > 300 km (di luar rentang kalibrasi)"
    );
    expect(formatAwamRadiusSummary("Mulai merusak ringan", outMag)).toBe(
      "Mulai merusak ringan: tidak dapat diperkirakan (di luar rentang kalibrasi)"
    );
    expect(formatAwamRadiusSummary("Mulai merusak ringan", notReached)).toBe(
      "Mulai merusak ringan: tidak terasa"
    );
  });

  it("konfigurasi tile peta selalu menyediakan atribusi OpenStreetMap contributors", () => {
    const cfg = getMapTileConfig();
    expect(cfg.url).toContain("{z}");
    expect(cfg.attributionHtml).toContain("OpenStreetMap contributors");
    expect(cfg.hasOsmCopyrightText).toBe(true);
  });
});

describe("Pemetaan MMI ke Profil & Sampel Animasi 3D (Ilustratif SIGAP)", () => {
  it("mencakup seluruh tingkat MMI 1–12 dengan batas aman & kutipan BMKG terpisah", () => {
    for (let lvl = 1; lvl <= 12; lvl++) {
      const profile = getVibrationProfileForMmi(lvl);
      const bmkgInfo = MMI_SCALE_INFO[lvl - 1]!;
      expect(profile.level).toBe(lvl);
      expect(profile.roman).toBe(bmkgInfo.roman);
      expect(profile.bmkgQuote).toBe(bmkgInfo.description);
      expect(profile.illustrativeEffectTitle.length).toBeGreaterThan(5);
      expect(profile.roomAmplitude).toBeLessThanOrEqual(MAX_SAFE_ROOM_AMPLITUDE);
      expect(profile.lampSwayRad).toBeLessThanOrEqual(MAX_SAFE_LAMP_SWAY_RAD);
    }

    const mmiIV = getVibrationProfileForMmi(4);
    expect(mmiIV.shelfDropCount).toBe(0);
    expect(mmiIV.glassFall).toBe(false);

    const mmiIX = getVibrationProfileForMmi(9);
    expect(mmiIX.shelfDropCount).toBeGreaterThan(0);
    expect(mmiIX.glassFall).toBe(true);
  });

  it("meredam amplitudo & frekuensi saat prefers-reduced-motion aktif", () => {
    const normal = getVibrationProfileForMmi(8, { reducedMotion: false });
    const reduced = getVibrationProfileForMmi(8, { reducedMotion: true });

    expect(reduced.reducedMotion).toBe(true);
    expect(reduced.reducedMotionNotice).not.toBeNull();
    expect(reduced.roomAmplitude).toBeLessThan(normal.roomAmplitude);
    expect(reduced.lampSwayRad).toBeLessThan(normal.lampSwayRad);
    expect(reduced.roomFreqHz).toBeLessThan(normal.roomFreqHz);
  });

  it("sampel bingkai animasi mengikuti urutan fase idle -> p_wave -> s_wave -> decay -> done", () => {
    const profile = getVibrationProfileForMmi(6);

    const sIdle = sampleVibrationFrame(0, profile);
    expect(sIdle.phase).toBe("idle");
    expect(sIdle.envelope).toBe(0);

    const sP = sampleVibrationFrame(1.5, profile);
    expect(sP.phase).toBe("p_wave");
    expect(sP.envelope).toBeGreaterThan(0);
    expect(sP.envelope).toBeLessThanOrEqual(0.25);

    const sS = sampleVibrationFrame(5.5, profile);
    expect(sS.phase).toBe("s_wave");
    expect(sS.envelope).toBeGreaterThan(sP.envelope);

    const sDecay = sampleVibrationFrame(10.5, profile);
    expect(sDecay.phase).toBe("decay");
    expect(sDecay.envelope).toBeGreaterThan(0);
    expect(sDecay.envelope).toBeLessThan(1);

    const sDone = sampleVibrationFrame(ANIMATION_TOTAL_DURATION_SEC, profile);
    expect(sDone.phase).toBe("done");
    expect(sDone.roomOffsetX).toBe(0);
    expect(sDone.lampAngleZ).toBe(0);
  });
});
