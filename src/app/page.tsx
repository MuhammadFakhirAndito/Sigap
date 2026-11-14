import React from "react";
import Link from "next/link";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QuakeCard } from "@/components/ui/QuakeCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { EpicenterGraphic } from "@/components/ui/EpicenterGraphic";
import { fetchBmkgAutogempa } from "@/lib/bmkg/client";
import { prisma } from "@/lib/prisma";
import { NormalizedGempa } from "@/types/bmkg";
import {
  ArrowRight,
  ArrowUpRight,
  History,
  Sliders,
  MessageSquare,
  Clock,
  Layers,
  MapPin,
  Compass,
  Globe,
  Share2,
  Send,
  Radio,
} from "lucide-react";

export const revalidate = 60; // Cache 60 detik sesuai spec

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

function formatWibTimeOnly(date: Date): string {
  if (isNaN(date.getTime())) return "";
  return (
    new Intl.DateTimeFormat("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(date).replace(":", ".") + " WIB"
  );
}

function formatRelativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

function formatCoordinates(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(2).replace(".", ",")}° ${lat < 0 ? "LS" : "LU"}`;
  const lonStr = `${Math.abs(lon).toFixed(2).replace(".", ",")}° ${lon < 0 ? "BB" : "BT"}`;
  return `${latStr}, ${lonStr}`;
}

function formatMagnitude(mag: number): string {
  return isNaN(mag) ? "0,0" : mag.toFixed(1).replace(".", ",");
}

export default async function HomePage() {
  const fetchTimestamp = new Date();
  let latestQuake: NormalizedGempa | null = await fetchBmkgAutogempa();
  let isBmkgDegraded = false;
  let lastSyncTime: Date | null = null;
  let dirasakanList: any[] = [];
  let isDbDegraded = false;
  let educationalArticles: any[] = [];

  // 1. Fallback DB jika BMKG autogempa gagal/timeout
  if (!latestQuake) {
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
          statusTsunami: fallbackQuake.statusTsunami as any,
          dirasakan: fallbackQuake.dirasakan || undefined,
          shakemapUrl: fallbackQuake.shakemapUrl || undefined,
          bmkgKey: fallbackQuake.bmkgKey,
        };
      }
      isBmkgDegraded = true;
    } catch {
      isDbDegraded = true;
    }
  }

  // 2. Ambil catatan sinkronisasi terakhir & data riwayat
  try {
    const [syncLog, dirasakan] = await Promise.all([
      prisma.syncLog.findFirst({
        where: { status: "OK" },
        orderBy: { createdAt: "desc" },
      }),
      prisma.gempa.findMany({
        where: { isDirasakan: true },
        orderBy: { waktuUtc: "desc" },
        take: 3,
      }),
    ]);
    if (syncLog) lastSyncTime = syncLog.createdAt;
    dirasakanList = dirasakan;
  } catch {
    isDbDegraded = true;
  }

  // 3. Ambil artikel edukasi mitigasi
  try {
    educationalArticles = await prisma.artikel.findMany({
      orderBy: { urutan: "asc" },
      take: 2,
      include: { sumber: true },
    });
  } catch {
    educationalArticles = [];
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-hidden">
      {/* Container utama Verdro: max-w-[1320px] pas & seimbang */}
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 flex-1 flex flex-col space-y-10 sm:space-y-14">
        
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
                <span className="text-[var(--color-text-muted)]">EN</span>
              </div>
            </div>

            {/* KOLOM KANAN: HEADLINE + CTA */}
            <div className="relative z-30 lg:ml-auto lg:w-[57%]">
              <div className="relative text-[clamp(30px,3.6vw,52px)]">
                <h1 className="font-normal leading-[1.1] tracking-[-0.03em] lg:text-right">
                  <span className="text-[var(--color-primary)]">Pantau gempa bumi</span>{" "}
                  <span className="text-[var(--color-text-primary)]">untuk</span>
                  <span className="block text-[var(--color-text-primary)]">kesiapsiagaan kita</span>
                </h1>
                {/* Subjudul kecil di kiri baris kedua (desktop), di bawah headline (mobile) */}
                <p className="mt-3 lg:mt-0 lg:absolute lg:left-0 lg:top-[calc(clamp(30px,3.6vw,52px)*1.18)] lg:w-[clamp(120px,11vw,160px)] text-[12px] lg:text-[11.5px] leading-snug text-[var(--color-text-secondary)] max-w-[320px]">
                  Data resmi BMKG dan edukasi mitigasi yang terukur.
                </p>
              </div>

              <div className="flex justify-start lg:justify-end mt-6 lg:mt-[clamp(28px,3.4vw,48px)]">
                <Link
                  href="/riwayat"
                  className="group inline-flex items-center justify-between w-[clamp(200px,15vw,216px)] h-12 lg:h-[clamp(46px,3.6vw,52px)] rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] pl-7 pr-1 text-sm font-medium hover:bg-[var(--color-primary)] transition-colors"
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
                className="w-full h-auto object-contain animate-floaty select-none"
              />
            </div>

            {/* 3 CHIP KECIL DI SUDUT KIRI BAWAH (DI DEPAN BATU) */}
            <div className="order-4 relative z-20 flex gap-2.5 mt-4 lg:mt-0 lg:absolute lg:left-11 lg:bottom-[5%]">
              {[
                { label: "Sumber resmi", value: "BMKG Indonesia" },
                { label: "Perhitungan fisik", value: "Estimasi MMI & P-S" },
                { label: "Asisten mitigasi", value: "Chatbot SIGAP" },
              ].map((chip) => (
                <div
                  key={chip.label}
                  className="w-[clamp(96px,8.2vw,112px)] rounded-[14px] bg-[var(--color-surface-raised)] px-3 pt-2.5 pb-3"
                >
                  <p className="text-[9.5px] leading-none text-[var(--color-text-muted)]">{chip.label}</p>
                  <p className="mt-2 text-[12.5px] font-medium leading-[1.15] text-[var(--color-text-primary)]">
                    {chip.value}
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
                <span className="pt-1 text-[11.5px] leading-tight text-[var(--color-text-muted)]">
                  magnitudo
                  <br />
                  gempa terkini
                </span>
              </div>

              <div className="relative flex-1 min-h-[110px] mt-2">
                {/* Garis lingkaran episentrum di kanan bawah */}
                <svg
                  aria-hidden="true"
                  viewBox="0 0 64 64"
                  className="absolute right-0 bottom-0 w-[46%] h-auto text-[var(--color-border-strong)]/50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <circle cx="32" cy="32" r="30" />
                  <circle cx="32" cy="32" r="18" />
                  <path d="M32 2v60M2 32h60" />
                </svg>
                <img
                  src="/images/tectonic-island.png"
                  alt=""
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[92%] h-auto object-contain"
                />
              </div>

              <p className="pt-2 text-[10.5px] leading-tight text-[var(--color-text-muted)] truncate">
                {latestQuake ? `BMKG · ${formatWibDate(latestQuake.waktuUtc)}` : "Data BMKG belum tersedia"}
              </p>
            </div>
          </div>
        </section>

        {/* ================= DUA CAPTION DI BAWAH CARD (BATU LEWAT DI TENGAH) ================= */}
        <section aria-label="Ringkasan platform" className="px-1 relative z-0">
          <div className="flex flex-col md:flex-row md:justify-between gap-4 text-[13px] text-[var(--color-text-secondary)] leading-relaxed">
            <p className="md:max-w-[30%]">
              Sistem informasi gempa bumi Indonesia yang menyajikan data resmi BMKG secara cepat dan dapat diakses setiap saat.
            </p>
            <p className="md:max-w-[36%]">
              Dilengkapi simulasi estimasi intensitas guncangan MMI, waktu tiba gelombang P-S, serta asisten edukasi mitigasi bencana.
            </p>
          </div>
        </section>

        {/* ================= RIWAYAT GEMPA TERKINI (BAGIAN BAWAH) ================= */}
        <section aria-label="Riwayat gempa dirasakan" className="space-y-6 pt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl sm:text-2xl font-light tracking-tight text-[var(--color-text-primary)]">
              Gempa dirasakan <span className="font-normal text-[var(--color-primary)]">terbaru</span>
            </h2>
            <Link
              href="/riwayat"
              className="text-xs sm:text-sm font-semibold text-[var(--color-primary)] hover:underline inline-flex items-center gap-1"
            >
              <span>Buka arsip lengkap</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dirasakanList.slice(0, 3).map((quake) => (
              <QuakeCard
                key={quake.id}
                quake={quake}
              />
            ))}
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
