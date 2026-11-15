"use client";

import React from "react";
import { RotateCcw, ExternalLink, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  SIMULASI_LIMITS,
  formatIdNumber,
  type PresetScenarioItem,
  type SimulasiInput,
  type SimulasiNumericField,
  type SimulasiValidationErrors,
  type TipeLokasiSimulasi,
} from "@/lib/simulasi";

export type SimulasiDraftStrings = Record<SimulasiNumericField, string>;

interface SliderNumericRowProps {
  id: string;
  label: string;
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
}

function SliderNumericRow({
  id,
  label,
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
        <div className="flex items-center gap-1.5">
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
            className="tnum w-24 min-h-[44px] rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3 text-right text-sm font-semibold text-[var(--color-text-primary)]"
          />
          {unit && (
            <span className="text-xs font-medium text-[var(--color-text-secondary)] w-7">
              {unit}
            </span>
          )}
        </div>
      </div>

      <div className="relative flex items-center">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 h-2 rounded-full bg-[var(--color-surface-sunken)] overflow-hidden"
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

      <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] tnum">
        <span id={helpId}>{helperText}</span>
        <span>
          {formatIdNumber(min, step < 1 ? 1 : 0)}–{formatIdNumber(max, step < 1 ? 1 : 0)}
          {unit ? ` ${unit}` : ""}
        </span>
      </div>

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
  onSelectPreset: (presetId: string) => void;
  onSliderChange: (field: SimulasiNumericField, val: number) => void;
  onDraftChange: (field: SimulasiNumericField, raw: string) => void;
  onTipeLokasiChange: (tipe: TipeLokasiSimulasi) => void;
  onReset: () => void;
}

function formatCoordPreview(lat: number, lon: number): string {
  const latDir = lat < 0 ? "LS" : "LU";
  const lonDir = lon < 0 ? "BB" : "BT";
  return `${formatIdNumber(Math.abs(lat), 2)}° ${latDir}, ${formatIdNumber(Math.abs(lon), 2)}° ${lonDir}`;
}

