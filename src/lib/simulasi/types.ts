export type TipeLokasiSimulasi = "DARAT" | "LAUT";

export interface SimulasiInput {
  magnitudo: number;
  kedalamanKm: number;
  lat: number;
  lon: number;
  jarakPengamatKm: number;
  tipeLokasi: TipeLokasiSimulasi;
  wilayah?: string;
}

export type SimulasiNumericField =
  | "magnitudo"
  | "kedalamanKm"
  | "lat"
  | "lon"
  | "jarakPengamatKm";

export type SimulasiValidationErrors = Partial<Record<SimulasiNumericField, string>>;

export type RadiusEstimateStatus =
  | "in_range"
  | "beyond_300"
  | "out_of_mag_calibration"
  | "not_reached";

export interface RadiusEstimate {
  status: RadiusEstimateStatus;
  radiusKm: number | null;
  displayText: string;
}

export interface MmiScaleLevelInfo {
  level: number;
  roman: string;
  label: string;
  description: string;
}

export interface MmiResult {
  raw: number;
  clampedLevel: number;
  roman: string;
  label: string;
  description: string;
  outsideMagRange: boolean;
  outsideDistRange: boolean;
  calibrationNotes: string[];
}

export interface TsunamiIndicator {
  meetsCriteria: boolean;
  badgeLabel: string;
  explanation: string;
  ruleText: string;
}

export interface FormattedEnergy {
  joules: number;
  mantissa: string;
  exponent: number;
  text: string;
}

export interface SimulasiResult {
  energy: FormattedEnergy;
  rhypoKm: number;
  tpSeconds: number;
  tsSeconds: number;
  goldenTimeSeconds: number;
  mmi: MmiResult;
  radiusFeltIII: RadiusEstimate;
  radiusDamagingVI: RadiusEstimate;
  tsunami: TsunamiIndicator;
}

export interface PresetScenarioItem {
  id: string;
  nama: string;
  magnitudo: number;
  kedalamanKm: number;
  lat: number;
  lon: number;
  tipeLokasi: TipeLokasiSimulasi;
  deskripsiSingkat: string | null;
  urutan: number;
  sumberUrl: string | null;
  sumberJudul: string | null;
  sumberPenerbit: string | null;
}

export interface ParsedSimulasiUrlResult {
  input: SimulasiInput;
  warnings: string[];
  appliedFromUrl: boolean;
  presetWilayah: string | null;
}

