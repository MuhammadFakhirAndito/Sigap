import { MMI_SCALE_INFO } from "@/lib/simulasi";

/**
 * Animasi "Getaran 3D" adalah ILUSTRASI SIGAP, bukan simulasi fisika struktur.
 * Semua fungsi di sini murni dan deterministik (seed tetap, tanpa Math.random):
 * MMI yang sama selalu menghasilkan gerakan yang sama, sehingga bisa diuji dan diputar ulang.
 * MMI dari halaman tetap satu-satunya sumber kebenaran intensitas; tP/tS hanya dipakai
 * untuk mengatur jeda gelombang P ke S di lini waktu animasi.
 */

export type MmiBandKey = "I-II" | "III-IV" | "V-VI" | "VII-VIII" | "IX-XII";

/** Batas atas amplitudo agar animasi tidak menyebabkan ketidaknyamanan visual. */
export const MAX_SAFE_ROOM_AMPLITUDE = 0.065;
export const MAX_SAFE_LAMP_SWAY_RAD = 0.32;
/** Getaran P dominan vertikal dan selalu jauh lebih kecil dari guncangan S. */
export const MAX_P_VERTICAL_AMPLITUDE = MAX_SAFE_ROOM_AMPLITUDE * 0.35;
export const MAX_CAMERA_SHAKE = 0.012;

/** Jeda P ke S asli dipercepat dengan faktor ini, lalu dibatasi min/maks agar tetap terlihat dan tidak membosankan. */
export const P_S_GAP_COMPRESSION = 3;
export const P_S_GAP_MIN_SEC = 1.2;
export const P_S_GAP_MAX_SEC = 5;
/** Dipakai bila halaman belum mengirim tP/tS (mis. dalam tes). */
const DEFAULT_GOLDEN_TIME_SEC = 6;

/** Jumlah benda per kelompok dalam adegan; scene memakai angka yang sama. */
export const SHELF_BOOK_COUNT = 6;

export const REDUCED_MOTION_AMPLITUDE_FACTOR = 0.2;
export const REDUCED_MOTION_FREQUENCY_FACTOR = 0.45;

const FALL_DURATION_SEC = 0.7;

export type VibrationPhase = "idle" | "p_wave" | "gap" | "s_wave" | "decay" | "done";

export interface VibrationTimeline {
  /** Akhir hentakan P (detik animasi). P mulai di 0. */
  pEndSec: number;
  /** Datangnya gelombang S (detik animasi) = jeda P ke S yang dipadatkan. */
  sStartSec: number;
  sEndSec: number;
  durationSec: number;
  /** Jeda P ke S di animasi (sudah dipadatkan). */
  compressedGapSec: number;
}

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
  /** Rincian gerak objek pada adegan (diturunkan dari efek yang benar-benar aktif). */
  illustrativeEffectDescription: string;
  /** 0 (MMI I) sampai 1 (MMI XII), naik kontinu. */
  intensity01: number;
  roomAmplitude: number;
  pVerticalAmplitude: number;
  sFreqHz: number;
  pFreqHz: number;
  lampSwayRad: number;
  lampFreqHz: number;
  plantSwayRad: number;
  glassSlideMax: number;
  glassFall: boolean;
  plateFall: boolean;
  /** Jumlah buku (0..SHELF_BOOK_COUNT) yang jatuh dari rak. */
  shelfDropCount: number;
  frameTiltMaxRad: number;
  frameFall: boolean;
  clockFall: boolean;
  furnitureSlideMax: number;
  /** Opasitas akhir retakan dinding (0 di bawah MMI VIII). */
  crackOpacity: number;
  /** Banyak debu dari langit-langit 0..1 (0 di bawah MMI IX). */
  dustAmount: number;
  cameraShake: number;
  timeline: VibrationTimeline;
  /** Nilai asli dari halaman, untuk label lini waktu "dipercepat". */
  real: { tpSeconds: number; tsSeconds: number; goldenTimeSeconds: number };
  durationSec: number;
  seed: number;
  reducedMotion: boolean;
  reducedMotionNotice: string | null;
}

