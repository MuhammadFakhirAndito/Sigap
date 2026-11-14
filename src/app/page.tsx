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
      {/* Container utama Verdro: max-w-[1440px] */}
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 pt-4 flex-1 flex flex-col space-y-12 sm:space-y-16">
        
        {/* ================= HERO SHELL DENGAN NOTCH HEADER PERSIS REFERENSI ================= */}
        <section aria-label="Informasi gempa terkini" className="w-full">
          {/* NOTCH NAVBAR DI BAGIAN ATAS */}
          <NotchNavbar variant="notch" />

          {/* BADAN HERO CARD YANG TERSAMBUNG DENGAN NOTCH */}
          <div className="relative w-full rounded-b-[40px] md:rounded-b-[48px] bg-[var(--color-surface)] px-6 sm:px-10 lg:px-14 pb-16 sm:pb-20 pt-6 sm:pt-8 transition-colors duration-200">
            
            {/* GRID UTAMA HERO */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-6 items-center">
              
              {/* KOLOM KIRI: TOOLBAR KECIL + ASET BATU TEKTONIK MELAYANG SANGAT BESAR PERSIS REFERENSI */}
              <div className="lg:col-span-7 relative order-2 lg:order-1">
                
                {/* TOOLBAR KIRI: SOCIAL / LANGUAGE (PERSIS REFERENSI) */}
                <div className="hidden sm:flex flex-col gap-4 absolute -top-4 -left-2 z-20">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      aria-label="Instagram SIGAP"
                      className="w-7 h-7 rounded-full bg-[var(--color-cta)] text-white flex items-center justify-center hover:opacity-85 transition-opacity"
                    >
                      <Radio className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Kanal Telegram SIGAP"
                      className="w-7 h-7 rounded-full bg-[var(--color-cta)] text-white flex items-center justify-center hover:opacity-85 transition-opacity"
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Bagikan informasi"
                      className="w-7 h-7 rounded-full bg-[var(--color-cta)] text-white flex items-center justify-center hover:opacity-85 transition-opacity"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] font-medium">
                    <Globe className="w-3.5 h-3.5 text-[var(--color-text-muted)]" />
                    <span className="text-[var(--color-text-primary)] font-semibold">ID</span>
                    <span>·</span>
                    <span className="hover:text-[var(--color-text-primary)] cursor-pointer">EN</span>
                  </div>
                </div>

                {/* GAMBAR LEMPENG TEKTONIK SANGAT BESAR MENEMBUS KIRI & BAWAH */}
                <div className="relative w-[110%] sm:w-[120%] lg:w-[135%] -left-4 sm:-left-8 lg:-left-14 -mb-20 sm:-mb-28 lg:-mb-36 xl:-mb-44 pt-2">
                  <div className="pointer-events-none absolute -inset-10 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
                  <img
                    src="/images/tectonic-island.png"
                    alt="Fragmen lempeng tektonik bumi dengan batuan berlumut dan retakan seismik"
                    className="relative w-full h-auto max-h-[640px] xl:max-h-[720px] object-contain animate-floaty filter drop-shadow-[0_45px_80px_rgba(13,13,13,0.18)] select-none pointer-events-none"
                  />
                </div>

                {/* 3 BENEFIT CHIPS PUTIH DI SUDUT BAWAH BATU (PERSIS REFERENSI) */}
                <div className="relative lg:absolute -bottom-6 lg:-bottom-12 left-0 sm:left-4 z-20 flex flex-wrap gap-2.5 pt-4 lg:pt-0">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-white/95 px-3.5 py-2.5 shadow-[0_8px_30px_rgba(13,13,13,0.08)] backdrop-blur-sm">
                    <p className="text-[10px] leading-none text-[var(--color-text-muted)]">Sumber resmi</p>
                    <p className="mt-1.5 text-[12px] font-semibold leading-none text-[var(--color-text-primary)]">
                      BMKG Indonesia
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-white/95 px-3.5 py-2.5 shadow-[0_8px_30px_rgba(13,13,13,0.08)] backdrop-blur-sm">
                    <p className="text-[10px] leading-none text-[var(--color-text-muted)]">Perhitungan fisik</p>
                    <p className="mt-1.5 text-[12px] font-semibold leading-none text-[var(--color-text-primary)]">
                      Estimasi MMI & P-S
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-white/95 px-3.5 py-2.5 shadow-[0_8px_30px_rgba(13,13,13,0.08)] backdrop-blur-sm">
                    <p className="text-[10px] leading-none text-[var(--color-text-muted)]">Asisten mitigasi</p>
                    <p className="mt-1.5 text-[12px] font-semibold leading-none text-[var(--color-text-primary)]">
                      Chatbot SIGAP
                    </p>
                  </div>
                </div>
              </div>

              {/* KOLOM KANAN: TIPOGRAFI HEADLINE + TOMBOL VIEW ALL + FLOATING STAT CARD */}
              <div className="lg:col-span-5 order-1 lg:order-2 lg:pl-6 space-y-6 sm:space-y-8 z-20">
                
                {/* H1 HEADLINE TIPOGRAFI VERDRO (2 BARIS: HIJAU & HITAM) */}
                <div className="space-y-3">
                  <h1 className="text-[38px] sm:text-[50px] lg:text-[58px] xl:text-[66px] font-medium leading-[1.04] tracking-[-0.03em]">
                    <span className="text-[var(--color-primary)]">Pantau gempa bumi untuk</span><br />
                    <span className="text-[var(--color-text-primary)]">kesiapsiagaan kita</span>
                  </h1>

                  <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-[500px] text-pretty">
                    Data resmi BMKG dan edukasi mitigasi untuk memahami serta menghadapi potensi bencana secara terukur.
                  </p>
                </div>

                {/* TOMBOL CTA PILL DENGAN OVAL THUMBNAIL (PERSIS SEPERTI "VIEW ALL" VERDRO) */}
                <div>
                  <Link
                    href="/riwayat"
                    className="inline-flex items-center justify-between gap-5 rounded-full bg-[var(--color-cta)] text-white pl-6 pr-2 py-2 text-sm font-medium hover:bg-[var(--color-primary)] transition-all shadow-md group"
                  >
                    <span>Lihat riwayat</span>
                    <span className="w-12 h-9 rounded-full overflow-hidden border border-white/20 bg-white/10 flex items-center justify-center shrink-0">
                      <img
                        src="/images/tectonic-island.png"
                        alt=""
                        className="w-full h-full object-cover scale-150 transition-transform group-hover:scale-175"
                      />
                    </span>
                  </Link>
                </div>

                {/* FLOATING METRIC CARD (PERSIS POSISI & GAYA 98% SATISFACTION VERDRO) */}
                <div className="pt-2 sm:pt-4 flex justify-start lg:justify-end">
                  <div className="w-full max-w-[280px] rounded-[28px] bg-white p-5 sm:p-6 shadow-[0_15px_40px_rgba(13,13,13,0.08)] border border-[var(--color-border)] space-y-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[var(--color-text-primary)] tnum">
                        {latestQuake ? formatMagnitude(latestQuake.magnitudo) : "4,1"}
                        <span className="text-2xl font-medium text-[var(--color-primary)] ml-0.5">M</span>
                      </span>
                      <div className="text-[11px] font-medium text-[var(--color-text-muted)] leading-tight">
                        <p>magnitudo</p>
                        <p>gempa terkini</p>
                      </div>
                    </div>

                    {/* RADAR VISUAL DENGAN MINI ROCK MELAYANG */}
                    <div className="relative h-28 w-full flex items-center justify-center bg-[var(--color-surface)]/60 rounded-2xl overflow-hidden border border-[var(--color-border)]/60">
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-24 h-24 rounded-full border border-[var(--color-primary)]/20 animate-ping opacity-30" />
                        <div className="w-20 h-20 rounded-full border border-[var(--color-primary)]/30" />
                        <div className="w-12 h-12 rounded-full border border-[var(--color-primary)]/40" />
                        <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                      </div>
                      <img
                        src="/images/tectonic-island.png"
                        alt=""
                        className="relative z-10 w-20 h-auto object-contain animate-floaty filter drop-shadow-[0_8px_16px_rgba(13,13,13,0.15)]"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--color-text-secondary)] pt-1 border-t border-[var(--color-border)]/60">
                      <span className="truncate max-w-[140px] font-medium text-[var(--color-text-primary)]">
                        {latestQuake ? latestQuake.wilayah.split(",")[0] : "Sukabumi, Jabar"}
                      </span>
                      <span className="tnum text-[var(--color-text-muted)]">
                        {latestQuake ? `${latestQuake.kedalamanKm} km` : "24 km"}
                      </span>
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        </section>

        {/* ================= DUA KOLOM CAPTION STRIP DI BAWAH CARD (PERSIS REFERENSI) ================= */}
        <section aria-label="Ringkasan platform" className="px-2 sm:px-6 pt-16 sm:pt-24 lg:pt-32">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 text-sm text-[var(--color-text-secondary)] leading-relaxed">
            <p>
              Sistem informasi geologis dan mitigasi gempa bumi Indonesia yang menyajikan data resmi BMKG secara persisten, cepat, dan dapat diakses setiap saat.
            </p>
            <p>
              Dilengkapi kalkulasi simulasi dampak fisik, estimasi intensitas guncangan MMI, waktu golden time gelombang P-S, serta asisten edukasi mitigasi kebencanaan.
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
