import React from "react";
import Link from "next/link";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { HistoryRow, GempaItem } from "@/components/ui/HistoryRow";
import { RiwayatFilter } from "@/components/ui/RiwayatFilter";
import { RiwayatChart } from "@/components/ui/RiwayatChart";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const dynamic = "force-dynamic";

interface RiwayatPageProps {
  searchParams: Promise<{
    mag?: string;
    dari?: string;
    sampai?: string;
    wilayah?: string;
    hal?: string;
    tipe?: string;
  }>;
}

function formatWibDate(date: Date): string {
  if (isNaN(date.getTime())) return "waktu tidak tersedia";
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

function formatRelative(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return "baru saja";
  if (diffMins < 60) return `${diffMins} menit lalu`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} jam lalu`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} hari lalu`;
}

export default async function RiwayatPage({ searchParams }: RiwayatPageProps) {
  const params = await searchParams;
  const mag = params.mag;
  const dari = params.dari;
  const sampai = params.sampai;
  const wilayah = params.wilayah;
  const hal = Math.max(1, parseInt(params.hal || "1", 10));
  const limit = 15;
  const tipe = params.tipe;

  const where: Prisma.GempaWhereInput = {};

  if (mag) {
    const minMag = parseFloat(mag);
    if (!isNaN(minMag)) {
      where.magnitudo = { gte: minMag };
    }
  }

  if (dari || sampai) {
    where.waktuUtc = {};
    if (dari) {
      const startDate = new Date(dari);
      if (!isNaN(startDate.getTime())) {
        where.waktuUtc.gte = startDate;
      }
    }
    if (sampai) {
      const endDate = new Date(sampai);
      if (!isNaN(endDate.getTime())) {
        endDate.setUTCHours(23, 59, 59, 999);
        where.waktuUtc.lte = endDate;
      }
    }
  }

  if (wilayah && wilayah.trim().length > 0) {
    where.wilayah = {
      contains: wilayah.trim(),
      mode: "insensitive",
    };
  }

  if (tipe === "dirasakan") {
    where.isDirasakan = true;
  } else if (tipe === "terkini") {
    where.isTerkini = true;
  }

  let data: GempaItem[] = [];
  let total = 0;
  let isDbError = false;
  let latestSync: { status: string; createdAt: Date } | null = null;
  let lastSuccessfulSync: { createdAt: Date } | null = null;

  try {
    const [t, d, latest, lastOk] = await Promise.all([
      prisma.gempa.count({ where }),
      prisma.gempa.findMany({
        where,
        orderBy: { waktuUtc: "desc" },
        skip: (hal - 1) * limit,
        take: limit,
      }),
      prisma.syncLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { status: true, createdAt: true },
      }),
      prisma.syncLog.findFirst({
        where: { status: "OK" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);
    total = t;
    data = d as unknown as GempaItem[];
    latestSync = latest;
    lastSuccessfulSync = lastOk;
  } catch (err) {
    console.error("Gagal kueri database riwayat:", err);
    isDbError = true;
  }

  const totalHalaman = Math.max(1, Math.ceil(total / limit));

  // Helper untuk membuat URL paginasi
  function createPageUrl(targetPage: number) {
    const p = new URLSearchParams();
    if (mag) p.set("mag", mag);
    if (dari) p.set("dari", dari);
    if (sampai) p.set("sampai", sampai);
    if (wilayah) p.set("wilayah", wilayah);
    if (tipe) p.set("tipe", tipe);
    p.set("hal", targetPage.toString());
    return `/riwayat?${p.toString()}`;
  }

  // Tentukan status sinkronisasi BMKG
  const isBmkgFailed = latestSync?.status === "ERROR";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      {/* Header selaras dengan batas kanvas Verdro max-w-[1440px] */}
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 pt-4">
        <NotchNavbar />
      </div>

      <main className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-8 flex-1">
        {/* Header Terpusat Berbobot Editorial Verdro */}
        <section className="text-center max-w-[720px] mx-auto space-y-3 pt-2 sm:pt-4">
          <h1 className="text-[32px] sm:text-[42px] lg:text-[46px] font-light tracking-[-0.03em] leading-[1.08] text-[var(--color-text-primary)]">
            <span className="text-[var(--color-primary)] font-normal">Arsip riwayat</span> gempa bumi Indonesia
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-[620px] mx-auto text-pretty">
            Data resmi dari BMKG yang disimpan persisten di database lokal agar tetap dapat diakses saat portal BMKG padam atau mengalami gangguan.
          </p>

          {/* Baris Status Sinkronisasi BMKG */}
          <div className="pt-2 flex justify-center">
            {isDbError ? (
              <StatusBadge
                variant="sync_warning"
                customText="Koneksi database lokal terputus"
              />
            ) : isBmkgFailed ? (
              <StatusBadge
                variant="sync_warning"
                customText={
                  lastSuccessfulSync
                    ? `BMKG tidak dapat diakses. Data terakhir disinkronkan ${formatWibDate(lastSuccessfulSync.createdAt)}`
                    : "BMKG tidak dapat diakses. Menampilkan data lokal."
                }
              />
            ) : lastSuccessfulSync ? (
              <StatusBadge
                variant="sync_ok"
                customText={`Sumber: BMKG · disinkronkan ${formatRelative(lastSuccessfulSync.createdAt)}`}
              />
            ) : (
              <StatusBadge
                variant="sync_ok"
                customText="Sumber: BMKG · data lokal siap"
              />
            )}
          </div>
        </section>

        {/* Panel Filter Collapsible di Mobile */}
        <RiwayatFilter
          initialMag={mag}
          initialDari={dari}
          initialSampai={sampai}
          initialWilayah={wilayah}
        />

        {/* Grafik Distribusi Magnitudo (SVG/CSS Tanpa Library) */}
        {!isDbError && data.length > 0 && (
          <RiwayatChart data={data} totalData={total} />
        )}

        {/* Daftar Gempa atau State Error/Empty */}
        <section aria-label="Daftar riwayat gempa" className="space-y-4">
          {isDbError ? (
            <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 flex flex-col items-center justify-center text-center">
              <ErrorState
                title="Gagal terhubung ke database"
                message="Data riwayat gempa sementara tidak dapat dimuat karena layanan database lokal sedang tidak terjangkau. Silakan muat ulang halaman."
              />
              <Link
                href="/riwayat"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-all min-h-[44px]"
              >
                Muat ulang halaman
              </Link>
            </div>
          ) : data.length === 0 ? (
            <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 flex flex-col items-center justify-center text-center">
              <EmptyState
                message="Tidak ada data gempa bumi yang cocok dengan kriteria filter Anda."
              />
              <Link
                href="/riwayat"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-all min-h-[44px]"
              >
                Reset filter pencarian
              </Link>
            </div>
          ) : (
            <div className="space-y-3" role="feed" aria-label="Daftar gempa terkini">
              {data.map((gempa) => (
                <HistoryRow key={gempa.id} gempa={gempa} />
              ))}
            </div>
          )}

          {/* Paginasi 15 Baris / Halaman (Tombol >= 44px dengan pill style Verdro) */}
          {!isDbError && totalHalaman > 1 && (
            <nav
              aria-label="Paginasi riwayat gempa"
              className="pt-6 flex flex-wrap items-center justify-center gap-2.5"
            >
              {hal > 1 ? (
                <Link
                  href={createPageUrl(hal - 1)}
                  className="px-5 py-2.5 min-h-[44px] min-w-[44px] inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] hover:bg-[var(--color-surface-raised)] text-sm font-medium text-[var(--color-text-primary)] transition-all duration-150 shadow-2xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] active:scale-95"
                  aria-label="Halaman sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="px-5 py-2.5 min-h-[44px] min-w-[44px] inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>
              )}

              <span className="px-5 py-2.5 min-h-[44px] inline-flex items-center rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] text-sm font-semibold shadow-2xs tnum">
                {hal} / {totalHalaman}
              </span>

              {hal < totalHalaman ? (
                <Link
                  href={createPageUrl(hal + 1)}
                  className="px-5 py-2.5 min-h-[44px] min-w-[44px] inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] hover:bg-[var(--color-surface-raised)] text-sm font-medium text-[var(--color-text-primary)] transition-all duration-150 shadow-2xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] active:scale-95"
                  aria-label="Halaman berikutnya"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  disabled
                  className="px-5 py-2.5 min-h-[44px] min-w-[44px] inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              )}
            </nav>
          )}
        </section>
      </main>

      <Footer
        lastUpdatedText={
          lastSuccessfulSync
            ? `Disinkronkan ${formatWibDate(lastSuccessfulSync.createdAt)}`
            : undefined
        }
      />
    </div>
  );
}
