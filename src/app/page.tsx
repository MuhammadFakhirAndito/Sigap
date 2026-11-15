import React from "react";
import Link from "next/link";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ArticleNotchedCard } from "@/components/edukasi/ArticleNotchedCard";
import { fetchBmkgAutogempa } from "@/lib/bmkg/client";
import { ReloadPageButton } from "@/components/beranda/ReloadPageButton";
import { prisma } from "@/lib/prisma";
import { NormalizedGempa, StatusTsunamiType } from "@/types/bmkg";
import type { Prisma } from "@prisma/client";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Globe,
  HelpCircle,
  MessageSquareText,
  Radio,
  Send,
  Share2,
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
    alt: "Ilustrasi diorama batu berlapis dengan bidang sesar geologi dan lumut hijau",
    width: 1792,
    height: 1024,
    position: "object-center",
  },
  "persiapan-sebelum-gempa": {
    src: "/images/modul-mitigasi-siaga.jpg",
    alt: "Ruang kerja minimalis dengan dinding lumut, meja kokoh, dan tas siaga bencana di dekat pintu",
    width: 1344,
    height: 768,
    position: "object-[50%_68%]",
  },
  "saat-gempa-terjadi": {
    src: "/images/modul-penanggulangan-lindung.jpg",
    alt: "Ruang paviliun dengan bangku kayu-batu kokoh yang terhubung ke halaman terbuka bebas hambatan",
    width: 1792,
    height: 1024,
    position: "object-[50%_65%]",
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

export default async function HomePage() {
  let latestQuake: NormalizedGempa | null = await fetchBmkgAutogempa();
  let isBmkgFallback = false;
  let lastSyncTime: Date | null = null;
  let skenarioList: SkenarioPreview[] = [];
  let artikelList: ArtikelPreview[] = [];
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

  // 2. Ambil catatan sinkronisasi terakhir, statistik riil DB, skenario simulasi, & 3 modul edukasi inti
  try {
    const [syncLog, skenarios, allArtikels, countGempa, countSkenario, countArtikel] =
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
        prisma.artikel.count(),
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
    totalArtikel = countArtikel;
  } catch {
    skenarioList = [];
    artikelList = [];
    isDbDegraded = true;
  }

  const hrefSimulasiLatest = latestQuake
    ? `/simulasi?m=${latestQuake.magnitudo}&d=${latestQuake.kedalamanKm}&lat=${latestQuake.lat}&lon=${latestQuake.lon}&wilayah=${encodeURIComponent(latestQuake.wilayah)}`
    : "/simulasi";

  const dirasakanTeks =
    latestQuake?.dirasakan &&
      latestQuake.dirasakan.trim() !== "" &&
      latestQuake.dirasakan.trim() !== "-"
      ? latestQuake.dirasakan.trim()
      : "Tidak tercatat dirasakan";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-hidden">
      {/* Container utama SIGAP Gempa: max-w-[1320px] pas & seimbang */}
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-16 sm:pb-20 flex-1 flex flex-col space-y-14 sm:space-y-20">

        {/* ================= HERO: KOMPOSISI MENGIKUTI REFERENSI (BATU MELUBER KE KIRI & BAWAH CARD) ================= */}
        <section aria-label="Informasi gempa terkini" className="w-full relative !mb-5 lg:!mb-6">
          <NotchNavbar variant="notch" />

          {/* lg: rasio tetap agar posisi batu (persen) konsisten di semua lebar desktop */}
          <div className="relative w-full lg:aspect-[15/8] rounded-b-[40px] md:rounded-b-[48px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-6 sm:px-9 lg:px-11 pt-4 sm:pt-6 lg:pt-10 pb-6 lg:pb-0 flex flex-col lg:block">

            {/* TOOLBAR KIRI: SOSIAL + BAHASA (VERTIKAL) */}
            <div className="hidden lg:flex flex-col gap-10 absolute top-[6%] left-11 z-30">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  aria-label="Instagram SIGAP"
                  className="w-7 h-7 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center hover:opacity-85 transition-opacity"
                >
                  <Radio className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Kanal Telegram SIGAP"
                  className="w-7 h-7 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center hover:opacity-85 transition-opacity"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Bagikan informasi"
                  className="w-7 h-7 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center hover:opacity-85 transition-opacity"
                >
                  <Share2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex flex-col items-start gap-2 pl-1 text-[12px] leading-none">
                <span className="w-6 h-6 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5 text-[var(--color-text-primary)]" />
                </span>
                <span className="pt-1 font-medium text-[var(--color-text-primary)]">ID</span>
                <span className="text-[var(--color-text-secondary)]">EN</span>
              </div>
            </div>

            {/* KOLOM KANAN: HEADLINE + CTA */}
            <div className="relative z-30 lg:ml-auto lg:w-fit">
              <div className="flex flex-col lg:grid lg:grid-cols-[auto_1fr] lg:items-center lg:gap-x-8 lg:gap-y-1.5">
                <h1 className="contents text-[clamp(28px,3.6vw,52px)] font-normal leading-[1.12] tracking-[-0.03em]">
                  <span className="lg:col-span-2 lg:whitespace-nowrap">
                    <span className="text-[var(--color-primary)]">Pantau gempa bumi</span>{" "}
                    <span className="text-[var(--color-text-primary)]">untuk</span>
                  </span>
                  <span className="lg:col-start-2 lg:row-start-2 lg:text-right text-[var(--color-text-primary)] lg:whitespace-nowrap">
                    kesiapsiagaan kita
                  </span>
                </h1>
                {/* Subjudul sejajar tepi kiri "Pantau" dan berada di samping "kesiapsiagaan kita" pada desktop */}
                <p className="mt-3 lg:mt-0 lg:col-start-1 lg:row-start-2 text-xs leading-snug text-[var(--color-text-secondary)] max-w-[320px]">
                  Data resmi BMKG dan
                  <br className="hidden lg:inline" /> edukasi mitigasi terukur
                </p>
              </div>

              <div className="flex justify-start lg:justify-end mt-6 lg:mt-[clamp(28px,3.4vw,48px)]">
                <Link
                  href="/riwayat"
                  className="group inline-flex items-center justify-between w-[clamp(200px,15vw,216px)] h-12 lg:h-[clamp(46px,3.6vw,52px)] rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] pl-7 pr-1 text-sm font-medium hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors"
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

            {/* BATU TEKTONIK: lg meluber ke kiri (dibatasi tepi viewport) dan ke bawah card */}
            <div className="order-3 relative z-10 pointer-events-none mt-6 -mx-[8%] w-[116%] lg:mx-0 lg:mt-0 lg:absolute lg:top-[16%] lg:w-[78%] lg:left-[max(-7%,calc((100%_-_100vw)/2_+_16px))]">
              <img
                src="/images/tectonic-island.png"
                alt="Fragmen lempeng tektonik bumi dengan batuan berlumut dan retakan seismik"
                className="w-full h-auto object-contain select-none"
              />
            </div>

            {/* 3 CHIP KECIL DI SUDUT KIRI BAWAH (DI DEPAN BATU) */}
            <div className="order-4 relative z-20 grid grid-cols-3 gap-2 sm:flex sm:flex-wrap sm:gap-3 mt-4 lg:mt-0 lg:absolute lg:left-12 lg:bottom-[8%]">
              {[
                { label: "Sumber resmi", line1: "BMKG", line2: "Indonesia" },
                { label: "Perhitungan fisik", line1: "Estimasi", line2: "MMI & P-S" },
                { label: "Asisten mitigasi", line1: "Chatbot", line2: "SIGAP" },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="sm:w-[116px] lg:w-[118px] rounded-[20px] border border-[var(--color-border)]/80 bg-[var(--color-surface-raised)]/95 backdrop-blur-[2px] px-2 py-3 sm:px-3 sm:py-3.5 flex flex-col items-center justify-center text-center"
                >
                  <p className="text-[10px] sm:text-[10.5px] leading-tight text-[var(--color-text-secondary)]">
                    {chip.label}
                  </p>
                  <p className="mt-1.5 text-[12.5px] sm:text-[13px] font-medium leading-[1.2] text-[var(--color-primary-strong)]">
                    <span className="block">{chip.line1}</span>
                    <span className="block">{chip.line2}</span>
                  </p>
                </div>
              ))}
            </div>

            {/* KARTU MAGNITUDO (KANAN BAWAH, DI DEPAN BATU) */}
            <div className="order-5 relative z-20 mt-4 lg:mt-0 w-full max-w-[260px] lg:max-w-none lg:absolute lg:right-11 lg:bottom-[5%] lg:w-[19.5%] lg:aspect-[7/8] rounded-[24px] bg-[var(--color-surface-raised)] p-5 flex flex-col">
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

        {/* ================= SECTION 2: SIMULASI PREVIEW + STATISTIK ================= */}
        <section aria-labelledby="ringkasan-sigap-heading" className="pt-2 sm:pt-4">
          {/* Bar statistik ringkas */}
          <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4 mb-10 sm:mb-14">
            <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-3">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Platform pemantauan dan edukasi gempa bumi berbasis data BMKG
              </p>
              <dl className="flex items-center gap-8 sm:gap-10">
                <div className="flex items-baseline gap-2">
                  <dd className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--color-text-primary)] tnum">
                    {isDbDegraded ? "–" : nf.format(totalGempa)}
                  </dd>
                  <dt className="text-xs text-[var(--color-text-secondary)]">gempa</dt>
                </div>
                <div className="flex items-baseline gap-2">
                  <dd className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--color-text-primary)] tnum">
                    {isDbDegraded ? "–" : nf.format(totalSkenario)}
                  </dd>
                  <dt className="text-xs text-[var(--color-text-secondary)]">skenario</dt>
                </div>
                <div className="flex items-baseline gap-2">
                  <dd className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--color-text-primary)] tnum">
                    {isDbDegraded ? "–" : nf.format(totalArtikel)}
                  </dd>
                  <dt className="text-xs text-[var(--color-text-secondary)]">artikel</dt>
                </div>
              </dl>
            </div>
          </div>

          {/* Dua kolom: heading kiri + pratinjau simulasi kanan (dark card) */}
          <div className="grid items-stretch gap-8 lg:grid-cols-2 lg:gap-10">
            <div className="flex flex-col justify-center gap-7">
              <div>
                <h2
                  id="ringkasan-sigap-heading"
                  className="max-w-lg text-3xl sm:text-4xl lg:text-[42px] font-normal leading-[1.1] tracking-[-0.025em] text-[var(--color-text-primary)]"
                >
                  Pahami risiko gempa sebelum guncangan datang
                </h2>
                <p className="mt-4 max-w-md text-sm sm:text-base leading-relaxed text-[var(--color-text-secondary)]">
                  Data resmi BMKG dipadukan kalkulator intensitas MMI, waktu tiba gelombang P–S, serta panduan mitigasi berbasis rujukan.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Link
                  href="/riwayat"
                  className="inline-flex items-center min-h-[44px] rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-4 text-xs sm:text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  Riwayat BMKG
                </Link>
                <Link
                  href="/simulasi"
                  className="inline-flex items-center min-h-[44px] rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-4 text-xs sm:text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  Simulasi MMI &amp; P–S
                </Link>
                <Link
                  href="/chatbot"
                  className="inline-flex items-center min-h-[44px] rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-4 text-xs sm:text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  Tanya chatbot
                </Link>
              </div>
            </div>

            {/* Ringkasan gempa terbaru dari BMKG */}
            <div
              aria-labelledby="latest-quake-heading"
              className="rounded-[28px] overflow-hidden bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex flex-col justify-between"
            >
              {latestQuake ? (
                <>
                  {/* Strip header editorial */}
                  <div className="bg-[var(--color-surface)] border-b border-[var(--color-border)] px-6 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${isBmkgFallback
                          ? "bg-[var(--color-warning-strong)]"
                          : "bg-[var(--color-text-primary)]"
                          }`}
                        aria-hidden="true"
                      />
                      <h3
                        id="latest-quake-heading"
                        className="text-base font-medium tracking-[-0.015em] text-[var(--color-text-primary)]"
                      >
                        Gempa terbaru
                      </h3>
                    </div>

                    <p className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
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

                  <div className="p-6 sm:p-8 flex flex-col justify-between gap-6 flex-1">
                    {isBmkgFallback && (
                      <div
                        role="status"
                        className="rounded-[16px] border border-[var(--color-warning-strong)]/40 bg-[var(--color-background)] px-3.5 py-2.5 flex items-start gap-2.5 text-xs leading-relaxed text-[var(--color-warning-strong)]"
                      >
                        <AlertTriangle
                          className="w-4 h-4 shrink-0 mt-0.5"
                          aria-hidden="true"
                        />
                        <span>
                          BMKG tidak dapat diakses. Data terakhir{" "}
                          {formatWibDate(lastSyncTime ?? latestQuake.waktuUtc)}.
                        </span>
                      </div>
                    )}

                    {/* Fokus utama: magnitudo + lokasi episentrum + potensi tsunami */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
                      <div className="shrink-0">
                        <p className="text-xs font-medium text-[var(--color-text-secondary)] mb-1.5">
                          Magnitudo
                        </p>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-5xl sm:text-6xl font-normal leading-none tracking-[-0.03em] text-[var(--color-text-primary)] tnum">
                            {formatMagnitude(latestQuake.magnitudo)}
                          </span>
                          <span className="text-lg font-medium text-[var(--color-text-secondary)]">
                            M
                          </span>
                        </div>
                      </div>

                      <div className="min-w-0 flex-1 sm:border-l sm:border-[var(--color-border)] sm:pl-6">
                        <p className="text-base sm:text-lg font-medium leading-snug text-[var(--color-text-primary)] break-words">
                          {latestQuake.wilayah}
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-2">
                          {latestQuake.statusTsunami === "BERPOTENSI" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-error-strong)]/40 bg-[var(--color-background)] px-3 py-1 text-xs font-medium text-[var(--color-error-strong)]">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>{latestQuake.potensiTeks}</span>
                            </span>
                          ) : latestQuake.statusTsunami === "AMAN" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-background)] px-3 py-1 text-xs font-medium text-[var(--color-text-primary)]">
                              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>{latestQuake.potensiTeks || "Tidak berpotensi tsunami"}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                              <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                              <span>
                                {latestQuake.potensiTeks || "Potensi tsunami tidak dinyatakan"}
                              </span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detail terukur tanpa kartu di dalam kartu */}
                    <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 pt-5 border-t border-[var(--color-border)]">
                      <div className="min-w-0">
                        <dt className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Waktu (WIB)
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--color-text-primary)] tnum">
                          {formatWibDate(latestQuake.waktuUtc)}
                        </dd>
                      </div>

                      <div className="min-w-0">
                        <dt className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Kedalaman
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--color-text-primary)] tnum">
                          {latestQuake.kedalamanKm.toLocaleString("id-ID")} km
                        </dd>
                      </div>

                      <div className="min-w-0">
                        <dt className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Koordinat
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--color-text-primary)] tnum">
                          {formatCoordinate(latestQuake.lat, latestQuake.lon)}
                        </dd>
                      </div>

                      <div className="min-w-0">
                        <dt className="text-xs font-medium text-[var(--color-text-secondary)]">
                          Dirasakan
                        </dt>
                        <dd className="mt-1 text-sm font-medium text-[var(--color-text-primary)] break-words">
                          {dirasakanTeks}
                        </dd>
                      </div>
                    </dl>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[var(--color-border)]">
                      <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] max-w-[280px] tnum">
                        Sumber: BMKG · diperbarui {formatWibDate(latestQuake.waktuUtc)}. Bukan
                        sistem peringatan dini resmi.
                      </p>
                      <Link
                        href={hrefSimulasiLatest}
                        className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-full bg-[var(--color-cta)] px-5 text-sm font-medium text-[var(--color-on-cta)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] active:bg-[var(--color-primary-strong)] active:text-[var(--color-on-cta)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                      >
                        <span>Simulasikan gempa ini</span>
                        <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-6 sm:p-8 flex flex-col justify-between gap-6 my-auto">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-error-strong)]">
                      <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Koneksi data terputus</span>
                    </div>
                    <h3
                      id="latest-quake-heading"
                      className="text-lg font-medium text-[var(--color-text-primary)]"
                    >
                      Data gempa terbaru belum tersedia
                    </h3>
                    <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] max-w-[42ch]">
                      Gagal terhubung ke BMKG dan belum ada catatan gempa lokal yang dapat
                      ditampilkan.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2.5">
                    <ReloadPageButton />
                    <Link
                      href="/riwayat"
                      className="inline-flex items-center justify-center min-h-[44px] rounded-full border border-[var(--color-border-strong)] px-5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:bg-[var(--color-surface-sunken)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
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
        <section aria-labelledby="edukasi-modul-heading">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <h2
              id="edukasi-modul-heading"
              className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--color-text-primary)]"
            >
              Modul edukasi
            </h2>
            <Link
              href="/edukasi"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-1 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
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
            <div className="space-y-4 sm:space-y-5">
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
          )}
        </section>

        {/* ================= SECTION 4: SKENARIO SIMULASI SEJARAH ================= */}
        <section aria-labelledby="skenario-heading">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <h2
              id="skenario-heading"
              className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--color-text-primary)]"
            >
              Skenario simulasi sejarah
            </h2>
            <Link
              href="/simulasi"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors"
            >
              <span>Buka simulasi</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {isDbDegraded && skenarioList.length === 0 ? (
            <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <ErrorState
                title="Daftar skenario sejarah belum dapat dimuat"
                message="Halaman simulasi tetap dapat dibuka untuk memasukkan parameter manual."
              />
            </div>
          ) : skenarioList.length === 0 ? (
            <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <EmptyState message="Belum ada skenario sejarah tersimpan di database." />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {skenarioList.map((sk) => {
                const hrefPreset = `/simulasi?m=${sk.magnitudo}&d=${sk.kedalamanKm}&lat=${sk.lat}&lon=${sk.lon}&wilayah=${encodeURIComponent(sk.nama)}`;
                return (
                  <article
                    key={sk.id}
                    className="group relative rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-normal tracking-tight text-[var(--color-text-primary)] leading-none tnum">
                            {formatMagnitude(sk.magnitudo)}
                          </span>
                          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                            M
                          </span>
                        </div>
                        <p className="mt-1.5 text-xs text-[var(--color-text-secondary)]">
                          {sk.tipeLokasi === "LAUT" ? "Lokasi laut" : "Lokasi darat"}
                        </p>
                      </div>
                      <span
                        aria-hidden="true"
                        className="w-11 h-11 shrink-0 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] group-hover:bg-[var(--color-cta)] group-hover:text-[var(--color-on-cta)] group-hover:border-[var(--color-cta)] flex items-center justify-center transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <h3 className="text-base font-medium text-[var(--color-text-primary)] leading-snug">
                        <Link
                          href={hrefPreset}
                          className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary-strong)] rounded"
                        >
                          {sk.nama}
                        </Link>
                      </h3>
                      {sk.deskripsiSingkat && (
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed">
                          {sk.deskripsiSingkat}
                        </p>
                      )}
                    </div>

                    <p className="pt-3 border-t border-[var(--color-border)]/70 text-xs text-[var(--color-text-secondary)] tnum">
                      Kedalaman {sk.kedalamanKm} km · {formatCoordinate(sk.lat, sk.lon)}
                    </p>
                  </article>
                );
              })}
            </div>
          )}
        </section>

        {/* ================= SECTION 5: CHATBOT MITIGASI ================= */}
        <section aria-labelledby="chatbot-section-heading">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <h2
              id="chatbot-section-heading"
              className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--color-text-primary)]"
            >
              Tanya Chatbot SIGAP
            </h2>
            <Link
              href="/chatbot"
              className="inline-flex items-center gap-1.5 min-h-[44px] px-1 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
            >
              <span>Buka chatbot</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center">
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
                <MessageSquareText
                  className="w-4 h-4 text-[var(--color-primary-strong)] shrink-0"
                  aria-hidden="true"
                />
                <span>Asisten edukasi mitigasi berbasis rujukan</span>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-xl sm:text-2xl font-normal tracking-tight text-[var(--color-text-primary)] leading-snug">
                  Tanya langkah keselamatan &amp; konteks gempa terkini
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-[48ch]">
                  Ajukan pertanyaan seputar tindakan darurat sebelum, saat, dan sesudah gempa, atau
                  ringkasan data terbaru BMKG. Saat kuota model AI terbatas, jawaban otomatis beralih
                  ke basis FAQ lokal.
                </p>
              </div>

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

            <div className="lg:col-span-6 space-y-2.5">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                Contoh pertanyaan
              </p>
              <div className="flex flex-col gap-2.5">
                <Link
                  href="/chatbot?q=Apa%20yang%20harus%20dilakukan%20saat%20gempa%20terjadi%3F"
                  className="min-h-[44px] rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] active:bg-[var(--color-surface-sunken)] px-4 py-3 text-sm text-[var(--color-text-primary)] flex items-center justify-between gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  <span>Apa yang harus dilakukan saat gempa terjadi?</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
                </Link>
                <Link
                  href="/chatbot?q=Cara%20menyiapkan%20tas%20siaga%20bencana%3F"
                  className="min-h-[44px] rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] active:bg-[var(--color-surface-sunken)] px-4 py-3 text-sm text-[var(--color-text-primary)] flex items-center justify-between gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  <span>Cara menyiapkan tas siaga bencana?</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
                </Link>
                <Link
                  href="/chatbot?q=Apa%20arti%20skala%20MMI%20pada%20dampak%20gempa%3F"
                  className="min-h-[44px] rounded-[16px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] active:bg-[var(--color-surface-sunken)] px-4 py-3 text-sm text-[var(--color-text-primary)] flex items-center justify-between gap-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  <span>Apa arti skala MMI pada dampak gempa?</span>
                  <ArrowUpRight className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
                </Link>
              </div>
            </div>
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