export interface VibrationFrameSample {
  phase: VibrationPhase;
  envelopeP: number;
  envelopeS: number;
  /** Selubung gabungan 0..1 (untuk HUD dan seismogram). */
  envelope: number;
  roomOffsetX: number;
  roomOffsetY: number;
  roomOffsetZ: number;
  lampAngleX: number;
  lampAngleZ: number;
  plantSway: number;
  frameTilt: number;
  frameFall: number;
  clockTilt: number;
  clockFall: number;
  glassOffsetX: number;
  glassFall: number;
  plateOffsetX: number;
  plateFall: number;
  bookJitter: number;
  /** Progres jatuh 0..1 per buku, panjang SHELF_BOOK_COUNT. */
  bookFall: number[];
  furnitureOffsetX: number;
  furnitureOffsetZ: number;
  furnitureYaw: number;
  tableOffsetX: number;
  crackOpacity: number;
  dustAmount: number;
  cameraShakeX: number;
  cameraShakeY: number;
  /** Sinyal tanah ternormalisasi -1..1 untuk seismogram. */
  seismo: number;
}

// ---------- Utilitas murni ----------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function smoothstep(t: number): number {
  const x = clamp01(t);
  return x * x * (3 - 2 * x);
}

/** PRNG mulberry32: deterministik untuk seed yang sama. */
export function createSeededRandom(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash1(i: number, seed: number): number {
  let h = Math.imul(i ^ seed, 0x27d4eb2d);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h ^= h >>> 13;
  return ((h >>> 0) / 4294967295) * 2 - 1;
}

/** Value noise 1D halus dalam rentang [-1, 1]. */
export function valueNoise1D(x: number, seed: number): number {
  const i = Math.floor(x);
  const f = x - i;
  const u = f * f * (3 - 2 * f);
  return hash1(i, seed) * (1 - u) + hash1(i + 1, seed) * u;
}

/** Tinggi relatif benda jatuh (1 = posisi awal, 0 = lantai), dengan satu pantulan kecil. */
export function fallHeight(progress: number): number {
  const p = clamp01(progress);
  if (p < 0.7) {
    const q = p / 0.7;
    return 1 - q * q;
  }
  return 0.12 * Math.sin((Math.PI * (p - 0.7)) / 0.3);
}

/** Jarak gelinding ternormalisasi setelah menyentuh lantai (0..1, melambat). */
export function rollDistance(progress: number): number {
  const p = clamp01((progress - 0.7) / 0.3);
  return 1 - (1 - p) * (1 - p);
}

// ---------- Profil per MMI ----------

function bandFor(level: number): MmiBandKey {
  if (level <= 2) return "I-II";
  if (level <= 4) return "III-IV";
  if (level <= 6) return "V-VI";
  if (level <= 8) return "VII-VIII";
  return "IX-XII";
}

const BAND_TITLES: Record<MmiBandKey, string> = {
  "I-II": "Ruangan nyaris diam, lampu gantung berayun samar",
  "III-IV": "Benda ringan bergeser dan lampu berayun",
  "V-VI": "Benda mulai berjatuhan dari rak dan meja",
  "VII-VIII": "Perabot bergeser dan banyak benda berjatuhan",
  "IX-XII": "Guncangan sangat kuat di dalam ruangan",
};

function describeEffects(p: Omit<VibrationProfile, "illustrativeEffectDescription">): string {
  const parts: string[] = ["lampu gantung berayun"];
  if (p.glassSlideMax > 0 && !p.glassFall) parts.push("gelas di meja bergeser");
  if (p.shelfDropCount > 0) parts.push(`${p.shelfDropCount} dari ${SHELF_BOOK_COUNT} buku jatuh dari rak`);
  if (p.glassFall) parts.push(p.plateFall ? "gelas dan piring jatuh dari meja" : "gelas jatuh dari meja");
  if (p.frameFall) parts.push("bingkai foto jatuh");
  else if (p.frameTiltMaxRad > 0.02) parts.push("bingkai foto miring");
  if (p.clockFall) parts.push("jam dinding jatuh");
  if (p.furnitureSlideMax > 0) parts.push("kursi dan meja bergeser");
  if (p.crackOpacity > 0) parts.push("retakan halus muncul di dinding");
  if (p.dustAmount > 0) parts.push("debu jatuh dari langit-langit");
  const text = parts.join(", ");
  return `${text.charAt(0).toUpperCase()}${text.slice(1)}. Ilustrasi, bukan simulasi kekuatan bangunan.`;
}

/** Membentuk profil animasi untuk MMI I–XII. Semua besaran naik bertahap, tetap di bawah batas aman. */
export function getVibrationProfileForMmi(
  mmiLevel: number,
  options?: { reducedMotion?: boolean; tpSeconds?: number; tsSeconds?: number }
): VibrationProfile {
  const level = clamp(Math.round(mmiLevel), 1, 12);
  const info = MMI_SCALE_INFO[level - 1] ?? MMI_SCALE_INFO[0]!;
  const reducedMotion = Boolean(options?.reducedMotion);
  const ampScale = reducedMotion ? REDUCED_MOTION_AMPLITUDE_FACTOR : 1;
  const freqScale = reducedMotion ? REDUCED_MOTION_FREQUENCY_FACTOR : 1;

  const t = (level - 1) / 11;

  // Lini waktu: P mulai di 0; jeda P ke S asli dipercepat lalu dibatasi.
  const tp = options?.tpSeconds;
  const ts = options?.tsSeconds;
  const hasTiming = typeof tp === "number" && typeof ts === "number" && ts >= tp && tp >= 0;
  const golden = hasTiming ? ts - tp : DEFAULT_GOLDEN_TIME_SEC;
  const gap = clamp(golden / P_S_GAP_COMPRESSION, P_S_GAP_MIN_SEC, P_S_GAP_MAX_SEC);
  const pEnd = clamp(gap * 0.5, 0.5, 1.6);
  const sDur = 3 + 4 * t;
  const decayDur = 2 + 2 * t;
  const sStart = gap;
  const sEnd = sStart + sDur;
  const duration = sEnd + decayDur;

  const shelfDropCount = level < 5 ? 0 : clamp(Math.round((level - 4) * 0.75), 0, SHELF_BOOK_COUNT);

  const base: Omit<VibrationProfile, "illustrativeEffectDescription"> = {
    level,
    roman: info.roman,
    band: bandFor(level),
    bmkgLabel: info.label,
    bmkgQuote: info.description,
    illustrativeEffectTitle: BAND_TITLES[bandFor(level)],
    intensity01: t,
    roomAmplitude: Math.min(MAX_SAFE_ROOM_AMPLITUDE, MAX_SAFE_ROOM_AMPLITUDE * Math.pow(t, 1.6) * ampScale),
    pVerticalAmplitude: Math.min(
      MAX_P_VERTICAL_AMPLITUDE,
      MAX_P_VERTICAL_AMPLITUDE * Math.pow(t, 1.3) * ampScale
    ),
    sFreqHz: (1.4 + 1.2 * t) * freqScale,
    pFreqHz: 8 * freqScale,
    lampSwayRad: Math.min(MAX_SAFE_LAMP_SWAY_RAD, (0.01 + (MAX_SAFE_LAMP_SWAY_RAD - 0.01) * Math.pow(t, 1.2)) * ampScale),
    lampFreqHz: 0.9 * (reducedMotion ? 0.8 : 1),
    plantSwayRad: (0.02 + 0.18 * t) * ampScale,
    glassSlideMax: level >= 3 ? (0.04 + 0.16 * clamp01((level - 3) / 4)) * (reducedMotion ? 0.5 : 1) : 0,
    glassFall: level >= 6,
    plateFall: level >= 7,
    shelfDropCount,
    frameTiltMaxRad: level >= 4 ? (0.03 + 0.17 * clamp01((level - 4) / 6)) * ampScale : 0,
    frameFall: level >= 8,
    clockFall: level >= 10,
    furnitureSlideMax: level >= 5 ? (0.02 + 0.14 * clamp01((level - 5) / 7)) * (reducedMotion ? 0.35 : 1) : 0,
    crackOpacity: level >= 8 ? (level - 7) / 5 : 0,
    dustAmount: level >= 9 ? ((level - 8) / 4) * (reducedMotion ? 0.3 : 1) : 0,
    cameraShake: reducedMotion ? 0 : MAX_CAMERA_SHAKE * Math.pow(t, 1.4),
    timeline: { pEndSec: pEnd, sStartSec: sStart, sEndSec: sEnd, durationSec: duration, compressedGapSec: gap },
    real: hasTiming
      ? { tpSeconds: tp, tsSeconds: ts, goldenTimeSeconds: golden }
      : { tpSeconds: 0, tsSeconds: DEFAULT_GOLDEN_TIME_SEC, goldenTimeSeconds: DEFAULT_GOLDEN_TIME_SEC },
    durationSec: duration,
    seed: level * 7919 + 17,
    reducedMotion,
    reducedMotionNotice: reducedMotion
      ? "Mode gerakan dikurangi aktif (prefers-reduced-motion): amplitudo dan frekuensi animasi diturunkan."
      : null,
  };

  return { ...base, illustrativeEffectDescription: describeEffects(base) };
}

// ---------- Sampel per bingkai ----------

/** Selubung gelombang P: hentakan cepat lalu getar sisa yang meluruh, hilang setelah S datang. */
function envelopeP(t: number, tl: VibrationTimeline): number {
  if (t <= 0) return 0;
  const attack = smoothstep(t / 0.08);
  const body = 0.3 + 0.7 * Math.exp(-t / Math.max(0.2, tl.pEndSec * 0.6));
  const fadeAfterS = 1 - smoothstep((t - tl.sStartSec) / 0.5);
  const tail = t < tl.pEndSec ? 1 : 0.35 + 0.65 * Math.exp(-(t - tl.pEndSec) / 0.6);
  return clamp01(attack * body * tail * fadeAfterS);
}

/** Selubung gelombang S: naik ~0,6 s, bertahan, lalu meluruh halus (cosinus) sampai diam. */
function envelopeS(t: number, tl: VibrationTimeline): number {
  if (t < tl.sStartSec) return 0;
  if (t < tl.sEndSec) return smoothstep((t - tl.sStartSec) / 0.6);
  const u = clamp01((t - tl.sEndSec) / (tl.durationSec - tl.sEndSec));
  return 0.5 * (1 + Math.cos(u * Math.PI));
}

function phaseAt(t: number, tl: VibrationTimeline): VibrationPhase {
  if (t <= 0) return "idle";
  if (t >= tl.durationSec) return "done";
  if (t < tl.pEndSec) return "p_wave";
  if (t < tl.sStartSec) return "gap";
  if (t < tl.sEndSec) return "s_wave";
  return "decay";
}

/** Gabungan tiga sinus + noise, bobot total 1 sehingga |hasil| <= 1. */
function organic(t: number, f: number, phase: number, seed: number): number {
  return (
    0.45 * Math.sin(2 * Math.PI * f * t + phase) +
    0.3 * Math.sin(2 * Math.PI * f * 1.73 * t + phase * 1.9) +
    0.25 * valueNoise1D(t * f * 2.6, seed)
  );
}

/** Waktu mulai jatuh tiap benda, tersebar di fase S dengan jitter ber-seed. */
export function fallStartTimes(profile: VibrationProfile): {
  books: number[];
  glass: number;
  plate: number;
  frame: number;
  clock: number;
} {
  const rand = createSeededRandom(profile.seed);
  const { sStartSec, sEndSec } = profile.timeline;
  const span = sEndSec - sStartSec;
  const at = (fraction: number) => sStartSec + span * clamp01(fraction + (rand() - 0.5) * 0.08);
  const books = Array.from({ length: SHELF_BOOK_COUNT }, (_, i) =>
    i < profile.shelfDropCount ? at(0.15 + (0.7 * i) / Math.max(1, profile.shelfDropCount)) : Infinity
  );
  return {
    books,
    glass: profile.glassFall ? at(0.3) : Infinity,
    plate: profile.plateFall ? at(0.42) : Infinity,
    frame: profile.frameFall ? at(0.55) : Infinity,
    clock: profile.clockFall ? at(0.7) : Infinity,
  };
}

function fallProgressAt(t: number, start: number): number {
  return Number.isFinite(start) ? clamp01((t - start) / FALL_DURATION_SEC) : 0;
}

/** Posisi & rotasi tiap objek pada waktu animasi t (detik). Setelah selesai, benda yang jatuh tetap di lantai. */
export function sampleVibrationFrame(elapsedSec: number, profile: VibrationProfile): VibrationFrameSample {
  const tl = profile.timeline;
  const t = clamp(elapsedSec, 0, tl.durationSec);
  const phase = phaseAt(elapsedSec, tl);
  const seed = profile.seed;
  const moving = phase !== "idle" && phase !== "done";

  const eP = moving ? envelopeP(t, tl) : 0;
  const eS = moving ? envelopeS(t, tl) : 0;

  // P: dominan vertikal, cepat. S: dominan horizontal, menggulung (x dan z berbeda frekuensi).
  const pSignal = organic(t, profile.pFreqHz, 0.7, seed + 1);
  const roomOffsetY = clamp(eP * profile.pVerticalAmplitude * pSignal, -MAX_P_VERTICAL_AMPLITUDE, MAX_P_VERTICAL_AMPLITUDE);
  const roomOffsetX = clamp(
    eS * profile.roomAmplitude * organic(t, profile.sFreqHz, 0.3, seed + 2) +
      eP * profile.pVerticalAmplitude * 0.2 * pSignal,
    -MAX_SAFE_ROOM_AMPLITUDE,
    MAX_SAFE_ROOM_AMPLITUDE
  );
  const roomOffsetZ = clamp(
    eS * profile.roomAmplitude * 0.7 * organic(t, profile.sFreqHz * 0.83, 1.4, seed + 3),
    -MAX_SAFE_ROOM_AMPLITUDE,
    MAX_SAFE_ROOM_AMPLITUDE
  );

  // Lampu: bandul yang ikut terdorong lalu meluruh lebih lambat dari tanah.
  const lampTail = phase === "decay" ? 0.6 * Math.exp(-(t - tl.sEndSec) / (tl.durationSec - tl.sEndSec)) : 0;
  const lampEndFade = 1 - smoothstep((t - tl.durationSec + 0.6) / 0.6);
  const lampEnv = moving ? Math.max(eS, eP * 0.3, lampTail) * lampEndFade : 0;
  const omegaLamp = 2 * Math.PI * profile.lampFreqHz;
  const lampAngleZ = clamp(lampEnv * profile.lampSwayRad * Math.sin(omegaLamp * t), -MAX_SAFE_LAMP_SWAY_RAD, MAX_SAFE_LAMP_SWAY_RAD);
  const lampAngleX = clamp(lampEnv * profile.lampSwayRad * 0.45 * Math.sin(omegaLamp * 0.81 * t + 1.1), -MAX_SAFE_LAMP_SWAY_RAD, MAX_SAFE_LAMP_SWAY_RAD);

  const plantSway = (eS + eP * 0.3) * profile.plantSwayRad * Math.sin(2 * Math.PI * 1.3 * t + 0.4);

  const sProgress = smoothstep((t - tl.sStartSec) / (tl.sEndSec - tl.sStartSec));
  const shake = eS + eP * 0.5;

  const falls = fallStartTimes(profile);
  const frameFall = fallProgressAt(t, falls.frame);
  const clockFall = fallProgressAt(t, falls.clock);
  const glassFall = fallProgressAt(t, falls.glass);
  const plateFall = fallProgressAt(t, falls.plate);
  const bookFall = falls.books.map((start) => fallProgressAt(t, start));

  const frameTilt =
    profile.frameTiltMaxRad * (0.5 * sProgress + 0.5 * shake * Math.sin(2 * Math.PI * 1.1 * t));
  const clockTilt =
    profile.frameTiltMaxRad * 0.7 * (0.4 * sProgress + 0.6 * shake * Math.sin(2 * Math.PI * 0.95 * t + 0.8));

  const jitter = shake * 0.006 * Math.sin(2 * Math.PI * profile.sFreqHz * 1.3 * t);
  const furnitureJitter = moving ? shake * Math.min(0.015, profile.furnitureSlideMax * 0.3) * Math.sin(2 * Math.PI * profile.sFreqHz * 0.9 * t) : 0;

  const crackOpacity = profile.crackOpacity * smoothstep((t - tl.sStartSec) / ((tl.sEndSec - tl.sStartSec) * 0.6));
  const dustAmount = moving ? profile.dustAmount * eS : 0;

  const cameraShakeX = profile.cameraShake * shake * valueNoise1D(t * 9, seed + 7);
  const cameraShakeY = profile.cameraShake * shake * 0.6 * valueNoise1D(t * 11, seed + 8);

  return {
    phase,
    envelopeP: eP,
    envelopeS: eS,
    envelope: Math.max(eS, eP * 0.35),
    roomOffsetX,
    roomOffsetY,
    roomOffsetZ,
    lampAngleX,
    lampAngleZ,
    plantSway,
    // Setelah selesai (shake = 0, sProgress = 1) bingkai dan jam tetap miring di posisi akhirnya.
    frameTilt: phase === "idle" ? 0 : frameTilt,
    frameFall,
    clockTilt: phase === "idle" ? 0 : clockTilt,
    clockFall,
    glassOffsetX: profile.glassSlideMax * sProgress + (moving ? jitter : 0),
    glassFall,
    plateOffsetX: profile.glassSlideMax * 0.6 * sProgress + (moving ? jitter * 0.8 : 0),
    plateFall,
    bookJitter: moving ? jitter : 0,
    bookFall,
    furnitureOffsetX: profile.furnitureSlideMax * sProgress + furnitureJitter,
    furnitureOffsetZ: profile.furnitureSlideMax * 0.4 * sProgress,
    furnitureYaw: profile.furnitureSlideMax * 0.8 * sProgress,
    tableOffsetX: profile.furnitureSlideMax * 0.45 * sProgress + furnitureJitter * 0.5,
    crackOpacity,
    dustAmount,
    cameraShakeX: moving ? cameraShakeX : 0,
    cameraShakeY: moving ? cameraShakeY : 0,
    seismo: clamp((roomOffsetX + roomOffsetY * 1.5) / MAX_SAFE_ROOM_AMPLITUDE, -1, 1),
  };
}
