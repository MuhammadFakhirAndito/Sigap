import {
  type VibrationFrameSample,
  type VibrationProfile,
} from "./mmi3dMapping";

/**
 * Mesin status deterministik karakter edukasi "Drop, Cover, Hold On" (Merunduk, Berlindung, Berpegangan).
 * Pergerakan memakai kurva Cubic Bezier (ruang XZ) dan interpolasi Bernstein C-infinity dengan easing
 * smootherstep (kontinu hingga turunan kedua) sehingga karakter tidak berhenti-henti di tiap fase.
 */

export type CharacterActionPhase =
  | "IDLE"
  | "ALERT"
  | "DROP"
  | "COVER"
  | "HOLD_ON"
  | "RECOVER";

/** Ambang MMI minimum default = 1 agar karakter selalu memperagakan perlindungan saat gempa dimulai. */
export const DEFAULT_SHELTER_MIN_MMI = 1;
/** Opsi realistis: pada MMI I–II karakter hanya menyadari getaran tanpa menyelam ke bawah meja. */
export const REALISTIC_SHELTER_MIN_MMI = 3;

export const CHARACTER_CONFIG = {
  defaultMinMmiForShelter: DEFAULT_SHELTER_MIN_MMI,
  realisticLowMmiThreshold: REALISTIC_SHELTER_MIN_MMI,
  scale: 1.0,
  alertMinSec: 0.3,
  alertMaxSec: 0.48,
  dropMinSec: 0.72,
  dropMaxSec: 1.08,
  coverDurationSec: 0.62,
  /** Karakter bertahan memegang kaki meja sepanjang fase S hingga awal peluruhan sebelum aman keluar. */
  recoverStartDecayFraction: 0.42,
  /** Papan meja dibuat sedikit tembus pandang hanya saat COVER/HOLD_ON agar posisi berlindung terlihat dari kamera isometrik. */
  tableTopShelterOpacity: 0.58,
  /** Titik kunci ruangan (koordinat lokal roomGroup, selaras dengan buildRoom.ts). */
  waypoints: {
    seat: { x: -0.60, z: 0.44, yaw: 0.55 },
    standCtrl1: { x: -0.44, z: 0.68 },
    standCtrl2: { x: 0.02, z: 0.58 },
    /** Relatif terhadap pusat meja (TABLE_BASE + tableOffsetX). Memberi jarak aman ~0,10 m antara kepala dan kaki depan-kanan meja. */
    underTableRel: { x: -0.16, z: -0.04, yaw: 1.2 },
    recoverCtrl1: { x: 0.2, z: 0.46 },
    recoverCtrl2: { x: 0.14, z: 0.68 },
    recoverStand: { x: 0.04, z: 0.68, yaw: 0.35 },
  },
} as const;

export interface CharacterPhaseMeta {
  badge: string;
  shortLabel: string;
  description: string;
}

export const CHARACTER_PHASE_META: Record<CharacterActionPhase, CharacterPhaseMeta> = {
  IDLE: {
    badge: "Siap",
    shortLabel: "Posisi awal",
    description: "Beraktivitas di dalam ruangan, jauh dari rak dinding dan jendela.",
  },
  ALERT: {
    badge: "Waspada (Gelombang P)",
    shortLabel: "Sadar getaran awal",
    description: "Getaran awal terasa: hentikan aktivitas dan arahkan perhatian ke meja kokoh terdekat.",
  },
  DROP: {
    badge: "Drop (Merunduk)",
    shortLabel: "Drop · Merunduk",
    description: "Segera menjauh dari jendela/rak, turun ke posisi rendah menuju bawah meja agar tidak terjatuh.",
  },
  COVER: {
    badge: "Cover (Berlindung)",
    shortLabel: "Cover · Berlindung",
    description: "Masuk ke bawah papan meja untuk melindungi kepala dan leher dari benda yang mungkin jatuh.",
  },
  HOLD_ON: {
    badge: "Hold On (Berpegangan)",
    shortLabel: "Hold On · Berpegangan",
    description: "Pegang kaki meja erat-erat dan lindungi kepala; ikuti pergeseran meja hingga guncangan berhenti.",
  },
  RECOVER: {
    badge: "Aman Keluar",
    shortLabel: "Keluar setelah mereda",
    description: "Setelah guncangan berhenti, keluar perlahan sambil memeriksa pecahan kaca atau benda jatuh.",
  },
};

