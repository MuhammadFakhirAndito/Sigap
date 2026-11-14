"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronDown } from "lucide-react";

interface RiwayatFilterProps {
  initialMag?: string;
  initialDari?: string;
  initialSampai?: string;
  initialWilayah?: string;
  embedded?: boolean;
}

const MAG_OPTIONS = [
  { value: "", label: "Semua" },
  { value: "3", label: "≥3" },
  { value: "4", label: "≥4" },
  { value: "5", label: "≥5" },
  { value: "6", label: "≥6" },
];

const fieldCls =
  "min-h-[44px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 text-sm text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary)]";

export function RiwayatFilter({
  initialMag = "",
  initialDari = "",
  initialSampai = "",
  initialWilayah = "",
  embedded = false,
}: RiwayatFilterProps) {
  const [open, setOpen] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const hasActive = Boolean(initialMag || initialDari || initialSampai || initialWilayah);
  const submit = () => formRef.current?.requestSubmit();

  const wrapperCls = embedded
    ? ""
    : "rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6";

  return (
    <section aria-label="Filter riwayat gempa" className={wrapperCls}>
      <div className="flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="riwayat-filter"
          className="inline-flex items-center gap-2 min-h-[44px] rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 text-sm font-medium text-[var(--color-text-primary)]"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Filter
          {hasActive && <span className="text-xs text-[var(--color-text-secondary)]">(aktif)</span>}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {hasActive && (
          <Link
            href="/riwayat"
            className="min-h-[44px] inline-flex items-center px-3 text-sm text-[var(--color-text-secondary)] underline underline-offset-4"
          >
            Reset
          </Link>
        )}
      </div>

      <form
        ref={formRef}
        id="riwayat-filter"
        method="GET"
        action="/riwayat"
        className={`${open ? "flex" : "hidden"} md:flex mt-4 md:mt-0 flex-col lg:flex-row lg:items-end gap-4 lg:gap-5`}
      >
        <fieldset className="min-w-0">
          <legend className="mb-2 text-xs text-[var(--color-text-secondary)]">Magnitudo minimum</legend>
          <div className="flex gap-1 overflow-x-auto rounded-full bg-[var(--color-surface-raised)] p-1 border border-[var(--color-border)] w-max max-w-full">
            {MAG_OPTIONS.map((o) => (
              <label key={o.value || "all"} className="shrink-0">
                <input
                  type="radio"
                  name="mag"
                  value={o.value}
                  defaultChecked={initialMag === o.value}
                  onChange={submit}
                  className="peer sr-only"
                />
                <span className="flex min-h-[44px] min-w-[52px] cursor-pointer items-center justify-center rounded-full px-3.5 text-sm text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--color-text-primary)] peer-checked:bg-[var(--color-cta)] peer-checked:text-[var(--color-on-cta)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-primary)] tnum">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="min-w-0">
          <legend className="mb-2 text-xs text-[var(--color-text-secondary)]">Rentang tanggal</legend>
          <div className="flex items-center gap-2">
            <label htmlFor="filter-dari" className="sr-only">
              Dari tanggal
            </label>
            <input
              id="filter-dari"
              type="date"
              name="dari"
              defaultValue={initialDari}
              onChange={submit}
              className={`${fieldCls} w-full lg:w-[156px]`}
            />
            <span className="text-[var(--color-text-muted)]" aria-hidden="true">
              –
            </span>
            <label htmlFor="filter-sampai" className="sr-only">
              Sampai tanggal
            </label>
            <input
              id="filter-sampai"
              type="date"
              name="sampai"
              defaultValue={initialSampai}
              onChange={submit}
              className={`${fieldCls} w-full lg:w-[156px]`}
            />
          </div>
        </fieldset>

        <div className="flex-1 min-w-0">
          <label htmlFor="filter-wilayah" className="mb-2 block text-xs text-[var(--color-text-secondary)]">
            Wilayah
          </label>
          <div className="relative">
            <input
              id="filter-wilayah"
              type="search"
              name="wilayah"
              defaultValue={initialWilayah}
              placeholder="Misal: Bengkulu, Maluku"
              className={`${fieldCls} w-full pl-5 pr-12 placeholder:text-[var(--color-text-muted)]`}
            />
            <button
              type="submit"
              aria-label="Cari wilayah"
              className="absolute right-0 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] hover:opacity-85 transition-opacity"
            >
              <Search className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <Link
          href="/riwayat"
          aria-disabled={!hasActive}
          className={`hidden md:inline-flex min-h-[44px] items-center justify-center rounded-full border px-5 text-sm transition-colors duration-150 ${
            hasActive
              ? "border-[var(--color-border-strong)]/60 text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
              : "border-[var(--color-border)] text-[var(--color-text-muted)] pointer-events-none"
          }`}
        >
          Reset
        </Link>
      </form>
    </section>
  );
}
