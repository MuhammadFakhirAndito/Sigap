import { BmkgRawGempa, NormalizedGempa, StatusTsunamiType } from "@/types/bmkg";

export function parseCoordinates(
  coordinatesStr?: string,
  lintangStr?: string,
  bujurStr?: string
): { lat: number; lon: number } {
  if (coordinatesStr && coordinatesStr.includes(",")) {
    const [latPart, lonPart] = coordinatesStr.split(",").map((s) => s.trim());
    const lat = parseFloat(latPart);
    const lon = parseFloat(lonPart);
    if (!isNaN(lat) && !isNaN(lon)) {
      return { lat, lon };
    }
  }

  let lat = 0;
  let lon = 0;

  if (lintangStr) {
    const val = parseFloat(lintangStr);
    lat = lintangStr.toUpperCase().includes("LS") ? -Math.abs(val) : Math.abs(val);
  }

  if (bujurStr) {
    const val = parseFloat(bujurStr);
    lon = bujurStr.toUpperCase().includes("BB") ? -Math.abs(val) : Math.abs(val);
  }

  return { lat, lon };
}

export function parseStatusTsunami(potensi?: string): StatusTsunamiType {
  if (!potensi) return "TIDAK_DINYATAKAN";
  const lower = potensi.toLowerCase();
  if (lower.includes("tidak berpotensi")) {
    return "AMAN";
  }
  if (lower.includes("berpotensi tsunami")) {
    return "BERPOTENSI";
  }
  return "TIDAK_DINYATAKAN";
}

export function parseKedalaman(kedalamanStr: string): number {
  const cleaned = kedalamanStr.replace(/[^0-9.]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

export function parseMagnitudo(magnitudoStr: string): number {
  const cleaned = magnitudoStr.replace(/[^0-9.]/g, "");
  const val = parseFloat(cleaned);
  return isNaN(val) ? 0 : val;
}

export function normalizeBmkgGempa(raw: BmkgRawGempa): NormalizedGempa {
  const { lat, lon } = parseCoordinates(raw.Coordinates, raw.Lintang, raw.Bujur);
  const magnitudo = parseMagnitudo(raw.Magnitude);
  const kedalamanKm = parseKedalaman(raw.Kedalaman);
  const statusTsunami = parseStatusTsunami(raw.Potensi);
  const potensiTeks = raw.Potensi?.trim() || "Tidak dinyatakan";
  const waktuUtc = new Date(raw.DateTime);

  let shakemapUrl: string | null = null;
  if (raw.Shakemap) {
    shakemapUrl = raw.Shakemap.startsWith("http")
      ? raw.Shakemap
      : `https://data.bmkg.go.id/DataMKG/TEWS/${raw.Shakemap}`;
  }

  return {
    bmkgKey: raw.DateTime,
    waktuUtc,
    lat,
    lon,
    magnitudo,
    kedalamanKm,
    wilayah: raw.Wilayah?.trim() || "",
    potensiTeks,
    statusTsunami,
    dirasakan: raw.Dirasakan?.trim() || null,
    shakemapUrl,
  };
}
