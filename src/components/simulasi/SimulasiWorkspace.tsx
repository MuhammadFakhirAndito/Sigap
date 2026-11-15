"use client";

import React, { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Info } from "lucide-react";
import { ControlPanel, type SimulasiDraftStrings } from "./ControlPanel";
import { MetricsGrid, MmiCard, TravelTimeCard, TsunamiCard } from "./ResultCards";
import { SafetyAndFormulaSection } from "./SafetyAndFormulaSection";
import {
  DEFAULT_SIMULASI_INPUT,
  formatIdNumber,
  runSimulasiCalculation,
  validateSimulasiInput,
  type ParsedSimulasiUrlResult,
  type PresetScenarioItem,
  type SimulasiInput,
  type SimulasiNumericField,
  type SimulasiValidationErrors,
  type TipeLokasiSimulasi,
} from "@/lib/simulasi";

interface SimulasiWorkspaceProps {
  presets: PresetScenarioItem[];
  presetsLoadError: boolean;
  initialUrlState: ParsedSimulasiUrlResult;
}

function inputToDrafts(input: SimulasiInput): SimulasiDraftStrings {
  return {
    magnitudo: String(input.magnitudo),
    kedalamanKm: String(input.kedalamanKm),
    lat: String(input.lat),
    lon: String(input.lon),
    jarakPengamatKm: String(input.jarakPengamatKm),
  };
}

