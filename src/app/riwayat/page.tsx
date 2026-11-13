import React from "react";
import Link from "next/link";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { MagnitudeBadge } from "@/components/ui/MagnitudeBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  Search,
  Filter,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Sliders,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Compass,
  ArrowUpRight,
} from "lucide-react";

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

function formatWib(date: Date): string {
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

  let data: any[] = [];
  let total = 0;
  let isDbError = false;
  let lastSyncRecord: any = null;

  try {
    const [t, d, s] = await Promise.all([
      prisma.gempa.count({ where }),
      prisma.gempa.findMany({
        where,
        orderBy: { waktuUtc: "desc" },
        skip: (hal - 1) * limit,
        take: limit,
      }),
      prisma.syncLog.findFirst({
        where: { status: "OK" },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    total = t;
    data = d;
    lastSyncRecord = s;
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

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <NotchNavbar />

      <main className="w-full max-w-[1220px] mx-auto px-4 sm:px-6 py-8 sm:py-10 space-y-10 flex-1">
        {/* Header Terpusat */}
        <section className="text-center max-w-2xl mx-auto space-y-3">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Riwayat Gempa Bumi
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed">
            Data dari BMKG yang disimpan agar tetap bisa dilihat saat BMKG tidak dapat diakses.
          </p>

          {/* Baris Status Sinkronisasi */}
          <div className="pt-2 flex justify-center">
            {lastSyncRecord ? (
              <StatusBadge
                variant="sync_ok"
                customText={`Sumber: BMKG · disinkronkan ${formatRelative(lastSyncRecord.createdAt)}`}
              />
            ) : (
              <StatusBadge
                variant="sync_warning"
                customText="BMKG tidak dapat diakses. Menampilkan data lokal."
              />
            )}
          </div>
        </section>

        {/* Filter Bar (Panel surface, radius 28, padding 24) */}
        <section
          aria-label="Filter Riwayat Gempa"
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[28px] p-6 sm:p-7 shadow-xs"
        >
          <form method="GET" action="/riwayat" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
              {/* Filter Magnitudo */}
              <div className="lg:col-span-3 space-y-1.5">
                <label htmlFor="filter-mag" className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Magnitudo Minimum
                </label>
                <select
                  id="filter-mag"
                  name="mag"
                  defaultValue={mag || ""}
                  className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] rounded-full px-4 py-2.5 text-sm text-[var(--color-text-primary)] min-h-[44px] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  <option value="">Semua Magnitudo</option>
                  <option value="3">≥ 3.0 SR</option>
                  <option value="4">≥ 4.0 SR</option>
                  <option value="5">≥ 5.0 SR (Gempa Terkini)</option>
                  <option value="6">≥ 6.0 SR (Kuat)</option>
                </select>
              </div>

              {/* Filter Rentang Tanggal: Dari */}
              <div className="lg:col-span-3 space-y-1.5">
                <label htmlFor="filter-dari" className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Dari Tanggal
                </label>
                <input
                  type="date"
                  id="filter-dari"
                  name="dari"
                  defaultValue={dari || ""}
                  className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] rounded-full px-4 py-2 text-sm text-[var(--color-text-primary)] min-h-[44px] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
                />
              </div>

              {/* Filter Rentang Tanggal: Sampai */}
              <div className="lg:col-span-3 space-y-1.5">
                <label htmlFor="filter-sampai" className="text-xs font-semibold text-[var(--color-text-secondary)]">
                  Sampai Tanggal
                </label>
                <input
                  type="date"
                  id="filter-sampai"
                  name="sampai"
                  defaultValue={sampai || ""}
                  className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] rounded-full px-4 py-2 text-sm text-[var(--color-text-primary)] min-h-[44px] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
                />
              </div>

              {/* Tombol Terapkan & Reset */}
              <div className="lg:col-span-3 flex items-center gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[var(--color-cta)] text-[var(--color-on-cta)] rounded-full px-6 py-2.5 min-h-[44px] text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-opacity duration-150 flex items-center justify-center gap-1.5 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filter</span>
                </button>

                <Link
                  href="/riwayat"
                  className="inline-flex items-center justify-center p-2.5 min-h-[44px] min-w-[44px] rounded-full border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] active:scale-95 transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
                  title="Reset Filter"
                  aria-label="Reset semua filter pencarian"
                >
                  <RotateCcw className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Input Pencarian Wilayah */}
            <div className="relative pt-1">
              <label htmlFor="filter-wilayah" className="sr-only">
                Cari Wilayah Gempa
              </label>
              <div className="relative flex items-center">
                <Search className="w-4 h-4 text-[var(--color-text-secondary)] absolute left-4 pointer-events-none" />
                <input
                  type="text"
                  id="filter-wilayah"
                  name="wilayah"
                  defaultValue={wilayah || ""}
                  placeholder="Ketik nama wilayah atau kota (misal: Sukabumi, Maluku, Jawa Barat)..."
                  className="w-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] rounded-full pl-11 pr-5 py-2.5 text-sm text-[var(--color-text-primary)] min-h-[44px] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] placeholder:text-[var(--color-text-secondary)]"
                />
              </div>
            </div>
          </form>
        </section>

        {/* Grafik Ringkas Hasil Terfilter (SVG Murni Sesuai Spesifikasi) */}
        {!isDbError && data.length > 0 && (
          <section
            aria-label="Grafik Distribusi Magnitudo"
            className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[28px] p-6 sm:p-7 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                Distribusi Magnitudo pada Halaman Ini
              </h2>
              <span className="text-xs text-[var(--color-text-secondary)] tnum">
                Menampilkan {data.length} dari {total} data
              </span>
            </div>

            {/* Visualisasi Bar Chart Semantik Ringan */}
            <div className="h-28 w-full flex items-end gap-2 pt-4 px-2 border-b border-[var(--color-border)] pb-2 overflow-x-auto">
              {data.slice(0, 15).map((q, idx) => {
                const heightPercent = Math.min(100, Math.max(15, (q.magnitudo / 8) * 100));
                return (
                  <div
                    key={q.id || idx}
                    className="flex-1 min-w-[20px] max-w-[48px] flex flex-col items-center gap-1 group relative"
                  >
                    <span className="text-xs text-[var(--color-text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity absolute -top-5 tnum font-semibold">
                      {q.magnitudo.toFixed(1).replace(".", ",")}
                    </span>
                    <div
                      className="w-full bg-[var(--color-surface-raised)] group-hover:bg-[var(--color-primary)] border border-[var(--color-border)] rounded-t-md transition-colors duration-200"
                      style={{ height: `${heightPercent}%` }}
                    />
                    <span className="text-xs text-[var(--color-text-secondary)] tnum">
                      #{idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
            <p className="sr-only">
              Tabel ringkas magnitudo: {data.map((q, i) => `#${i + 1} M${q.magnitudo} di ${q.wilayah}`).join("; ")}
            </p>
          </section>
        )}

        {/* Daftar Gempa (Baris, bukan grid) */}
        <section aria-label="Daftar Riwayat Gempa" className="space-y-4">
          {isDbError ? (
            <ErrorState
              title="Gagal Terhubung ke Database"
              message="Data riwayat gempa sementara tidak dapat dimuat. Silakan periksa koneksi atau coba beberapa saat lagi."
            />
          ) : data.length === 0 ? (
            <EmptyState
              message="Tidak ada data gempa bumi yang cocok dengan kriteria filter Anda."
              actionText="Reset Pencarian"
              onAction={() => {}}
            />
          ) : (
            <div className="space-y-3" role="feed" aria-label="Daftar gempa terkini">
              {data.map((quake) => {
                const dateObj = new Date(quake.waktuUtc);
                const hrefSimulasi = `/simulasi?m=${quake.magnitudo}&d=${quake.kedalamanKm}&lat=${quake.lat}&lon=${quake.lon}`;

                return (
                  <article
                    key={quake.id}
                    className="bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-2xl sm:rounded-[28px] p-5 sm:p-6 transition-colors duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    {/* Kolom Kiri: Magnitudo & Info Utama */}
                    <div className="flex items-start gap-4">
                      <div className="shrink-0 pt-0.5">
                        <MagnitudeBadge magnitude={quake.magnitudo} size="lg" />
                      </div>

                      <div className="space-y-1.5">
                        <h3 className="font-semibold text-base sm:text-lg text-[var(--color-text-primary)] leading-snug">
                          {quake.wilayah}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                            <time dateTime={dateObj.toISOString()} className="tnum">
                              {formatWib(dateObj)}
                            </time>
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Layers className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                            <span className="tnum">Kedalaman {quake.kedalamanKm} km</span>
                          </span>

                          <span className="inline-flex items-center gap-1">
                            <Compass className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                            <span className="tnum">
                              {Math.abs(quake.lat).toFixed(2).replace(".", ",")} {quake.lat < 0 ? "LS" : "LU"},{" "}
                              {Math.abs(quake.lon).toFixed(2).replace(".", ",")} {quake.lon < 0 ? "BB" : "BT"}
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Kolom Kanan: Status Tsunami & Aksi Simulasikan */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]/50">
                      <StatusBadge
                        variant={
                          quake.statusTsunami === "AMAN"
                            ? "tsunami_aman"
                            : quake.statusTsunami === "BERPOTENSI"
                            ? "tsunami_berpotensi"
                            : "tsunami_tidak_dinyatakan"
                        }
                        customText={quake.potensiTeks}
                        onSurface={false}
                      />

                      <Link
                        href={hrefSimulasi}
                        className="inline-flex items-center gap-1.5 px-4 py-2 min-h-[44px] rounded-full border border-[var(--color-border-strong)] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
                      >
                        <span>Simulasikan</span>
                        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* Paginasi 15 Baris / Halaman (Tombol >= 44px) */}
          {!isDbError && totalHalaman > 1 && (
            <nav
              aria-label="Paginasi Riwayat Gempa"
              className="pt-8 flex flex-wrap items-center justify-center gap-2"
            >
              {hal > 1 ? (
                <Link
                  href={createPageUrl(hal - 1)}
                  className="px-4 py-2.5 min-h-[44px] min-w-[44px] inline-flex items-center gap-1 rounded-full border border-[var(--color-border-strong)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
                  aria-label="Halaman Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </Link>
              ) : (
                <button
                  disabled
                  className="px-4 py-2.5 min-h-[44px] min-w-[44px] inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] opacity-40 cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Sebelumnya</span>
                </button>
              )}

              <span className="px-4 py-2.5 min-h-[44px] inline-flex items-center rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] text-sm font-semibold tnum">
                {hal} / {totalHalaman}
              </span>

              {hal < totalHalaman ? (
                <Link
                  href={createPageUrl(hal + 1)}
                  className="px-4 py-2.5 min-h-[44px] min-w-[44px] inline-flex items-center gap-1 rounded-full border border-[var(--color-border-strong)] text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
                  aria-label="Halaman Berikutnya"
                >
                  <span>Berikutnya</span>
                  <ChevronRight className="w-4 h-4" />
                </Link>
              ) : (
                <button
                  disabled
                  className="px-4 py-2.5 min-h-[44px] min-w-[44px] inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] text-sm font-medium text-[var(--color-text-secondary)] opacity-40 cursor-not-allowed"
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
          lastSyncRecord ? `Disinkronkan ${formatWib(lastSyncRecord.createdAt)}` : undefined
        }
      />
    </div>
  );
}
