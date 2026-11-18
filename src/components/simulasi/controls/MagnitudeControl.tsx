"use client";

import React from "react";
import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { SIMULASI_LIMITS, formatIdNumber } from "@/lib/simulasi";
import {
  CALIBRATION_ZONE_PERCENT,
  INTENSITY_STEPS,
  buildIntensityBands,
  intensityVar,
  isMagnitudeOutsideCalibration,
  magnitudeIntensity,
  magnitudePercent,
  magnitudeTicks,
} from "@/lib/simulasi-visual";
import { NumberField } from "./NumberField";
import { useAnimatedNumber } from "../useAnimatedNumber";

interface MagnitudeControlProps {
  value: number;
  draftValue: string;
  error?: string;
  onSliderChange: (val: number) => void;
  onDraftChange: (raw: string) => void;
}

const BANDS = buildIntensityBands();
const TICKS = magnitudeTicks();
const THUMB = 28;

/** Posisi horizontal pusat thumb native: 14px dari tepi, sampai (lebar - 14px). */
const leftAt = (percent: number) => `calc(${THUMB / 2}px + (100% - ${THUMB}px) * ${percent / 100})`;

export function MagnitudeControl({
  value,
  draftValue,
  error,
  onSliderChange,
  onDraftChange,
}: MagnitudeControlProps) {
  const clamped = Math.min(SIMULASI_LIMITS.MAG_MAX, Math.max(SIMULASI_LIMITS.MAG_MIN, value));
  const animated = useAnimatedNumber(clamped);
  const intensity = magnitudeIntensity(clamped);
  const accent = intensityVar(intensity.step);
  const outside = isMagnitudeOutsideCalibration(clamped);
  const pct = magnitudePercent(clamped);
  const valueText = formatIdNumber(clamped, 1);
  const errorId = "sim-mag-error";
  const helpId = "sim-mag-help";

  return (
    <div className="rounded-[28px] bg-[var(--color-surface-raised)] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor="sim-mag-input" className="text-base font-semibold text-[var(--color-text-primary)]">
          Magnitudo
        </label>
        <NumberField
          id="sim-mag-input"
          prefix="M"
          min={SIMULASI_LIMITS.MAG_MIN}
          max={SIMULASI_LIMITS.MAG_MAX}
          step={SIMULASI_LIMITS.MAG_STEP}
          value={draftValue}
          describedBy={error ? errorId : helpId}
          invalid={Boolean(error)}
          onChange={onDraftChange}
          toneClassName="bg-[var(--color-surface)]"
        />
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <p className="flex items-baseline gap-2 leading-none" aria-hidden="true">
          <span className="text-2xl font-medium text-[var(--color-text-secondary)]">M</span>
          <span
            className="tnum text-[3.5rem] font-semibold tracking-[-0.03em] transition-colors duration-200 sm:text-[4rem]"
            style={{ color: accent }}
          >
            {formatIdNumber(animated, 1)}
          </span>
        </p>

        <div className="pb-1 text-right">
          <p className="text-xl font-semibold leading-tight text-[var(--color-text-primary)]">
            {intensity.label}
          </p>
          <ol aria-hidden="true" className="mt-2 flex justify-end gap-1">
            {INTENSITY_STEPS.map((s) => (
              <li
                key={s.step}
                className={`h-2 rounded-full transition-all duration-200 ${
                  s.step === intensity.step ? "w-6" : "w-2"
                }`}
                style={{
                  backgroundColor: intensityVar(s.step),
                  opacity: s.step <= intensity.step ? 1 : 0.35,
                }}
              />
            ))}
          </ol>
        </div>
      </div>

      {/* Slider: lapisan dekoratif di bawah input range native yang transparan */}
      <div className="relative mt-9">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-8 z-20 -translate-x-1/2 whitespace-nowrap rounded-full bg-[var(--color-cta)] px-2.5 py-1 text-xs font-semibold text-[var(--color-on-cta)] tnum transition-[left] duration-75"
          style={{ left: leftAt(pct) }}
        >
          M {valueText}
        </div>

        <div className="relative h-12">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 h-3 -translate-y-1/2 overflow-hidden rounded-full"
            style={{ left: THUMB / 2, right: THUMB / 2, backgroundImage: BANDS }}
          >
            {/* Di luar zona kalibrasi: dipudarkan dan diarsir */}
            {[
              { left: "0%", width: `${CALIBRATION_ZONE_PERCENT.start}%` },
              { left: `${CALIBRATION_ZONE_PERCENT.end}%`, width: `${100 - CALIBRATION_ZONE_PERCENT.end}%` },
            ].map((zone) => (
              <span
                key={zone.left}
                className="absolute inset-y-0"
                style={{
                  left: zone.left,
                  width: zone.width,
                  backgroundColor: "color-mix(in srgb, var(--color-surface-raised) 55%, transparent)",
                  backgroundImage:
                    "repeating-linear-gradient(135deg, color-mix(in srgb, var(--color-surface-raised) 90%, transparent) 0 2px, transparent 2px 5px)",
                }}
              />
            ))}
            {/* Bagian di kanan thumb dipudarkan agar posisi terbaca sebagai progres */}
            <span
              className="absolute inset-y-0 right-0 bg-[var(--color-surface-raised)]/60 transition-[width] duration-75"
              style={{ width: `${100 - pct}%` }}
            />
          </div>

          <input
            id="sim-mag-slider"
            type="range"
            min={SIMULASI_LIMITS.MAG_MIN}
            max={SIMULASI_LIMITS.MAG_MAX}
            step={SIMULASI_LIMITS.MAG_STEP}
            value={clamped}
            aria-label="Magnitudo"
            aria-valuetext={`Magnitudo ${valueText}, kelas ${intensity.label}${
              outside ? ", di luar kalibrasi MMI" : ""
            }`}
            aria-describedby={helpId}
            onChange={(e) => onSliderChange(Number(e.target.value))}
            className="simulasi-range absolute inset-0 z-10"
            style={{ "--range-accent": accent } as React.CSSProperties}
          />
        </div>

        {/* Tick tiap 1,0; yang dekat thumb menebal */}
        <div aria-hidden="true" className="relative h-9">
          {TICKS.map((t) => {
            const near = Math.abs(t.value - clamped) <= 0.3;
            return (
              <span
                key={t.value}
                className="absolute top-0 flex -translate-x-1/2 flex-col items-center"
                style={{ left: leftAt(t.percent) }}
              >
                <span
                  className={`w-px transition-all duration-150 ${
                    near ? "h-3 bg-[var(--color-text-primary)]" : "h-2 bg-[var(--color-border-strong)]"
                  }`}
                />
                <span
                  className={`mt-1 text-xs tnum transition-colors duration-150 ${
                    near
                      ? "font-semibold text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-secondary)]"
                  }`}
                >
                  {t.value}
                </span>
              </span>
            );
          })}
        </div>

        {/* Braket zona kalibrasi */}
        <div aria-hidden="true" className="relative h-5">
          <span
            className="absolute top-0 h-2 border-x border-b border-[var(--color-text-secondary)]"
            style={{
              left: leftAt(CALIBRATION_ZONE_PERCENT.start),
              width: `calc((100% - ${THUMB}px) * ${(CALIBRATION_ZONE_PERCENT.end - CALIBRATION_ZONE_PERCENT.start) / 100})`,
            }}
          />
          <span
            className="absolute top-2.5 -translate-x-1/2 whitespace-nowrap text-xs font-medium text-[var(--color-text-secondary)]"
            style={{
              left: leftAt((CALIBRATION_ZONE_PERCENT.start + CALIBRATION_ZONE_PERCENT.end) / 2),
            }}
          >
            Zona kalibrasi MMI
          </span>
        </div>
      </div>

      <p
        id={helpId}
        className={`mt-4 flex items-start gap-2 rounded-[16px] px-3.5 py-2.5 text-sm leading-snug ${
          outside
            ? "bg-[var(--color-surface)] font-medium text-[var(--color-warning-strong)]"
            : "bg-[var(--color-surface)] text-[var(--color-text-secondary)]"
        }`}
      >
        {outside ? (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        )}
        <span>
          {outside
            ? "Di luar kalibrasi MMI (Mw 5,0–7,9): estimasi hanya gambaran kasar."
            : "Dalam zona kalibrasi MMI: Mw 5,0–7,9."}{" "}
          <span className="tnum text-[var(--color-text-secondary)]">
            Rentang slider {formatIdNumber(SIMULASI_LIMITS.MAG_MIN, 1)} s.d.{" "}
            {formatIdNumber(SIMULASI_LIMITS.MAG_MAX, 1)}.
          </span>
        </span>
      </p>

      {error && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[var(--color-error-strong)]"
        >
          <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
