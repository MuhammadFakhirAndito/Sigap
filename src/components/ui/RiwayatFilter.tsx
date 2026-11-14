"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, Filter, RotateCcw, ChevronDown, ChevronUp } from "lucide-react";

interface RiwayatFilterProps {
  initialMag?: string;
  initialDari?: string;
  initialSampai?: string;
  initialWilayah?: string;
}

export function RiwayatFilter({
  initialMag = "",
  initialDari = "",
  initialSampai = "",
  initialWilayah = "",
}: RiwayatFilterProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  const hasActiveFilters = Boolean(
    initialMag || initialDari || initialSampai || initialWilayah
  );

  return (
    <section
      aria-label="Filter riwayat gempa"
      className="rounded-[28px] sm:rounded-[32px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7 shadow-2xs transition-colors duration-200"
    >
      {/* Mobile Toggle Bar */}
      <div className="flex items-center justify-between sm:hidden">
        <button
          type="button"
          onClick={() => setIsOpenMobile((prev) => !prev)}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)] min-h-[44px] px-2 -ml-2 rounded-xl focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
          aria-expanded={isOpenMobile}
          aria-controls="filter-form-body"
        >
          <Filter className="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
          <span>Filter riwayat</span>
          {hasActiveFilters && (
            <span className="h-2 w-2 rounded-full bg-[var(--color-primary)]" title="Filter aktif" />
          )}
          {isOpenMobile ? (
            <ChevronUp className="w-4 h-4 text-[var(--color-text-muted)]" />
          ) : (
            <ChevronDown className="w-4 h-4 text-[var(--color-text-muted)]" />
          )}
        </button>

        {hasActiveFilters && (
          <Link
            href="/riwayat"
            className="text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] min-h-[44px] flex items-center px-2"
          >
            Reset
          </Link>
        )}
      </div>

      {/* Filter Body (Always visible on desktop, toggleable on mobile) */}
      <div
        id="filter-form-body"
        className={`${isOpenMobile ? "block pt-4" : "hidden"} sm:block sm:pt-0`}
      >
        <form method="GET" action="/riwayat" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-12 items-end">
            {/* Filter Magnitudo */}
            <div className="space-y-1.5 lg:col-span-3">
              <label htmlFor="filter-mag" className="text-xs font-medium text-[var(--color-text-secondary)]">
                Magnitudo minimum
              </label>
              <select
                id="filter-mag"
                name="mag"
                defaultValue={initialMag}
                className="w-full min-h-[44px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-2 text-sm text-[var(--color-text-primary)] shadow-2xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
              >
                <option value="">Semua magnitudo</option>
                <option value="3">≥ 3,0 M</option>
                <option value="4">≥ 4,0 M</option>
                <option value="5">≥ 5,0 M (gempa terkini)</option>
                <option value="6">≥ 6,0 M (gempa kuat)</option>
              </select>
            </div>

            {/* Filter Tanggal Mulai */}
            <div className="space-y-1.5 lg:col-span-3">
              <label htmlFor="filter-dari" className="text-xs font-medium text-[var(--color-text-secondary)]">
                Dari tanggal
              </label>
              <input
                type="date"
                id="filter-dari"
                name="dari"
                defaultValue={initialDari}
                className="w-full min-h-[44px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-2 text-sm text-[var(--color-text-primary)] shadow-2xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
              />
            </div>

            {/* Filter Tanggal Selesai */}
            <div className="space-y-1.5 lg:col-span-3">
              <label htmlFor="filter-sampai" className="text-xs font-medium text-[var(--color-text-secondary)]">
                Sampai tanggal
              </label>
              <input
                type="date"
                id="filter-sampai"
                name="sampai"
                defaultValue={initialSampai}
                className="w-full min-h-[44px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-2 text-sm text-[var(--color-text-primary)] shadow-2xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
              />
            </div>

            {/* Tombol Terapkan & Reset */}
            <div className="flex items-center gap-2 lg:col-span-3">
              <button
                type="submit"
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-5 py-2.5 text-sm font-medium hover:opacity-90 active:scale-95 transition-all shadow-2xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
              >
                <Filter className="w-4 h-4" aria-hidden="true" />
                <span>Terapkan</span>
              </button>

              <Link
                href="/riwayat"
                className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] active:scale-95 transition-all shadow-2xs focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
                title="Reset semua filter"
                aria-label="Reset semua filter pencarian"
              >
                <RotateCcw className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          {/* Pencarian Wilayah */}
          <div className="relative pt-1">
            <label htmlFor="filter-wilayah" className="sr-only">
              Cari wilayah gempa
            </label>
            <div className="relative flex items-center">
              <Search
                className="absolute left-4 w-4 h-4 text-[var(--color-text-muted)] pointer-events-none"
                aria-hidden="true"
              />
              <input
                type="text"
                id="filter-wilayah"
                name="wilayah"
                defaultValue={initialWilayah}
                placeholder="Cari wilayah gempa (contoh: Sukabumi, Bengkulu, Maluku, Jawa Barat)..."
                className="w-full min-h-[44px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] pl-11 pr-5 py-2.5 text-sm text-[var(--color-text-primary)] shadow-2xs placeholder:text-[var(--color-text-muted)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary)]"
              />
            </div>
          </div>
        </form>
      </div>
    </section>
  );
}
