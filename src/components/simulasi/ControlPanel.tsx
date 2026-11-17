"use client";

import React from "react";
import { RotateCcw, ExternalLink, AlertCircle, MapPin, ChevronDown } from "lucide-react";
import {
  SIMULASI_LIMITS,
  formatIdNumber,
  type PresetScenarioItem,
  type SimulasiInput,
  type SimulasiNumericField,
  type SimulasiValidationErrors,
} from "@/lib/simulasi";
import { KEDALAMAN_PRESETS, type DistanceSyncState } from "@/lib/simulasi-visual";

export type SimulasiDraftStrings = Record<SimulasiNumericField, string>;

interface SliderNumericRowProps {
  id: string;
  label: string;
  prefix?: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  sliderValue: number;
  draftValue: string;
  ariaValueText: string;
  helperText: string;
  error?: string;
  onSliderChange: (val: number) => void;
  onDraftChange: (raw: string) => void;
  extraNotice?: React.ReactNode;
}

function SliderNumericRow({
  id,
  label,
  prefix,
  unit,
  min,
  max,
  step,
  sliderValue,
  draftValue,
  ariaValueText,
  helperText,
  error,
  onSliderChange,
  onDraftChange,
  extraNotice,
}: SliderNumericRowProps) {
  const clamped = Math.min(max, Math.max(min, sliderValue));
  const pct = max > min ? ((clamped - min) / (max - min)) * 100 : 0;
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label
          htmlFor={`${id}-input`}
          className="text-sm font-semibold text-[var(--color-text-primary)]"
        >
          {label}
        </label>
        <div className="flex items-center gap-1.5 w-[112px] min-h-[46px] rounded-[14px] bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)]/70 px-3 transition-colors duration-150 focus-within:border-[var(--color-primary-strong)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-primary-strong)]">
          {prefix && (
            <span
              aria-hidden="true"
              className="text-xs font-medium text-[var(--color-text-secondary)] shrink-0"
            >
              {prefix}
            </span>
          )}
          <input
            id={`${id}-input`}
            type="number"
            min={min}
            max={max}
            step={step}
            value={draftValue}
            onChange={(e) => onDraftChange(e.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : helpId}
            className="tnum w-full min-w-0 min-h-[44px] bg-transparent text-right text-sm font-semibold text-[var(--color-text-primary)] focus:outline-none disabled:opacity-50 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          {unit && (
            <span className="text-xs font-medium text-[var(--color-text-secondary)] shrink-0">
              {unit}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex items-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full bg-[var(--color-surface-sunken)] overflow-hidden"
        >
          <div
            className="h-full bg-[var(--color-cta)] rounded-full"
            style={{ width: `${pct}%` }}
          />
        </div>
        <input
          id={`${id}-slider`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={clamped}
          aria-label={label}
          aria-valuetext={ariaValueText}
          onChange={(e) => onSliderChange(Number(e.target.value))}
          className="simulasi-range relative z-10"
        />
      </div>

      <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)] tnum">
        <span id={helpId}>{helperText}</span>
        <span className="shrink-0">
          {formatIdNumber(min, step < 1 ? 1 : 0)} s.d. {formatIdNumber(max, step < 1 ? 1 : 0)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>

      {extraNotice}

      {error && (
        <p
          id={errorId}
          role="alert"
          className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-error-strong)]"
        >
          <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}

interface ControlPanelProps {
  presets: PresetScenarioItem[];
  presetsLoadError: boolean;
  selectedPresetId: string;
  activePreset: PresetScenarioItem | null;
  validInput: SimulasiInput;
  drafts: SimulasiDraftStrings;
  errors: SimulasiValidationErrors;
  distanceSync: DistanceSyncState;
  onSelectPreset: (presetId: string) => void;
  onSliderChange: (field: "magnitudo" | "jarakPengamatKm", val: number) => void;
  onDraftChange: (field: "magnitudo" | "jarakPengamatKm", raw: string) => void;
  onKedalamanPresetSelect: (depthKm: number) => void;
  onReset: () => void;
}

export function ControlPanel({
  presets,
  presetsLoadError,
  selectedPresetId,
  activePreset,
  validInput,
  drafts,
  errors,
  distanceSync,
  onSelectPreset,
  onSliderChange,
  onDraftChange,
  onKedalamanPresetSelect,
  onReset,
}: ControlPanelProps) {
  const matchedPresetDepth = KEDALAMAN_PRESETS.some(
    (opt) => Math.abs(validInput.kedalamanKm - opt.valueKm) < 0.01
  );

  return (
    <section
      aria-label="Panel parameter simulasi gempa"
      className="bg-[var(--color-surface)] rounded-[28px] border border-[var(--color-border)]/70 p-5 sm:p-6 space-y-5"
    >
      {/* Preset gempa bersejarah */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="preset-select"
            className="text-sm font-semibold text-[var(--color-text-primary)]"
          >
            Pilih gempa bersejarah
          </label>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 -mr-1.5 rounded-[12px] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] active:bg-[var(--color-surface-sunken)] disabled:opacity-50 transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Reset</span>
          </button>
        </div>

        <div className="relative">
          <select
            id="preset-select"
            value={selectedPresetId}
            onChange={(e) => onSelectPreset(e.target.value)}
            className="w-full min-h-[46px] appearance-none rounded-[14px] bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)]/70 pl-3.5 pr-10 text-sm font-medium text-[var(--color-text-primary)] transition-colors duration-150 hover:border-[var(--color-border-strong)] disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
          >
            <option value="kustom">Kustom (atur manual)</option>
            {presets.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]"
            aria-hidden="true"
          />
        </div>

        {presetsLoadError && (
          <p className="text-xs text-[var(--color-warning-strong)] leading-relaxed">
            Daftar preset dari database sedang tidak tersedia. Mode Kustom tetap dapat digunakan sepenuhnya di peramban Anda.
          </p>
        )}

        {activePreset && (
          <div className="rounded-[16px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-3.5 space-y-2 text-xs text-[var(--color-text-secondary)]">
            {activePreset.deskripsiSingkat && (
              <p className="leading-relaxed text-[var(--color-text-primary)]">
                {activePreset.deskripsiSingkat}
              </p>
            )}
            {activePreset.sumberUrl && (
              <a
                href={activePreset.sumberUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 min-h-[44px] font-medium text-[var(--color-text-primary)] underline underline-offset-2 hover:opacity-80"
              >
                <span>
                  Sumber data: {activePreset.sumberPenerbit || "USGS"}
                </span>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-[var(--color-border)]/70 pt-5">
        {/* 1. Magnitudo */}
        <SliderNumericRow
          id="sim-mag"
          label="Magnitudo"
          prefix="M"
          min={SIMULASI_LIMITS.MAG_MIN}
          max={SIMULASI_LIMITS.MAG_MAX}
          step={SIMULASI_LIMITS.MAG_STEP}
          sliderValue={validInput.magnitudo}
          draftValue={drafts.magnitudo}
          ariaValueText={`Magnitudo ${formatIdNumber(validInput.magnitudo, 1)}`}
          helperText="Kalibrasi MMI: Mw 5,0–7,9"
          error={errors.magnitudo}
          onSliderChange={(v) => onSliderChange("magnitudo", v)}
          onDraftChange={(s) => onDraftChange("magnitudo", s)}
        />
      </div>

      <div className="border-t border-[var(--color-border)]/70 pt-5 space-y-2.5">
        {/* 2. Kedalaman (3 preset cepat: Dangkal 10 / Menengah 70 / Dalam 200 km) */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span
            id="sim-depth-label"
            className="text-sm font-semibold text-[var(--color-text-primary)]"
          >
            Kedalaman hiposenter
          </span>
          <span className="tnum text-xs font-semibold text-[var(--color-text-primary)]">
            {formatIdNumber(validInput.kedalamanKm, Number.isInteger(validInput.kedalamanKm) ? 0 : 1)} km
          </span>
        </div>

        <div
          role="group"
          aria-labelledby="sim-depth-label"
          className="grid grid-cols-3 gap-1 rounded-[16px] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] p-1"
        >
          {KEDALAMAN_PRESETS.map((opt) => {
            const active = Math.abs(validInput.kedalamanKm - opt.valueKm) < 0.01;
            return (
              <button
                key={opt.valueKm}
                type="button"
                aria-pressed={active}
                onClick={() => onKedalamanPresetSelect(opt.valueKm)}
                className={`min-h-[48px] rounded-[12px] px-2 py-2 text-center border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-primary-strong)] ${
                  active
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border-[var(--color-border)]"
                    : "bg-transparent text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface)]/60"
                }`}
              >
                <span className={`block text-xs ${active ? "font-semibold" : "font-medium"}`}>
                  {opt.label}
                </span>
                <span className="block tnum text-xs text-[var(--color-text-secondary)]">
                  {opt.shortNote}
                </span>
              </button>
            );
          })}
        </div>

        {!matchedPresetDepth && (
          <p className="text-xs text-[var(--color-text-secondary)]">
            Kedalaman saat ini{" "}
            <strong className="tnum font-semibold text-[var(--color-text-primary)]">
              {formatIdNumber(validInput.kedalamanKm, Number.isInteger(validInput.kedalamanKm) ? 0 : 1)} km
            </strong>{" "}
            berasal dari skenario atau Detail lanjutan. Pilih salah satu tombol di atas untuk menyetel 10, 70, atau 200 km.
          </p>
        )}

        {errors.kedalamanKm && (
          <p
            role="alert"
            className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-error-strong)]"
          >
            <AlertCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{errors.kedalamanKm}</span>
          </p>
        )}
      </div>

      <div className="border-t border-[var(--color-border)]/70 pt-5">
        {/* 3. Jarak dari pusat gempa */}
        <SliderNumericRow
          id="sim-dist"
          label="Jarak dari pusat gempa"
          unit="km"
          min={SIMULASI_LIMITS.DIST_MIN}
          max={SIMULASI_LIMITS.DIST_MAX}
          step={1}
          sliderValue={validInput.jarakPengamatKm}
          draftValue={drafts.jarakPengamatKm}
          ariaValueText={
            distanceSync.isBeyondCalibratedRange
              ? `Jarak marker Anda ${distanceSync.formattedActualDistance} dari pusat gempa, di luar batas slider 300 km`
              : `Jarak pengamat ${formatIdNumber(validInput.jarakPengamatKm, 0)} kilometer dari pusat gempa`
          }
          helperText="Tersinkron dengan posisi marker Anda di peta"
          error={errors.jarakPengamatKm}
          onSliderChange={(v) => onSliderChange("jarakPengamatKm", v)}
          onDraftChange={(s) => onDraftChange("jarakPengamatKm", s)}
        extraNotice={
          distanceSync.isBeyondCalibratedRange ? (
            <div
              role="note"
              className="flex items-start gap-2 rounded-[14px] bg-[var(--color-surface-raised)] border border-[var(--color-warning-strong)] px-3 py-2 text-xs text-[var(--color-warning-strong)]"
            >
              <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                Jarak aktual marker Anda:{" "}
                <strong className="tnum font-semibold">
                  {distanceSync.formattedActualDistance}
                </strong>{" "}
                (&gt; 300 km, di luar rentang kalibrasi). Slider berhenti di 300 km; geser slider untuk menarik marker kembali ke ≤ 300 km.
              </span>
            </div>
          ) : undefined
        }
        />
      </div>
    </section>
  );
}
