"use client";

import React from "react";
import { AlertCircle, ChevronDown } from "lucide-react";
import {
  SIMULASI_LIMITS,
  formatIdNumber,
  type PresetScenarioItem,
  type SimulasiInput,
  type SimulasiResult,
  type SimulasiValidationErrors,
  type TipeLokasiSimulasi,
} from "@/lib/simulasi";
import { formatKoordinatId, type UiTipeLokasi } from "@/lib/simulasi-visual";
import type { SimulasiDraftStrings } from "./ControlPanel";
import {
  MetricsGrid,
  MmiCard,
  TravelTimeCard,
  TsunamiCard,
} from "./ResultCards";
import { FormulaReferenceCard } from "./SafetyAndFormulaSection";

export interface ObserverDraftStrings {
  lat: string;
  lon: string;
}

export interface ObserverValidationErrors {
  lat?: string;
  lon?: string;
}

interface AdvancedDetailsPanelProps {
  inputWithActualDistance: SimulasiInput;
  result: SimulasiResult;
  activePreset: PresetScenarioItem | null;
  uiTipeLokasi: UiTipeLokasi;
  drafts: SimulasiDraftStrings;
  errors: SimulasiValidationErrors;
  observerDrafts: ObserverDraftStrings;
  observerErrors: ObserverValidationErrors;
  onTipeLokasiChange: (tipe: TipeLokasiSimulasi) => void;
  onKedalamanDraftChange: (raw: string) => void;
  onEpicenterCoordDraftChange: (field: "lat" | "lon", raw: string) => void;
  onObserverCoordDraftChange: (field: "lat" | "lon", raw: string) => void;
}

