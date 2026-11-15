import React from "react";
import Link from "next/link";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import type { QuakeCardData } from "@/components/ui/QuakeCard";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ArticleListItem } from "@/components/edukasi/ArticleListItem";
import { fetchBmkgAutogempa } from "@/lib/bmkg/client";
import { prisma } from "@/lib/prisma";
import { runSimulasiCalculation, formatIdNumber } from "@/lib/simulasi";
import { NormalizedGempa, StatusTsunamiType } from "@/types/bmkg";
import type { Prisma } from "@prisma/client";
import {
  ArrowUpRight,
  MessageSquareText,
  Globe,
  Share2,
  Send,
  Radio,
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

type ArtikelPreview = Prisma.ArtikelGetPayload<{ include: { sumber: true } }>;
type SkenarioPreview = Prisma.SkenarioSimulasiGetPayload<Record<string, never>>;

export default async function HomePage() {
  let latestQuake: NormalizedGempa | null = await fetchBmkgAutogempa();
  let isBmkgFallback = false;
  let lastSyncTime: Date | null = null;
  let dirasakanList: QuakeCardData[] = [];
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

  // 2. Ambil catatan sinkronisasi terakhir, statistik riil DB, dirasakan, skenario simulasi, & artikel edukasi
  try {
    const [syncLog, dirasakan, skenarios, artikels, countGempa, countSkenario, countArtikel] =
      await Promise.all([
        prisma.syncLog.findFirst({
          where: { status: "OK" },
          orderBy: { createdAt: "desc" },
        }),
        prisma.gempa.findMany({
          where: { isDirasakan: true },
          orderBy: { waktuUtc: "desc" },
          take: 3,
        }),
        prisma.skenarioSimulasi.findMany({
          orderBy: { urutan: "asc" },
          take: 3,
        }),
        prisma.artikel.findMany({
          orderBy: [{ urutan: "asc" }, { updatedAt: "desc" }],
          take: 2,
          include: { sumber: true },
        }),
        prisma.gempa.count(),
        prisma.skenarioSimulasi.count(),
        prisma.artikel.count(),
      ]);
    if (syncLog) lastSyncTime = syncLog.createdAt;
    dirasakanList = dirasakan;
    skenarioList = skenarios;
    artikelList = artikels;
    totalGempa = countGempa;
    totalSkenario = countSkenario;
    totalArtikel = countArtikel;
  } catch {
    dirasakanList = [];
    skenarioList = [];
    artikelList = [];
    isDbDegraded = true;
  }

  const hrefSimulasiLatest = latestQuake
    ? `/simulasi?m=${latestQuake.magnitudo}&d=${latestQuake.kedalamanKm}&lat=${latestQuake.lat}&lon=${latestQuake.lon}&wilayah=${encodeURIComponent(latestQuake.wilayah)}`
    : "/simulasi";

  const previewSimInput = latestQuake
    ? {
        magnitudo: latestQuake.magnitudo,
        kedalamanKm: latestQuake.kedalamanKm,
        lat: latestQuake.lat,
        lon: latestQuake.lon,
        jarakPengamatKm: 50,
        tipeLokasi: (latestQuake.wilayah.toLowerCase().includes("darat") ? "DARAT" : "LAUT") as "DARAT" | "LAUT",
        wilayah: latestQuake.wilayah,
      }
    : null;
  const previewSim = previewSimInput ? runSimulasiCalculation(previewSimInput) : null;

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

            {/* Kartu gelap pratinjau simulasi */}
            <div className="rounded-[24px] bg-[var(--color-cta)] text-[var(--color-on-cta)] p-6 sm:p-8 flex flex-col justify-between gap-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="inline-flex items-center rounded-full bg-[var(--color-on-cta)]/10 border border-[var(--color-on-cta)]/15 px-3 py-1 text-xs font-medium">
                  {isBmkgFallback ? "Pratinjau · data lokal" : "Pratinjau simulasi · 50 km"}
                </span>
                <span className="text-xs opacity-60">Estimasi edukasi</span>
              </div>

              {latestQuake && previewSim ? (
                <div className="space-y-5">
                  <p className="text-xs opacity-70 line-clamp-1 tnum">
                    M {formatMagnitude(latestQuake.magnitudo)} · {latestQuake.wilayah}
                  </p>

                  <div className="flex items-baseline gap-3">
                    <span className="text-5xl sm:text-6xl font-normal tracking-tight tnum">
                      {previewSim.mmi.roman}
                    </span>
                    <div>
                      <p className="text-base sm:text-lg font-medium">{previewSim.mmi.label}</p>
                      <p className="text-xs opacity-55">Skala MMI (Allen dkk., 2012)</p>
                    </div>
                  </div>

                  {/* 12-segmen skala MMI */}
                  <div className="space-y-1.5">
                    <div
                      className="grid grid-cols-12 gap-1"
                      role="img"
                      aria-label={`Tingkat guncangan ${previewSim.mmi.roman} dari XII pada skala MMI`}
                    >
                      {Array.from({ length: 12 }, (_, idx) => (
                        <span
                          key={idx}
                          className={`h-2 rounded-full ${
                            idx + 1 <= previewSim.mmi.clampedLevel
                              ? "bg-[var(--color-primary)]"
                              : "bg-[var(--color-on-cta)]/15"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between text-xs opacity-50 tnum">
                      <span>I</span>
                      <span>VI</span>
                      <span>XII</span>
                    </div>
                  </div>

                  {/* Waktu gelombang */}
                  <dl className="grid grid-cols-3 gap-3 rounded-[16px] bg-[var(--color-on-cta)]/[0.07] p-4 text-xs">
                    <div>
                      <dt className="opacity-65">Gel. P</dt>
                      <dd className="mt-1 text-sm font-medium tnum">
                        {formatIdNumber(previewSim.tpSeconds, 1)} dtk
                      </dd>
                    </div>
                    <div>
                      <dt className="opacity-65">Gel. S</dt>
                      <dd className="mt-1 text-sm font-medium tnum">
                        {formatIdNumber(previewSim.tsSeconds, 1)} dtk
                      </dd>
                    </div>
                    <div>
                      <dt className="opacity-65">Golden time</dt>
                      <dd className="mt-1 text-sm font-medium tnum">
                        {formatIdNumber(previewSim.goldenTimeSeconds, 1)} dtk
                      </dd>
                    </div>
                  </dl>
                </div>
              ) : (
                <div className="rounded-[16px] bg-[var(--color-on-cta)]/[0.07] p-5 space-y-2">
                  <p className="text-sm font-medium">Pratinjau belum tersedia</p>
                  <p className="text-xs opacity-65 leading-relaxed">
                    Data gempa terkini belum dapat dimuat. Masukkan parameter manual di simulator.
                  </p>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--color-on-cta)]/12">
                <p className="text-xs opacity-55 max-w-[240px]">
                  Bukan data resmi BMKG
                </p>
                <Link
                  href={hrefSimulasiLatest}
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-full bg-[var(--color-on-cta)] px-5 text-xs sm:text-sm font-medium text-[var(--color-cta)] hover:bg-[var(--color-surface)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]"
                >
                  <span>Buka simulator</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================= SECTION 3: GEMPA DIRASAKAN TERBARU ================= */}
        <section aria-labelledby="dirasakan-heading">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <h2
              id="dirasakan-heading"
              className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--color-text-primary)]"
            >
              Gempa dirasakan terbaru
            </h2>
            <Link
              href="/riwayat?tipe=dirasakan"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors"
            >
              <span>Lihat semua</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {isDbDegraded && dirasakanList.length === 0 ? (
            <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <ErrorState
                title="Daftar gempa dirasakan belum dapat dimuat"
                message="Koneksi database lokal sedang terganggu."
              />
            </div>
          ) : dirasakanList.length === 0 ? (
            <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
              <EmptyState message="Belum ada data gempa dirasakan yang tersimpan saat ini." />
            </div>
          ) : (
            <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] divide-y divide-[var(--color-border)] overflow-hidden">
              {dirasakanList.slice(0, 3).map((quake) => {
                const hrefQuake = `/simulasi?m=${quake.magnitudo}&d=${quake.kedalamanKm}&lat=${quake.lat}&lon=${quake.lon}&wilayah=${encodeURIComponent(quake.wilayah)}`;
                const tsunamiVariant =
                  quake.statusTsunami === "AMAN"
                    ? "tsunami_aman"
                    : quake.statusTsunami === "BERPOTENSI"
                    ? "tsunami_berpotensi"
                    : "tsunami_tidak_dinyatakan";
                return (
                  <article
                    key={quake.id}
                    className="group relative p-5 sm:px-6 sm:py-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:bg-[var(--color-surface)]/60 transition-colors"
                  >
                    <div className="flex items-baseline gap-1 sm:w-20 shrink-0">
                      <span className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--color-text-primary)] tnum">
                        {formatMagnitude(quake.magnitudo)}
                      </span>
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                        M
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <h3 className="text-sm sm:text-base font-medium text-[var(--color-text-primary)] leading-snug">
                        <Link
                          href={hrefQuake}
                          className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary-strong)] rounded"
                        >
                          {quake.wilayah}
                        </Link>
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)] tnum">
                        {formatWibDate(new Date(quake.waktuUtc))} · Kedalaman {quake.kedalamanKm} km
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <StatusBadge variant={tsunamiVariant} />
                      <span
                        aria-hidden="true"
                        className="w-11 h-11 shrink-0 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] group-hover:bg-[var(--color-cta)] group-hover:text-[var(--color-on-cta)] group-hover:border-[var(--color-cta)] flex items-center justify-center transition-colors"
                      >
                        <ArrowUpRight className="w-4 h-4" />
                      </span>
                    </div>
                  </article>
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

        {/* ================= SECTION 5: EDUKASI & CHATBOT ================= */}
        <section aria-labelledby="edukasi-heading">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
            <h2
              id="edukasi-heading"
              className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--color-text-primary)]"
            >
              Panduan mitigasi &amp; chatbot
            </h2>
            <Link
              href="/edukasi"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors"
            >
              <span>Semua materi</span>
              <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
            <div className="lg:col-span-7 flex flex-col">
              {isDbDegraded && artikelList.length === 0 ? (
                <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex-1">
                  <ErrorState
                    title="Materi edukasi sementara belum tersedia"
                    message="Database lokal belum merespons saat ini."
                  />
                </div>
              ) : artikelList.length === 0 ? (
                <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex-1">
                  <EmptyState message="Belum ada artikel edukasi mitigasi yang dipublikasikan." />
                </div>
              ) : (
                <div className="rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] divide-y divide-[var(--color-border)] overflow-hidden flex-1">
                  {artikelList.map((artikel, idx) => (
                    <ArticleListItem
                      key={artikel.id}
                      slug={artikel.slug}
                      judul={artikel.judul}
                      ringkasan={artikel.ringkasan}
                      kategori={artikel.kategori}
                      sumber={artikel.sumber}
                      indexNumber={idx + 1}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-5 rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface)] p-6 flex flex-col justify-between gap-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
                    Asisten Edukasi
                  </span>
                  <span className="w-9 h-9 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] flex items-center justify-center">
                    <MessageSquareText className="w-4 h-4 text-[var(--color-primary-strong)]" aria-hidden="true" />
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-medium text-[var(--color-text-primary)] leading-snug">
                  Tanya Chatbot SIGAP
                </h3>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Tanyakan langkah keselamatan saat gempa atau konteks kejadian terbaru.
                </p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                  Contoh pertanyaan
                </p>
                <div className="flex flex-col gap-2">
                  <Link
                    href="/chatbot?q=Apa%20yang%20harus%20dilakukan%20saat%20gempa%20terjadi%3F"
                    className="min-h-[44px] rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] flex items-center justify-between gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                  >
                    <span>Apa yang harus dilakukan saat gempa terjadi?</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
                  </Link>
                  <Link
                    href="/chatbot?q=Cara%20menyiapkan%20tas%20siaga%20bencana%3F"
                    className="min-h-[44px] rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] flex items-center justify-between gap-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                  >
                    <span>Cara menyiapkan tas siaga bencana?</span>
                    <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
                  </Link>
                </div>
              </div>

              <Link
                href="/chatbot"
                className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-full bg-[var(--color-cta)] px-5 text-xs sm:text-sm font-medium text-[var(--color-on-cta)] hover:opacity-90 transition-opacity focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
              >
                <span>Mulai percakapan</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </Link>
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