export interface CharacterSimOptions {
  /** Ambang MMI minimum agar karakter berlindung di bawah meja (default 1 = selalu berlindung). */
  minMmiForShelter?: number;
  /** Jam idle opsional (detik) untuk animasi napas/menoleh halus sebelum gempa dimulai. */
  idleClockSec?: number;
  /** Delta waktu antar bingkai (detik) untuk peredaman eksponensial halus saat pemutaran langsung. */
  dtSec?: number;
}

export interface CharacterFrameState {
  actionPhase: CharacterActionPhase;
  sheltering: boolean;
  shouldTakeCover: boolean;
  tableTopOpacity: number;
  hazardHighlightOpacity: number;
  rootPosition: { x: number; y: number; z: number };
  rootYaw: number;
  hipsY: number;
  hipsPitch: number;
  hipsRoll: number;
  torsoPitch: number;
  torsoYaw: number;
  torsoRoll: number;
  headPitch: number;
  headYaw: number;
  headRoll: number;
  leftShoulderPitch: number;
  leftShoulderYaw: number;
  leftShoulderRoll: number;
  leftElbowPitch: number;
  rightShoulderPitch: number;
  rightShoulderYaw: number;
  rightShoulderRoll: number;
  rightElbowPitch: number;
  leftHipPitch: number;
  leftKneePitch: number;
  rightHipPitch: number;
  rightKneePitch: number;
}

interface JointPose {
  hipsY: number;
  hipsPitch: number;
  hipsRoll: number;
  torsoPitch: number;
  torsoYaw: number;
  torsoRoll: number;
  headPitch: number;
  headYaw: number;
  headRoll: number;
  leftShoulderPitch: number;
  leftShoulderYaw: number;
  leftShoulderRoll: number;
  leftElbowPitch: number;
  rightShoulderPitch: number;
  rightShoulderYaw: number;
  rightShoulderRoll: number;
  rightElbowPitch: number;
  leftHipPitch: number;
  leftKneePitch: number;
  rightHipPitch: number;
  rightKneePitch: number;
}

