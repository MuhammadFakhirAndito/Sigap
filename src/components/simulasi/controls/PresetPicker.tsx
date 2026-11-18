"use client";

import React from "react";
import { Check, ExternalLink, RotateCcw } from "lucide-react";
import { formatIdNumber, type PresetScenarioItem } from "@/lib/simulasi";
import { intensityVar, magnitudeIntensity, presetDisplayName } from "@/lib/simulasi-visual";

interface PresetPickerProps {
  presets: PresetScenarioItem[];
  presetsLoadError: boolean;
  selectedPresetId: string;
  activePreset: PresetScenarioItem | null;
  onSelectPreset: (presetId: string) => void;
  onReset: () => void;
}

const optionBase =
  "flex min-h-[56px] cursor-pointer flex-col justify-center rounded-[16px] px-4 py-2.5 transition-colors duration-150 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-[var(--color-primary-strong)]";
const optionIdle =
  "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-background)]";
const optionSelected = "bg-[var(--color-cta)] text-[var(--color-on-cta)]";

export function PresetPicker({
  presets,
  presetsLoadError,
  selectedPresetId,
  activePreset,
  onSelectPreset,
  onReset,
}: PresetPickerProps) {
  const options = [{ id: "kustom", custom: true as const }, ...presets.map((p) => ({ id: p.id, custom: false as const, preset: p }))];

  return (
    <div className="rounded-[28px] bg-[var(--color-surface)] p-5 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <h2 id="preset-heading" className="text-base font-semibold text-[var(--color-text-primary)]">
          Pilih gempa bersejarah
        </h2>
        <button
          type="button"
          onClick={onReset}
          className="-mr-2 inline-flex min-h-[44px] items-center gap-1.5 rounded-full px-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors duration-150 hover:bg-[var(--color-surface-raised)] hover:text-[var(--color-text-primary)] active:bg-[var(--color-surface-sunken)]"
        >
          <RotateCcw className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Reset</span>
        </button>
      </div>

      <div
        role="radiogroup"
        aria-labelledby="preset-heading"
        className="mt-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2"
      >
        {options.map((opt) => {
          const selected = selectedPresetId === opt.id;
          const mag = opt.custom ? null : opt.preset.magnitudo;
          return (
            <label key={opt.id} className="relative block">
              <input
                type="radio"
                name="preset-gempa"
                value={opt.id}
                checked={selected}
                onChange={() => onSelectPreset(opt.id)}
                className="peer sr-only"
              />
              <span className={`${optionBase} ${selected ? optionSelected : optionIdle}`}>
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold leading-snug">
                    {opt.custom ? "Kustom" : presetDisplayName(opt.preset.nama)}
                  </span>
                  {selected && <Check className="h-4 w-4 shrink-0" aria-hidden="true" />}
                </span>
                {mag !== null ? (
                  <span className="mt-0.5 flex items-center gap-1.5 text-xs tnum">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: intensityVar(magnitudeIntensity(mag).step) }}
                    />
                    <span className={selected ? "" : "text-[var(--color-text-secondary)]"}>
                      M {formatIdNumber(mag, 1)}
                    </span>
                  </span>
                ) : (
                  <span
                    className={`mt-0.5 text-xs ${selected ? "" : "text-[var(--color-text-secondary)]"}`}
                  >
                    Atur manual
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {presetsLoadError && (
        <p className="mt-3 text-xs leading-relaxed text-[var(--color-warning-strong)]">
          Daftar preset dari database sedang tidak tersedia. Mode Kustom tetap dapat digunakan sepenuhnya di peramban Anda.
        </p>
      )}

      {activePreset && (
        <div className="mt-4 space-y-1 rounded-[16px] bg-[var(--color-surface-raised)] p-4 text-sm">
          {activePreset.deskripsiSingkat && (
            <p className="leading-relaxed text-[var(--color-text-primary)]">{activePreset.deskripsiSingkat}</p>
          )}
          {activePreset.sumberUrl && (
            <a
              href={activePreset.sumberUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-[44px] items-center gap-1 text-xs font-medium text-[var(--color-text-primary)] underline underline-offset-2 hover:opacity-80"
            >
              <span>Sumber data: {activePreset.sumberPenerbit || "USGS"}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
