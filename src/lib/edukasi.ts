export interface CategoryOption {
  key: string;
  label: string;
}

export const EDUKASI_CATEGORIES: CategoryOption[] = [
  { key: "semua", label: "Semua Kategori" },
  { key: "PENGERTIAN", label: "Pengertian" },
  { key: "PROSES", label: "Proses Geologi" },
  { key: "PENANGGULANGAN", label: "Penanggulangan" },
  { key: "MITIGASI", label: "Mitigasi & Siaga" },
  { key: "LAINNYA", label: "Lainnya" },
];

export const KATEGORI_LABELS: Record<string, string> = {
  PENGERTIAN: "Pengertian",
  PROSES: "Proses Geologi",
  PENANGGULANGAN: "Penanggulangan",
  MITIGASI: "Mitigasi & Siaga",
  LAINNYA: "Lainnya",
};

export function getKategoriLabel(kategori: string): string {
  return KATEGORI_LABELS[kategori] || kategori;
}

export function formatTanggalIndonesia(date: Date | string, monthStyle: "short" | "long" = "long"): string {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return "";

  try {
    return new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: monthStyle,
      year: "numeric",
      timeZone: "Asia/Jakarta",
    }).format(parsed);
  } catch {
    return "";
  }
}

export function formatWibDateTime(date: Date | string): string {
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) return "Waktu tidak tersedia";

  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(parsed) + " WIB"
  );
}

/**
 * Validasi protokol URL eksternal sebelum dirender ke tautan keluar.
 */
export function getSafeExternalHref(url: string): string {
  const trimmed = (url || "").trim();
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return "#";
}

