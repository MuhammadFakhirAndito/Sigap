import React from "react";
import Link from "next/link";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { HistoryRow, GempaItem } from "@/components/ui/HistoryRow";
import { RiwayatFilter } from "@/components/ui/RiwayatFilter";
import { RiwayatChart } from "@/components/ui/RiwayatChart";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  CHART_DAYS,
  DailyCount,
  fillDailySeries,
  paginationItems,
  wibDayKey,
  windowStartUtc,
} from "@/lib/riwayat";
import { AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react";

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

function formatShortDateWib(date: Date, withYear = false): string {
  if (isNaN(date.getTime())) return "–";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "Asia/Jakarta",
  }).format(date);
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
  let parsedMinMag: number | undefined;
  let parsedStartDate: Date | undefined;
  let parsedEndDate: Date | undefined;
  const trimmedWilayah = wilayah?.trim() || "";

  if (mag) {
    const minMag = parseFloat(mag);
    if (!isNaN(minMag)) {
      parsedMinMag = minMag;
      where.magnitudo = { gte: minMag };
    }
  }

  if (dari || sampai) {
    where.waktuUtc = {};
    if (dari) {
      const startDate = new Date(`${dari}T00:00:00+07:00`);
      if (!isNaN(startDate.getTime())) {
        parsedStartDate = startDate;
        where.waktuUtc.gte = startDate;
      }
    }
    if (sampai) {
      const endDate = new Date(`${sampai}T23:59:59.999+07:00`);
      if (!isNaN(endDate.getTime())) {
        parsedEndDate = endDate;
        where.waktuUtc.lte = endDate;
      }
    }
  }

  if (trimmedWilayah.length > 0) {
    where.wilayah = {
      contains: trimmedWilayah,
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
  let maxMagnitudo: number | null = null;
  let rentangText = "–";
  let dailySeries: DailyCount[] = [];
  let isDbError = false;
  let latestSync: { status: string; createdAt: Date } | null = null;
  let lastSuccessfulSync: { createdAt: Date } | null = null;

  try {
    const [agg, d, latest, lastOk] = await Promise.all([
      prisma.gempa.aggregate({
        where,
        _count: { _all: true },
        _max: { magnitudo: true, waktuUtc: true },
        _min: { waktuUtc: true },
      }),
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

    total = agg._count._all;
    maxMagnitudo = agg._max.magnitudo;
    data = d as unknown as GempaItem[];
    latestSync = latest;
    lastSuccessfulSync = lastOk;

    const minUtc = agg._min.waktuUtc;
    const maxUtc = agg._max.waktuUtc;

    if (minUtc && maxUtc) {
      const minKey = wibDayKey(minUtc);
      const maxKey = wibDayKey(maxUtc);
      const sameYear = minKey.slice(0, 4) === maxKey.slice(0, 4);
      rentangText =
        minKey === maxKey
          ? formatShortDateWib(maxUtc, true)
          : `${formatShortDateWib(minUtc, !sameYear)} – ${formatShortDateWib(maxUtc, true)}`;

      const chartStartUtc = windowStartUtc(maxKey, CHART_DAYS);
      const sqlConds: Prisma.Sql[] = [
        Prisma.sql`"waktuUtc" >= ${chartStartUtc}`,
        Prisma.sql`"waktuUtc" <= ${maxUtc}`,
      ];
      if (parsedMinMag !== undefined) {
        sqlConds.push(Prisma.sql`"magnitudo" >= ${parsedMinMag}`);
      }
      if (parsedStartDate) {
        sqlConds.push(Prisma.sql`"waktuUtc" >= ${parsedStartDate}`);
      }
      if (parsedEndDate) {
        sqlConds.push(Prisma.sql`"waktuUtc" <= ${parsedEndDate}`);
      }
      if (trimmedWilayah.length > 0) {
        sqlConds.push(Prisma.sql`"wilayah" ILIKE ${`%${trimmedWilayah}%`}`);
      }
      if (tipe === "dirasakan") {
        sqlConds.push(Prisma.sql`"isDirasakan" = true`);
      } else if (tipe === "terkini") {
        sqlConds.push(Prisma.sql`"isTerkini" = true`);
      }

      const rawDaily = await prisma.$queryRaw<Array<{ hari: string; jumlah: number }>>(
        Prisma.sql`
          SELECT
            to_char(date_trunc('day', "waktuUtc" AT TIME ZONE 'Asia/Jakarta'), 'YYYY-MM-DD') AS hari,
            COUNT(*)::int AS jumlah
          FROM "gempa"
          WHERE ${Prisma.join(sqlConds, " AND ")}
          GROUP BY 1
          ORDER BY 1 ASC
        `
      );

      const startClampKey = parsedStartDate ? wibDayKey(parsedStartDate) : minKey;
      dailySeries = fillDailySeries(rawDaily, maxKey, CHART_DAYS, startClampKey);
    }
  } catch (err) {
    console.error("Gagal kueri database riwayat:", err);
    isDbError = true;
  }

  const totalHalaman = Math.max(1, Math.ceil(total / limit));
  const pages = paginationItems(hal, totalHalaman);

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

  const isBmkgFailed = latestSync?.status === "ERROR";

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-8 flex-1 flex flex-col space-y-6 sm:space-y-8">
        {/* SHELL ATAS: NOTCH NAVBAR + HEADER RIWAYAT + PANEL FILTER */}
        <section aria-labelledby="riwayat-heading" className="w-full">
          <NotchNavbar variant="notch" />

          <div className="rounded-b-[32px] md:rounded-b-[40px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-6 sm:px-9 lg:px-11 pt-5 sm:pt-7 pb-6 sm:pb-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div className="space-y-2 max-w-[600px]">
                <h1
                  id="riwayat-heading"
                  className="text-3xl sm:text-4xl lg:text-5xl font-normal tracking-[-0.03em] leading-[1.1] text-[var(--color-text-primary)]"
                >
                  Riwayat gempa
                </h1>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  Data dari BMKG yang disimpan agar tetap bisa dilihat saat BMKG tidak dapat diakses.
                </p>
              </div>

              {/* Pill Status Sinkronisasi (surface-raised) */}
              <div className="self-start lg:mt-1">
                {isDbError ? (
                  <span
                    role="status"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-warning)]/40 bg-[var(--color-surface-raised)] px-3.5 py-2 text-xs font-medium text-[var(--color-warning-strong)]"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)] shrink-0" aria-hidden="true" />
                    <span>Koneksi database lokal terputus</span>
                  </span>
                ) : isBmkgFailed ? (
                  <span
                    role="status"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-warning)]/40 bg-[var(--color-surface-raised)] px-3.5 py-2 text-xs font-medium text-[var(--color-warning-strong)]"
                  >
                    <AlertTriangle className="w-3.5 h-3.5 text-[var(--color-warning)] shrink-0" aria-hidden="true" />
                    <span>
                      {lastSuccessfulSync
                        ? `BMKG tidak dapat diakses. Data terakhir disinkronkan ${formatWibDate(lastSuccessfulSync.createdAt)}`
                        : "BMKG tidak dapat diakses. Menampilkan data lokal."}
                    </span>
                  </span>
                ) : (
                  <span
                    role="status"
                    className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-2 text-xs font-medium text-[var(--color-text-primary)]"
                  >
                    <span className="h-2 w-2 rounded-full bg-[var(--color-success)] shrink-0" aria-hidden="true" />
                    <span>
                      {lastSuccessfulSync
                        ? `Sumber: BMKG · disinkronkan ${formatRelative(lastSuccessfulSync.createdAt)}`
                        : "Sumber: BMKG · data lokal siap"}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--color-border)]">
              <RiwayatFilter
                embedded
                initialMag={mag}
                initialDari={dari}
                initialSampai={sampai}
                initialWilayah={wilayah}
              />
            </div>
          </div>
        </section>

        <main className="flex-1 flex flex-col space-y-6 sm:space-y-8">
          {/* Ringkasan & Grafik Jumlah Gempa per Hari */}
          {!isDbError && total > 0 && (
            <RiwayatChart
              series={dailySeries}
              total={total}
              maxMagnitudo={maxMagnitudo}
              rentangText={rentangText}
            />
          )}

          {/* Daftar Riwayat Gempa */}
          <section aria-label="Daftar riwayat gempa" className="space-y-5">
            {isDbError ? (
              <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 flex flex-col items-center justify-center text-center">
                <ErrorState
                  title="Gagal terhubung ke database"
                  message="Data riwayat gempa sementara tidak dapat dimuat karena layanan database lokal sedang tidak terjangkau. Silakan muat ulang halaman."
                />
                <Link
                  href="/riwayat"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] transition-colors min-h-[44px]"
                >
                  Coba lagi
                </Link>
              </div>
            ) : data.length === 0 ? (
              <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 flex flex-col items-center justify-center text-center">
                <EmptyState message="Tidak ada gempa yang cocok dengan filter" />
                <Link
                  href="/riwayat"
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)]/60 bg-[var(--color-surface-raised)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] transition-colors min-h-[44px]"
                >
                  Reset
                </Link>
              </div>
            ) : (
              <div
                role="feed"
                aria-label="Daftar gempa"
                className="space-y-3 md:space-y-0 md:rounded-[28px] md:border md:border-[var(--color-border)] md:bg-[var(--color-surface)] md:overflow-hidden md:divide-y md:divide-[var(--color-border)]"
              >
                {data.map((gempa) => (
                  <HistoryRow key={gempa.id} gempa={gempa} />
                ))}
              </div>
            )}

            {/* Paginasi 15 Baris/Halaman (Prev/Next + Nomor Ringkas >= 44px) */}
            {!isDbError && totalHalaman > 1 && (
              <nav
                aria-label="Paginasi riwayat gempa"
                className="pt-2 flex flex-wrap items-center justify-center gap-1 sm:gap-1.5"
              >
                {hal > 1 ? (
                  <Link
                    href={createPageUrl(hal - 1)}
                    className="px-3 sm:px-4 min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] text-sm font-medium text-[var(--color-text-primary)] transition-colors"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="px-3 sm:px-4 min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                  </span>
                )}

                {pages.map((item, idx) =>
                  item === "gap" ? (
                    <span
                      key={`gap-${idx}`}
                      aria-hidden="true"
                      className="min-h-[44px] min-w-[20px] inline-flex items-center justify-center text-sm text-[var(--color-text-muted)]"
                    >
                      …
                    </span>
                  ) : item === hal ? (
                    <span
                      key={item}
                      aria-current="page"
                      className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3.5 inline-flex items-center justify-center rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] text-sm font-semibold tnum"
                    >
                      {item}
                    </span>
                  ) : (
                    <Link
                      key={item}
                      href={createPageUrl(item)}
                      aria-label={`Halaman ${item}`}
                      className="min-h-[44px] min-w-[44px] px-2.5 sm:px-3.5 inline-flex items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] text-sm font-medium text-[var(--color-text-primary)] transition-colors tnum"
                    >
                      {item}
                    </Link>
                  )
                )}

                {hal < totalHalaman ? (
                  <Link
                    href={createPageUrl(hal + 1)}
                    className="px-3 sm:px-4 min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] text-sm font-medium text-[var(--color-text-primary)] transition-colors"
                    aria-label="Halaman berikutnya"
                  >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="px-3 sm:px-4 min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-medium text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
                  >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                  </span>
                )}
              </nav>
            )}
          </section>
        </main>
      </div>

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