export function ControlPanel({
  presets,
  presetsLoadError,
  selectedPresetId,
  activePreset,
  validInput,
  drafts,
  errors,
  onSelectPreset,
  onSliderChange,
  onDraftChange,
  onTipeLokasiChange,
  onReset,
}: ControlPanelProps) {
  return (
    <section
      aria-label="Panel parameter simulasi gempa"
      className="bg-[var(--color-surface)] rounded-[28px] p-6 space-y-6"
    >
      {/* Preset gempa bersejarah */}
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="preset-select"
            className="text-sm font-semibold text-[var(--color-text-primary)]"
          >
            Pilih gempa bersejarah
          </label>
          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            className="px-4 py-1.5 min-h-[44px] text-xs"
            icon={<RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />}
          >
            Reset
          </Button>
        </div>

        <select
          id="preset-select"
          value={selectedPresetId}
          onChange={(e) => onSelectPreset(e.target.value)}
          className="w-full min-h-[44px] rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-4 text-sm font-medium text-[var(--color-text-primary)]"
        >
          <option value="kustom">Kustom (atur manual)</option>
          {presets.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nama}
            </option>
          ))}
        </select>

        {presetsLoadError && (
          <p className="text-xs text-[var(--color-warning-strong)]">
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

      <hr className="border-[var(--color-border)]" />

      {/* Magnitudo */}
      <SliderNumericRow
        id="sim-mag"
        label="Magnitudo"
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

      {/* Kedalaman */}
      <SliderNumericRow
        id="sim-depth"
        label="Kedalaman hiposenter"
        unit="km"
        min={SIMULASI_LIMITS.DEPTH_MIN}
        max={SIMULASI_LIMITS.DEPTH_MAX}
        step={1}
        sliderValue={validInput.kedalamanKm}
        draftValue={drafts.kedalamanKm}
        ariaValueText={`Kedalaman ${formatIdNumber(validInput.kedalamanKm, 0)} kilometer`}
        helperText="Batas kriteria tsunami BNPB: ≤ 70 km"
        error={errors.kedalamanKm}
        onSliderChange={(v) => onSliderChange("kedalamanKm", v)}
        onDraftChange={(s) => onDraftChange("kedalamanKm", s)}
      />

      {/* Jarak pengamat */}
      <SliderNumericRow
        id="sim-dist"
        label="Jarak pengamat dari episentrum"
        unit="km"
        min={SIMULASI_LIMITS.DIST_MIN}
        max={SIMULASI_LIMITS.DIST_MAX}
        step={1}
        sliderValue={validInput.jarakPengamatKm}
        draftValue={drafts.jarakPengamatKm}
        ariaValueText={`Jarak pengamat ${formatIdNumber(validInput.jarakPengamatKm, 0)} kilometer dari episentrum`}
        helperText="Dipakai untuk MMI & waktu rambat"
        error={errors.jarakPengamatKm}
        onSliderChange={(v) => onSliderChange("jarakPengamatKm", v)}
        onDraftChange={(s) => onDraftChange("jarakPengamatKm", s)}
      />

      <hr className="border-[var(--color-border)]" />

      {/* Lokasi & koordinat episentrum */}
      <div className="space-y-4">
        <div className="space-y-2">
          <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
            Tipe lokasi episentrum
          </span>
          <div
            role="group"
            aria-label="Pilih tipe lokasi episentrum"
            className="grid grid-cols-2 gap-2"
          >
            {(["DARAT", "LAUT"] as const).map((tipe) => {
              const active = validInput.tipeLokasi === tipe;
              return (
                <button
                  key={tipe}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onTipeLokasiChange(tipe)}
                  className={`min-h-[44px] rounded-full text-sm font-medium border transition-colors duration-150 ${
                    active
                      ? "bg-[var(--color-cta)] text-[var(--color-on-cta)] border-[var(--color-cta)]"
                      : "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border-[var(--color-border-strong)] hover:bg-[var(--color-background)]"
                  }`}
                >
                  {tipe === "DARAT" ? "Darat" : "Laut"}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label
              htmlFor="sim-lat"
              className="block text-xs font-semibold text-[var(--color-text-primary)]"
            >
              Lintang (-90 s.d. 90)
            </label>
            <input
              id="sim-lat"
              type="number"
              step="0.01"
              min={SIMULASI_LIMITS.LAT_MIN}
              max={SIMULASI_LIMITS.LAT_MAX}
              value={drafts.lat}
              onChange={(e) => onDraftChange("lat", e.target.value)}
              aria-invalid={Boolean(errors.lat)}
              className="tnum w-full min-h-[44px] rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3.5 text-sm font-medium text-[var(--color-text-primary)]"
            />
            {errors.lat && (
              <p role="alert" className="text-xs text-[var(--color-error-strong)]">
                {errors.lat}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="sim-lon"
              className="block text-xs font-semibold text-[var(--color-text-primary)]"
            >
              Bujur (-180 s.d. 180)
            </label>
            <input
              id="sim-lon"
              type="number"
              step="0.01"
              min={SIMULASI_LIMITS.LON_MIN}
              max={SIMULASI_LIMITS.LON_MAX}
              value={drafts.lon}
              onChange={(e) => onDraftChange("lon", e.target.value)}
              aria-invalid={Boolean(errors.lon)}
              className="tnum w-full min-h-[44px] rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3.5 text-sm font-medium text-[var(--color-text-primary)]"
            />
            {errors.lon && (
              <p role="alert" className="text-xs text-[var(--color-error-strong)]">
                {errors.lon}
              </p>
            )}
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
          <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Konteks koordinat: <strong className="tnum text-[var(--color-text-primary)]">{formatCoordPreview(validInput.lat, validInput.lon)}</strong>.
            Lintang dan bujur hanya sebagai konteks lokasi dan tidak memengaruhi hasil hitungan simulasi.
          </span>
        </p>
      </div>
    </section>
  );
}
