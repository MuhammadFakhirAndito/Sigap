import {
  Activity,
  Backpack,
  BookOpen,
  ClipboardCheck,
  Gauge,
  Layers,
  Map,
  Mountain,
  ShieldAlert,
  Waves,
  type LucideIcon,
} from "lucide-react";

/** Materi paling mendesak tampil sebagai kartu besar. */
export const FEATURED_ARTICLE_SLUGS = ["saat-gempa-terjadi", "tsunami-yang-harus-dilakukan"] as const;

export const EMERGENCY_ARTICLE_SLUG = "saat-gempa-terjadi";
export const BASICS_ARTICLE_SLUG = "apa-itu-gempa-bumi";

const ARTICLE_ICONS: Record<string, LucideIcon> = {
  "persiapan-sebelum-gempa": Backpack,
  "saat-gempa-terjadi": ShieldAlert,
  "setelah-gempa": ClipboardCheck,
  "tsunami-yang-harus-dilakukan": Mountain,
  "apa-itu-gempa-bumi": Activity,
  "skala-mmi": Gauge,
  "mengapa-indonesia-rawan-gempa": Map,
  "penyebab-gempa-dan-bahaya-ikutan": Layers,
  "tsunami-penyebab-dan-tanda": Waves,
};

export function getArticleIcon(slug: string): LucideIcon {
  return ARTICLE_ICONS[slug] ?? BookOpen;
}

export function isFeaturedArticle(slug: string): boolean {
  return (FEATURED_ARTICLE_SLUGS as readonly string[]).includes(slug);
}

// Kecepatan baca 200 kata/menit (asumsi yang disetujui di rencana redesign /edukasi).
const WORDS_PER_MINUTE = 200;

export function estimateReadMinutes(markdown: string): number {
  const words = markdown.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}

/** Label pendek untuk chip sumber; "CNBC Indonesia (mengutip BMKG)" menjadi "CNBC". */
export function getShortPublisherLabel(penerbit: string): string {
  const upper = penerbit.trim().toUpperCase();
  for (const key of ["BMKG", "BNPB", "PVMBG", "USGS", "CNBC", "CNN"]) {
    if (upper.startsWith(key)) return key;
  }
  return penerbit.trim().split(/\s+/)[0] ?? penerbit;
}

export function uniqueShortPublishers(sumber: { penerbit: string }[]): string[] {
  return Array.from(new Set(sumber.map((s) => getShortPublisherLabel(s.penerbit))));
}

export type ArticleGroupKey = "fase" | "memahami" | "lainnya";

export interface ArticleGroupSpec {
  key: ArticleGroupKey;
  title: string;
  kategori: string[];
}

export const ARTICLE_GROUPS: ArticleGroupSpec[] = [
  { key: "fase", title: "Sebelum, saat, dan sesudah gempa", kategori: ["MITIGASI", "PENANGGULANGAN"] },
  { key: "memahami", title: "Memahami gempa & tsunami", kategori: ["PENGERTIAN", "PROSES"] },
  { key: "lainnya", title: "Materi lainnya", kategori: ["LAINNYA"] },
];

// Urutan kronologis fase: sebelum -> saat -> sesudah -> tsunami.
const PHASE_ORDER: Record<string, number> = {
  "persiapan-sebelum-gempa": 0,
  "saat-gempa-terjadi": 1,
  "setelah-gempa": 2,
  "tsunami-yang-harus-dilakukan": 3,
};

interface GroupableArticle {
  slug: string;
  kategori: string;
  urutan: number;
}

export function groupArticles<T extends GroupableArticle>(
  articles: T[]
): { spec: ArticleGroupSpec; items: T[] }[] {
  return ARTICLE_GROUPS.map((spec) => {
    const items = articles.filter((a) => spec.kategori.includes(a.kategori));
    const sorted = [...items].sort((a, b) => {
      if (spec.key === "fase") {
        const pa = PHASE_ORDER[a.slug] ?? 100 + a.urutan;
        const pb = PHASE_ORDER[b.slug] ?? 100 + b.urutan;
        return pa - pb;
      }
      const ka = spec.kategori.indexOf(a.kategori);
      const kb = spec.kategori.indexOf(b.kategori);
      return ka !== kb ? ka - kb : a.urutan - b.urutan;
    });
    return { spec, items: sorted };
  }).filter((g) => g.items.length > 0);
}

export type PustakaGroupKey = "BMKG" | "BNPB" | "MEDIA" | "USGS";

export const PUSTAKA_GROUP_LABELS: Record<PustakaGroupKey, string> = {
  BMKG: "BMKG",
  BNPB: "BNPB",
  MEDIA: "Media & lainnya",
  USGS: "USGS",
};

export const PUSTAKA_GROUP_ORDER: PustakaGroupKey[] = ["BMKG", "BNPB", "MEDIA", "USGS"];

export function getPustakaGroup(penerbit: string): PustakaGroupKey {
  const upper = penerbit.trim().toUpperCase();
  if (upper.startsWith("BMKG")) return "BMKG";
  if (upper.startsWith("BNPB")) return "BNPB";
  if (upper.startsWith("USGS")) return "USGS";
  return "MEDIA";
}
