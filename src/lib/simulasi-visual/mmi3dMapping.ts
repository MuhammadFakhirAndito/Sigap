import { MMI_SCALE_INFO } from "@/lib/simulasi";

export type MmiBandKey = "I-II" | "III-IV" | "V-VI" | "VII-VIII" | "IX-XII";

/** Batas atas amplitudo animasi ruangan dan lampu agar tidak menyebabkan ketidaknyamanan visual. */
export const MAX_SAFE_ROOM_AMPLITUDE = 0.065;
export const MAX_SAFE_LAMP_SWAY_RAD = 0.32;
export const ANIMATION_TOTAL_DURATION_SEC = 12;
export const ANIMATION_P_WAVE_END_RATIO = 0.25;
export const ANIMATION_S_WAVE_END_RATIO = 0.8;
export const REDUCED_MOTION_AMPLITUDE_FACTOR = 0.2;
export const REDUCED_MOTION_FREQUENCY_FACTOR = 0.45;

export interface VibrationProfile {
  level: number;
  roman: string;
  band: MmiBandKey;
  /** Label tingkat intensitas skala MMI BMKG. */
  bmkgLabel: string;
  /** Kutipan deskripsi dampak resmi skala MMI BMKG (bukan teks animasi). */
  bmkgQuote: string;
  /** Judul efek visual adegan 3D (pilihan ilustratif SIGAP, bukan standar/teks BMKG). */
  illustrativeEffectTitle: string;
  /** Rincian gerak objek pada adegan low-poly (pilihan ilustratif SIGAP, bukan fisika struktur). */
  illustrativeEffectDescription: string;
  roomAmplitude: number;
  roomFreqHz: number;
  lampSwayRad: number;
  lampFreqHz: number;
  glassSlideMax: number;
  shelfItemSlideMax: number;
  shelfDropCount: number;
  glassFall: boolean;
  furnitureSlideMax: number;
  durationSec: number;
  reducedMotion: boolean;
  reducedMotionNotice: string | null;
}

export interface VibrationFrameSample {
  phase: "idle" | "p_wave" | "s_wave" | "decay" | "done";
  envelope: number;
  roomOffsetX: number;
  roomOffsetZ: number;
  lampAngleZ: number;
  lampAngleX: number;
  glassOffsetX: number;
  glassFallProgress: number;
  shelfItemOffsets: [number, number, number];
  shelfDropProgresses: [number, number, number];
  furnitureOffsetX: number;
  furnitureYawRad: number;
}

interface RawProfilePreset {
  band: MmiBandKey;
  illustrativeEffectTitle: string;
  illustrativeEffectDescription: string;
  roomAmplitude: number;
  roomFreqHz: number;
  lampSwayRad: number;
  lampFreqHz: number;
  glassSlideMax: number;
  shelfItemSlideMax: number;
  shelfDropCount: number;
  glassFall: boolean;
  furnitureSlideMax: number;
}

