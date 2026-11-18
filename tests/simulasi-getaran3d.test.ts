import { describe, expect, it } from "vitest";
import { MMI_SCALE_INFO } from "@/lib/simulasi";
import {
  CHARACTER_CONFIG,
  DEFAULT_SHELTER_MIN_MMI,
  MAX_P_VERTICAL_AMPLITUDE,
  MAX_SAFE_LAMP_SWAY_RAD,
  MAX_SAFE_ROOM_AMPLITUDE,
  P_S_GAP_MAX_SEC,
  P_S_GAP_MIN_SEC,
  REALISTIC_SHELTER_MIN_MMI,
  SHELF_BOOK_COUNT,
  computeCharacterTiming,
  fallHeight,
  getVibrationProfileForMmi,
  sampleCharacterState,
  sampleVibrationFrame,
  type CharacterActionPhase,
  type VibrationPhase,
  type VibrationProfile,
} from "@/lib/simulasi-visual";

const STEP_SEC = 1 / 60;

function sampleAll(profile: VibrationProfile) {
  const frames = [];
  for (let t = 0; t <= profile.durationSec + 0.5; t += STEP_SEC) {
    frames.push(sampleVibrationFrame(t, profile));
  }
  return frames;
}

describe("Profil Getaran 3D per MMI (ilustrasi SIGAP)", () => {
  it("mencakup MMI I–XII dengan kutipan BMKG asli dan batas amplitudo aman", () => {
    for (let lvl = 1; lvl <= 12; lvl++) {
      const p = getVibrationProfileForMmi(lvl, { tpSeconds: 8.5, tsSeconds: 14.6 });
      const info = MMI_SCALE_INFO[lvl - 1]!;
      expect(p.level).toBe(lvl);
      expect(p.roman).toBe(info.roman);
      expect(p.bmkgQuote).toBe(info.description);
      expect(p.illustrativeEffectDescription.length).toBeGreaterThan(10);
      expect(p.roomAmplitude).toBeLessThanOrEqual(MAX_SAFE_ROOM_AMPLITUDE);
      expect(p.lampSwayRad).toBeLessThanOrEqual(MAX_SAFE_LAMP_SWAY_RAD);
      expect(p.shelfDropCount).toBeLessThanOrEqual(SHELF_BOOK_COUNT);
    }
  });

  it("naik bertahap (tidak pernah turun) dari MMI I ke XII", () => {
    const profiles = Array.from({ length: 12 }, (_, i) => getVibrationProfileForMmi(i + 1));
    for (let i = 1; i < profiles.length; i++) {
      const prev = profiles[i - 1]!;
      const cur = profiles[i]!;
      expect(cur.roomAmplitude).toBeGreaterThanOrEqual(prev.roomAmplitude);
      expect(cur.lampSwayRad).toBeGreaterThanOrEqual(prev.lampSwayRad);
      expect(cur.shelfDropCount).toBeGreaterThanOrEqual(prev.shelfDropCount);
      expect(cur.furnitureSlideMax).toBeGreaterThanOrEqual(prev.furnitureSlideMax);
      expect(cur.crackOpacity).toBeGreaterThanOrEqual(prev.crackOpacity);
      expect(cur.dustAmount).toBeGreaterThanOrEqual(prev.dustAmount);
      expect(cur.durationSec).toBeGreaterThanOrEqual(prev.durationSec);
    }
  });

  it("menjaga ambang efek: retak mulai VIII, debu mulai IX, tidak ada benda jatuh di IV", () => {
    expect(getVibrationProfileForMmi(7).crackOpacity).toBe(0);
    expect(getVibrationProfileForMmi(8).crackOpacity).toBeGreaterThan(0);
    expect(getVibrationProfileForMmi(8).dustAmount).toBe(0);
    expect(getVibrationProfileForMmi(9).dustAmount).toBeGreaterThan(0);

    const iv = getVibrationProfileForMmi(4);
    expect(iv.shelfDropCount).toBe(0);
    expect(iv.glassFall).toBe(false);
  });

  it("MMI XII terlihat berbeda dari IX: amplitudo, benda jatuh, dan debu lebih banyak", () => {
    const ix = getVibrationProfileForMmi(9);
    const xii = getVibrationProfileForMmi(12);
    expect(xii.roomAmplitude).toBeGreaterThan(ix.roomAmplitude * 1.3);
    expect(xii.shelfDropCount).toBeGreaterThan(ix.shelfDropCount);
    expect(xii.dustAmount).toBeGreaterThan(ix.dustAmount);
    expect(xii.clockFall).toBe(true);
    expect(ix.clockFall).toBe(false);
  });

  it("memadatkan jeda P ke S dengan batas min dan maks, tetapi menyimpan nilai asli", () => {
    const dekat = getVibrationProfileForMmi(6, { tpSeconds: 1.7, tsSeconds: 2.9 });
    const sedang = getVibrationProfileForMmi(6, { tpSeconds: 8.5, tsSeconds: 14.6 });
    const jauh = getVibrationProfileForMmi(6, { tpSeconds: 50, tsSeconds: 86 });

    expect(dekat.timeline.compressedGapSec).toBe(P_S_GAP_MIN_SEC);
    expect(jauh.timeline.compressedGapSec).toBe(P_S_GAP_MAX_SEC);
    expect(sedang.timeline.compressedGapSec).toBeGreaterThan(P_S_GAP_MIN_SEC);
    expect(sedang.timeline.compressedGapSec).toBeLessThan(P_S_GAP_MAX_SEC);
    expect(sedang.timeline.compressedGapSec).toBeLessThan(sedang.real.goldenTimeSeconds);

    expect(jauh.real.tpSeconds).toBe(50);
    expect(jauh.real.tsSeconds).toBe(86);
    expect(jauh.real.goldenTimeSeconds).toBe(36);
  });

  it("meredam amplitudo dan mematikan getaran kamera saat prefers-reduced-motion", () => {
    const normal = getVibrationProfileForMmi(8);
    const reduced = getVibrationProfileForMmi(8, { reducedMotion: true });
    expect(reduced.reducedMotionNotice).not.toBeNull();
    expect(reduced.roomAmplitude).toBeLessThan(normal.roomAmplitude);
    expect(reduced.sFreqHz).toBeLessThan(normal.sFreqHz);
    expect(reduced.cameraShake).toBe(0);
    expect(normal.cameraShake).toBeGreaterThan(0);
  });
});