export function AdvancedDetailsPanel({
  inputWithActualDistance,
  result,
  activePreset,
  uiTipeLokasi,
  drafts,
  errors,
  observerDrafts,
  observerErrors,
  onTipeLokasiChange,
  onKedalamanDraftChange,
  onEpicenterCoordDraftChange,
  onObserverCoordDraftChange,
}: AdvancedDetailsPanelProps) {
  return (
    <details className="group bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] rounded-[28px] p-5 sm:p-6">
      <summary className="flex items-center justify-between gap-3 list-none text-base font-semibold text-[var(--color-text-primary)] min-h-[44px]">
        <div className="space-y-0.5 pr-2">
          <span className="block text-base font-semibold text-[var(--color-text-primary)]">
            Detail lanjutan
          </span>
          <span className="block text-xs font-normal text-[var(--color-text-secondary)]">
            Tipe lokasi, kedalaman angka, input koordinat manual, energi, waktu rambat, tsunami, 12 tingkat MMI, &amp; rumus
          </span>
        </div>
        <ChevronDown
          className="w-5 h-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
          aria-hidden="true"
        />
      </summary>

      <div className="mt-5 pt-5 border-t border-[var(--color-border)] space-y-5">
        {/* Parameter lanjutan & input manual koordinat (jalur non-peta / keyboard penuh) */}
        <section
          aria-label="Parameter lanjutan dan input koordinat manual"
          className="bg-[var(--color-surface)] rounded-[24px] p-5 sm:p-6 space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Tipe lokasi 3 keadaan */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Tipe lokasi episentrum
                </span>
                <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                  {uiTipeLokasi === "BELUM_DIPILIH"
                    ? "Belum dipilih"
                    : uiTipeLokasi === "DARAT"
                      ? "Darat"
                      : "Laut"}
                </span>
              </div>

              <div
                role="group"
                aria-label="Pilih tipe lokasi episentrum"
                className="grid grid-cols-2 gap-2"
              >
                {(["DARAT", "LAUT"] as const).map((tipe) => {
                  const active = uiTipeLokasi === tipe;
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
              <p className="text-xs text-[var(--color-text-secondary)]">
                Menentukan indikator kriteria tsunami. Preset sejarah mengisi otomatis; mode Kustom awalnya belum dipilih.
              </p>
            </div>

            {/* Kedalaman angka 1–700 km */}
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label
                  htmlFor="sim-depth-manual"
                  className="text-sm font-semibold text-[var(--color-text-primary)]"
                >
                  Kedalaman hiposenter angka (km)
                </label>
                <span className="text-xs text-[var(--color-text-secondary)] tnum">
                  1 s.d. {formatIdNumber(SIMULASI_LIMITS.DEPTH_MAX, 0)} km
                </span>
              </div>

              <input
                id="sim-depth-manual"
                type="number"
                step="0.5"
                min={SIMULASI_LIMITS.DEPTH_MIN}
                max={SIMULASI_LIMITS.DEPTH_MAX}
                value={drafts.kedalamanKm}
                onChange={(e) => onKedalamanDraftChange(e.target.value)}
                aria-invalid={Boolean(errors.kedalamanKm)}
                className="tnum w-full min-h-[44px] rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-4 text-sm font-semibold text-[var(--color-text-primary)]"
              />
              <p className="text-xs text-[var(--color-text-secondary)]">
                Batas kriteria tsunami BNPB: ≤ 70 km.
              </p>
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
          </div>

          <hr className="border-[var(--color-border)]" />

          {/* Input manual Lintang & Bujur Pusat Gempa + Lokasi Anda */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Koordinat pusat gempa
                </span>
                <span className="tnum text-xs text-[var(--color-text-secondary)]">
                  {formatKoordinatId(inputWithActualDistance.lat, inputWithActualDistance.lon)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="sim-lat"
                    className="block text-xs font-semibold text-[var(--color-text-primary)]"
                  >
                    Lintang (-85 s.d. 85)
                  </label>
                  <input
                    id="sim-lat"
                    type="number"
                    step="0.01"
                    min={-85}
                    max={85}
                    value={drafts.lat}
                    onChange={(e) => onEpicenterCoordDraftChange("lat", e.target.value)}
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
                    onChange={(e) => onEpicenterCoordDraftChange("lon", e.target.value)}
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
            </div>

            <div className="space-y-2.5">
              <span className="block text-sm font-semibold text-[var(--color-text-primary)]">
                Koordinat titik &ldquo;Anda&rdquo; (manual)
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label
                    htmlFor="sim-obs-lat"
                    className="block text-xs font-semibold text-[var(--color-text-primary)]"
                  >
                    Lintang Anda (-85 s.d. 85)
                  </label>
                  <input
                    id="sim-obs-lat"
                    type="number"
                    step="0.01"
                    min={-85}
                    max={85}
                    value={observerDrafts.lat}
                    onChange={(e) => onObserverCoordDraftChange("lat", e.target.value)}
                    aria-invalid={Boolean(observerErrors.lat)}
                    className="tnum w-full min-h-[44px] rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3.5 text-sm font-medium text-[var(--color-text-primary)]"
                  />
                  {observerErrors.lat && (
                    <p role="alert" className="text-xs text-[var(--color-error-strong)]">
                      {observerErrors.lat}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor="sim-obs-lon"
                    className="block text-xs font-semibold text-[var(--color-text-primary)]"
                  >
                    Bujur Anda (-180 s.d. 180)
                  </label>
                  <input
                    id="sim-obs-lon"
                    type="number"
                    step="0.01"
                    min={SIMULASI_LIMITS.LON_MIN}
                    max={SIMULASI_LIMITS.LON_MAX}
                    value={observerDrafts.lon}
                    onChange={(e) => onObserverCoordDraftChange("lon", e.target.value)}
                    aria-invalid={Boolean(observerErrors.lon)}
                    className="tnum w-full min-h-[44px] rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3.5 text-sm font-medium text-[var(--color-text-primary)]"
                  />
                  {observerErrors.lon && (
                    <p role="alert" className="text-xs text-[var(--color-error-strong)]">
                      {observerErrors.lon}
                    </p>
                  )}
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Memungkinkan penempatan titik tanpa peta; jarak ke pusat gempa otomatis diperbarui dengan Haversine.
              </p>
            </div>
          </div>
        </section>

        {/* Energi, hiposenter, & radius */}
        <MetricsGrid input={inputWithActualDistance} result={result} />

        {/* Waktu rambat P & S */}
        <TravelTimeCard result={result} />

        {/* Indikator kriteria tsunami 3 keadaan */}
        <TsunamiCard
          input={inputWithActualDistance}
          result={result}
          activePreset={activePreset}
          uiTipeLokasi={uiTipeLokasi}
        />

        {/* 12 tingkat skala MMI */}
        <MmiCard input={inputWithActualDistance} result={result} />

        {/* Rumus, kalibrasi, dan atribusi */}
        <FormulaReferenceCard />
      </div>
    </details>
  );
}
