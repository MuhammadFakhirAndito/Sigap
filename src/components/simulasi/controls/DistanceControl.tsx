"use client";

import React from "react";
import { AlertCircle, MapPin } from "lucide-react";
import { SIMULASI_LIMITS, formatIdNumber } from "@/lib/simulasi";
import { ringDiameterPx, type DistanceSyncState } from "@/lib/simulasi-visual";
import { NumberField } from "./NumberField";
import { useAnimatedNumber } from "../useAnimatedNumber";

interface DistanceControlProps {
  value: number;
  draftValue: string;
  error?: string;
  distanceSync: DistanceSyncState;
  onSliderChange: (val: number) => void;
  onDraftChange: (raw: string) => void;
}

const THUMB = 28;
const TICKS_KM = [0, 100, 200, 300];
const RING_MIN_PX = 14;
const RING_MAX_PX = 88;

const leftAt = (fraction: number) => `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${fraction})`;

/** Cincin konsentris: cincin terluar = jarak pengamat, titik di cincin = posisi "Anda". */
function RingViz({ distanceKm }: { distanceKm: number }) {
  const outer = ringDiameterPx(distanceKm, RING_MIN_PX, RING_MAX_PX);
  const ringClass =
    "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[var(--color-border-strong)] transition-[width,height] duration-200 ease-[cubic-bezier(0.2,0,0,1)]";

  return (
    <div
      aria-hidden="true"
      className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[20px] bg-[var(--color-surface-sunken)]"
    >
      <span className={`${ringClass} opacity-50`} style={{ width: outer * 0.34, height: outer * 0.34 }} />
      <span className={`${ringClass} opacity-70`} style={{ width: outer * 0.67, height: outer * 0.67 }} />
      <span className={`${ringClass} border-[var(--color-cta)]`} style={{ width: outer, height: outer }}>
        <span className="absolute left-1/2 top-0 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--color-surface-raised)] bg-[var(--color-cta)]" />
      </span>
      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-cta)]" />
    </div>
  );
}

export function DistanceControl({
  value,
  draftValue,
  error,
  distanceSync,
  onSliderChange,
  onDraftChange,
}: DistanceControlProps) {
  const clamped = Math.min(SIMULASI_LIMITS.DIST_MAX, Math.max(SIMULASI_LIMITS.DIST_MIN, value));
  const animated = useAnimatedNumber(clamped);
  const fraction = (clamped - SIMULASI_LIMITS.DIST_MIN) / (SIMULASI_LIMITS.DIST_MAX - SIMULASI_LIMITS.DIST_MIN);
  const errorId = "sim-dist-error";
  const helpId = "sim-dist-help";

  return (
    <div className="rounded-[28px] bg-[var(--color-surface)] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="sim-dist-input" className="text-base font-semibold text-[var(--color-text-primary)]">
          Jarak dari pusat gempa
        </label>
        <NumberField
          id="sim-dist-input"
          unit="km"
          min={SIMULASI_LIMITS.DIST_MIN}
          max={SIMULASI_LIMITS.DIST_MAX}
          step={1}
          value={draftValue}
          describedBy={error ? errorId : helpId}
          invalid={Boolean(error)}
          onChange={onDraftChange}
        />
      </div>

      <div className="mt-4 flex items-center gap-5">
        <RingViz distanceKm={clamped} />
        <p className="tnum text-[3.5rem] font-semibold leading-none tracking-[-0.03em] text-[var(--color-text-primary)] sm:text-[4rem]" aria-hidden="true">
          {formatIdNumber(animated, 0)}
          <span className="ml-1.5 text-2xl font-medium tracking-normal text-[var(--color-text-secondary)]">km</span>
        </p>
      </div>

      <div className="relative mt-4 h-12">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 h-3 -translate-y-1/2 rounded-full"
          style={{
            left: THUMB / 2,
            right: THUMB / 2,
            backgroundImage: `linear-gradient(to right, var(--color-cta) ${fraction * 100}%, var(--color-surface-sunken) ${fraction * 100}%)`,
          }}
        />
        <input
          id="sim-dist-slider"
          type="range"
          min={SIMULASI_LIMITS.DIST_MIN}
          max={SIMULASI_LIMITS.DIST_MAX}
          step={1}
          value={clamped}
          aria-label="Jarak dari pusat gempa"
          aria-valuetext={
            distanceSync.isBeyondCalibratedRange
              ? `Jarak marker Anda ${distanceSync.formattedActualDistance} dari pusat gempa, di luar batas slider 300 km`
              : `Jarak pengamat ${formatIdNumber(value, 0)} kilometer dari pusat gempa`
          }
          aria-describedby={helpId}
          onChange={(e) => onSliderChange(Number(e.target.value))}
          className="simulasi-range absolute inset-0 z-10"
        />
      </div>

      <div aria-hidden="true" className="relative h-6">
        {TICKS_KM.map((km) => (
          <span
            key={km}
            className="absolute top-0 -translate-x-1/2 text-xs text-[var(--color-text-secondary)] tnum"
            style={{ left: leftAt(km / SIMULASI_LIMITS.DIST_MAX) }}
          >
            {km}
          </span>
        ))}
      </div>

      <p
        id={helpId}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)]"
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Tersinkron dengan posisi marker Anda di peta</span>
      </p>

      {distanceSync.isBeyondCalibratedRange && (
        <div
          role="note"
          className="mt-3 flex items-start gap-2 rounded-[16px] bg-[var(--color-surface-raised)] px-3.5 py-2.5 text-xs leading-relaxed text-[var(--color-warning-strong)]"
        >
          <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>
            Jarak aktual marker Anda:{" "}
            <strong className="tnum font-semibold">{distanceSync.formattedActualDistance}</strong> (&gt; 300 km, di luar
            rentang kalibrasi). Slider berhenti di 300 km; geser slider untuk menarik marker kembali ke ≤ 300 km.
          </span>
        </div>
      )}

      {error && (
        <p id={errorId} role="alert" className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-error-strong)]">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
