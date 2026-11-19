import React from "react";
import Link from "next/link";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ArticleNotchedCard } from "@/components/edukasi/ArticleNotchedCard";
import { fetchBmkgAutogempa } from "@/lib/bmkg/client";
import { ReloadPageButton } from "@/components/beranda/ReloadPageButton";
import { HeroScrollRock } from "@/components/beranda/HeroScrollRock";
import { EduScrollDeck } from "@/components/beranda/EduScrollDeck";
import { MobileEduCarousel, type MobileEduCarouselItem } from "@/components/beranda/MobileEduCarousel";
import {
  MobileScenarioCarousel,
  type MobileScenarioCarouselItem,
} from "@/components/beranda/MobileScenarioCarousel";
import { MobileChatbotQuickAsk } from "@/components/beranda/MobileChatbotQuickAsk";
import { ScenarioOverlayCard } from "@/components/beranda/ScenarioOverlayCard";
import { NewsPreviewCard } from "@/components/beranda/NewsPreviewCard";
import { HeroQuickToolbar } from "@/components/beranda/HeroQuickToolbar";
import { RevealOnScroll } from "@/components/edukasi/RevealOnScroll";
import { getLatestEarthquakeNews, type DynamicBeritaItem } from "@/lib/news-rss";
import { prisma } from "@/lib/prisma";
import { NormalizedGempa, StatusTsunamiType } from "@/types/bmkg";
import type { Prisma } from "@prisma/client";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  HelpCircle,
  MessageSquareText,
  Mountain,
  Newspaper,
  Waves,
} from "lucide-react";

export const revalidate = 60; // Cache 60 detik sesuai spec

const nf = new Intl.NumberFormat("id-ID");