export function SimulasiWorkspace({
  presets,
  presetsLoadError,
  initialUrlState,
}: SimulasiWorkspaceProps) {
  const [validInput, setValidInput] = useState<SimulasiInput>(initialUrlState.input);
  const [drafts, setDrafts] = useState<SimulasiDraftStrings>(() =>
    inputToDrafts(initialUrlState.input)
  );
  const [errors, setErrors] = useState<SimulasiValidationErrors>({});
  const [selectedPresetId, setSelectedPresetId] = useState<string>("kustom");
  const [urlWarnings, setUrlWarnings] = useState<string[]>(initialUrlState.warnings);

  const activePreset = useMemo(
    () => presets.find((p) => p.id === selectedPresetId) ?? null,
    [presets, selectedPresetId]
  );

  // Semua kalkulasi berjalan 100% di klien tanpa memanggil API atau DB (TC-DB-15).
  const result = useMemo(() => runSimulasiCalculation(validInput), [validInput]);

  // Debounce pengumuman perubahan hasil ke screen reader agar tidak membanjiri saat menggeser slider.
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLiveAnnouncement(
        `Estimasi diperbarui: MMI ${result.mmi.roman} (${result.mmi.label}), Golden time ${formatIdNumber(result.goldenTimeSeconds, 1)} detik.`
      );
    }, 400);
    return () => window.clearTimeout(timer);
  }, [result.mmi.roman, result.mmi.label, result.goldenTimeSeconds]);

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setUrlWarnings([]);
    if (presetId === "kustom") return;

    const found = presets.find((p) => p.id === presetId);
    if (!found) return;

    const next: SimulasiInput = {
      magnitudo: found.magnitudo,
      kedalamanKm: found.kedalamanKm,
      lat: found.lat,
      lon: found.lon,
      jarakPengamatKm: validInput.jarakPengamatKm,
      tipeLokasi: found.tipeLokasi,
      wilayah: found.nama,
    };
    setValidInput(next);
    setDrafts(inputToDrafts(next));
    setErrors({});
  };

  const handleSliderChange = (field: SimulasiNumericField, val: number) => {
    setSelectedPresetId("kustom");
    const candidate: SimulasiInput = { ...validInput, [field]: val, wilayah: undefined };
    const candidateErrors = validateSimulasiInput(candidate);
    setDrafts((prev) => ({ ...prev, [field]: String(val) }));

    if (candidateErrors[field]) {
      setErrors((prev) => ({ ...prev, [field]: candidateErrors[field] }));
      return;
    }

    setErrors((prev) => {
      const nextErr = { ...prev };
      delete nextErr[field];
      return nextErr;
    });
    setValidInput(candidate);
  };

  const handleDraftChange = (field: SimulasiNumericField, raw: string) => {
    setSelectedPresetId("kustom");
    setDrafts((prev) => ({ ...prev, [field]: raw }));

    const trimmed = raw.trim().replace(",", ".");
    const parsed = trimmed === "" ? NaN : Number(trimmed);
    const candidate: SimulasiInput = { ...validInput, [field]: parsed, wilayah: undefined };
    const candidateErrors = validateSimulasiInput(candidate);

    if (candidateErrors[field]) {
      // Nilai invalid: tampilkan pesan inline, hasil hitungan terakhir TIDAK berubah.
      setErrors((prev) => ({ ...prev, [field]: candidateErrors[field] }));
      return;
    }

    setErrors((prev) => {
      const nextErr = { ...prev };
      delete nextErr[field];
      return nextErr;
    });
    setValidInput(candidate);
  };

  const handleTipeLokasiChange = (tipe: TipeLokasiSimulasi) => {
    setSelectedPresetId("kustom");
    setValidInput((prev) => ({ ...prev, tipeLokasi: tipe, wilayah: undefined }));
  };

  const handleReset = () => {
    setSelectedPresetId("kustom");
    setValidInput(DEFAULT_SIMULASI_INPUT);
    setDrafts(inputToDrafts(DEFAULT_SIMULASI_INPUT));
    setErrors({});
    setUrlWarnings([]);
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Peringatan parameter URL invalid jika ada (TC-DB-17) */}
      {urlWarnings.length > 0 && (
        <div
          role="alert"
          className="rounded-[20px] bg-[var(--color-surface-raised)] border border-[var(--color-warning-strong)] p-4 flex items-start gap-3 text-xs sm:text-sm text-[var(--color-warning-strong)]"
        >
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-1">
            <p className="font-semibold">Sebagian parameter tautan tidak dapat diterapkan:</p>
            <ul className="list-disc pl-4 space-y-0.5">
              {urlWarnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Banner informasi gempa dari Riwayat jika dibawa via URL */}
      {initialUrlState.appliedFromUrl && initialUrlState.presetWilayah && urlWarnings.length === 0 && (
        <div className="rounded-[20px] bg-[var(--color-surface)] px-4 py-3 text-xs sm:text-sm text-[var(--color-text-primary)] flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
          <span>
            Parameter dimuat dari tautan untuk skenario: <strong>{initialUrlState.presetWilayah}</strong>.
          </span>
        </div>
      )}

      {/* Layout 2 kolom desktop: ~40% panel kontrol, ~60% hasil */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <ControlPanel
            presets={presets}
            presetsLoadError={presetsLoadError}
            selectedPresetId={selectedPresetId}
            activePreset={activePreset}
            validInput={validInput}
            drafts={drafts}
            errors={errors}
            onSelectPreset={handleSelectPreset}
            onSliderChange={handleSliderChange}
            onDraftChange={handleDraftChange}
            onTipeLokasiChange={handleTipeLokasiChange}
            onReset={handleReset}
          />
        </div>

        <div className="lg:col-span-7 space-y-5">
          {/* Pill permanen wajib di area hasil (bukan tooltip) */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-4 py-2 text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">
              <Info className="w-4 h-4 shrink-0" aria-hidden="true" />
              Estimasi edukasi, bukan data resmi BMKG
            </span>
          </div>

          <MmiCard input={validInput} result={result} />
          <MetricsGrid input={validInput} result={result} />
          <TravelTimeCard result={result} />
          <TsunamiCard input={validInput} result={result} activePreset={activePreset} />
          <SafetyAndFormulaSection input={validInput} result={result} />
        </div>
      </div>

      {/* Screen-reader live region ter-debounce */}
      <p className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </p>

      {/* Ringkasan sticky mobile (390px) saat menggeser slider */}
      <div
        aria-label="Ringkasan hasil simulasi"
        className="lg:hidden sticky bottom-3 z-30 rounded-[20px] bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-4 py-3 flex items-center justify-between gap-4"
      >
        <div>
          <span className="block text-xs text-[var(--color-text-secondary)]">
            Estimasi intensitas
          </span>
          <span className="tnum text-base font-bold text-[var(--color-text-primary)]">
            MMI {result.mmi.roman} · {result.mmi.label}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-xs text-[var(--color-text-secondary)]">
            Golden time
          </span>
          <span className="tnum text-base font-bold text-[var(--color-text-primary)]">
            {formatIdNumber(result.goldenTimeSeconds, 1)} dtk
          </span>
        </div>
      </div>
    </div>
  );
}
