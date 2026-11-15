"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronDown, RotateCcw, Calendar } from "lucide-react";

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

const MONTHS_ID = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

function formatFilterDate(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return iso;
  const mon = MONTHS_ID[Number(match[2]) - 1];
  return mon ? `${Number(match[3])} ${mon} ${match[1]}` : iso;
}

const labelCls = "block mb-2 text-xs font-medium leading-none text-[var(--color-text-secondary)]";

export function RiwayatFilter({
  initialMag = "",
  initialDari = "",
  initialSampai = "",
  initialWilayah = "",
  embedded = false,
}: RiwayatFilterProps) {
  const [open, setOpen] = useState(false);
  const [dari, setDari] = useState(initialDari);
  const [sampai, setSampai] = useState(initialSampai);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    setDari(initialDari);
    setSampai(initialSampai);
  }, [initialDari, initialSampai]);

  const hasActive = Boolean(initialMag || initialDari || initialSampai || initialWilayah);
  const submit = () => formRef.current?.requestSubmit();

  const openPicker = (e: React.MouseEvent<HTMLInputElement>) => {
    try {
      (e.currentTarget as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      // Abaikan jika browser tidak mendukung showPicker()
    }
  };

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
          className="inline-flex items-center gap-2 min-h-[44px] rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-4 text-sm font-medium text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Filter
          {hasActive && <span className="text-xs text-[var(--color-primary-strong)]">(aktif)</span>}
          <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {hasActive && (
          <Link
            href="/riwayat"
            className="min-h-[44px] inline-flex items-center gap-1.5 px-3 text-sm font-medium text-[var(--color-text-primary)] underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset
          </Link>
        )}
      </div>

      <form
        ref={formRef}
        id="riwayat-filter"
        method="GET"
        action="/riwayat"
        className={`${open ? "flex" : "hidden"} md:flex mt-4 md:mt-0 flex-col lg:flex-row lg:items-end gap-4`}
      >
        <div role="radiogroup" aria-labelledby="filter-mag-label" className="min-w-0 shrink-0">
          <span id="filter-mag-label" className={labelCls}>
            Magnitudo minimum
          </span>
          <div className="flex md:inline-flex w-full md:w-auto h-12 items-center gap-0.5 overflow-x-auto rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-sunken)] p-[1px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {MAG_OPTIONS.map((o) => (
              <label key={o.value || "all"} className="flex-1 md:flex-initial shrink-0">
                <input
                  type="radio"
                  name="mag"
                  value={o.value}
                  defaultChecked={initialMag === o.value}
                  onChange={submit}
                  className="peer sr-only"
                />
                <span className="flex h-[44px] min-w-[48px] cursor-pointer items-center justify-center rounded-full px-3.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:text-[var(--color-text-primary)] peer-checked:bg-[var(--color-surface-raised)] peer-checked:text-[var(--color-text-primary)] peer-checked:font-semibold peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-primary-strong)] tnum">
                  {o.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div role="group" aria-labelledby="filter-date-label" className="min-w-0 shrink-0">
          <span id="filter-date-label" className={labelCls}>
            Rentang tanggal
          </span>
          <div className="flex h-12 items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-3.5">
            <Calendar className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0 mr-2" aria-hidden="true" />
            <div className="relative flex-1 lg:flex-none lg:w-[116px] h-[44px] flex items-center rounded-full px-1.5 hover:bg-[var(--color-surface)]/60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-primary-strong)] transition-colors">
              <label htmlFor="filter-dari" className="sr-only">
                Dari tanggal
              </label>
              <span
                aria-hidden="true"
                className={`block w-full truncate text-sm tnum ${
                  dari ? "font-medium text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                }`}
              >
                {dari ? formatFilterDate(dari) : "Dari tanggal"}
              </span>
              <input
                id="filter-dari"
                type="date"
                name="dari"
                value={dari}
                onClick={openPicker}
                onChange={(e) => {
                  setDari(e.target.value);
                  submit();
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>

            <span className="mx-1.5 h-5 w-px bg-[var(--color-border)] shrink-0" aria-hidden="true" />

            <div className="relative flex-1 lg:flex-none lg:w-[124px] h-[44px] flex items-center rounded-full px-1.5 hover:bg-[var(--color-surface)]/60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-[var(--color-primary-strong)] transition-colors">
              <label htmlFor="filter-sampai" className="sr-only">
                Sampai tanggal
              </label>
              <span
                aria-hidden="true"
                className={`block w-full truncate text-sm tnum ${
                  sampai ? "font-medium text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
                }`}
              >
                {sampai ? formatFilterDate(sampai) : "Sampai tanggal"}
              </span>
              <input
                id="filter-sampai"
                type="date"
                name="sampai"
                value={sampai}
                onClick={openPicker}
                onChange={(e) => {
                  setSampai(e.target.value);
                  submit();
                }}
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <label htmlFor="filter-wilayah" className={labelCls}>
            Wilayah
          </label>
          <div className="relative flex h-12 items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] pl-4 pr-0.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-[var(--color-primary-strong)]">
            <Search className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0 mr-2.5 pointer-events-none" aria-hidden="true" />
            <input
              id="filter-wilayah"
              type="search"
              name="wilayah"
              defaultValue={initialWilayah}
              placeholder="Cari wilayah, misal: Bengkulu"
              className="h-[44px] w-full min-w-0 bg-transparent pr-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none"
            />
            <button
              type="submit"
              className="inline-flex h-[42px] min-h-[44px] shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] px-4 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)] transition-colors duration-150"
            >
              Cari
            </button>
          </div>
        </div>

        {hasActive && (
          <Link
            href="/riwayat"
            className="hidden md:inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-transparent px-4 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)] transition-colors duration-150"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Reset
          </Link>
        )}
      </form>
    </section>
  );
}