describe("Sampel bingkai Getaran 3D", () => {
  it("deterministik: profil dan waktu yang sama selalu memberi hasil identik", () => {
    const a = getVibrationProfileForMmi(9, { tpSeconds: 8.5, tsSeconds: 14.6 });
    const b = getVibrationProfileForMmi(9, { tpSeconds: 8.5, tsSeconds: 14.6 });
    for (const t of [0.05, 0.9, 2.3, 4.7, 8.1, 11.6]) {
      expect(sampleVibrationFrame(t, a)).toEqual(sampleVibrationFrame(t, b));
    }
  });

  it("tidak melampaui batas aman di setiap bingkai, untuk semua MMI", () => {
    for (let lvl = 1; lvl <= 12; lvl++) {
      const profile = getVibrationProfileForMmi(lvl, { tpSeconds: 1, tsSeconds: 1.8 });
      for (const f of sampleAll(profile)) {
        expect(Math.abs(f.roomOffsetX)).toBeLessThanOrEqual(MAX_SAFE_ROOM_AMPLITUDE);
        expect(Math.abs(f.roomOffsetZ)).toBeLessThanOrEqual(MAX_SAFE_ROOM_AMPLITUDE);
        expect(Math.abs(f.roomOffsetY)).toBeLessThanOrEqual(MAX_P_VERTICAL_AMPLITUDE);
        expect(Math.abs(f.lampAngleZ)).toBeLessThanOrEqual(MAX_SAFE_LAMP_SWAY_RAD);
        expect(Math.abs(f.lampAngleX)).toBeLessThanOrEqual(MAX_SAFE_LAMP_SWAY_RAD);
        expect(Math.abs(f.seismo)).toBeLessThanOrEqual(1);
      }
    }
  });

  it("urutan fase selalu idle → P → jeda → S → peluruhan → selesai, tanpa kembali mundur", () => {
    const order: VibrationPhase[] = ["idle", "p_wave", "gap", "s_wave", "decay", "done"];
    const profile = getVibrationProfileForMmi(7, { tpSeconds: 8.5, tsSeconds: 14.6 });
    const seen: VibrationPhase[] = [];
    for (const f of sampleAll(profile)) {
      if (seen[seen.length - 1] !== f.phase) seen.push(f.phase);
    }
    expect(seen).toEqual(order);
  });

  it("P dominan vertikal dan kecil; S dominan horizontal dan lebih besar", () => {
    const profile = getVibrationProfileForMmi(8, { tpSeconds: 8.5, tsSeconds: 14.6 });
    const frames = sampleAll(profile);
    const peak = (phase: VibrationPhase, key: "roomOffsetX" | "roomOffsetY") =>
      Math.max(...frames.filter((f) => f.phase === phase).map((f) => Math.abs(f[key])));

    expect(peak("p_wave", "roomOffsetY")).toBeGreaterThan(peak("p_wave", "roomOffsetX"));
    expect(peak("s_wave", "roomOffsetX")).toBeGreaterThan(peak("s_wave", "roomOffsetY"));
    expect(peak("s_wave", "roomOffsetX")).toBeGreaterThan(peak("p_wave", "roomOffsetY"));
  });

  it("bukan sinus seragam: puncak gerakan S bervariasi antar siklus", () => {
    const profile = getVibrationProfileForMmi(9);
    const { sStartSec, sEndSec } = profile.timeline;
    const peaks: number[] = [];
    let prev = 0;
    let rising = false;
    for (let t = sStartSec + 0.7; t < sEndSec; t += STEP_SEC) {
      const x = sampleVibrationFrame(t, profile).roomOffsetX;
      if (x < prev && rising && prev > 0) peaks.push(prev);
      rising = x > prev;
      prev = x;
    }
    const spread = Math.max(...peaks) - Math.min(...peaks);
    expect(peaks.length).toBeGreaterThan(4);
    expect(spread).toBeGreaterThan(profile.roomAmplitude * 0.1);
  });

  it("diam total di akhir, benda yang jatuh tetap di lantai, dan buku jatuh bertahap", () => {
    const profile = getVibrationProfileForMmi(12);
    const end = sampleVibrationFrame(profile.durationSec + 1, profile);
    expect(end.phase).toBe("done");
    expect(end.roomOffsetX).toBeCloseTo(0, 10);
    expect(end.roomOffsetY).toBeCloseTo(0, 10);
    expect(end.lampAngleZ).toBeCloseTo(0, 10);
    expect(end.dustAmount).toBeCloseTo(0, 10);
    expect(end.bookFall.filter((p) => p === 1)).toHaveLength(profile.shelfDropCount);
    expect(end.glassFall).toBe(1);
    expect(end.crackOpacity).toBeCloseTo(profile.crackOpacity, 5);

    const mid = sampleVibrationFrame(
      (profile.timeline.sStartSec + profile.timeline.sEndSec) / 2,
      profile
    );
    const fallenMid = mid.bookFall.filter((p) => p > 0).length;
    expect(fallenMid).toBeGreaterThan(0);
    expect(fallenMid).toBeLessThan(profile.shelfDropCount);
  });

  it("lintasan jatuh dimulai di posisi awal, menyentuh lantai, lalu memantul kecil", () => {
    expect(fallHeight(0)).toBe(1);
    expect(fallHeight(0.7)).toBeCloseTo(0, 5);
    expect(fallHeight(0.85)).toBeGreaterThan(0);
    expect(fallHeight(0.85)).toBeLessThan(0.15);
    expect(fallHeight(1)).toBeCloseTo(0, 5);
  });
});

