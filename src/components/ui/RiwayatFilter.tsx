"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, ChevronDown, RotateCcw } from "lucide-react";

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

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]";
const rowLabelCls = "shrink-0 text-sm text-[var(--color-text-secondary)] sm:w-24";

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

  const dateField = (
    id: string,
    name: "dari" | "sampai",
    label: string,
    value: string,
    setValue: (v: string) => void
  ) => (
    <div className="relative inline-flex min-h-[44px] items-center has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-primary-strong)]">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <span
        aria-hidden="true"
        className={`text-base underline decoration-dotted decoration-[var(--color-border-strong)] underline-offset-[6px] tnum ${
          value ? "font-semibold text-[var(--color-text-primary)]" : "text-[var(--color-text-secondary)]"
        }`}
      >
        {value ? formatFilterDate(value) : label.toLowerCase()}
      </span>
      <input
        id={id}
        type="date"
        name={name}
        value={value}
        onClick={openPicker}
        onChange={(e) => {
          setValue(e.target.value);
          submit();
        }}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
      />
    </div>
  );

  return (
    <section aria-label="Filter riwayat gempa" className={wrapperCls}>
      <div className="flex items-center justify-between md:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="riwayat-filter"
          className={`inline-flex items-center gap-2 min-h-[44px] rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-4 text-sm font-medium text-[var(--color-text-primary)] ${focusRing}`}
        >
          <SlidersHorizontal className="w-4 h-4" aria-hidden="true" />
          Filter
          {hasActive && <span className="text-xs text-[var(--color-primary-strong)]">(aktif)</span>}
          <ChevronDown
            className={`w-4 h-4 transition-transform motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </button>
        {hasActive && (
          <Link
            href="/riwayat"
            className={`min-h-[44px] inline-flex items-center gap-1.5 px-3 text-sm font-medium text-[var(--color-text-primary)] underline underline-offset-4 ${focusRing}`}
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            Hapus filter
          </Link>
        )}
      </div>

      <form
        ref={formRef}
        id="riwayat-filter"
        method="GET"
        action="/riwayat"
        className={`${open ? "flex" : "hidden"} md:flex mt-4 md:mt-0 flex-col gap-4`}
      >
        {/* Pencarian wilayah adalah aksi utama, jadi dibuat paling besar; filter lain jadi baris teks di bawahnya. */}
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0">
          <label htmlFor="filter-wilayah" className={rowLabelCls}>
            Wilayah
          </label>
          <div className="flex flex-1 min-w-0 items-center gap-3 border-b-2 border-[var(--color-border-strong)] transition-colors duration-150 focus-within:border-[var(--color-cta)]">
            <Search className="w-5 h-5 text-[var(--color-text-secondary)] shrink-0 pointer-events-none" aria-hidden="true" />
            <input
              id="filter-wilayah"
              type="search"
              name="wilayah"
              defaultValue={initialWilayah}
              placeholder="misal: Bengkulu"
              className="h-14 w-full min-w-0 bg-transparent text-lg sm:text-xl text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] focus:outline-none"
            />
            <button
              type="submit"
              className={`inline-flex min-h-[44px] shrink-0 items-center px-2 text-sm font-semibold text-[var(--color-text-primary)] underline decoration-2 underline-offset-4 hover:decoration-[var(--color-primary)] active:text-[var(--color-primary-strong)] transition-colors duration-150 ${focusRing}`}
            >
              Cari
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-x-12">
          <div
            role="radiogroup"
            aria-labelledby="filter-mag-label"
            className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0"
          >
            <span id="filter-mag-label" className={rowLabelCls}>
              Magnitudo
            </span>
            <div className="flex items-center gap-1">
              {MAG_OPTIONS.map((o) => (
                <label key={o.value || "all"}>
                  <input
                    type="radio"
                    name="mag"
                    value={o.value}
                    defaultChecked={initialMag === o.value}
                    onChange={submit}
                    className="peer sr-only"
                  />
                  <span className="flex h-11 min-w-[44px] cursor-pointer items-center justify-center px-2 text-base text-[var(--color-text-secondary)] decoration-2 underline-offset-8 transition-colors duration-150 hover:text-[var(--color-text-primary)] active:text-[var(--color-primary-strong)] peer-checked:font-semibold peer-checked:text-[var(--color-text-primary)] peer-checked:underline peer-checked:decoration-[var(--color-cta)] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-primary-strong)] tnum">
                    {o.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div
            role="group"
            aria-labelledby="filter-date-label"
            className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-0 lg:flex-1"
          >
            <span id="filter-date-label" className={`${rowLabelCls} lg:w-auto lg:mr-4`}>
              Tanggal
            </span>
            <div className="flex flex-wrap items-center gap-x-3">
              {dateField("filter-dari", "dari", "Dari tanggal", dari, setDari)}
              <span aria-hidden="true" className="text-[var(--color-text-secondary)]">
                sampai
              </span>
              {dateField("filter-sampai", "sampai", "Sampai tanggal", sampai, setSampai)}
            </div>
          </div>

          {hasActive && (
            <Link
              href="/riwayat"
              className={`hidden md:inline-flex min-h-[44px] shrink-0 items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] underline underline-offset-4 ${focusRing}`}
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Hapus filter
            </Link>
          )}
        </div>
      </form>
    </section>
  );
}
