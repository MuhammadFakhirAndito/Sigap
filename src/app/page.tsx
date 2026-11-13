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
      {/* Container utama: persis max-w-[1280px], di tengah, padding 24px (mobile 16px) */}
      <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-6 pt-4 sm:pt-6 flex-1 flex flex-col space-y-12 sm:space-y-16">
        {/* HERO SECTION: Menyatukan NotchNavbar dan Panel Hero dalam satu arsitektur bentuk notch */}
        <section aria-label="Informasi gempa terkini" className="w-full">
          {/* Notch Header di desktop menyatu langsung ke panel hero di bawahnya */}
          <NotchNavbar />

          {/* Panel hero: Terhubung mulus dengan bahu kiri dan kanan header di desktop */}
          <div className="w-full bg-[var(--color-surface)] border border-[var(--color-border)] md:border-t-0 rounded-[40px] md:rounded-t-none md:rounded-b-[40px] p-6 sm:p-10 md:p-12 relative overflow-visible transition-colors duration-200">
            {/* Grid hero asimetris sesuai rancangan blueprint */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
              {/* SISI KIRI: Badge BMKG, Bahasa, Formasi Batuan Tektonik Melayang, dan 3 Chip di Kiri Bawah */}
              <div className="w-full lg:col-span-7 relative flex flex-col justify-between min-h-[440px] sm:min-h-[500px] lg:min-h-[560px]">
                {/* Atas Kiri: Badge BMKG dan Toggle Bahasa (ID / EN) */}
                <div className="space-y-3 relative z-20">
                  <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-full px-3 py-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)] shadow-2xs">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-primary)] shrink-0 animate-pulse" aria-hidden="true" />
                    <span>BMKG</span>
                  </div>

                  <div className="flex flex-col text-[11px] font-semibold text-[var(--color-text-secondary)] space-y-0.5 select-none pl-1">
                    <span className="text-[var(--color-text-primary)] font-bold">ID</span>
                    <span className="text-[var(--color-text-secondary)]/60 hover:text-[var(--color-text-primary)] cursor-pointer transition-colors">EN</span>
                  </div>
                </div>

                {/* Tengah-Kiri: Formasi Batuan Tektonik Melayang yang Menembus Batas Bawah Panel */}
                <div className="relative lg:absolute lg:-bottom-24 xl:-bottom-32 lg:left-6 xl:left-10 w-full max-w-[500px] sm:max-w-[580px] lg:max-w-[680px] xl:max-w-[760px] mx-auto z-10 pointer-events-none select-none animate-floaty">
                  <img
                    src="/images/tectonic-island.png"
                    alt="Formasi geologis lempeng tektonik seismik Indonesia"
                    className="w-full h-auto object-contain filter drop-shadow-[0_24px_40px_rgba(0,0,0,0.14)]"
                  />
                  {/* Efek Pulsa Seismik Halus di Balik Formasi Batuan */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-20 overflow-hidden">
                    <div className="w-48 h-48 sm:w-64 sm:h-64 rounded-full border border-[var(--color-primary)] animate-pulse" />
                  </div>
                </div>

                {/* 3 Chip di Kiri Bawah (Persis di Sisi Kiri Bawah Batuan Sesuai Blueprint) */}
                <div className="flex flex-wrap items-center gap-2.5 pt-6 sm:pt-8 relative z-20">
                  <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-3 sm:p-3.5 shadow-2xs min-w-[105px]">
                    <span className="text-[10px] text-[var(--color-text-secondary)] font-medium block">
                      Sumber resmi
                    </span>
                    <span className="text-xs font-bold text-[var(--color-primary)] block">
                      BMKG Indonesia
                    </span>
                  </div>

                  <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-3 sm:p-3.5 shadow-2xs min-w-[105px]">
                    <span className="text-[10px] text-[var(--color-text-secondary)] font-medium block">
                      Perhitungan
                    </span>
                    <span className="text-xs font-bold text-[var(--color-primary)] block">
                      Estimasi MMI & P-S
                    </span>
                  </div>

                  <div className="bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl p-3 sm:p-3.5 shadow-2xs min-w-[105px]">
                    <span className="text-[10px] text-[var(--color-text-secondary)] font-medium block">
                      Asisten mitigasi
                    </span>
                    <span className="text-xs font-bold text-[var(--color-primary)] block">
                      Chatbot SIGAP
                    </span>
                  </div>
                </div>
              </div>

              {/* SISI KANAN: H1, Subcopy Resmi, CTA Utama, dan Kartu Gempa Kompak di Kanan Bawah */}
              <div className="w-full lg:col-span-5 flex flex-col justify-between space-y-8 z-10 min-h-[440px] sm:min-h-[500px] lg:min-h-[560px]">
                {/* Atas: H1, Subcopy, dan CTA */}
                <div className="space-y-4">
                  <h1 className="text-[clamp(2.5rem,4.2vw,4rem)] font-light tracking-[-0.03em] leading-[1.05] text-[var(--color-text-primary)]">
                    <span className="text-[var(--color-primary)] font-normal">Pantau gempa terkini,</span>{" "}
                    siap menghadapi yang berikutnya.
                  </h1>

                  <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-[42ch] leading-relaxed text-pretty">
                    Data resmi BMKG, riwayat gempa, dan simulasi untuk memahami dampaknya.
                  </p>

                  <div className="pt-2">
                    <Link
                      href="/riwayat"
                      className="bg-[var(--color-cta)] text-[var(--color-on-cta)] font-medium rounded-full pl-6 pr-2.5 py-2 min-h-[48px] text-sm hover:opacity-90 active:scale-[0.98] transition-opacity duration-150 inline-flex items-center gap-3 shadow-xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
                    >
                      <span>Lihat riwayat gempa</span>
                      <span className="w-8 h-8 rounded-full bg-[var(--color-surface-raised)]/10 border border-white/10 flex items-center justify-center shrink-0">
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--color-primary)] animate-pulse" />
                      </span>
                    </Link>
                  </div>
                </div>

                {/* Bawah: Kartu Gempa Kompak di Kanan Bawah (Persis Blueprint Pengguna) */}
                {latestQuake ? (
                  <div className="w-[190px] sm:w-[215px] ml-auto bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[28px] p-4 sm:p-5 flex flex-col items-center text-center shadow-xs">
                    {/* Magnitudo Besar + label */}
                    <div className="flex items-baseline justify-center gap-1.5 w-full">
                      <span className="text-4xl sm:text-5xl font-bold text-[var(--color-primary)] tnum tracking-tight leading-none">
                        {formatMagnitude(latestQuake.magnitudo)}
                      </span>
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                        magnitudo
                      </span>
                    </div>

                    {/* Radar Episentrum Konsentris */}
                    <div className="my-2.5 flex items-center justify-center">
                      <EpicenterGraphic depthKm={latestQuake.kedalamanKm} className="scale-75 -my-2" />
                    </div>

                    {/* Kedalaman & Waktu (WIB) */}
                    <div className="text-[11px] font-semibold text-[var(--color-text-primary)] tnum tracking-tight whitespace-nowrap">
                      <span>{latestQuake.kedalamanKm} km kedalaman</span>
                      <span className="mx-1 text-[var(--color-text-secondary)]">·</span>
                      <span>{formatWibTimeOnly(latestQuake.waktuUtc)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="w-[190px] sm:w-[215px] ml-auto bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[28px] p-4 flex flex-col items-center space-y-2">
                    <Skeleton className="w-20 h-8 rounded-full" />
                    <Skeleton className="w-16 h-16 rounded-full" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dua Baris Teks Editorial di Luar Panel (Canvas Background) Persis Blueprint Pengguna */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-12 pt-16 sm:pt-24 px-4 sm:px-6 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {/* Kiri: Terjadi {relatif}, {tanggal WIB}. {wilayah}. */}
            <div>
              {latestQuake ? (
                <p className="max-w-[48ch]">
                  Terjadi {formatRelativeTime(latestQuake.waktuUtc)}, {formatWibDateOnly(latestQuake.waktuUtc)}. Pusat gempa {latestQuake.wilayah.toLowerCase().startsWith("pusat") ? latestQuake.wilayah.replace(/^pusat gempa\s*/i, "") : latestQuake.wilayah}.
                </p>
              ) : (
                <p className="max-w-[48ch]">
                  Data resmi BMKG terintegrasi otomatis untuk seluruh wilayah Indonesia dengan pembaruan berkala.
                </p>
              )}
            </div>

            {/* Kanan: Koordinat {lat}, {lon}. Status: {statusTsunami}. + Simulasikan dampak gempa ini ↗ */}
            <div className="md:text-right md:ml-auto">
              {latestQuake ? (
                <div className="space-y-1">
                  <p>
                    Koordinat {formatCoordinates(latestQuake.lat, latestQuake.lon)}. Status: {tsunamiLabel.toLowerCase()}.
                  </p>
                  <div>
                    <Link
                      href={`/simulasi?m=${latestQuake.magnitudo}&d=${latestQuake.kedalamanKm}&lat=${latestQuake.lat}&lon=${latestQuake.lon}`}
                      className="text-[var(--color-primary)] font-semibold inline-flex items-center gap-1 hover:underline active:scale-[0.98] transition-transform"
                    >
                      <span>Simulasikan dampak gempa ini</span>
                      <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ) : (
                <p>
                  Simulasi estimasi percepatan tanah dan edukasi kesiapsiagaan menghadapi potensi bencana seismik berikutnya.
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
