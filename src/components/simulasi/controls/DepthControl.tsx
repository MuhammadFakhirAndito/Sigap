"use client";

import React from "react";
import { AlertCircle } from "lucide-react";
import { formatIdNumber } from "@/lib/simulasi";
import { KEDALAMAN_PRESETS, depthFraction } from "@/lib/simulasi-visual";

interface DepthControlProps {
  depthKm: number;
  error?: string;
  onSelect: (depthKm: number) => void;
}

const SECTION_HEIGHT_PX = 168;
const GROUND_PX = 8;
const DOT_SIZE_PX = 18;
const DOT_TRAVEL_PX = SECTION_HEIGHT_PX - GROUND_PX - DOT_SIZE_PX;

/** Penampang vertikal mini: titik hiposenter turun sesuai kedalaman (skala linear, dasar = 250 km). */
function DepthSection({ depthKm }: { depthKm: number }) {
  const frac = depthFraction(depthKm);
  return (
    <div
      aria-hidden="true"
      className="relative h-[168px] w-[84px] shrink-0 overflow-hidden rounded-[16px] bg-[var(--color-surface-sunken)]"
    >
      <span className="absolute inset-x-0 top-0 h-2 bg-[var(--color-cta)]" />
      <span
        className="absolute left-[41px] top-2 w-0 border-l border-dashed border-[var(--color-border-strong)] transition-[height] duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
        style={{ height: `calc(${DOT_TRAVEL_PX}px * ${frac} + ${DOT_SIZE_PX / 2}px)` }}
      />
      <span
        className="absolute left-[33px] top-2 transition-transform duration-300 ease-[cubic-bezier(0.2,0,0,1)]"
        style={{ transform: `translateY(calc(${DOT_TRAVEL_PX}px * ${frac}))` }}
      >
        <span className="block h-[18px] w-[18px] rounded-full border-4 border-[var(--color-cta)] bg-[var(--color-surface-raised)]" />
        <span className="absolute -inset-2 rounded-full border border-[var(--color-border-strong)] opacity-60" />
      </span>
    </div>
  );
}

export function DepthControl({ depthKm, error, onSelect }: DepthControlProps) {
  const matched = KEDALAMAN_PRESETS.some((opt) => Math.abs(depthKm - opt.valueKm) < 0.01);
  const formatted = formatIdNumber(depthKm, Number.isInteger(depthKm) ? 0 : 1);

  return (
    <div className="rounded-[28px] bg-[var(--color-surface)] p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="sim-depth-label" className="text-base font-semibold text-[var(--color-text-primary)]">
          Kedalaman hiposenter
        </h2>
        <p className="tnum text-[2rem] font-semibold leading-none tracking-[-0.02em] text-[var(--color-text-primary)]">
          {formatted}
          <span className="ml-1 text-base font-medium text-[var(--color-text-secondary)]">km</span>
        </p>
      </div>

      <div className="mt-4 flex gap-4">
        <DepthSection depthKm={depthKm} />

        <div
          role="group"
          aria-labelledby="sim-depth-label"
          className="flex flex-1 flex-col gap-1 rounded-[20px] bg-[var(--color-surface-sunken)] p-1"
        >
          {KEDALAMAN_PRESETS.map((opt) => {
            const active = Math.abs(depthKm - opt.valueKm) < 0.01;
            return (
              <button
                key={opt.valueKm}
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(opt.valueKm)}
                className={`flex min-h-[52px] flex-1 items-center justify-between gap-3 rounded-[16px] px-4 text-left transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-primary-strong)] ${
                  active
                    ? "bg-[var(--color-cta)] text-[var(--color-on-cta)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/70 hover:text-[var(--color-text-primary)]"
                }`}
              >
                <span className={`text-sm ${active ? "font-semibold" : "font-medium"}`}>{opt.label}</span>
                <span className="tnum text-sm">{opt.shortNote}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!matched && (
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          Kedalaman saat ini{" "}
          <strong className="tnum font-semibold text-[var(--color-text-primary)]">{formatted} km</strong>{" "}
          berasal dari skenario atau Detail lanjutan. Pilih salah satu tombol di atas untuk menyetel 10, 70, atau 200 km.
        </p>
      )}

      {error && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-error-strong)]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