const TABLE_BASE = { x: 0.35, z: 0.2 };

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function clamp01(v: number): number {
  return clamp(v, 0, 1);
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Easing C2 (posisi, kecepatan, dan percepatan bernilai nol di ujung 0 & 1) tanpa sentakan awal/akhir. */
function smootherstep(t: number): number {
  const x = clamp01(t);
  return x * x * x * (x * (x * 6 - 15) + 10);
}

function lerpAngle(a: number, b: number, t: number): number {
  let diff = (b - a) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}

function cubicBezierPt(
  p0: { x: number; z: number },
  p1: { x: number; z: number },
  p2: { x: number; z: number },
  p3: { x: number; z: number },
  t: number
): { x: number; z: number; dx: number; dz: number } {
  const u = clamp01(t);
  const omt = 1 - u;
  const omt2 = omt * omt;
  const u2 = u * u;

  const w0 = omt2 * omt;
  const w1 = 3 * omt2 * u;
  const w2 = 3 * omt * u2;
  const w3 = u2 * u;

  const x = w0 * p0.x + w1 * p1.x + w2 * p2.x + w3 * p3.x;
  const z = w0 * p0.z + w1 * p1.z + w2 * p2.z + w3 * p3.z;

  const dx =
    3 * omt2 * (p1.x - p0.x) +
    6 * omt * u * (p2.x - p1.x) +
    3 * u2 * (p3.x - p2.x);
  const dz =
    3 * omt2 * (p1.z - p0.z) +
    6 * omt * u * (p2.z - p1.z) +
    3 * u2 * (p3.z - p2.z);

  return { x, z, dx, dz };
}

function lerpPose(a: JointPose, b: JointPose, t: number): JointPose {
  const u = clamp01(t);
  return {
    hipsY: lerp(a.hipsY, b.hipsY, u),
    hipsPitch: lerp(a.hipsPitch, b.hipsPitch, u),
    hipsRoll: lerp(a.hipsRoll, b.hipsRoll, u),
    torsoPitch: lerp(a.torsoPitch, b.torsoPitch, u),
    torsoYaw: lerp(a.torsoYaw, b.torsoYaw, u),
    torsoRoll: lerp(a.torsoRoll, b.torsoRoll, u),
    headPitch: lerp(a.headPitch, b.headPitch, u),
    headYaw: lerp(a.headYaw, b.headYaw, u),
    headRoll: lerp(a.headRoll, b.headRoll, u),
    leftShoulderPitch: lerp(a.leftShoulderPitch, b.leftShoulderPitch, u),
    leftShoulderYaw: lerp(a.leftShoulderYaw, b.leftShoulderYaw, u),
    leftShoulderRoll: lerp(a.leftShoulderRoll, b.leftShoulderRoll, u),
    leftElbowPitch: lerp(a.leftElbowPitch, b.leftElbowPitch, u),
    rightShoulderPitch: lerp(a.rightShoulderPitch, b.rightShoulderPitch, u),
    rightShoulderYaw: lerp(a.rightShoulderYaw, b.rightShoulderYaw, u),
    rightShoulderRoll: lerp(a.rightShoulderRoll, b.rightShoulderRoll, u),
    rightElbowPitch: lerp(a.rightElbowPitch, b.rightElbowPitch, u),
    leftHipPitch: lerp(a.leftHipPitch, b.leftHipPitch, u),
    leftKneePitch: lerp(a.leftKneePitch, b.leftKneePitch, u),
    rightHipPitch: lerp(a.rightHipPitch, b.rightHipPitch, u),
    rightKneePitch: lerp(a.rightKneePitch, b.rightKneePitch, u),
  };
}

/** Evaluasi kurva Bernstein 5 titik kontrol agar pose sendi mengalir mulus (C-infinity) tanpa melampaui batas lantai/apron. */
function bezier5Pose(p0: JointPose, p1: JointPose, p2: JointPose, p3: JointPose, p4: JointPose, t: number): JointPose {
  const u = clamp01(t);
  const omt = 1 - u;
  const w0 = omt ** 4;
  const w1 = 4 * omt ** 3 * u;
  const w2 = 6 * omt ** 2 * u ** 2;
  const w3 = 4 * omt * u ** 3;
  const w4 = u ** 4;

  const mix = (k: keyof JointPose) =>
    w0 * p0[k] + w1 * p1[k] + w2 * p2[k] + w3 * p3[k] + w4 * p4[k];

  return {
    hipsY: mix("hipsY"),
    hipsPitch: mix("hipsPitch"),
    hipsRoll: mix("hipsRoll"),
    torsoPitch: mix("torsoPitch"),
    torsoYaw: mix("torsoYaw"),
    torsoRoll: mix("torsoRoll"),
    headPitch: mix("headPitch"),
    headYaw: mix("headYaw"),
    headRoll: mix("headRoll"),
    leftShoulderPitch: mix("leftShoulderPitch"),
    leftShoulderYaw: mix("leftShoulderYaw"),
    leftShoulderRoll: mix("leftShoulderRoll"),
    leftElbowPitch: mix("leftElbowPitch"),
    rightShoulderPitch: mix("rightShoulderPitch"),
    rightShoulderYaw: mix("rightShoulderYaw"),
    rightShoulderRoll: mix("rightShoulderRoll"),
    rightElbowPitch: mix("rightElbowPitch"),
    leftHipPitch: mix("leftHipPitch"),
    leftKneePitch: mix("leftKneePitch"),
    rightHipPitch: mix("rightHipPitch"),
    rightKneePitch: mix("rightKneePitch"),
  };
}

/** Evaluasi kurva Bernstein 3 titik kontrol untuk fase keluar (RECOVER). */
function bezier3Pose(p0: JointPose, p1: JointPose, p2: JointPose, t: number): JointPose {
  const u = clamp01(t);
  const omt = 1 - u;
  const w0 = omt * omt;
  const w1 = 2 * omt * u;
  const w2 = u * u;
  const mix = (k: keyof JointPose) => w0 * p0[k] + w1 * p1[k] + w2 * p2[k];

  return {
    hipsY: mix("hipsY"),
    hipsPitch: mix("hipsPitch"),
    hipsRoll: mix("hipsRoll"),
    torsoPitch: mix("torsoPitch"),
    torsoYaw: mix("torsoYaw"),
    torsoRoll: mix("torsoRoll"),
    headPitch: mix("headPitch"),
    headYaw: mix("headYaw"),
    headRoll: mix("headRoll"),
    leftShoulderPitch: mix("leftShoulderPitch"),
    leftShoulderYaw: mix("leftShoulderYaw"),
    leftShoulderRoll: mix("leftShoulderRoll"),
    leftElbowPitch: mix("leftElbowPitch"),
    rightShoulderPitch: mix("rightShoulderPitch"),
    rightShoulderYaw: mix("rightShoulderYaw"),
    rightShoulderRoll: mix("rightShoulderRoll"),
    rightElbowPitch: mix("rightElbowPitch"),
    leftHipPitch: mix("leftHipPitch"),
    leftKneePitch: mix("leftKneePitch"),
    rightHipPitch: mix("rightHipPitch"),
    rightKneePitch: mix("rightKneePitch"),
  };
}

// Pose duduk di kursi: tinggi dudukan 0,52 m; lutut menekuk nyaman tanpa menembus bantalan.
const POSE_SIT: JointPose = {
  hipsY: 0.56,
  hipsPitch: 0,
  hipsRoll: 0,
  torsoPitch: 0.04,
  torsoYaw: 0,
  torsoRoll: 0,
  headPitch: 0.04,
  headYaw: 0.08,
  headRoll: 0,
  leftShoulderPitch: -0.22,
  leftShoulderYaw: 0,
  leftShoulderRoll: 0.08,
  leftElbowPitch: -1.1,
  rightShoulderPitch: -0.22,
  rightShoulderYaw: 0,
  rightShoulderRoll: -0.08,
  rightElbowPitch: -1.1,
  leftHipPitch: -1.5,
  leftKneePitch: 1.5,
  rightHipPitch: -1.5,
  rightKneePitch: 1.5,
};

// Pose waspada saat gelombang P: badan terangkat ringan dan menoleh cepat ke sumber goyangan.
const POSE_ALERT: JointPose = {
  hipsY: 0.59,
  hipsPitch: 0,
  hipsRoll: 0,
  torsoPitch: 0.06,
  torsoYaw: 0.14,
  torsoRoll: 0,
  headPitch: -0.1,
  headYaw: 0.32,
  headRoll: -0.04,
  leftShoulderPitch: -0.46,
  leftShoulderYaw: 0.08,
  leftShoulderRoll: 0.2,
  leftElbowPitch: -1.18,
  rightShoulderPitch: -0.46,
  rightShoulderYaw: -0.08,
  rightShoulderRoll: -0.2,
  rightElbowPitch: -1.18,
  leftHipPitch: -1.35,
  leftKneePitch: 1.38,
  rightHipPitch: -1.35,
  rightKneePitch: 1.38,
};

// Titik kontrol bangun & melangkah rendah menjauhi kursi tanpa melompat tegak kaku.
const POSE_RISE_STEP: JointPose = {
  hipsY: 0.63,
  hipsPitch: 0,
  hipsRoll: 0,
  torsoPitch: 0.38,
  torsoYaw: 0,
  torsoRoll: 0,
  headPitch: -0.14,
  headYaw: 0,
  headRoll: 0,
  leftShoulderPitch: -0.45,
  leftShoulderYaw: 0.1,
  leftShoulderRoll: 0.15,
  leftElbowPitch: -0.82,
  rightShoulderPitch: -0.45,
  rightShoulderYaw: -0.1,
  rightShoulderRoll: -0.15,
  rightElbowPitch: -0.82,
  leftHipPitch: -0.52,
  leftKneePitch: 0.68,
  rightHipPitch: -0.52,
  rightKneePitch: 0.68,
};

// Titik kontrol merunduk rendah saat melintas masuk ke celah depan meja (Drop).
const POSE_CROUCH_GLIDE: JointPose = {
  hipsY: 0.37,
  hipsPitch: 0,
  hipsRoll: 0,
  torsoPitch: 0.8,
  torsoYaw: 0,
  torsoRoll: 0,
  headPitch: 0.05,
  headYaw: 0,
  headRoll: 0,
  leftShoulderPitch: -1.25,
  leftShoulderYaw: 0.18,
  leftShoulderRoll: 0.16,
  leftElbowPitch: -0.95,
  rightShoulderPitch: -1.25,
  rightShoulderYaw: -0.12,
  rightShoulderRoll: -0.14,
  rightElbowPitch: -0.9,
  leftHipPitch: -0.92,
  leftKneePitch: 1.88,
  rightHipPitch: -0.92,
  rightKneePitch: 1.88,
};

// Pose Cover: berlutut di bawah pusat meja, kedua lengan melindungi tengkuk & kepala tanpa menembus rambut/apron.
const POSE_COVER: JointPose = {
  hipsY: 0.22,
  hipsPitch: 0,
  hipsRoll: 0,
  torsoPitch: 1.08,
  torsoYaw: 0,
  torsoRoll: 0,
  headPitch: 0.44,
  headYaw: 0,
  headRoll: 0,
  leftShoulderPitch: -2.28,
  leftShoulderYaw: 0.95,
  leftShoulderRoll: 0.15,
  leftElbowPitch: -2.1,
  rightShoulderPitch: -2.28,
  rightShoulderYaw: -0.95,
  rightShoulderRoll: -0.15,
  rightElbowPitch: -2.1,
  leftHipPitch: -0.9,
  leftKneePitch: 2.4,
  rightHipPitch: -0.9,
  rightKneePitch: 2.4,
};

// Pose Hold On: kepala terlindung di bawah meja tengah, tangan kiri menutup tengkuk, tangan kanan memegang kaki meja depan-kanan.
const POSE_HOLD_ON: JointPose = {
  hipsY: 0.22,
  hipsPitch: 0,
  hipsRoll: 0,
  torsoPitch: 1.06,
  torsoYaw: 0,
  torsoRoll: 0,
  headPitch: 0.46,
  headYaw: -0.04,
  headRoll: 0,
  // Tangan kiri melingkar rapi melindungi bagian belakang kepala & leher (y <= 0,53 m)
  leftShoulderPitch: -2.28,
  leftShoulderYaw: 0.95,
  leftShoulderRoll: 0.15,
  leftElbowPitch: -2.1,
  // Tangan kanan terjulur ke depan menyentuh batang kaki depan-kanan meja (Hold On)
  rightShoulderPitch: -2.14,
  rightShoulderYaw: 0.42,
  rightShoulderRoll: -0.02,
  rightElbowPitch: -0.45,
  leftHipPitch: -0.9,
  leftKneePitch: 2.4,
  rightHipPitch: -0.9,
  rightKneePitch: 2.4,
};

// Pose berdiri tegak & tenang setelah keluar dari bawah meja.
const POSE_STAND: JointPose = {
  hipsY: 0.78,
  hipsPitch: 0,
  hipsRoll: 0,
  torsoPitch: 0.04,
  torsoYaw: 0,
  torsoRoll: 0,
  headPitch: 0.04,
  headYaw: 0,
  headRoll: 0,
  leftShoulderPitch: 0.05,
  leftShoulderYaw: 0,
  leftShoulderRoll: 0.1,
  leftElbowPitch: -0.2,
  rightShoulderPitch: 0.05,
  rightShoulderYaw: 0,
  rightShoulderRoll: -0.1,
  rightElbowPitch: -0.2,
  leftHipPitch: -0.04,
  leftKneePitch: 0.08,
  rightHipPitch: -0.04,
  rightKneePitch: 0.08,
};

/**
 * Menghitung penanda waktu transisi aksi karakter yang deterministik dari `profile.timeline`.
 * Memberi rentang gerak kontinu `1,3–1,7 dtk` sehingga langkah turun-berlindung mengalir wajar tanpa tergesa-gesa.
 */
export function computeCharacterTiming(profile: VibrationProfile) {
  const tl = profile.timeline;
  const urgency = clamp01((profile.level - 2) / 8);

  const alertDur = lerp(CHARACTER_CONFIG.alertMaxSec, CHARACTER_CONFIG.alertMinSec, urgency);
  const dropDur = lerp(CHARACTER_CONFIG.dropMaxSec, CHARACTER_CONFIG.dropMinSec, urgency);
  const coverDur = CHARACTER_CONFIG.coverDurationSec;

  const alertStart = 0.02;
  const dropStart = Math.min(tl.sStartSec * 0.35, alertStart + alertDur);
  const coverStart = dropStart + dropDur;
  const holdStart = coverStart + coverDur;
  const decaySpan = Math.max(0.5, tl.durationSec - tl.sEndSec);
  const recoverStart = Math.max(
    holdStart + 0.45,
    tl.sEndSec + decaySpan * CHARACTER_CONFIG.recoverStartDecayFraction
  );

  return {
    alertStart,
    dropStart,
    coverStart,
    holdStart,
    recoverStart,
    endSec: tl.durationSec,
    urgency,
  };
}

/**
 * Menghasilkan status lengkap dan pose deterministik karakter pada waktu animasi `elapsedSec`.
 */
export function sampleCharacterState(
  elapsedSec: number,
  sample: VibrationFrameSample,
  profile: VibrationProfile,
  options?: CharacterSimOptions
): CharacterFrameState {
  const minMmi = options?.minMmiForShelter ?? CHARACTER_CONFIG.defaultMinMmiForShelter;
  const shouldTakeCover = profile.level >= minMmi;
  const wp = CHARACTER_CONFIG.waypoints;
  const timing = computeCharacterTiming(profile);

  const t = clamp(elapsedSec, 0, profile.durationSec);
  const idleClock = options?.idleClockSec ?? 0;
  const ampScale = profile.reducedMotion ? 0.35 : 1;

  // Posisi kursi saat duduk
  const seatX = wp.seat.x + sample.furnitureOffsetX;
  const seatZ = wp.seat.z + sample.furnitureOffsetZ;
  const seatYaw = wp.seat.yaw + sample.furnitureYaw;

  // Posisi berlindung di bawah meja selalu terikat dengan `tableOffsetX` agar tidak melayang saat meja bergeser.
  const underX = TABLE_BASE.x + sample.tableOffsetX + wp.underTableRel.x;
  const underZ = TABLE_BASE.z + wp.underTableRel.z;
  const underYaw = wp.underTableRel.yaw;

  // ---------- 1. IDLE (sebelum gempa / belum diputar) ----------
  const idleBreath = Math.sin(idleClock * 2.1) * 0.015 * ampScale;
  const idleGlance = Math.sin(idleClock * 0.75) * 0.14 * ampScale;

  if (sample.phase === "idle" || t <= timing.alertStart) {
    return {
      actionPhase: "IDLE",
      sheltering: false,
      shouldTakeCover,
      tableTopOpacity: 1,
      hazardHighlightOpacity: 0,
      rootPosition: { x: seatX, y: 0, z: seatZ },
      rootYaw: seatYaw,
      ...POSE_SIT,
      hipsY: POSE_SIT.hipsY + idleBreath * 0.2,
      torsoPitch: POSE_SIT.torsoPitch + idleBreath,
      headYaw: POSE_SIT.headYaw + idleGlance,
    };
  }

  // ---------- 2. OPSI MMI RENDAH (hanya menyadari getaran bila ambang MMI dinaikkan) ----------
  if (!shouldTakeCover) {
    const alertOut =
      sample.phase === "done"
        ? 1
        : sample.phase === "decay"
          ? smootherstep((t - profile.timeline.sEndSec) / Math.max(0.4, timing.endSec - profile.timeline.sEndSec))
          : 0;
    const lookSweep = Math.sin(t * 2.4) * 0.38 * (1 - alertOut) * ampScale;
    const pose = lerpPose(POSE_ALERT, POSE_SIT, alertOut);
    const phase: CharacterActionPhase = sample.phase === "done" || alertOut > 0.75 ? "RECOVER" : "ALERT";

    return {
      actionPhase: phase,
      sheltering: false,
      shouldTakeCover,
      tableTopOpacity: 1,
      hazardHighlightOpacity: 0,
      rootPosition: { x: seatX, y: 0, z: seatZ },
      rootYaw: seatYaw,
      ...pose,
      headYaw: pose.headYaw + lookSweep,
      torsoRoll: (sample.roomOffsetX / 0.065) * 0.08 * ampScale,
    };
  }

  // ---------- 3. ALERT: gelombang P tiba, menoleh halus tanpa snap awal ----------
  if (t < timing.dropStart) {
    const u = smootherstep((t - timing.alertStart) / Math.max(0.15, timing.dropStart - timing.alertStart));
    const look = Math.sin(u * Math.PI * 1.3) * 0.36 * ampScale;
    const pose = lerpPose(POSE_SIT, POSE_ALERT, u);
    // Redam sisa napas idle secara mulus di awal ALERT
    const idleFade = 1 - u;
    pose.hipsY += idleBreath * 0.2 * idleFade;
    pose.torsoPitch += idleBreath * idleFade;
    pose.headYaw += idleGlance * idleFade + look;

    return {
      actionPhase: "ALERT",
      sheltering: false,
      shouldTakeCover,
      tableTopOpacity: 1,
      hazardHighlightOpacity: 0.22 * u,
      rootPosition: { x: seatX, y: 0, z: seatZ },
      rootYaw: seatYaw,
      ...pose,
    };
  }

  // ---------- 4 & 5. DROP -> COVER: SATU GERAK KONTINU (Cubic Bezier + Bernstein Pose) ----------
  if (t < timing.holdStart) {
    const totalMoveDur = Math.max(0.4, timing.holdStart - timing.dropStart);
    const linearMoveU = clamp01((t - timing.dropStart) / totalMoveDur);
    // Kombinasi sinusoidal & smootherstep menjaga kelancaran kecepatan tanpa menunda terlalu lama di awal gerak
    const sineEase = 0.5 * (1 - Math.cos(Math.PI * linearMoveU));
    const moveU = lerp(sineEase, smootherstep(linearMoveU), 0.35);
    const actionPhase: CharacterActionPhase = t < timing.coverStart ? "DROP" : "COVER";

    // Jalur lantai mulus berbentuk huruf-S lembut dari kursi ke bawah meja tanpa sudut tajam
    const pathPt = cubicBezierPt(
      { x: seatX, z: seatZ },
      wp.standCtrl1,
      wp.standCtrl2,
      { x: underX, z: underZ },
      moveU
    );

    const tangentYaw = Math.atan2(pathPt.dx, pathPt.dz);
    const speedBlend = Math.sin(Math.PI * moveU);
    let rootYaw = lerpAngle(seatYaw, tangentYaw, clamp01(moveU * 2.4));
    rootYaw = lerpAngle(rootYaw, underYaw, smootherstep((moveU - 0.52) / 0.48));

    // Pada 30% akhir gerak, tangan kanan mulai bersiap menuju kaki meja sehingga transisi ke HOLD_ON tak terasa terputus
    const preGrip = smootherstep((moveU - 0.68) / 0.32);
    const endTargetPose = lerpPose(POSE_COVER, POSE_HOLD_ON, preGrip * 0.55);

    const pose = bezier5Pose(
      POSE_ALERT,
      POSE_RISE_STEP,
      POSE_CROUCH_GLIDE,
      lerpPose(POSE_CROUCH_GLIDE, POSE_COVER, 0.72),
      endTargetPose,
      moveU
    );

    // Siklus ayunan langkah kaki & lengan halus saat melangkah menuju bawah meja
    const walkWeight = speedBlend * speedBlend * (1 - smootherstep((moveU - 0.58) / 0.35));
    const stride = Math.sin(moveU * Math.PI * 2.5) * 0.42 * walkWeight;
    const kneeLift = Math.max(0, Math.sin(moveU * Math.PI * 2.5)) * 0.3 * walkWeight;
    const oppKneeLift = Math.max(0, -Math.sin(moveU * Math.PI * 2.5)) * 0.3 * walkWeight;

    pose.leftHipPitch += stride;
    pose.rightHipPitch -= stride;
    pose.leftKneePitch += kneeLift;
    pose.rightKneePitch += oppKneeLift;
    pose.leftShoulderPitch -= stride * 0.35;
    pose.rightShoulderPitch += stride * 0.35;
    // Sedikit ayunan badan alami saat melangkah
    pose.hipsRoll += Math.sin(moveU * Math.PI * 2.5) * 0.04 * walkWeight;

    const tableOpacity = lerp(1, CHARACTER_CONFIG.tableTopShelterOpacity, smootherstep((moveU - 0.48) / 0.32));

    return {
      actionPhase,
      sheltering: actionPhase === "COVER",
      shouldTakeCover,
      tableTopOpacity: tableOpacity,
      hazardHighlightOpacity: 0.22,
      rootPosition: { x: pathPt.x, y: 0, z: pathPt.z },
      rootYaw,
      ...pose,
    };
  }

  // ---------- 6. HOLD_ON: tangan kanan meluncur mulus meraih kaki meja & berpegangan mengikuti guncangan ----------
  if (t < timing.recoverStart && sample.phase !== "done") {
    const startHoldPose = lerpPose(POSE_COVER, POSE_HOLD_ON, 0.55);
    const gripBlend = smootherstep((t - timing.holdStart) / 0.38);
    const pose = lerpPose(startHoldPose, POSE_HOLD_ON, gripBlend);

    // Getaran sekunder tubuh mengikuti intensitas MMI + usaha menjaga keseimbangan saat guncangan kuat
    const shakeFactor = (0.25 + 0.75 * profile.intensity01) * (0.2 + sample.envelopeS) * ampScale;
    const freq = profile.sFreqHz * 2 * Math.PI;
    const swayRoll = Math.sin(freq * t + 0.5) * 0.075 * shakeFactor;
    const swayPitch = Math.sin(freq * 1.35 * t + 1.1) * 0.055 * shakeFactor;
    const braceBounce = Math.abs(Math.sin(freq * 1.1 * t)) * 0.01 * shakeFactor;

    return {
      actionPhase: "HOLD_ON",
      sheltering: true,
      shouldTakeCover,
      tableTopOpacity: CHARACTER_CONFIG.tableTopShelterOpacity,
      hazardHighlightOpacity: 0.22,
      rootPosition: { x: underX, y: 0, z: underZ },
      rootYaw: underYaw,
      ...pose,
      hipsY: pose.hipsY - braceBounce,
      hipsRoll: pose.hipsRoll + swayRoll * 0.65,
      torsoRoll: pose.torsoRoll + swayRoll,
      torsoPitch: pose.torsoPitch + swayPitch,
      headPitch: pose.headPitch + swayPitch * 0.45,
      headRoll: pose.headRoll - swayRoll * 0.35,
    };
  }

  // ---------- 7. RECOVER: SATU GERAK KONTINU KELUAR DARI BAWAH MEJA SAMPAI BERDIRI TENANG ----------
  const recSpan = Math.max(0.75, timing.endSec - timing.recoverStart);
  const rawU = sample.phase === "done" ? 1 : clamp01((t - timing.recoverStart) / (recSpan * 0.88));
  const recU = smootherstep(rawU);

  const recPt = cubicBezierPt(
    { x: underX, z: underZ },
    wp.recoverCtrl1,
    wp.recoverCtrl2,
    { x: wp.recoverStand.x, z: wp.recoverStand.z },
    recU
  );

  // Putar tubuh menghadap depan ruangan (+Z) secara mulus selama keluar agar tidak menghadap kursi di kiri
  const rootYaw = lerpAngle(underYaw, wp.recoverStand.yaw, smootherstep(recU));

  const pose = bezier3Pose(POSE_HOLD_ON, POSE_CROUCH_GLIDE, POSE_STAND, recU);

  const recWalkWeight = Math.sin(Math.PI * recU) ** 2 * smootherstep((recU - 0.35) / 0.35);
  const recStride = Math.sin(recU * Math.PI * 2.2) * 0.34 * recWalkWeight;
  pose.leftHipPitch += recStride;
  pose.rightHipPitch -= recStride;
  pose.leftShoulderPitch -= recStride * 0.3;
  pose.rightShoulderPitch += recStride * 0.3;

  const lookAround = Math.sin(smootherstep((rawU - 0.55) / 0.45) * Math.PI * 1.2) * 0.38 * ampScale;
  pose.headYaw += lookAround;

  const tableOpacity = lerp(CHARACTER_CONFIG.tableTopShelterOpacity, 1, smootherstep(recU / 0.48));

  return {
    actionPhase: "RECOVER",
    sheltering: false,
    shouldTakeCover,
    tableTopOpacity: tableOpacity,
    hazardHighlightOpacity: 0.22 * (1 - recU),
    rootPosition: { x: recPt.x, y: 0, z: recPt.z },
    rootYaw,
    ...pose,
  };
}
