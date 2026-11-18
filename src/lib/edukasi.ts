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

export interface PublisherBadgeSpec {
  initials: string;
  badgeClassName: string;
}

export function getNewsPublisherSpec(sumber: string): PublisherBadgeSpec {
  const normalized = sumber.trim().toLowerCase();
  if (normalized.includes("cnn")) {
    return {
      initials: "CNN",
      badgeClassName: "bg-[var(--color-error)] text-[var(--color-on-cta)]",
    };
  }
  if (normalized.includes("cnbc")) {
    return {
      initials: "CNBC",
      badgeClassName: "bg-[var(--color-primary-strong)] text-[var(--color-on-cta)]",
    };
  }
  if (normalized.includes("bisnis")) {
    return {
      initials: "BI",
      badgeClassName: "bg-[var(--color-cta)] text-[var(--color-on-cta)]",
    };
  }
  if (normalized.includes("kompas")) {
    return {
      initials: "KM",
      badgeClassName: "bg-[var(--color-cta)] text-[var(--color-on-cta)]",
    };
  }
  if (normalized.includes("detik")) {
    return {
      initials: "DT",
      badgeClassName: "bg-[var(--color-cta)] text-[var(--color-on-cta)]",
    };
  }
  if (normalized.includes("antara")) {
    return {
      initials: "AN",
      badgeClassName: "bg-[var(--color-primary-strong)] text-[var(--color-on-cta)]",
    };
  }
  if (normalized.includes("tempo")) {
    return {
      initials: "TM",
      badgeClassName: "bg-[var(--color-error)] text-[var(--color-on-cta)]",
    };
  }
  if (normalized.includes("bmkg")) {
    return {
      initials: "BMKG",
      badgeClassName: "bg-[var(--color-primary-strong)] text-[var(--color-on-cta)]",
    };
  }
  const letters = sumber
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  return {
    initials: letters || "BR",
    badgeClassName:
      "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)]",
  };
}

export function getUrlHostname(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

export interface NewsThumbnailVisual {
  src: string;
  alt: string;
}

export function getNewsThumbnailVisual(judul: string): NewsThumbnailVisual {
  const lower = judul.toLowerCase();
  if (lower.includes("disiapkan") || lower.includes("siaga") || lower.includes("mitigasi")) {
    return {
      src: "/images/berita-siaga-megathrust.jpg",
      alt: "Perlengkapan tas siaga bencana berupa ransel darurat, kotak P3K, senter, power bank, peluit, air minum, dan dokumen di atas meja kayu",
    };
  }
  if (lower.includes("13 zona") || lower.includes("ancaman") || lower.includes("zona") || lower.includes("megathrust")) {
    return {
      src: "/images/berita-zona-megathrust.jpg",
      alt: "Layar pemantauan geofisika di pusat observasi seismik menampilkan peta batimetri dan garis zona subduksi kepulauan Indonesia",
    };
  }
  if (lower.includes("tsunami") || lower.includes("pantai") || lower.includes("pesisir")) {
    return {
      src: "/images/berita-rawan-tsunami.jpg",
      alt: "Garis pantai Indonesia menghadap Samudra Hindia dengan menara sirene peringatan tsunami di dekat jalan evakuasi menuju perbukitan hijau",
    };
  }
  return {
    src: "/images/berita-tiga-lempeng.jpg",
    alt: "Foto udara tebing sesar tektonik yang membelah lembah hijau Indonesia dengan jajaran pegunungan vulkanik di kejauhan",
  };
}

