export interface BmkgRawGempa {
  Tanggal?: string;
  Jam?: string;
  DateTime: string;
  Coordinates?: string;
  Lintang?: string;
  Bujur?: string;
  Magnitude: string;
  Kedalaman: string;
  Wilayah: string;
  Potensi?: string;
  Dirasakan?: string;
  Shakemap?: string;
}

export interface BmkgAutogempaResponse {
  Infogempa: {
    gempa: BmkgRawGempa;
  };
}

export interface BmkgMultiGempaResponse {
  Infogempa: {
    gempa: BmkgRawGempa[];
  };
}

export type StatusTsunamiType = "AMAN" | "BERPOTENSI" | "TIDAK_DINYATAKAN";

export interface NormalizedGempa {
  bmkgKey: string;
  waktuUtc: Date;
  lat: number;
  lon: number;
  magnitudo: number;
  kedalamanKm: number;
  wilayah: string;
  potensiTeks: string;
  statusTsunami: StatusTsunamiType;
  dirasakan?: string | null;
  shakemapUrl?: string | null;
}
