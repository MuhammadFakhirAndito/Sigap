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

function formatWibDateOnly(date: Date): string {
  if (isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  }).format(date);
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
  const latStr = `${Math.abs(lat).toFixed(2).replace(".", ",")} ${lat < 0 ? "LS" : "LU"}`;
  const lonStr = `${Math.abs(lon).toFixed(2).replace(".", ",")} ${lon < 0 ? "BB" : "BT"}`;
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
          bmkgKey: fallbackQuake.bmkgKey,
          waktuUtc: fallbackQuake.waktuUtc,
          lat: fallbackQuake.lat,
          lon: fallbackQuake.lon,
          magnitudo: fallbackQuake.magnitudo,
          kedalamanKm: fallbackQuake.kedalamanKm,
          wilayah: fallbackQuake.wilayah,
          potensiTeks: fallbackQuake.potensiTeks,
          statusTsunami: fallbackQuake.statusTsunami as any,
          dirasakan: fallbackQuake.dirasakan,
          shakemapUrl: fallbackQuake.shakemapUrl,
        };
        isBmkgDegraded = true;

        const latestSyncLog = await prisma.syncLog.findFirst({
          where: { status: "OK" },
          orderBy: { createdAt: "desc" },
        });
        if (latestSyncLog) {
          lastSyncTime = latestSyncLog.createdAt;
        }
      }
    } catch (err) {
      console.error("Gagal membaca fallback autogempa dari DB:", err);
      isDbDegraded = true;
    }
  }

  // 2. Ambil data gempa dirasakan dari database
  try {
    dirasakanList = await prisma.gempa.findMany({
      where: { isDirasakan: true },
      orderBy: { waktuUtc: "desc" },
      take: 4,
    });
  } catch (err) {
    console.error("Gagal membaca gempa dirasakan dari DB:", err);
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

  // Status Tsunami eksplisit kalimat biasa (Sentence case)
  const tsunamiVariant =
    latestQuake?.statusTsunami === "AMAN"
      ? "tsunami_aman"
      : latestQuake?.statusTsunami === "BERPOTENSI"
      ? "tsunami_berpotensi"
      : "tsunami_tidak_dinyatakan";

  const tsunamiLabel =
    latestQuake?.statusTsunami === "AMAN"
      ? "Tidak berpotensi tsunami"
      : latestQuake?.statusTsunami === "BERPOTENSI"
      ? "Berpotensi tsunami"
      : "Tidak dinyatakan";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-hidden">
      {/* Container utama Verdro: px-3 pt-4 sm:px-6 */}
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 pt-4 flex-1 flex flex-col space-y-12 sm:space-y-16">
        {/* ================= HERO SHELL PERSIS INDEX-1.HTML ================= */}
        <section aria-label="Informasi gempa terkini" className="w-full">
          <div className="relative mx-auto w-full rounded-[36px] bg-[var(--color-surface)] px-4 pb-14 pt-5 sm:px-8 md:rounded-[48px] md:px-12 md:pb-20 border border-[var(--color-border)] transition-colors duration-200">
            {/* FLOATING PILL HEADER DI DALAM CONTAINER HERO */}
            <NotchNavbar />

            {/* HERO CONTENT: GRID ASIMETRIS PERSIS INDEX-1.HTML */}
            <div className="relative mt-8 grid items-center gap-10 md:mt-12 lg:grid-cols-2 lg:gap-8">
              {/* IMAGE COLUMN (KIRI) */}
              <div className="relative order-2 lg:order-1">
                <div className="relative mx-auto w-full max-w-[560px]">
                  {/* Subtle soft primary blur behind the stone */}
                  <div className="pointer-events-none absolute -inset-6 rounded-full bg-[var(--color-primary)]/10 blur-3xl" />
                  <img
                    src="/images/tectonic-island.png"
                    alt="Formasi geologis lempeng tektonik seismik Indonesia"
                    className="relative w-full h-auto max-h-[460px] object-contain animate-floaty filter drop-shadow-[0_30px_60px_rgba(13,13,13,0.12)] select-none pointer-events-none"
                  />
                </div>

                {/* Floating benefit chips at bottom edge of image */}
                <div className="relative lg:absolute inset-x-0 -bottom-4 z-20 flex flex-wrap gap-2.5 pt-4 lg:pt-0 px-1 sm:px-4">
                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)]/95 px-3.5 py-2.5 shadow-[0_8px_30px_rgba(13,13,13,0.08)] backdrop-blur-sm">
                    <p className="text-[10px] leading-none text-[var(--color-text-muted)]">Sumber resmi</p>
                    <p className="mt-1.5 text-[12px] font-semibold leading-none text-[var(--color-text-primary)]">
                      BMKG Indonesia
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)]/95 px-3.5 py-2.5 shadow-[0_8px_30px_rgba(13,13,13,0.08)] backdrop-blur-sm">
                    <p className="text-[10px] leading-none text-[var(--color-text-muted)]">Perhitungan</p>
                    <p className="mt-1.5 text-[12px] font-semibold leading-none text-[var(--color-text-primary)]">
                      Estimasi MMI & P-S
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)]/95 px-3.5 py-2.5 shadow-[0_8px_30px_rgba(13,13,13,0.08)] backdrop-blur-sm">
                    <p className="text-[10px] leading-none text-[var(--color-text-muted)]">Asisten mitigasi</p>
                    <p className="mt-1.5 text-[12px] font-semibold leading-none text-[var(--color-text-primary)]">
                      Chatbot SIGAP
                    </p>
                  </div>
                </div>
              </div>

              {/* TEXT COLUMN (KANAN) */}
              <div className="order-1 lg:order-2 lg:pl-6">
                {/* Meta status & language toggle */}
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-primary)] shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 animate-pulse" aria-hidden="true" />
                    <span>BMKG Terkini</span>
                  </div>
                  <div className="h-6 w-px bg-[var(--color-border)]" />
                  <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-1.5 text-[11px] font-medium text-[var(--color-text-primary)] shadow-2xs select-none">
                    <span className="font-bold text-[var(--color-text-primary)]">ID</span>
                    <span className="text-[var(--color-text-secondary)]">—</span>
                    <span className="text-[var(--color-text-secondary)]/70 hover:text-[var(--color-text-primary)] cursor-pointer transition-colors">
                      EN
                    </span>
                  </div>
                </div>

                {/* H1 Typography */}
                <h1 className="text-[38px] font-light leading-[1.05] tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-[50px] lg:text-[58px] xl:text-[68px]">
                  <span className="text-[var(--color-primary)] font-normal">Pantau gempa terkini,</span><br className="hidden sm:block" />{" "}
                  siap menghadapi yang berikutnya.
                </h1>

                <p className="mt-5 max-w-md text-sm leading-relaxed text-[var(--color-text-secondary)] md:text-base">
                  Data resmi BMKG, riwayat gempa persisten, dan simulasi fisik untuk memahami dampaknya.
                </p>

                {/* Primary CTA Button (Pill Verdro dengan circular thumbnail) */}
                <div className="mt-8 flex flex-wrap items-center gap-5">
                  <Link
                    href="/riwayat"
                    className="inline-flex items-center gap-3 rounded-full bg-[var(--color-cta)] py-1.5 pl-6 pr-1.5 text-sm font-medium text-[var(--color-on-cta)] transition hover:bg-[var(--color-primary)] hover:text-white active:scale-95 shadow-xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                  >
                    <span>Lihat riwayat gempa</span>
                    <span className="h-10 w-10 overflow-hidden rounded-full bg-[var(--color-surface-strong)]/15 border border-white/10 flex items-center justify-center shrink-0">
                      <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                    </span>
                  </Link>
                </div>

                {/* Floating Metric Card (Kanan Bawah Persis Index-1.html) */}
                {latestQuake ? (
                  <div className="mt-8 flex justify-start lg:justify-end">
                    <div className="w-full max-w-[260px] rounded-3xl bg-[var(--color-surface-strong)] p-4 sm:p-5 shadow-[0_8px_30px_rgba(13,13,13,0.06)] border border-[var(--color-border)]">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[42px] font-light leading-none tracking-[-0.03em] tabular-nums text-[var(--color-text-primary)]">
                            {formatMagnitude(latestQuake.magnitudo)}
                            <span className="text-[var(--color-primary)] text-2xl font-normal ml-0.5">M</span>
                          </p>
                          <p className="mt-1.5 text-[11px] leading-tight text-[var(--color-text-secondary)]">
                            magnitudo gempa
                          </p>
                        </div>
                        <div className="relative h-16 w-16 shrink-0 flex items-center justify-center overflow-hidden rounded-2xl bg-[var(--color-surface)]">
                          <EpicenterGraphic depthKm={latestQuake.kedalamanKm} className="scale-75" />
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-2 border-t border-[var(--color-border)] pt-3 text-[11px] text-[var(--color-text-secondary)] tnum">
                        <Clock className="w-3.5 h-3.5 text-[var(--color-primary)] shrink-0" aria-hidden="true" />
                        <span>{latestQuake.kedalamanKm} km · {formatWibTimeOnly(latestQuake.waktuUtc)}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mt-8 flex justify-start lg:justify-end">
                    <div className="w-full max-w-[260px] rounded-3xl bg-[var(--color-surface-strong)] p-4 sm:p-5 shadow-[0_8px_30px_rgba(13,13,13,0.06)] border border-[var(--color-border)]">
                      <Skeleton className="w-24 h-8 rounded-full mb-2" />
                      <Skeleton className="w-full h-12 rounded-xl" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= HERO CAPTION STRIP PERSIS INDEX-1.HTML ================= */}
          <div className="mx-auto mt-6 grid max-w-[1440px] gap-4 px-6 md:grid-cols-2 md:gap-10">
            {/* Kiri */}
            <div>
              {latestQuake ? (
                <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)] md:text-xs">
                  Terjadi {formatRelativeTime(latestQuake.waktuUtc)}, {formatWibDateOnly(latestQuake.waktuUtc)}. Pusat gempa {latestQuake.wilayah.toLowerCase().startsWith("pusat") ? latestQuake.wilayah.replace(/^pusat gempa\s*/i, "") : latestQuake.wilayah}.
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)] md:text-xs">
                  Data resmi BMKG terintegrasi otomatis untuk seluruh wilayah Indonesia dengan pembaruan berkala.
                </p>
              )}
            </div>

            {/* Kanan */}
            <div className="md:text-right">
              {latestQuake ? (
                <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)] md:text-xs">
                  Koordinat {formatCoordinates(latestQuake.lat, latestQuake.lon)}. Status: {tsunamiLabel.toLowerCase()}.
                  <Link
                    href={`/simulasi?m=${latestQuake.magnitudo}&d=${latestQuake.kedalamanKm}&lat=${latestQuake.lat}&lon=${latestQuake.lon}`}
                    className="ml-2 text-[var(--color-primary)] font-medium hover:underline inline-flex items-center gap-0.5 active:scale-95 transition-transform"
                  >
                    <span>Simulasikan dampak gempa ini</span>
                    <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                  </Link>
                </p>
              ) : (
                <p className="text-[11px] leading-relaxed text-[var(--color-text-muted)] md:text-xs">
                  Simulasi estimasi percepatan tanah dan edukasi kesiapsiagaan seismik berikutnya.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 3 JALAN PINTAS: Berbobot & Asimetris (Sesuai docs/screens/01-beranda.md) */}
        <section aria-label="Akses cepat fitur" className="w-full space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Jalan Pintas 1: Riwayat (Lebar 5/12) */}
            <Link
              href="/riwayat"
              className="md:col-span-5 bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[28px] p-6 sm:p-7 flex flex-col justify-between gap-4 transition-colors duration-200 group focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)]">
                  <History className="w-5 h-5 text-[var(--color-primary-strong)]" aria-hidden="true" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-xl text-[var(--color-text-primary)] mb-1">
                  Arsip riwayat gempa
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Telusuri data gempa BMKG tersimpan dengan filter wilayah, tanggal, dan magnitudo.
                </p>
              </div>
            </Link>

            {/* Jalan Pintas 2: Simulasi (Lebar 4/12) */}
            <Link
              href="/simulasi"
              className="md:col-span-4 bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[28px] p-6 sm:p-7 flex flex-col justify-between gap-4 transition-colors duration-200 group focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)]">
                  <Sliders className="w-5 h-5 text-[var(--color-primary-strong)]" aria-hidden="true" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-xl text-[var(--color-text-primary)] mb-1">
                  Simulasi seismik
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Hitung perkiraan skala MMI, energi Gutenberg-Richter, dan golden time gelombang P-S.
                </p>
              </div>
            </Link>

            {/* Jalan Pintas 3: Tanya Chatbot (Lebar 3/12) */}
            <Link
              href="/chatbot"
              className="md:col-span-3 bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[28px] p-6 sm:p-7 flex flex-col justify-between gap-4 transition-colors duration-200 group focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)]">
                  <MessageSquare className="w-5 h-5 text-[var(--color-primary-strong)]" aria-hidden="true" />
                </div>
                <div className="w-10 h-10 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <div>
                <h2 className="font-semibold text-xl text-[var(--color-text-primary)] mb-1">
                  Tanya SIGAP
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Asisten mitigasi tanggap bencana dengan basis data gempa kontekstual.
                </p>
              </div>
            </Link>
          </div>
        </section>

        {/* SECTION: GEMPA DIRASAKAN TERBARU */}
        <section aria-label="Daftar gempa dirasakan" className="w-full space-y-6">
          <div className="flex flex-wrap items-end justify-between gap-4 border-b border-[var(--color-border)] pb-4">
            <div>
              <h2 className="font-semibold text-2xl sm:text-3xl text-[var(--color-text-primary)] tracking-tight">
                Gempa dirasakan terbaru
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Laporan getaran fisik yang dirasakan masyarakat di berbagai wilayah Indonesia.
              </p>
            </div>

            <Link
              href="/riwayat"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[var(--color-border-strong)] text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:scale-[0.98] transition-colors duration-150 min-h-[44px] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
            >
              <span>Buka seluruh riwayat</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

            {isDbDegraded && dirasakanList.length === 0 ? (
              <ErrorState
                title="Gagal memuat riwayat gempa"
                message="Basis data internal sedang tidak dapat diakses. Data autogempa di atas tetap bekerja langsung dari BMKG."
              />
            ) : dirasakanList.length === 0 ? (
              <EmptyState
                message="BMKG belum melaporkan gempa bumi dirasakan dalam periode pemantauan aktif saat ini."
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {dirasakanList.map((item) => (
                  <QuakeCard
                    key={item.id}
                    quake={{
                      id: item.id,
                      wilayah: item.wilayah,
                      magnitudo: item.magnitudo,
                      waktuUtc: item.waktuUtc,
                      kedalamanKm: item.kedalamanKm,
                      statusTsunami: item.statusTsunami,
                      lat: item.lat,
                      lon: item.lon,
                    }}
                  />
                ))}
              </div>
            )}
        </section>

        {/* SECTION: EDUKASI MITIGASI BENCANA */}
        <section aria-label="Edukasi mitigasi" className="w-full space-y-6">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-4">
            <div>
              <h2 className="font-semibold text-2xl sm:text-3xl text-[var(--color-text-primary)] tracking-tight">
                Edukasi & kesiapsiagaan
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                Panduan ilmiah praktis langkah penyelamatan diri saat dan setelah gempa bumi.
              </p>
            </div>

            <Link
              href="/edukasi"
              className="hidden sm:inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)] hover:underline min-h-[44px]"
            >
              <span>Lihat semua artikel</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>

          {educationalArticles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {educationalArticles.map((article) => (
                <article
                  key={article.id}
                  className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[28px] p-6 sm:p-7 flex flex-col justify-between gap-4"
                >
                  <div>
                    <span className="inline-block px-3 py-1 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-full text-xs font-semibold text-[var(--color-primary-strong)] mb-3">
                      {article.kategori}
                    </span>
                    <h3 className="font-semibold text-xl text-[var(--color-text-primary)] mb-2">
                      {article.judul}
                    </h3>
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {article.ringkasan}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-[var(--color-border)]/60 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
                    <span>Sumber: {article.sumber?.nama || "Pusat Mitigasi"}</span>
                    <Link
                      href={`/edukasi/${article.slug}`}
                      className="font-semibold text-[var(--color-text-primary)] hover:underline inline-flex items-center gap-1"
                    >
                      <span>Baca panduan</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <EmptyState
              message="Materi kesiapsiagaan bencana, mitigasi struktural, dan panduan evakuasi gempa akan tersedia pada pembaruan Fase 2."
            />
          )}
        </section>
      </div>

      {/* FOOTER */}
      <Footer />
    </div>
  );
}