describe("Karakter edukasi Drop, Cover, Hold On", () => {
  it("deterministik: status dan pose identik untuk waktu dan profil yang sama (termasuk scrubbing mundur)", () => {
    const profile = getVibrationProfileForMmi(6, { tpSeconds: 8.5, tsSeconds: 14.6 });
    const t = profile.timeline.sStartSec + 1.1;
    const sample = sampleVibrationFrame(t, profile);

    const a = sampleCharacterState(t, sample, profile);
    // Simulasikan scrubbing ke akhir lalu kembali mundur ke t
    sampleCharacterState(profile.durationSec, sampleVibrationFrame(profile.durationSec, profile), profile);
    const b = sampleCharacterState(t, sample, profile);

    expect(a).toEqual(b);
  });

  it("melewati urutan fase lengkap IDLE → ALERT → DROP → COVER → HOLD_ON → RECOVER pada ambang default", () => {
    const profile = getVibrationProfileForMmi(5, { tpSeconds: 8.5, tsSeconds: 14.6 });
    expect(DEFAULT_SHELTER_MIN_MMI).toBe(1);

    const expected: CharacterActionPhase[] = ["IDLE", "ALERT", "DROP", "COVER", "HOLD_ON", "RECOVER"];
    const seen: CharacterActionPhase[] = [];

    for (let t = 0; t <= profile.durationSec; t += STEP_SEC) {
      const sample = sampleVibrationFrame(t, profile);
      const state = sampleCharacterState(t, sample, profile);
      if (seen[seen.length - 1] !== state.actionPhase) {
        seen.push(state.actionPhase);
      }
    }

    expect(seen).toEqual(expected);
  });

  it("opsi ambang MMI realistis (III+): MMI I–II hanya menyadari getaran tanpa masuk ke bawah meja", () => {
    const mmi2 = getVibrationProfileForMmi(2, { tpSeconds: 8.5, tsSeconds: 14.6 });
    const phases: CharacterActionPhase[] = [];

    for (let t = 0; t <= mmi2.durationSec; t += STEP_SEC) {
      const sample = sampleVibrationFrame(t, mmi2);
      const state = sampleCharacterState(t, sample, mmi2, {
        minMmiForShelter: REALISTIC_SHELTER_MIN_MMI,
      });
      phases.push(state.actionPhase);
      expect(state.sheltering).toBe(false);
      expect(state.tableTopOpacity).toBe(1);
    }

    expect(phases).toContain("ALERT");
    expect(phases).not.toContain("DROP");
    expect(phases).not.toContain("COVER");
    expect(phases).not.toContain("HOLD_ON");
  });

  it("saat HOLD_ON karakter berada di bawah meja, papan meja sedikit transparan, dan posisi mengikuti pergeseran meja", () => {
    const profile = getVibrationProfileForMmi(8, { tpSeconds: 8.5, tsSeconds: 14.6 });
    const timing = computeCharacterTiming(profile);
    const t = Math.min(timing.holdStart + 1.2, timing.recoverStart - 0.1);
    const sample = sampleVibrationFrame(t, profile);
    const state = sampleCharacterState(t, sample, profile);

    expect(state.actionPhase).toBe("HOLD_ON");
    expect(state.sheltering).toBe(true);
    expect(state.tableTopOpacity).toBeLessThan(1);
    // Posisi X karakter bergeser tepat seiring `sample.tableOffsetX` (tidak melayang diam di dunia)
    expect(state.rootPosition.x).toBeCloseTo(
      0.35 + CHARACTER_CONFIG.waypoints.underTableRel.x + sample.tableOffsetX,
      5
    );
    expect(state.hipsY).toBeLessThan(0.3);
  });

  it("transisi posisi dan sudut sendi karakter kontinu (halus tanpa lonjakan patah)", () => {
    const profile = getVibrationProfileForMmi(5, { tpSeconds: 8.5, tsSeconds: 14.6 });
    let prev = sampleCharacterState(0, sampleVibrationFrame(0, profile), profile);
    for (let t = STEP_SEC; t <= profile.durationSec; t += STEP_SEC) {
      const cur = sampleCharacterState(t, sampleVibrationFrame(t, profile), profile);
      const dx = cur.rootPosition.x - prev.rootPosition.x;
      const dz = cur.rootPosition.z - prev.rootPosition.z;
      const stepDist = Math.hypot(dx, dz);
      expect(stepDist).toBeLessThan(0.05);
      expect(Math.abs(cur.hipsY - prev.hipsY)).toBeLessThan(0.03);
      expect(Math.abs(cur.torsoPitch - prev.torsoPitch)).toBeLessThan(0.08);
      prev = cur;
    }
  });

  it("getaran sekunder tubuh saat HOLD_ON lebih besar di MMI tinggi dan teredam pada reducedMotion", () => {
    const low = getVibrationProfileForMmi(3, { tpSeconds: 8.5, tsSeconds: 14.6 });
    const high = getVibrationProfileForMmi(10, { tpSeconds: 8.5, tsSeconds: 14.6 });
    const highReduced = getVibrationProfileForMmi(10, { tpSeconds: 8.5, tsSeconds: 14.6, reducedMotion: true });

    const peakRoll = (p: VibrationProfile) => {
      let maxRoll = 0;
      for (let t = p.timeline.sStartSec; t <= p.timeline.sEndSec; t += STEP_SEC) {
        const s = sampleVibrationFrame(t, p);
        const c = sampleCharacterState(t, s, p);
        if (c.actionPhase === "HOLD_ON") {
          maxRoll = Math.max(maxRoll, Math.abs(c.torsoRoll));
        }
      }
      return maxRoll;
    };

    expect(peakRoll(high)).toBeGreaterThan(peakRoll(low));
    expect(peakRoll(highReduced)).toBeLessThan(peakRoll(high));
  });
});