function formatCoordinate(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(2).replace(".", ",")}° ${lat < 0 ? "LS" : "LU"}`;
  const lonStr = `${Math.abs(lon).toFixed(2).replace(".", ",")}° ${lon < 0 ? "BB" : "BT"}`;
  return `${latStr}, ${lonStr}`;
}

function formatWibDate(date: Date): string {
  if (isNaN(date.getTime())) return "Waktu tidak tersedia";
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(date) + " WIB"
  );
}

function formatWibCompact(date: Date): string {
  if (isNaN(date.getTime())) return "Waktu tidak tersedia";
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(date) + " WIB"
  );
}

function formatMagnitude(mag: number): string {
  return isNaN(mag) ? "0,0" : mag.toFixed(1).replace(".", ",");
}

interface ModuleVisual {
  src: string;
  alt: string;
  width: number;
  height: number;
  position: string;
}

const MODULE_VISUAL_BY_SLUG: Record<string, ModuleVisual> = {
  "apa-itu-gempa-bumi": {
    src: "/images/modul-pengertian-sesar.jpg",
    alt: "Penampang diorama kerak bumi yang menunjukkan patahan sesar tektonik di bawah perbukitan hijau",
    width: 1792,
    height: 1008,
    position: "object-center",
  },
  "persiapan-sebelum-gempa": {
    src: "/images/modul-mitigasi-siaga.jpg",
    alt: "Perlengkapan tas siaga bencana berupa ransel darurat, kotak P3K, senter, radio portabel, air minum, peluit, dan map dokumen tahan air",
    width: 1792,
    height: 1024,
    position: "object-center",
  },
  "saat-gempa-terjadi": {
    src: "/images/modul-penanggulangan-lindung.jpg",
    alt: "Peragaan perlindungan diri saat gempa dengan berlutut di bawah meja kayu kokoh sambil melindungi kepala dan memegang kaki meja",
    width: 1792,
    height: 1024,
    position: "object-center",
  },
};

const MODULE_VISUAL_BY_KATEGORI: Record<string, ModuleVisual> = {
  PENGERTIAN: MODULE_VISUAL_BY_SLUG["apa-itu-gempa-bumi"],
  PROSES: MODULE_VISUAL_BY_SLUG["apa-itu-gempa-bumi"],
  MITIGASI: MODULE_VISUAL_BY_SLUG["persiapan-sebelum-gempa"],
  PENANGGULANGAN: MODULE_VISUAL_BY_SLUG["saat-gempa-terjadi"],
};

function getModuleVisual(slug: string, kategori: string): ModuleVisual {
  return (
    MODULE_VISUAL_BY_SLUG[slug] ??
    MODULE_VISUAL_BY_KATEGORI[kategori] ??
    MODULE_VISUAL_BY_SLUG["apa-itu-gempa-bumi"]
  );
}

type ArtikelPreview = Prisma.ArtikelGetPayload<{ include: { sumber: true } }>;
type SkenarioPreview = Prisma.SkenarioSimulasiGetPayload<Record<string, never>>;

function getScenarioMedia(sk: SkenarioPreview): { url: string; alt: string } {
  const normalizedName = sk.nama.toLowerCase();
  if (normalizedName.includes("aceh")) {
    return {
      url: "/images/skenario-aceh.jpg",
      alt: "Foto arsip Masjid Rahmatullah yang tetap berdiri di tengah kawasan pesisir Lampuuk, Aceh yang luluh lantak akibat tsunami 26 Desember 2004 (U.S. Navy / Wikimedia Commons, Public Domain)",
    };
  }
  if (normalizedName.includes("nias")) {
    return {
      url: "/images/skenario-nias.jpg",
      alt: "Foto arsip warga berdiri di antara puing rumah kayu yang runtuh akibat gempa Nias 28 Maret 2005 (U.S. Navy / Wikimedia Commons, Public Domain)",
    };
  }
  if (normalizedName.includes("yogyakarta") || normalizedName.includes("bantul")) {
    return {
      url: "/images/skenario-yogyakarta.jpg",
      alt: "Foto arsip kerusakan permukiman bata pascagempa Yogyakarta 27 Mei 2006 (Foto Muhammad Bundhowi, DFAT / Wikimedia Commons, CC BY 2.0)",
    };
  }
  if (sk.tipeLokasi === "LAUT") {
    return {
      url: "/images/skenario-aceh.jpg",
      alt: `Foto arsip dampak gempa pesisir untuk skenario ${sk.nama} (Wikimedia Commons)`,
    };
  }
  return {
    url: "/images/skenario-yogyakarta.jpg",
    alt: `Foto arsip dampak gempa darat untuk skenario ${sk.nama} (Wikimedia Commons)`,
  };
}

export default async function HomePage() {
  let latestQuake: NormalizedGempa | null = await fetchBmkgAutogempa();
  let isBmkgFallback = false;
  let lastSyncTime: Date | null = null;
  let skenarioList: SkenarioPreview[] = [];
  let artikelList: ArtikelPreview[] = [];
  let beritaList: DynamicBeritaItem[] = [];
  let totalGempa = 0;
  let totalSkenario = 0;
  let totalArtikel = 0;
  let isDbDegraded = false;

  // 1. Fallback DB jika BMKG autogempa gagal/timeout
  if (!latestQuake) {
    isBmkgFallback = true;
    try {
      const fallbackQuake = await prisma.gempa.findFirst({
        orderBy: { waktuUtc: "desc" },
      });
      if (fallbackQuake) {
        latestQuake = {
          waktuUtc: fallbackQuake.waktuUtc,
          lat: fallbackQuake.lat,
          lon: fallbackQuake.lon,
          magnitudo: fallbackQuake.magnitudo,
          kedalamanKm: fallbackQuake.kedalamanKm,
          wilayah: fallbackQuake.wilayah,
          potensiTeks: fallbackQuake.potensiTeks,
          statusTsunami: fallbackQuake.statusTsunami as StatusTsunamiType,
          dirasakan: fallbackQuake.dirasakan || undefined,
          shakemapUrl: fallbackQuake.shakemapUrl || undefined,
          bmkgKey: fallbackQuake.bmkgKey,
        };
      }
    } catch {
      isDbDegraded = true;
    }
  }

  // 2. Ambil berita otomatis (Google News RSS + fallback) dan data DB secara paralel
  const newsPromise = getLatestEarthquakeNews().catch(() => []);

  try {
    const [syncLog, skenarios, allArtikels, countGempa, countSkenario] =
      await Promise.all([
        prisma.syncLog.findFirst({
          where: { status: "OK" },
          orderBy: { createdAt: "desc" },
        }),
        prisma.skenarioSimulasi.findMany({
          orderBy: { urutan: "asc" },
          take: 3,
        }),
        prisma.artikel.findMany({
          orderBy: [{ urutan: "asc" }, { updatedAt: "desc" }],
          include: { sumber: true },
        }),
        prisma.gempa.count(),
        prisma.skenarioSimulasi.count(),
      ]);
    if (syncLog) lastSyncTime = syncLog.createdAt;
    skenarioList = skenarios;

    // Pilih maksimal 3 modul representatif (Pengertian, Mitigasi, Penanggulangan) lalu lengkapi bila kurang
    const preferredCategories = ["PENGERTIAN", "MITIGASI", "PENANGGULANGAN", "PROSES"] as const;
    const picked: ArtikelPreview[] = [];
    for (const cat of preferredCategories) {
      if (picked.length >= 3) break;
      const match = allArtikels.find((a) => a.kategori === cat && !picked.some((p) => p.id === a.id));
      if (match) picked.push(match);
    }
    for (const a of allArtikels) {
      if (picked.length >= 3) break;
      if (!picked.some((p) => p.id === a.id)) picked.push(a);
    }
    artikelList = picked;
    totalGempa = countGempa;
    totalSkenario = countSkenario;
    totalArtikel = allArtikels.length;
  } catch {
    skenarioList = [];
    artikelList = [];
    isDbDegraded = true;
  }

  beritaList = (await newsPromise).slice(0, 3);

  const hrefSimulasiLatest = latestQuake
    ? `/simulasi?m=${latestQuake.magnitudo}&d=${latestQuake.kedalamanKm}&lat=${latestQuake.lat}&lon=${latestQuake.lon}&wilayah=${encodeURIComponent(latestQuake.wilayah)}`
    : "/simulasi";

  const dirasakanTeks =
    latestQuake?.dirasakan &&
      latestQuake.dirasakan.trim() !== "" &&
      latestQuake.dirasakan.trim() !== "-"
      ? latestQuake.dirasakan.trim()
      : "Tidak tercatat dirasakan";

  const shareSummary = latestQuake
    ? `Gempa M ${formatMagnitude(latestQuake.magnitudo)} di ${latestQuake.wilayah} (${formatWibDate(latestQuake.waktuUtc)}) — SIGAP Gempa`
    : "SIGAP Gempa: Informasi gempa BMKG & edukasi mitigasi terukur";

  const eduCardItems: MobileEduCarouselItem[] = artikelList.slice(0, 3).map((artikel) => {
    const visual = getModuleVisual(artikel.slug, artikel.kategori);
    return {
      id: artikel.id,
      slug: artikel.slug,
      judul: artikel.judul,
      ringkasan: artikel.ringkasan,
      kategori: artikel.kategori,
      imageSrc: visual.src,
      imageAlt: visual.alt,
      imageWidth: visual.width,
      imageHeight: visual.height,
      imagePosition: visual.position,
    };
  });

  const scenarioItems: MobileScenarioCarouselItem[] = skenarioList.map((sk) => {
    const media = getScenarioMedia(sk);
    const depthText = String(sk.kedalamanKm).replace(".", ",");
    return {
      id: sk.id,
      imageUrl: media.url,
      imageAlt: media.alt,
      tipeLokasi: sk.tipeLokasi,
      title: sk.nama,
      metaLine: `Kedalaman ${depthText} km · ${formatCoordinate(sk.lat, sk.lon)}`,
      overview:
        sk.deskripsiSingkat ??
        "Skenario gempa historis untuk mempelajari perkiraan guncangan MMI dan waktu tiba gelombang seismik.",
      magnitudeText: formatMagnitude(sk.magnitudo),
      locationTypeLabel: sk.tipeLokasi === "LAUT" ? "Lokasi laut" : "Lokasi darat",
      href: `/simulasi?m=${sk.magnitudo}&d=${sk.kedalamanKm}&lat=${sk.lat}&lon=${sk.lon}&wilayah=${encodeURIComponent(sk.nama)}`,
    };
  });

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      {/* Container utama SIGAP Gempa: max-w-[1320px] dengan ritme antar-section terhubung */}
      <div className="w-full max-w-[1320px] mx-auto px-3 sm:px-7 lg:px-8 pt-3 sm:pt-6 pb-14 sm:pb-20 flex-1 flex flex-col space-y-10 sm:space-y-14 lg:space-y-16">

        {/* ================= HERO: KOMPOSISI MENGIKUTI REFERENSI (BATU MELUBER KE KIRI & BAWAH CARD) ================= */}
        <section aria-label="Informasi gempa terkini" className="w-full relative">
          <NotchNavbar variant="notch" />

          {/* lg: rasio tetap agar posisi batu (persen) konsisten di semua lebar desktop */}
          <div className="relative w-full lg:aspect-[15/8] rounded-tl-[28px] rounded-b-[36px] lg:rounded-t-none lg:rounded-b-[48px] bg-[var(--color-surface)] lg:border-b lg:border-x lg:border-[var(--color-border)]/60 overflow-x-clip lg:overflow-visible px-4 sm:px-8 lg:px-11 pt-5 sm:pt-7 lg:pt-10 pb-5 sm:pb-7 lg:pb-0 flex flex-col lg:block">

            {/* TOOLBAR KIRI: AKSI CEPAT + BAHASA */}
            <HeroQuickToolbar shareSummary={shareSummary} />

            {/* KOLOM KANAN: HEADLINE + CTA */}
            <div className="relative z-30 lg:ml-auto lg:w-fit">
              <div className="flex flex-col items-center text-center lg:text-left lg:grid lg:grid-cols-[auto_1fr] lg:items-center lg:gap-x-8 lg:gap-y-1.5">
                <h1 className="contents text-[clamp(25px,6.8vw,40px)] lg:text-[clamp(28px,3.6vw,52px)] font-normal leading-[1.12] tracking-[-0.03em]">
                  <span className="lg:col-span-2 lg:whitespace-nowrap">
                    <span className="text-[var(--color-primary)]">Pantau gempa bumi</span>{" "}
                    <span className="text-[var(--color-text-primary)]">untuk</span>
                  </span>
                  <span className="lg:col-start-2 lg:row-start-2 lg:text-right text-[var(--color-text-primary)] lg:whitespace-nowrap">
                    kesiapsiagaan kita
                  </span>
                </h1>
                {/* Subjudul sejajar tepi kiri "Pantau" dan berada di samping "kesiapsiagaan kita" pada desktop */}
                <p className="hidden lg:block mt-0 lg:col-start-1 lg:row-start-2 text-xs leading-snug text-[var(--color-text-secondary)] max-w-[320px]">
                  Data resmi BMKG dan
                  <br /> edukasi mitigasi terukur
                </p>
              </div>

              <div className="hidden lg:flex justify-end mt-[clamp(28px,3.4vw,48px)]">
                <Link
                  href="/riwayat"
                  className="group inline-flex items-center justify-between w-[clamp(200px,15vw,216px)] h-[clamp(46px,3.6vw,52px)] rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] pl-7 pr-1 text-sm font-medium hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors"
                >
                  <span>Lihat riwayat</span>
                  <span className="h-[calc(100%-8px)] w-[64px] rounded-full overflow-hidden bg-[var(--color-surface)] shrink-0">
                    <img
                      src="/images/tectonic-island.png"
                      alt=""
                      className="w-full h-full object-cover scale-[1.6] transition-transform group-hover:scale-[1.8]"
                    />
                  </span>
                </Link>
              </div>
            </div>

            {/* MOBILE LAYERED ROCK STAGE (lg:contents menjaga posisi absolut desktop 100% utuh) */}
            <div className="relative mt-3 sm:mt-4 w-full max-w-[520px] mx-auto lg:contents">
              <div className="lg:hidden absolute top-0 right-0 z-20 w-[112px] sm:w-[132px] rounded-[18px] border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)]/95 px-2.5 py-2.5 text-center">
                <p className="text-[10px] leading-tight text-[var(--color-text-secondary)]">
                  Sumber resmi
                </p>
                <p className="mt-1 text-[12px] sm:text-[13px] font-medium leading-[1.2] text-[var(--color-primary-strong)]">
                  <span className="block">BMKG</span>
                  <span className="block">Indonesia</span>
                </p>
              </div>

              {/* BATU TEKTONIK: meluber di hero dan bergerak mengecil ke Section 2 saat scroll */}
              <HeroScrollRock
                targetId="sec2-rock-target"
                targetSectionId="ringkasan-sigap-section"
                reticleId="sec2-rock-reticle"
              />

              {/* Lapisan bawah mobile: chip Estimasi MMI & caption kiri + kartu magnitudo kanan */}
              <div className="lg:hidden -mt-10 sm:-mt-16 relative z-20 grid grid-cols-[1fr_auto] items-end gap-3">
                <div className="flex flex-col items-start gap-3 pb-1 min-w-0">
                  <div className="w-[116px] sm:w-[136px] rounded-[18px] border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)]/95 px-2.5 py-2.5 text-center">
                    <p className="text-[10px] leading-tight text-[var(--color-text-secondary)]">
                      Perhitungan fisik
                    </p>
                    <p className="mt-1 text-[12px] sm:text-[13px] font-medium leading-[1.2] text-[var(--color-primary-strong)]">
                      <span className="block">Estimasi</span>
                      <span className="block">MMI &amp; P-S</span>
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm leading-snug text-[var(--color-text-secondary)] max-w-[168px] sm:max-w-[220px]">
                    Data resmi BMKG dan
                    <br /> edukasi mitigasi terukur
                  </p>
                </div>

                <div className="w-[164px] sm:w-[190px] rounded-[22px] bg-[var(--color-surface-raised)] p-3.5 sm:p-4 flex flex-col">
                  <div className="flex items-start gap-2">
                    <span className="text-[28px] sm:text-[34px] font-normal leading-none tracking-tight text-[var(--color-text-primary)] tnum">
                      {latestQuake ? formatMagnitude(latestQuake.magnitudo) : "–"}
                      <span className="text-[0.55em] ml-0.5 text-[var(--color-primary)]">M</span>
                    </span>
                    <span className="pt-0.5 text-[10px] sm:text-[11px] leading-tight text-[var(--color-text-secondary)]">
                      magnitudo
                      <br />
                      gempa terkini
                    </span>
                  </div>

                  <div className="relative min-h-[74px] sm:min-h-[92px] mt-1">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 64 64"
                      className="absolute right-0 bottom-0 w-[48%] h-auto text-[var(--color-border-strong)]/55"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1"
                    >
                      <circle cx="32" cy="32" r="30" />
                      <circle cx="32" cy="32" r="18" />
                      <path d="M32 2v60M2 32h60" />
                    </svg>
                    <img
                      src="/images/tectonic-island-v3.png"
                      alt=""
                      width={1712}
                      height={922}
                      className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-[16deg] w-[96%] h-auto object-contain select-none"
                    />
                  </div>

                  <p className="pt-1.5 text-[10.5px] leading-tight text-[var(--color-text-secondary)] truncate tnum">
                    {latestQuake ? `BMKG · ${formatWibCompact(latestQuake.waktuUtc)}` : "Data BMKG belum tersedia"}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA PILL LEBAR PENUH DI MOBILE (< 1024px) */}
            <div className="lg:hidden mt-5 w-full max-w-[440px] mx-auto">
              <Link
                href="/riwayat"
                className="group flex items-center justify-between w-full h-[58px] rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] pl-7 pr-1.5 text-sm font-medium hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] active:bg-[var(--color-primary-strong)] active:text-[var(--color-on-cta)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
              >
                <span>Lihat riwayat</span>
                <span className="h-[calc(100%-10px)] w-[108px] sm:w-[128px] rounded-full overflow-hidden bg-[var(--color-surface)] shrink-0">
                  <img
                    src="/images/tectonic-island.png"
                    alt=""
                    width={1519}
                    height={948}
                    className="w-full h-full object-cover scale-[1.55] transition-transform group-hover:scale-[1.7]"
                  />
                </span>
              </Link>
            </div>

            {/* DESKTOP: 3 CHIP KECIL DI SUDUT KIRI BAWAH (DI DEPAN BATU) */}
            <div className="hidden lg:flex lg:flex-wrap lg:gap-3 relative z-20 lg:absolute lg:left-12 lg:bottom-[8%]">
              {[
                { label: "Sumber resmi", line1: "BMKG", line2: "Indonesia" },
                { label: "Perhitungan fisik", line1: "Estimasi", line2: "MMI & P-S" },
                { label: "Asisten mitigasi", line1: "Chatbot", line2: "SIGAP" },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="lg:w-[118px] rounded-[20px] border border-[var(--color-border)]/80 bg-[var(--color-surface-raised)]/95 backdrop-blur-[2px] px-3 py-3.5 flex flex-col items-center justify-center text-center"
                >
                  <p className="text-[10.5px] leading-tight text-[var(--color-text-secondary)]">
                    {chip.label}
                  </p>
                  <p className="mt-1.5 text-[13px] font-medium leading-[1.2] text-[var(--color-primary-strong)]">
                    <span className="block">{chip.line1}</span>
                    <span className="block">{chip.line2}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* DESKTOP: KARTU MAGNITUDO (KANAN BAWAH, DI DEPAN BATU) */}
            <div className="hidden lg:flex lg:flex-col relative z-20 lg:absolute lg:right-11 lg:bottom-[5%] lg:w-[19.5%] lg:aspect-[7/8] rounded-[24px] bg-[var(--color-surface-raised)] p-5">
              <div className="flex items-start gap-3">
                <span className="text-[clamp(34px,3vw,44px)] font-normal leading-none tracking-tight text-[var(--color-text-primary)] tnum">
                  {latestQuake ? formatMagnitude(latestQuake.magnitudo) : "–"}
                  <span className="text-[0.55em] ml-0.5 text-[var(--color-primary)]">M</span>
                </span>
                <span className="pt-1 text-[11.5px] leading-tight text-[var(--color-text-secondary)]">
                  magnitudo
                  <br />
                  gempa terkini
                </span>
              </div>

              <div className="relative flex-1 min-h-[116px] mt-1">
                {/* Garis lingkaran episentrum di kanan bawah */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 64 64"
                  className="absolute right-0 bottom-0 w-[48%] h-auto text-[var(--color-border-strong)]/55"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <circle cx="32" cy="32" r="30" />
                  <circle cx="32" cy="32" r="18" />
                  <path d="M32 2v60M2 32h60" />
                </svg>
                <img
                  src="/images/tectonic-island-v3.png"
                  alt=""
                  className="absolute -left-1 top-1/2 -translate-y-1/2 -rotate-[16deg] w-[98%] h-auto object-contain select-none"
                />
              </div>

              <p className="pt-2 text-[10.5px] leading-tight text-[var(--color-text-secondary)] truncate">
                {latestQuake ? `BMKG · ${formatWibDate(latestQuake.waktuUtc)}` : "Data BMKG belum tersedia"}
              </p>
            </div>
          </div>
        </section>

        {/* ================= SECTION 2: RINGKASAN + GEMPA TERBARU ================= */}
        <section
          id="ringkasan-sigap-section"
          aria-labelledby="ringkasan-sigap-heading"
          className="pt-1 sm:pt-4 lg:!mt-16 lg:min-h-[100svh] lg:flex lg:flex-col lg:justify-center lg:py-12"
        >
          {/* Dua kolom: di mobile metrik kiri sejajar langsung dengan kartu gempa terbaru kanan */}
          <div className="grid grid-cols-[96px_1fr] sm:grid-cols-[156px_1fr] lg:grid-cols-2 lg:grid-rows-[auto_1fr_auto] items-stretch gap-x-3 sm:gap-x-5 gap-y-5 lg:gap-x-12 lg:gap-y-6">
            <div className="relative z-20 col-span-2 lg:col-span-1 lg:col-start-1 lg:row-start-1 lg:pt-1">
              <div className="flex items-start justify-between gap-3">
                <h2
                  id="ringkasan-sigap-heading"
                  className="max-w-[32rem] text-[26px] sm:text-4xl lg:text-[2.75rem] font-normal leading-[1.08] tracking-[-0.035em] text-[var(--color-text-primary)]"
                >
                  Pahami{" "}
                  <span className="text-[var(--color-primary-strong)]">
                    risiko
                    <br className="hidden lg:inline" /> gempa sebelum
                  </span>
                  <br className="hidden lg:inline" /> guncangan datang
                </h2>
                <span
                  aria-hidden="true"
                  className="lg:hidden shrink-0 w-10 h-10 rounded-full border border-[var(--color-primary-strong)]/40 bg-[var(--color-surface-raised)] flex items-center justify-center p-2"
                >
                  <img
                    src="/logo/symbol.svg"
                    alt=""
                    width={24}
                    height={24}
                    className="w-full h-full"
                  />
                </span>
              </div>
              <div className="mt-3 sm:mt-5 lg:mt-6 flex items-center justify-between gap-3 lg:block">
                <p className="max-w-[26ch] sm:max-w-[38ch] text-xs sm:text-sm font-normal lg:font-light leading-relaxed tracking-[-0.01em] text-[var(--color-text-secondary)]">
                  Data resmi BMKG, kalkulator intensitas MMI &amp; gelombang P/S,
                  serta panduan mitigasi berbasis rujukan.
                </p>
                <Link
                  href="/riwayat"
                  className="lg:hidden shrink-0 inline-flex items-center justify-center min-h-[44px] rounded-full border border-[var(--color-border-strong)] px-4 text-xs font-medium text-[var(--color-text-primary)] whitespace-nowrap hover:bg-[var(--color-surface)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  Riwayat BMKG
                </Link>
              </div>
            </div>

            {/* MOBILE: 3 METRIK VERTIKAL KIRI (SEJAJAR DENGAN KARTU GEMPA TERBARU KANAN) */}
            <dl className="lg:hidden col-start-1 row-start-2 flex flex-col justify-between gap-5 py-3">
              {[
                {
                  value: isDbDegraded ? "–" : nf.format(totalGempa),
                  label: "catatan gempa",
                },
                {
                  value: isDbDegraded ? "–" : nf.format(totalSkenario),
                  label: "skenario simulasi",
                },
                {
                  value: isDbDegraded ? "–" : nf.format(totalArtikel),
                  label: "modul edukasi",
                },
              ].map(({ value, label }) => (
                <div key={label} className="space-y-1 min-w-0">
                  <dd className="text-[26px] sm:text-4xl font-medium tracking-[-0.04em] leading-none text-[var(--color-text-primary)] tnum">
                    {value}
                  </dd>
                  <dt className="text-[11px] sm:text-sm leading-snug tracking-[-0.01em] text-[var(--color-text-secondary)]">
                    {label}
                  </dt>
                </div>
              ))}
            </dl>

            {/* Slot pendaratan batu tektonik saat scroll ke Section 2 di desktop */}
            <div
              aria-hidden="true"
              className="hidden lg:flex lg:col-start-1 lg:row-start-2 lg:self-center w-full max-w-[32rem] justify-center py-2 pointer-events-none"
            >
              <div
                id="sec2-rock-target"
                className="relative w-[240px] h-[150px] shrink-0 flex items-center justify-center"
              >
                <svg
                  id="sec2-rock-reticle"
                  viewBox="0 0 220 140"
                  className="absolute inset-0 w-full h-full text-[var(--color-border)] opacity-0 motion-reduce:opacity-70"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <circle cx="110" cy="70" r="64" strokeDasharray="3 4" />
                  <circle cx="110" cy="70" r="40" />
                  <path d="M110 2v136M38 70h144" opacity="0.55" />
                </svg>
                <img
                  src="/images/tectonic-island.png"
                  alt=""
                  className="hidden motion-reduce:block relative z-10 w-full h-full object-contain select-none opacity-90"
                />
              </div>
            </div>

            {/* DESKTOP: 3 PIL LINK + 3 STATISTIK HORIZONTAL */}
            <div className="hidden lg:block lg:col-start-1 lg:row-start-3 lg:self-end lg:pb-1 relative z-20 w-full sm:max-w-[32rem] space-y-10">
              <div className="grid grid-cols-3 gap-0">
                {[
                  { href: "/riwayat", label: "Riwayat BMKG" },
                  { href: "/simulasi", label: "Simulasi MMI & P/S" },
                  { href: "/chatbot", label: "Tanya chatbot" },
                ].map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    className="inline-flex items-center justify-center min-h-[44px] w-full rounded-full border border-[var(--color-border-strong)] bg-transparent px-3 text-xs font-normal tracking-[-0.01em] text-[var(--color-text-secondary)] whitespace-nowrap hover:relative hover:z-10 hover:bg-[var(--color-primary)] hover:border-[var(--color-primary)] hover:text-[var(--color-on-primary)] hover:font-medium transition-colors motion-reduce:transition-none focus-visible:relative focus-visible:z-20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                  >
                    {label}
                  </Link>
                ))}
              </div>

              <dl className="grid grid-cols-3 gap-4">
                {[
                  {
                    value: isDbDegraded ? "–" : nf.format(totalGempa),
                    label: "catatan gempa",
                  },
                  {
                    value: isDbDegraded ? "–" : nf.format(totalSkenario),
                    label: "skenario simulasi",
                  },
                  {
                    value: isDbDegraded ? "–" : nf.format(totalArtikel),
                    label: "modul edukasi",
                  },
                ].map(({ value, label }) => (
                  <div key={label} className="space-y-1.5 min-w-0 pl-2">
                    <dd className="text-[2.75rem] font-medium tracking-[-0.04em] leading-none text-[var(--color-text-primary)] tnum">
                      {value}
                    </dd>
                    <dt className="text-sm font-light leading-snug tracking-[-0.01em] text-[var(--color-text-secondary)]">
                      {label}
                    </dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* Ringkasan gempa terbaru dari BMKG */}
            <div
              aria-labelledby="latest-quake-heading"
              className="col-start-2 row-start-2 lg:col-start-2 lg:row-start-1 lg:row-span-3 min-w-0 rounded-[24px] lg:rounded-[28px] overflow-hidden bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex flex-col justify-between"
            >
              {latestQuake ? (
                <>
                  {/* Strip header editorial */}
                  <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-3.5 py-2.5 sm:px-6 sm:py-3.5 lg:px-8 lg:py-4 flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${isBmkgFallback
                          ? "bg-[var(--color-warning-strong)]"
                          : "bg-[var(--color-text-primary)]"
                          }`}
                        aria-hidden="true"
                      />
                      <h3
                        id="latest-quake-heading"
                        className="text-xs sm:text-base font-medium tracking-[-0.015em] text-[var(--color-text-primary)]"
                      >
                        Gempa terbaru
                      </h3>
                    </div>

                    <p className="inline-flex items-center gap-1 sm:gap-1.5 text-[10.5px] sm:text-xs font-medium text-[var(--color-text-secondary)]">
                      {isBmkgFallback ? (
                        <>
                          <AlertTriangle
                            className="w-3.5 h-3.5 shrink-0 text-[var(--color-warning-strong)]"
                            aria-hidden="true"
                          />
                          <span className="text-[var(--color-warning-strong)]">
                            Cadangan lokal
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2
                            className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-primary)]"
                            aria-hidden="true"
                          />
                          <span>Data langsung BMKG</span>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="p-3.5 sm:p-6 lg:p-8 flex flex-col justify-between gap-3.5 sm:gap-5 lg:gap-6 flex-1">
                    {isBmkgFallback && (
                      <div
                        role="status"
                        className="rounded-[14px] sm:rounded-[16px] border border-[var(--color-warning-strong)]/40 bg-[var(--color-background)] px-3 py-2 sm:px-3.5 sm:py-2.5 flex items-start gap-2 text-[11px] sm:text-xs leading-relaxed text-[var(--color-warning-strong)]"
                      >
                        <AlertTriangle
                          className="w-4 h-4 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>
                          {`BMKG tidak dapat diakses. Data terakhir ${formatWibDate(lastSyncTime ?? latestQuake.waktuUtc)}.`}
                        </span>
                      </div>
                    )}

                    {/* Fokus utama: magnitudo + lokasi episentrum + potensi tsunami */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2.5 sm:gap-6">
                      <div className="shrink-0">
                        <p className="text-[11px] sm:text-xs font-medium text-[var(--color-text-secondary)] mb-0.5 sm:mb-1">
                          Magnitudo
                        </p>
                        <div className="flex items-baseline gap-1 sm:gap-1.5">
                          <span className="text-3xl sm:text-5xl lg:text-6xl font-normal leading-none tracking-[-0.03em] text-[var(--color-text-primary)] tnum">
                            {formatMagnitude(latestQuake.magnitudo)}
                          </span>
                          <span className="text-sm sm:text-lg font-medium text-[var(--color-text-secondary)]">
                            M
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 sm:border-l sm:border-[var(--color-border)] sm:pl-6">
                        <p className="text-xs sm:text-base lg:text-lg font-medium leading-snug text-[var(--color-text-primary)] break-words">
                          {latestQuake.wilayah}
                        </p>
                        <div className="mt-2 sm:mt-2.5 flex flex-wrap items-center gap-2">
                          {latestQuake.statusTsunami === "BERPOTENSI" ? (
                            <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-[var(--color-error-strong)]/40 bg-[var(--color-background)] px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10.5px] sm:text-xs font-medium text-[var(--color-error-strong)]">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>{latestQuake.potensiTeks}</span>
                            </span>
                          ) : latestQuake.statusTsunami === "AMAN" ? (
                            <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-background)] px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10.5px] sm:text-xs font-medium text-[var(--color-text-primary)]">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>{latestQuake.potensiTeks || "Tidak berpotensi tsunami"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 sm:gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-2.5 py-0.5 sm:px-3 sm:py-1 text-[10.5px] sm:text-xs font-medium text-[var(--color-text-secondary)]">
                              <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>
                                {latestQuake.potensiTeks || "Potensi tsunami tidak dinyatakan"}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detail terukur 2 kolom di semua lebar agar ringkas di ponsel */}
                    <dl className="grid grid-cols-2 gap-x-2.5 sm:gap-x-6 gap-y-2.5 sm:gap-y-4 pt-3 sm:pt-5 border-t border-[var(--color-border)]">
                      <div className="min-w-0">
                        <dt className="text-[10.5px] sm:text-xs font-medium text-[var(--color-text-secondary)]">
                          Waktu (WIB)
                        </dt>
                        <dd className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm font-medium text-[var(--color-text-primary)] tnum break-words">
                          {formatWibDate(latestQuake.waktuUtc)}
                        </dd>
                      </div>

                      <div className="min-w-0">
                        <dt className="text-[10.5px] sm:text-xs font-medium text-[var(--color-text-secondary)]">
                          Kedalaman
                        </dt>
                        <dd className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm font-medium text-[var(--color-text-primary)] tnum">
                          {latestQuake.kedalamanKm.toLocaleString("id-ID")} km
                        </dd>
                      </div>

                      <div className="min-w-0">
                        <dt className="text-[10.5px] sm:text-xs font-medium text-[var(--color-text-secondary)]">
                          Koordinat
                        </dt>
                        <dd className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm font-medium text-[var(--color-text-primary)] tnum break-words">
                          {formatCoordinate(latestQuake.lat, latestQuake.lon)}
                        </dd>
                      </div>

                      <div className="min-w-0">
                        <dt className="text-[10.5px] sm:text-xs font-medium text-[var(--color-text-secondary)]">
                          Dirasakan
                        </dt>
                        <dd className="mt-0.5 sm:mt-1 text-[11px] sm:text-sm font-medium text-[var(--color-text-primary)] break-words">
                          {dirasakanTeks}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center sm:justify-between gap-2.5 sm:gap-3 pt-3 sm:pt-4 border-t border-[var(--color-border)]">
                      <p className="text-[10.5px] sm:text-xs leading-snug sm:leading-relaxed text-[var(--color-text-secondary)] lg:max-w-[280px] tnum">
                        {`Sumber: BMKG · diperbarui ${formatWibDate(latestQuake.waktuUtc)}. Bukan sistem peringatan dini resmi.`}
                      </p>
                      <Link
                        href={hrefSimulasiLatest}
                        className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 min-h-[44px] rounded-full bg-[var(--color-cta)] px-3.5 sm:px-5 text-xs sm:text-sm font-medium text-[var(--color-on-cta)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] active:bg-[var(--color-primary-strong)] active:text-[var(--color-on-cta)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                      >
                        <span>Simulasikan gempa ini</span>
                        <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-4 sm:p-8 flex flex-col justify-between gap-5 my-auto">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-error-strong)]">
                      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Koneksi data terputus</span>
                    </div>
                    <h3
                      id="latest-quake-heading"
                      className="text-base sm:text-lg font-medium text-[var(--color-text-primary)]"
                    >
                      Data gempa terbaru belum tersedia
                    </h3>
                    <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)] max-w-[42ch]">
                      Gagal terhubung ke BMKG dan belum ada catatan gempa lokal yang dapat
                      ditampilkan.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <ReloadPageButton />
                    <Link
                      href="/riwayat"
                      className="inline-flex items-center justify-center min-h-[44px] rounded-full border border-[var(--color-border-strong)] px-4 sm:px-5 text-xs sm:text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:bg-[var(--color-surface-sunken)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                    >
                      Buka riwayat
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= SECTION 3: MODUL EDUKASI ================= */}
        <section
          aria-labelledby="edukasi-modul-heading"
          className="lg:!mt-4 border-t border-[var(--color-border)]/80 pt-8 sm:pt-12"
        >
          <EduScrollDeck>
            <div
              data-edu-header=""
              className="flex items-start lg:items-end justify-between gap-3 sm:gap-4 mb-5 lg:mb-7"
            >
              <span
                aria-hidden="true"
                className="lg:hidden shrink-0 w-10 h-10 mt-0.5 rounded-full border border-[var(--color-primary-strong)]/40 bg-[var(--color-surface-raised)] flex items-center justify-center p-2"
              >
                <img src="/logo/symbol.svg" alt="" width={24} height={24} className="w-full h-full" />
              </span>

              <div className="flex-1 space-y-1.5 lg:max-w-[54ch]">
                <p className="hidden lg:block text-xs font-medium text-[var(--color-primary-strong)] tnum">
                  01 · Materi rujukan
                </p>
                <h2
                  id="edukasi-modul-heading"
                  className="text-[26px] sm:text-3xl font-normal leading-[1.12] lg:leading-tight tracking-[-0.03em] lg:tracking-tight text-[var(--color-text-primary)]"
                >
                  <span className="block lg:inline text-[var(--color-primary-strong)] lg:text-[var(--color-text-primary)]">
                    Modul edukasi
                  </span>{" "}
                  <span className="lg:hidden inline-flex flex-wrap items-center gap-2 text-[var(--color-text-primary)]">
                    <span>mitigasi gempa bumi</span>
                    <span className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] px-3 py-0.5 text-[11px] font-medium tracking-normal text-[var(--color-text-secondary)]">
                      Materi rujukan
                    </span>
                  </span>
                </h2>
                <p className="hidden lg:block text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Pahami mekanisme patahan bumi, kesiapsiagaan rumah tangga, dan tindakan lindungi diri dari rujukan resmi.
                </p>
              </div>

              <Link
                href="/edukasi"
                className="hidden lg:inline-flex items-center gap-1.5 min-h-[44px] px-1 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
              >
                <span className="tnum">
                  {totalArtikel > 0 ? `Lihat semua (${nf.format(totalArtikel)} modul)` : "Lihat semua modul"}
                </span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {isDbDegraded && artikelList.length === 0 ? (
              <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <ErrorState
                  title="Modul edukasi belum dapat dimuat"
                  message="Koneksi database lokal sedang terganggu saat mengambil materi."
                />
              </div>
            ) : artikelList.length === 0 ? (
              <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
                <EmptyState message="Belum ada modul edukasi mitigasi yang dipublikasikan." />
              </div>
            ) : (
              <>
                <MobileEduCarousel items={eduCardItems} totalArtikel={totalArtikel} />

                <div className="hidden lg:block space-y-5">
                  {artikelList.slice(0, 3).map((artikel, idx) => {
                    const visual = getModuleVisual(artikel.slug, artikel.kategori);
                    return (
                      <ArticleNotchedCard
                        key={artikel.id}
                        slug={artikel.slug}
                        judul={artikel.judul}
                        ringkasan={artikel.ringkasan}
                        kategori={artikel.kategori}
                        reversed={idx % 2 === 1}
                        imageSrc={visual.src}
                        imageAlt={visual.alt}
                        imageWidth={visual.width}
                        imageHeight={visual.height}
                        imagePosition={visual.position}
                      />
                    );
                  })}
                </div>
              </>
            )}
          </EduScrollDeck>
        </section>

        {/* ================= SECTION 4: SKENARIO SIMULASI SEJARAH ================= */}
        <RevealOnScroll>
          <section
            aria-labelledby="skenario-heading"
            className="rounded-[28px] lg:rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7 lg:p-10"
          >
            <div className="flex flex-wrap items-end justify-between gap-4 mb-5 sm:mb-7">
              <div className="w-full lg:w-auto text-center lg:text-left space-y-1.5 lg:max-w-[54ch]">
                <p className="hidden lg:block text-xs font-medium text-[var(--color-primary-strong)] tnum">
                  02 · Simulasi dampak
                </p>
                <h2
                  id="skenario-heading"
                  className="text-[26px] sm:text-3xl font-normal leading-[1.12] tracking-[-0.03em] lg:tracking-tight text-[var(--color-text-primary)]"
                >
                  <span className="text-[var(--color-primary-strong)] lg:text-[var(--color-text-primary)]">
                    Skenario simulasi
                  </span>{" "}
                  <span>sejarah</span>
                </h2>
                <p className="mx-auto lg:mx-0 max-w-[36ch] lg:max-w-none text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Lanjutkan pemahaman materi ke estimasi guncangan MMI dan selisih waktu tiba gelombang P/S pada tiga peristiwa besar Indonesia.
                </p>
              </div>
              <Link
                href="/simulasi"
                className="hidden lg:inline-flex items-center gap-1.5 min-h-[44px] px-1 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
              >
                <span>Buka simulasi</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>

            {isDbDegraded && skenarioList.length === 0 ? (
              <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
                <ErrorState
                  title="Daftar skenario sejarah belum dapat dimuat"
                  message="Halaman simulasi tetap dapat dibuka untuk memasukkan parameter manual."
                />
              </div>
            ) : skenarioList.length === 0 ? (
              <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
                <EmptyState message="Belum ada skenario sejarah tersimpan di database." />
              </div>
            ) : (
              <>
                <MobileScenarioCarousel items={scenarioItems} />

                <div className="hidden md:grid md:grid-cols-3 gap-5">
                  {scenarioItems.map((item) => (
                    <ScenarioOverlayCard
                      key={item.id}
                      imageUrl={item.imageUrl}
                      imageAlt={item.imageAlt}
                      icon={
                        item.tipeLokasi === "LAUT" ? (
                          <Waves className="h-5 w-5" />
                        ) : (
                          <Mountain className="h-5 w-5" />
                        )
                      }
                      title={item.title}
                      metaLine={item.metaLine}
                      overview={item.overview}
                      magnitudeText={item.magnitudeText}
                      locationTypeLabel={item.locationTypeLabel}
                      href={item.href}
                    />
                  ))}
                </div>
              </>
            )}
          </section>
        </RevealOnScroll>

        {/* ================= SECTION 5: BERITA TERKINI & CHATBOT MITIGASI ================= */}
        <RevealOnScroll>
          <section
            aria-label="Berita dan Chatbot SIGAP"
            className="rounded-[28px] lg:rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 sm:p-7 lg:p-10 space-y-6 sm:space-y-8"
          >
            {/* MOBILE CHATBOT HERO BLOCK (menyerupai Referensi #4) */}
            <div className="lg:hidden space-y-5">
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[26px] sm:text-3xl font-normal leading-[1.12] tracking-[-0.03em]">
                  <span className="block text-[var(--color-text-primary)]">
                    Tanya langkah keselamatan
                  </span>
                  <span className="block text-[var(--color-primary-strong)]">
                    &amp; konteks gempa terkini
                  </span>
                </h2>
                <div className="w-[76px] h-[76px] shrink-0 overflow-hidden rounded-[18px] border border-[var(--color-border)] bg-[var(--color-surface)]">
                  <img
                    src="/images/berita-zona-megathrust.jpg"
                    alt="Peta pemantauan zona megathrust Indonesia"
                    width={1376}
                    height={768}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                Ajukan pertanyaan tindakan darurat atau ringkasan data BMKG terbaru. Saat kuota AI terbatas, jawaban otomatis beralih ke FAQ lokal.
              </p>

              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "Saat gempa",
                    href: "/chatbot?q=Apa%20yang%20harus%20dilakukan%20saat%20gempa%20terjadi%3F",
                  },
                  {
                    label: "Tas siaga",
                    href: "/chatbot?q=Cara%20menyiapkan%20tas%20siaga%20bencana%3F",
                  },
                  {
                    label: "Skala MMI",
                    href: "/chatbot?q=Apa%20arti%20skala%20MMI%20pada%20dampak%20gempa%3F",
                  },
                ].map((chip) => (
                  <Link
                    key={chip.label}
                    href={chip.href}
                    className="min-h-[44px] rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] hover:bg-[var(--color-surface)] px-2 text-xs font-medium text-[var(--color-text-primary)] flex items-center justify-center text-center whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                  >
                    {chip.label}
                  </Link>
                ))}
              </div>

              <MobileChatbotQuickAsk />
            </div>

            {/* DESKTOP HEADER */}
            <div className="hidden lg:flex flex-wrap items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]/80">
              <div className="space-y-1.5 max-w-[54ch]">
                <p className="text-xs font-medium text-[var(--color-primary-strong)] tnum">
                  03 · Berita &amp; konsultasi
                </p>
                <h2
                  id="berita-chatbot-heading"
                  className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--color-text-primary)]"
                >
                  Berita &amp; Chatbot SIGAP
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Ikuti ringkasan berita kebencanaan dari penerbit terverifikasi atau ajukan pertanyaan mitigasi kepada asisten SIGAP.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-4">
                <Link
                  href="/edukasi#heading-berita"
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-1 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  <span>Semua berita</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
                <Link
                  href="/chatbot"
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-1 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  <span>Buka chatbot</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="pt-6 border-t border-[var(--color-border)]/80 lg:pt-0 lg:border-t-0 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
              {/* Kolom kiri: liputan media rujukan otomatis */}
              <div className="lg:col-span-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                    <Newspaper
                      className="w-4 h-4 text-[var(--color-primary-strong)] shrink-0"
                      aria-hidden="true"
                    />
                    <span>Liputan media rujukan</span>
                  </div>
                  <Link
                    href="/edukasi#heading-berita"
                    className="lg:hidden inline-flex items-center gap-1 min-h-[44px] px-1 text-xs font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors rounded"
                  >
                    <span>Semua berita</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                  <span className="hidden lg:inline text-xs text-[var(--color-text-secondary)]">
                    Tautan membuka situs penerbit asli
                  </span>
                </div>

                {beritaList.length === 0 ? (
                  <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
                    <EmptyState message="Berita belum tersedia." />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {beritaList.map((berita) => (
                      <NewsPreviewCard
                        key={berita.id}
                        judul={berita.judul}
                        sumber={berita.sumber}
                        domain={berita.domain}
                        url={berita.url}
                        tanggalTerbit={berita.tanggalTerbit}
                        ringkasan={berita.ringkasan}
                        thumbnailSrc={berita.thumbnailUrl}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* DESKTOP Kolom kanan: panel ringkas Chatbot SIGAP */}
              <div className="hidden lg:block lg:col-span-5 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 space-y-5">
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                    <MessageSquareText
                      className="w-4 h-4 text-[var(--color-primary-strong)] shrink-0"
                      aria-hidden="true"
                    />
                    <span>Asisten edukasi mitigasi berbasis rujukan</span>
                  </div>

                  <h3 className="text-xl font-normal tracking-tight text-[var(--color-text-primary)] leading-snug">
                    Tanya langkah keselamatan &amp; konteks gempa terkini
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    Ajukan pertanyaan tindakan darurat atau ringkasan data BMKG terbaru. Saat kuota AI terbatas, jawaban otomatis beralih ke FAQ lokal.
                  </p>

                  <div className="pt-1">
                    <Link
                      href="/chatbot"
                      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-full bg-[var(--color-cta)] px-5 text-sm font-medium text-[var(--color-on-cta)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] active:bg-[var(--color-primary-strong)] active:text-[var(--color-on-cta)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                    >
                      <span>Mulai percakapan</span>
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </Link>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--color-border)] space-y-2.5">
                  <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                    Contoh pertanyaan
                  </p>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/chatbot?q=Apa%20yang%20harus%20dilakukan%20saat%20gempa%20terjadi%3F"
                      className="min-h-[44px] rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] active:bg-[var(--color-surface-sunken)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] flex items-center justify-between gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                    >
                      <span>Apa yang harus dilakukan saat gempa terjadi?</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/chatbot?q=Cara%20menyiapkan%20tas%20siaga%20bencana%3F"
                      className="min-h-[44px] rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] active:bg-[var(--color-surface-sunken)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] flex items-center justify-between gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                    >
                      <span>Cara menyiapkan tas siaga bencana?</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
                    </Link>
                    <Link
                      href="/chatbot?q=Apa%20arti%20skala%20MMI%20pada%20dampak%20gempa%3F"
                      className="min-h-[44px] rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] active:bg-[var(--color-surface-sunken)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] flex items-center justify-between gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                    >
                      <span>Apa arti skala MMI pada dampak gempa?</span>
                      <ArrowUpRight className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </RevealOnScroll>

        {/* ================= PENUTUP MOBILE KHAS REFERENSI #4 ================= */}
        <section aria-label="Ringkasan kesiapsiagaan SIGAP" className="lg:hidden pt-2">
          <div className="text-center space-y-2">
            <p className="text-[24px] sm:text-3xl font-normal leading-[1.14] tracking-[-0.03em]">
              <span className="block text-[var(--color-primary-strong)]">
                Kesiapsiagaan gempa
              </span>
              <span className="block text-[var(--color-text-primary)]">
                untuk masyarakat Indonesia
              </span>
            </p>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-[34ch] mx-auto leading-relaxed">
              Pantau data resmi BMKG dan latih langkah mitigasi bersama SIGAP Gempa.
            </p>
          </div>

          <div className="relative mt-5 rounded-[28px] bg-[var(--color-surface)] overflow-hidden min-h-[156px] pt-8 px-4 pb-4 flex items-end justify-between gap-3">
            {/* Lekukan notch atas tengah menyatu dengan kanvas halaman */}
            <svg
              width="108"
              height="34"
              viewBox="0 0 108 34"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-[108px] h-[34px]"
              aria-hidden="true"
            >
              <path
                d="M 0 0 L 108 0 C 90 0, 82 32, 54 32 C 26 32, 18 0, 0 0 Z"
                fill="var(--color-background)"
              />
            </svg>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute top-1.5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full border border-[var(--color-primary-strong)]/45 bg-[var(--color-surface-raised)] p-1.5 flex items-center justify-center"
            >
              <img src="/logo/symbol.svg" alt="" width={24} height={24} className="w-full h-full" />
            </span>

            <img
              src="/images/tectonic-island.png"
              alt=""
              width={1519}
              height={948}
              className="w-[56%] max-w-[220px] h-auto -ml-5 -mb-5 object-contain select-none pointer-events-none"
            />

            <Link
              href="/edukasi"
              className="relative z-10 w-[132px] sm:w-[152px] shrink-0 rounded-[18px] bg-[var(--color-surface-raised)] border border-[var(--color-border)]/70 p-3.5 text-left hover:border-[var(--color-border-strong)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
            >
              <span className="block text-[11px] leading-tight text-[var(--color-text-secondary)]">
                Data resmi
              </span>
              <span className="mt-1 block text-sm font-medium leading-tight text-[var(--color-primary-strong)]">
                BMKG &amp; BNPB
              </span>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[var(--color-text-primary)]">
                <span>Buka edukasi</span>
                <ArrowUpRight className="w-3 h-3" aria-hidden="true" />
              </span>
            </Link>
          </div>
        </section>

      </div>

      <Footer
        lastUpdatedText={
          lastSyncTime ? `Disinkronkan ${formatWibDate(lastSyncTime)}` : undefined
        }
      />
    </div>
  );
}