const RAW_MMI_3D_PRESETS: Record<number, RawProfilePreset> = {
  1: {
    band: "I-II",
    illustrativeEffectTitle: "Nyaris diam dengan ayunan mikro lampu gantung",
    illustrativeEffectDescription:
      "Ruangan, gelas, dan benda di rak tetap diam; lampu gantung berayun sangat samar.",
    roomAmplitude: 0,
    roomFreqHz: 1.5,
    lampSwayRad: 0.01,
    lampFreqHz: 0.9,
    glassSlideMax: 0,
    shelfItemSlideMax: 0,
    shelfDropCount: 0,
    glassFall: false,
    furnitureSlideMax: 0,
  },
  2: {
    band: "I-II",
    illustrativeEffectTitle: "Lampu gantung bergoyang halus",
    illustrativeEffectDescription:
      "Lampu gantung berayun lembut berirama; lantai bergetar mikro sementara benda di meja dan rak tetap di tempat.",
    roomAmplitude: 0.004,
    roomFreqHz: 1.8,
    lampSwayRad: 0.04,
    lampFreqHz: 1.1,
    glassSlideMax: 0,
    shelfItemSlideMax: 0,
    shelfDropCount: 0,
    glassFall: false,
    furnitureSlideMax: 0,
  },
  3: {
    band: "III-IV",
    illustrativeEffectTitle: "Benda ringan dan gelas bergeser mulai terlihat",
    illustrativeEffectDescription:
      "Ruangan bergetar ringan, lampu gantung berayun sedang, dan gelas di meja serta benda ringan di rak bergeser terbatas.",
    roomAmplitude: 0.012,
    roomFreqHz: 2.4,
    lampSwayRad: 0.08,
    lampFreqHz: 1.3,
    glassSlideMax: 0.05,
    shelfItemSlideMax: 0.04,
    shelfDropCount: 0,
    glassFall: false,
    furnitureSlideMax: 0,
  },
  4: {
    band: "III-IV",
    illustrativeEffectTitle: "Benda ringan dan gelas bergeser jelas",
    illustrativeEffectDescription:
      "Lampu gantung berayun lebar, ruangan bergetar nyata, serta gelas di meja dan benda ringan di rak bergeser jelas mendekati tepi.",
    roomAmplitude: 0.02,
    roomFreqHz: 3.0,
    lampSwayRad: 0.13,
    lampFreqHz: 1.5,
    glassSlideMax: 0.12,
    shelfItemSlideMax: 0.09,
    shelfDropCount: 0,
    glassFall: false,
    furnitureSlideMax: 0.008,
  },
  5: {
    band: "V-VI",
    illustrativeEffectTitle: "Sebagian benda jatuh dari rak",
    illustrativeEffectDescription:
      "Guncangan utama membuat lampu berayun kuat, meja bervibrasi, dan 2 benda ringan terjatuh dari rak ke lantai.",
    roomAmplitude: 0.032,
    roomFreqHz: 3.5,
    lampSwayRad: 0.19,
    lampFreqHz: 1.7,
    glassSlideMax: 0.16,
    shelfItemSlideMax: 0.12,
    shelfDropCount: 2,
    glassFall: false,
    furnitureSlideMax: 0.025,
  },
  6: {
    band: "V-VI",
    illustrativeEffectTitle: "Benda di rak dan gelas terjatuh",
    illustrativeEffectDescription:
      "Seluruh 3 benda di rak dan gelas di atas meja terjatuh ke lantai saat fase gelombang S, disertai pergeseran ringan meja dan rak.",
    roomAmplitude: 0.045,
    roomFreqHz: 4.0,
    lampSwayRad: 0.25,
    lampFreqHz: 1.9,
    glassSlideMax: 0.18,
    shelfItemSlideMax: 0.14,
    shelfDropCount: 3,
    glassFall: true,
    furnitureSlideMax: 0.045,
  },
  7: {
    band: "VII-VIII",
    illustrativeEffectTitle: "Perabot bergeser kuat dan benda berjatuhan",
    illustrativeEffectDescription:
      "Meja, kursi, dan rak bergeser kuat di atas lantai, semua benda lepas jatuh, dan lampu berayun mendekati batas aman tanpa keruntuhan dinding.",
    roomAmplitude: 0.056,
    roomFreqHz: 4.5,
    lampSwayRad: 0.3,
    lampFreqHz: 2.1,
    glassSlideMax: 0.18,
    shelfItemSlideMax: 0.14,
    shelfDropCount: 3,
    glassFall: true,
    furnitureSlideMax: 0.085,
  },
  8: {
    band: "VII-VIII",
    illustrativeEffectTitle: "Perabot bergeser kuat (batas amplitudo aman)",
    illustrativeEffectDescription:
      "Amplitudo getaran mencapai batas aman maksimum adegan; perabot bergeser kuat dan benda jatuh tanpa efek bangunan roboh.",
    roomAmplitude: MAX_SAFE_ROOM_AMPLITUDE,
    roomFreqHz: 4.8,
    lampSwayRad: MAX_SAFE_LAMP_SWAY_RAD,
    lampFreqHz: 2.2,
    glassSlideMax: 0.18,
    shelfItemSlideMax: 0.14,
    shelfDropCount: 3,
    glassFall: true,
    furnitureSlideMax: 0.11,
  },
  9: {
    band: "IX-XII",
    illustrativeEffectTitle: "Pergeseran perabot maksimal dalam batas aman",
    illustrativeEffectDescription:
      "Getaran ruangan dan ayunan lampu dikunci pada batas amplitudo aman maksimum; perabot bergeser jelas dan benda jatuh tanpa adegan keruntuhan.",
    roomAmplitude: MAX_SAFE_ROOM_AMPLITUDE,
    roomFreqHz: 4.8,
    lampSwayRad: MAX_SAFE_LAMP_SWAY_RAD,
    lampFreqHz: 2.2,
    glassSlideMax: 0.18,
    shelfItemSlideMax: 0.14,
    shelfDropCount: 3,
    glassFall: true,
    furnitureSlideMax: 0.12,
  },
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(t: number): number {
  const clamped = clamp01(t);
  return 1 - Math.pow(1 - clamped, 3);
}

/** Membentuk profil animasi ilustratif 3D berdasarkan tingkat MMI I–XII dan preferensi reduced-motion. */
export function getVibrationProfileForMmi(
  mmiLevel: number,
  options?: { reducedMotion?: boolean }
): VibrationProfile {
  const clampedLevel = Math.min(12, Math.max(1, Math.round(mmiLevel)));
  const info = MMI_SCALE_INFO[clampedLevel - 1] ?? MMI_SCALE_INFO[0]!;
  const presetKey = clampedLevel >= 9 ? 9 : clampedLevel;
  const raw = RAW_MMI_3D_PRESETS[presetKey]!;
  const reducedMotion = Boolean(options?.reducedMotion);

  const ampScale = reducedMotion ? REDUCED_MOTION_AMPLITUDE_FACTOR : 1;
  const freqScale = reducedMotion ? REDUCED_MOTION_FREQUENCY_FACTOR : 1;

  return {
    level: clampedLevel,
    roman: info.roman,
    band: raw.band,
    bmkgLabel: info.label,
    bmkgQuote: info.description,
    illustrativeEffectTitle: raw.illustrativeEffectTitle,
    illustrativeEffectDescription: raw.illustrativeEffectDescription,
    roomAmplitude: Math.min(MAX_SAFE_ROOM_AMPLITUDE, raw.roomAmplitude * ampScale),
    roomFreqHz: raw.roomFreqHz * freqScale,
    lampSwayRad: Math.min(MAX_SAFE_LAMP_SWAY_RAD, raw.lampSwayRad * ampScale),
    lampFreqHz: raw.lampFreqHz * freqScale,
    glassSlideMax: raw.glassSlideMax * ampScale,
    shelfItemSlideMax: raw.shelfItemSlideMax * ampScale,
    shelfDropCount: raw.shelfDropCount,
    glassFall: raw.glassFall,
    furnitureSlideMax: raw.furnitureSlideMax * (reducedMotion ? 0.35 : 1),
    durationSec: ANIMATION_TOTAL_DURATION_SEC,
    reducedMotion,
    reducedMotionNotice: reducedMotion
      ? "Mode gerakan dikurangi aktif (prefers-reduced-motion): amplitudo dan frekuensi animasi diturunkan."
      : null,
  };
}

/** Menghitung sampel posisi & rotasi tiap objek adegan 3D pada waktu elapsedSec (0..12s). */
export function sampleVibrationFrame(
  elapsedSec: number,
  profile: VibrationProfile
): VibrationFrameSample {
  if (elapsedSec <= 0) {
    return {
      phase: "idle",
      envelope: 0,
      roomOffsetX: 0,
      roomOffsetZ: 0,
      lampAngleZ: 0,
      lampAngleX: 0,
      glassOffsetX: 0,
      glassFallProgress: 0,
      shelfItemOffsets: [0, 0, 0],
      shelfDropProgresses: [0, 0, 0],
      furnitureOffsetX: 0,
      furnitureYawRad: 0,
    };
  }

  const ratio = clamp01(elapsedSec / profile.durationSec);
  const done = elapsedSec >= profile.durationSec;

  let phase: VibrationFrameSample["phase"];
  let envelope: number;
  if (done) {
    phase = "done";
    envelope = 0;
  } else if (ratio < ANIMATION_P_WAVE_END_RATIO) {
    phase = "p_wave";
    const local = ratio / ANIMATION_P_WAVE_END_RATIO;
    envelope = 0.24 * Math.sin((local * Math.PI) / 2);
  } else if (ratio < ANIMATION_S_WAVE_END_RATIO) {
    phase = "s_wave";
    const local =
      (ratio - ANIMATION_P_WAVE_END_RATIO) /
      (ANIMATION_S_WAVE_END_RATIO - ANIMATION_P_WAVE_END_RATIO);
    envelope = local < 0.2 ? 0.24 + 0.76 * (local / 0.2) : 1.0;
  } else {
    phase = "decay";
    const local =
      (ratio - ANIMATION_S_WAVE_END_RATIO) / (1 - ANIMATION_S_WAVE_END_RATIO);
    envelope = 0.5 * (1 + Math.cos(local * Math.PI));
  }

  const omegaRoom = 2 * Math.PI * profile.roomFreqHz;
  const omegaLamp = 2 * Math.PI * profile.lampFreqHz;

  const roomOffsetX = done
    ? 0
    : envelope * profile.roomAmplitude * Math.sin(omegaRoom * elapsedSec);
  const roomOffsetZ = done
    ? 0
    : envelope * profile.roomAmplitude * 0.65 * Math.cos(omegaRoom * 0.87 * elapsedSec);

  // Ayunan lampu mereda sedikit lebih lambat seperti bandul
  const lampEnvelope = done ? 0 : Math.max(envelope, ratio > 0.25 ? (1 - ratio) * 0.55 : 0);
  const lampAngleZ = done
    ? 0
    : lampEnvelope * profile.lampSwayRad * Math.sin(omegaLamp * elapsedSec);
  const lampAngleX = done
    ? 0
    : lampEnvelope * profile.lampSwayRad * 0.45 * Math.cos(omegaLamp * 0.8 * elapsedSec);

  const sWaveProgress = clamp01(
    (ratio - ANIMATION_P_WAVE_END_RATIO) / (ANIMATION_S_WAVE_END_RATIO - ANIMATION_P_WAVE_END_RATIO)
  );
  const cumulativeSlide = easeOutCubic(Math.min(1, sWaveProgress * 1.15));

  const glassJitter = done ? 0 : envelope * 0.012 * Math.sin(omegaRoom * 1.3 * elapsedSec);
  const glassOffsetX = profile.glassSlideMax * cumulativeSlide + glassJitter;

  const glassFallProgress = profile.glassFall
    ? easeOutCubic((ratio - 0.34) / 0.22)
    : 0;

  const shelfItemOffsets: [number, number, number] = [
    profile.shelfItemSlideMax * cumulativeSlide,
    profile.shelfItemSlideMax * 0.82 * cumulativeSlide,
    profile.shelfItemSlideMax * 0.94 * cumulativeSlide,
  ];

  const shelfDropProgresses: [number, number, number] = [
    profile.shelfDropCount >= 1 ? easeOutCubic((ratio - 0.3) / 0.22) : 0,
    profile.shelfDropCount >= 2 ? easeOutCubic((ratio - 0.4) / 0.22) : 0,
    profile.shelfDropCount >= 3 ? easeOutCubic((ratio - 0.48) / 0.22) : 0,
  ];

  const furnitureJitter = done
    ? 0
    : envelope * Math.min(0.015, profile.furnitureSlideMax * 0.35) * Math.sin(omegaRoom * 0.9 * elapsedSec);
  const furnitureOffsetX = profile.furnitureSlideMax * cumulativeSlide + furnitureJitter;
  const furnitureYawRad = profile.furnitureSlideMax * 0.6 * cumulativeSlide;

  return {
    phase,
    envelope,
    roomOffsetX,
    roomOffsetZ,
    lampAngleZ,
    lampAngleX,
    glassOffsetX,
    glassFallProgress,
    shelfItemOffsets,
    shelfDropProgresses,
    furnitureOffsetX,
    furnitureYawRad,
  };
}
