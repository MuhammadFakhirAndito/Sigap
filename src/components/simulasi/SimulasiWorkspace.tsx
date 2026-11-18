"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Compass, Info, Layers } from "lucide-react";
import {
  formatIdNumber,
  validateSimulasiInput,
  type ParsedSimulasiUrlResult,
  type PresetScenarioItem,
  type SimulasiInput,
  type SimulasiValidationErrors,
  type TipeLokasiSimulasi,
} from "@/lib/simulasi";
import {
  DEFAULT_OBSERVER_BEARING_DEG,
  destinationPointFromBearingKm,
  normalizeLongitude,
  runVisualSimulasiCalculation,
  syncDistanceFromPoints,
  syncObserverPointFromSlider,
  getInitialUiTipeLokasi,
  type GeoPoint,
  type SimulasiMode,
  type UiTipeLokasi,
} from "@/lib/simulasi-visual";
import { ControlPanel, type SimulasiDraftStrings } from "./ControlPanel";
import { ImpactMapPanel } from "./ImpactMapPanel";
import { Vibration3DPanel } from "./Vibration3DPanel";
import {
  AdvancedDetailsPanel,
  type ObserverDraftStrings,
  type ObserverValidationErrors,
} from "./AdvancedDetailsPanel";
import { SafetyAndFormulaSection } from "./SafetyAndFormulaSection";
import { RevealOnScroll } from "@/components/edukasi/RevealOnScroll";

interface SimulasiWorkspaceProps {
  presets: PresetScenarioItem[];
  presetsLoadError?: boolean;
  initialUrlState: ParsedSimulasiUrlResult;
  hasExplicitUrlLokasi: boolean;
}

function inputToDrafts(input: SimulasiInput): SimulasiDraftStrings {
  return {
    magnitudo: String(input.magnitudo),
    kedalamanKm: String(input.kedalamanKm),
    lat: String(roundCoord(input.lat)),
    lon: String(roundCoord(input.lon)),
    jarakPengamatKm: String(input.jarakPengamatKm),
  };
}

function pointToObserverDrafts(point: GeoPoint): ObserverDraftStrings {
  return {
    lat: String(roundCoord(point.lat)),
    lon: String(roundCoord(point.lon)),
  };
}

function roundCoord(val: number): number {
  return Math.round(val * 10000) / 10000;
}

function clampSafeLat(lat: number): number {
  return Math.max(-85, Math.min(85, lat));
}

function validateObserverCoord(field: "lat" | "lon", val: number): string | undefined {
  if (!Number.isFinite(val)) {
    return field === "lat"
      ? "Lintang Anda harus berupa angka (-85° hingga 85°)."
      : "Bujur Anda harus berupa angka (-180° hingga 180°).";
  }
  if (field === "lat" && (val < -85 || val > 85)) {
    return "Lintang Anda harus antara -85° hingga 85°.";
  }
  if (field === "lon" && (val < -180 || val > 180)) {
    return "Bujur Anda harus antara -180° hingga 180°.";
  }
  return undefined;
}

export function SimulasiWorkspace({
  presets,
  initialUrlState,
  hasExplicitUrlLokasi,
}: SimulasiWorkspaceProps) {
  const [activeMode, setActiveMode] = useState<SimulasiMode>("peta");

  const [validInput, setValidInput] = useState<SimulasiInput>(initialUrlState.input);
  const [uiTipeLokasi, setUiTipeLokasi] = useState<UiTipeLokasi>(() =>
    getInitialUiTipeLokasi({
      hasExplicitUrlLokasi,
      urlLokasi: initialUrlState.input.tipeLokasi,
    })
  );

  const [observerPoint, setObserverPoint] = useState<GeoPoint>(() =>
    destinationPointFromBearingKm(
      { lat: initialUrlState.input.lat, lon: initialUrlState.input.lon },
      initialUrlState.input.jarakPengamatKm,
      DEFAULT_OBSERVER_BEARING_DEG
    )
  );

  const [drafts, setDrafts] = useState<SimulasiDraftStrings>(() =>
    inputToDrafts(initialUrlState.input)
  );
  const [observerDrafts, setObserverDrafts] = useState<ObserverDraftStrings>(() =>
    pointToObserverDrafts(
      destinationPointFromBearingKm(
        { lat: initialUrlState.input.lat, lon: initialUrlState.input.lon },
        initialUrlState.input.jarakPengamatKm,
        DEFAULT_OBSERVER_BEARING_DEG
      )
    )
  );

  const [errors, setErrors] = useState<SimulasiValidationErrors>({});
  const [observerErrors, setObserverErrors] = useState<ObserverValidationErrors>({});
  const [selectedPresetId, setSelectedPresetId] = useState<string>(() => {
    if (initialUrlState.presetWilayah) {
      const matched = presets.find((p) => p.nama === initialUrlState.presetWilayah);
      if (matched) return matched.id;
    }
    return "kustom";
  });
  const urlWarnings = initialUrlState.warnings;

  const tabPetaRef = useRef<HTMLButtonElement | null>(null);
  const tab3dRef = useRef<HTMLButtonElement | null>(null);

  const epicenterPoint: GeoPoint = useMemo(
    () => ({ lat: validInput.lat, lon: validInput.lon }),
    [validInput.lat, validInput.lon]
  );

  const distanceSync = useMemo(
    () => syncDistanceFromPoints(epicenterPoint, observerPoint),
    [epicenterPoint, observerPoint]
  );

  const activePreset = useMemo(
    () => presets.find((p) => p.id === selectedPresetId) ?? null,
    [presets, selectedPresetId]
  );

  const inputWithActualDistance: SimulasiInput = useMemo(
    () => ({
      ...validInput,
      jarakPengamatKm: distanceSync.actualDistanceKm,
      tipeLokasi: uiTipeLokasi === "BELUM_DIPILIH" ? "DARAT" : uiTipeLokasi,
    }),
    [validInput, distanceSync.actualDistanceKm, uiTipeLokasi]
  );

  // Semua kalkulasi berjalan 100% di klien tanpa memanggil API atau DB (TC-DB-15).
  const result = useMemo(
    () =>
      runVisualSimulasiCalculation(
        validInput,
        distanceSync.actualDistanceKm,
        uiTipeLokasi
      ),
    [validInput, distanceSync.actualDistanceKm, uiTipeLokasi]
  );

  // Debounce pengumuman perubahan hasil ke screen reader agar tidak membanjiri saat menggeser slider/marker.
  const [liveAnnouncement, setLiveAnnouncement] = useState<string>("");
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setLiveAnnouncement(
        `Estimasi diperbarui di jarak ${distanceSync.formattedActualDistance}: MMI ${result.mmi.roman} (${result.mmi.label}), jeda gelombang P ke S ${formatIdNumber(result.goldenTimeSeconds, 1)} detik.`
      );
    }, 450);
    return () => window.clearTimeout(timer);
  }, [
    distanceSync.formattedActualDistance,
    result.mmi.roman,
    result.mmi.label,
    result.goldenTimeSeconds,
  ]);

  const handleSliderOrDistChange = (
    field: "magnitudo" | "jarakPengamatKm",
    val: number
  ) => {
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

    if (field === "jarakPengamatKm") {
      const nextObserver = syncObserverPointFromSlider(
        epicenterPoint,
        observerPoint,
        val
      );
      setObserverPoint(nextObserver);
      setObserverDrafts(pointToObserverDrafts(nextObserver));
      setObserverErrors({});
    }

    setValidInput(candidate);
  };

  const handleSliderDraftChange = (
    field: "magnitudo" | "jarakPengamatKm",
    raw: string
  ) => {
    setSelectedPresetId("kustom");
    setDrafts((prev) => ({ ...prev, [field]: raw }));

    const trimmed = raw.trim().replace(",", ".");
    const parsed = trimmed === "" ? NaN : Number(trimmed);
    const candidate: SimulasiInput = { ...validInput, [field]: parsed, wilayah: undefined };
    const candidateErrors = validateSimulasiInput(candidate);

    if (candidateErrors[field]) {
      setErrors((prev) => ({ ...prev, [field]: candidateErrors[field] }));
      return;
    }

    setErrors((prev) => {
      const nextErr = { ...prev };
      delete nextErr[field];
      return nextErr;
    });

    if (field === "jarakPengamatKm") {
      const nextObserver = syncObserverPointFromSlider(
        epicenterPoint,
        observerPoint,
        parsed
      );
      setObserverPoint(nextObserver);
      setObserverDrafts(pointToObserverDrafts(nextObserver));
      setObserverErrors({});
    }

    setValidInput(candidate);
  };

  const handleKedalamanPresetSelect = (depthKm: number) => {
    setSelectedPresetId("kustom");
    const candidate: SimulasiInput = {
      ...validInput,
      kedalamanKm: depthKm,
      wilayah: undefined,
    };
    setDrafts((prev) => ({ ...prev, kedalamanKm: String(depthKm) }));
    setErrors((prev) => {
      const nextErr = { ...prev };
      delete nextErr.kedalamanKm;
      return nextErr;
    });
    setValidInput(candidate);
  };

  const handleKedalamanDraftChange = (raw: string) => {
    setSelectedPresetId("kustom");
    setDrafts((prev) => ({ ...prev, kedalamanKm: raw }));

    const trimmed = raw.trim().replace(",", ".");
    const parsed = trimmed === "" ? NaN : Number(trimmed);
    const candidate: SimulasiInput = {
      ...validInput,
      kedalamanKm: parsed,
      wilayah: undefined,
    };
    const candidateErrors = validateSimulasiInput(candidate);

    if (candidateErrors.kedalamanKm) {
      setErrors((prev) => ({ ...prev, kedalamanKm: candidateErrors.kedalamanKm }));
      return;
    }

    setErrors((prev) => {
      const nextErr = { ...prev };
      delete nextErr.kedalamanKm;
      return nextErr;
    });
    setValidInput(candidate);
  };

  const handleEpicenterMoveFromMap = (point: GeoPoint) => {
    setSelectedPresetId("kustom");
    const safeEpicenter: GeoPoint = {
      lat: roundCoord(clampSafeLat(point.lat)),
      lon: roundCoord(normalizeLongitude(point.lon)),
    };
    const nextSync = syncDistanceFromPoints(safeEpicenter, observerPoint);
    const nextInput: SimulasiInput = {
      ...validInput,
      lat: safeEpicenter.lat,
      lon: safeEpicenter.lon,
      jarakPengamatKm: nextSync.sliderDistanceKm,
      wilayah: undefined,
    };
    setValidInput(nextInput);
    setDrafts((prev) => ({
      ...prev,
      lat: String(safeEpicenter.lat),
      lon: String(safeEpicenter.lon),
      jarakPengamatKm: String(nextSync.sliderDistanceKm),
    }));
    setErrors((prev) => {
      const nextErr = { ...prev };
      delete nextErr.lat;
      delete nextErr.lon;
      delete nextErr.jarakPengamatKm;
      return nextErr;
    });
  };

  const handleObserverMoveFromMap = (point: GeoPoint) => {
    const safeObserver: GeoPoint = {
      lat: roundCoord(clampSafeLat(point.lat)),
      lon: roundCoord(normalizeLongitude(point.lon)),
    };
    const nextSync = syncDistanceFromPoints(epicenterPoint, safeObserver);
    setObserverPoint(safeObserver);
    setObserverDrafts(pointToObserverDrafts(safeObserver));
    setObserverErrors({});
    setValidInput((prev) => ({
      ...prev,
      jarakPengamatKm: nextSync.sliderDistanceKm,
    }));
    setDrafts((prev) => ({
      ...prev,
      jarakPengamatKm: String(nextSync.sliderDistanceKm),
    }));
    setErrors((prev) => {
      const nextErr = { ...prev };
      delete nextErr.jarakPengamatKm;
      return nextErr;
    });
  };

  const handleEpicenterCoordDraftChange = (field: "lat" | "lon", raw: string) => {
    setSelectedPresetId("kustom");
    setDrafts((prev) => ({ ...prev, [field]: raw }));

    const trimmed = raw.trim().replace(",", ".");
    const parsed = trimmed === "" ? NaN : Number(trimmed);
    const boundedInvalid =
      !Number.isFinite(parsed) ||
      (field === "lat" ? parsed < -85 || parsed > 85 : parsed < -180 || parsed > 180);

    if (boundedInvalid) {
      setErrors((prev) => ({
        ...prev,
        [field]:
          field === "lat"
            ? "Lintang pusat gempa harus antara -85° hingga 85°."
            : "Bujur pusat gempa harus antara -180° hingga 180°.",
      }));
      return;
    }

    const nextEpicenter: GeoPoint = {
      ...epicenterPoint,
      [field]: parsed,
    };
    const nextSync = syncDistanceFromPoints(nextEpicenter, observerPoint);
    setErrors((prev) => {
      const nextErr = { ...prev };
      delete nextErr[field];
      delete nextErr.jarakPengamatKm;
      return nextErr;
    });
    setValidInput((prev) => ({
      ...prev,
      [field]: parsed,
      jarakPengamatKm: nextSync.sliderDistanceKm,
      wilayah: undefined,
    }));
    setDrafts((prev) => ({
      ...prev,
      jarakPengamatKm: String(nextSync.sliderDistanceKm),
    }));
  };

  const handleObserverCoordDraftChange = (field: "lat" | "lon", raw: string) => {
    setObserverDrafts((prev) => ({ ...prev, [field]: raw }));
    const trimmed = raw.trim().replace(",", ".");
    const parsed = trimmed === "" ? NaN : Number(trimmed);
    const errMsg = validateObserverCoord(field, parsed);

    if (errMsg) {
      setObserverErrors((prev) => ({ ...prev, [field]: errMsg }));
      return;
    }

    const nextObserver: GeoPoint = {
      ...observerPoint,
      [field]: parsed,
    };
    const nextSync = syncDistanceFromPoints(epicenterPoint, nextObserver);
    setObserverErrors((prev) => {
      const nextErr = { ...prev };
      delete nextErr[field];
      return nextErr;
    });
    setObserverPoint(nextObserver);
    setValidInput((prev) => ({
      ...prev,
      jarakPengamatKm: nextSync.sliderDistanceKm,
    }));
    setDrafts((prev) => ({
      ...prev,
      jarakPengamatKm: String(nextSync.sliderDistanceKm),
    }));
  };

  const handleTipeLokasiChange = (tipe: TipeLokasiSimulasi) => {
    setSelectedPresetId("kustom");
    setUiTipeLokasi(tipe);
    setValidInput((prev) => ({ ...prev, tipeLokasi: tipe, wilayah: undefined }));
  };

  const handleModeKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft" || e.key === "Home" || e.key === "End") {
      e.preventDefault();
      if (e.key === "Home") {
        setActiveMode("peta");
        tabPetaRef.current?.focus();
      } else if (e.key === "End") {
        setActiveMode("3d");
        tab3dRef.current?.focus();
      } else {
        const nextMode: SimulasiMode = activeMode === "peta" ? "3d" : "peta";
        setActiveMode(nextMode);
        if (nextMode === "peta") {
          tabPetaRef.current?.focus();
        } else {
          tab3dRef.current?.focus();
        }
      }
    }
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

      {/* Layout 2 kolom desktop: panel 3 kontrol | panggung visualisasi & detail lanjutan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-5">
          <ControlPanel
            validInput={validInput}
            drafts={drafts}
            errors={errors}
            distanceSync={distanceSync}
            result={result}
            onSliderChange={handleSliderOrDistChange}
            onDraftChange={handleSliderDraftChange}
            onKedalamanPresetSelect={handleKedalamanPresetSelect}
          />
        </div>

        <div className="lg:col-span-7 space-y-5">
          {/* Panggung visualisasi terpadu: header tab mode + area hasil aktif */}
          <div className="bg-[var(--color-surface)] rounded-[28px] border border-[var(--color-border)]/70">
            <div className="rounded-t-[28px] border-b border-[var(--color-border)] px-4 sm:px-6 pt-3 sm:pt-3.5 flex flex-col-reverse sm:flex-row sm:items-end sm:justify-between gap-2.5 sm:gap-4">
              <div
                role="tablist"
                aria-label="Pilih mode tampilan simulasi"
                onKeyDown={handleModeKeyDown}
                className="grid grid-cols-2 sm:inline-flex items-stretch gap-1 sm:gap-1.5 -mb-px"
              >
                <button
                  ref={tabPetaRef}
                  id="tab-mode-peta"
                  type="button"
                  role="tab"
                  aria-selected={activeMode === "peta"}
                  aria-controls="panel-mode-peta"
                  tabIndex={activeMode === "peta" ? 0 : -1}
                  onClick={() => setActiveMode("peta")}
                  className={`relative inline-flex items-center justify-center gap-2 min-h-[46px] px-3.5 sm:px-5 pt-2.5 pb-3 rounded-t-[14px] text-xs sm:text-sm border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-primary-strong)] ${activeMode === "peta"
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] font-semibold border-[var(--color-border)] border-b-[var(--color-surface-raised)] z-10"
                    : "bg-transparent text-[var(--color-text-secondary)] font-medium border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]/50 active:bg-[var(--color-surface-sunken)]/60"
                    }`}
                >
                  <Compass
                    className="w-4 h-4 shrink-0"
                    strokeWidth={activeMode === "peta" ? 2.2 : 1.75}
                    aria-hidden="true"
                  />
                  <span>Peta dampak</span>
                  {activeMode === "peta" && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-3.5 bottom-0 h-[2px] rounded-full bg-[var(--color-cta)]"
                    />
                  )}
                </button>

                <button
                  ref={tab3dRef}
                  id="tab-mode-3d"
                  type="button"
                  role="tab"
                  aria-selected={activeMode === "3d"}
                  aria-controls="panel-mode-3d"
                  tabIndex={activeMode === "3d" ? 0 : -1}
                  onClick={() => setActiveMode("3d")}
                  className={`relative inline-flex items-center justify-center gap-2 min-h-[46px] px-3.5 sm:px-5 pt-2.5 pb-3 rounded-t-[14px] text-xs sm:text-sm border transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-primary-strong)] ${activeMode === "3d"
                    ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] font-semibold border-[var(--color-border)] border-b-[var(--color-surface-raised)] z-10"
                    : "bg-transparent text-[var(--color-text-secondary)] font-medium border-transparent hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]/50 active:bg-[var(--color-surface-sunken)]/60"
                    }`}
                >
                  <Layers
                    className="w-4 h-4 shrink-0"
                    strokeWidth={activeMode === "3d" ? 2.2 : 1.75}
                    aria-hidden="true"
                  />
                  <span>Getaran 3D</span>
                  {activeMode === "3d" && (
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-3.5 bottom-0 h-[2px] rounded-full bg-[var(--color-cta)]"
                    />
                  )}
                </button>
              </div>

              <span className="w-full sm:w-auto justify-center sm:justify-start sm:mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                <Info
                  className="w-3.5 h-3.5 shrink-0 text-[var(--color-primary-strong)]"
                  aria-hidden="true"
                />
                <span>Estimasi edukasi, bukan data resmi BMKG</span>
              </span>
            </div>

            {/* Panggung mode aktif: default Peta dampak; Getaran 3D dimuat dinamis HANYA saat dibuka */}
            <div key={activeMode} className="sigap-page-enter">
              {activeMode === "peta" ? (
                <ImpactMapPanel
                  input={inputWithActualDistance}
                  result={result}
                  epicenter={epicenterPoint}
                  observer={observerPoint}
                  distanceSync={distanceSync}
                  onEpicenterMove={handleEpicenterMoveFromMap}
                  onObserverMove={handleObserverMoveFromMap}
                />
              ) : (
                <Vibration3DPanel result={result} />
              )}
            </div>
          </div>

          {/* Detail lanjutan: tertutup secara default */}
          <RevealOnScroll>
            <AdvancedDetailsPanel
              inputWithActualDistance={inputWithActualDistance}
              result={result}
              activePreset={activePreset}
              uiTipeLokasi={uiTipeLokasi}
              drafts={drafts}
              errors={errors}
              observerDrafts={observerDrafts}
              observerErrors={observerErrors}
              onTipeLokasiChange={handleTipeLokasiChange}
              onKedalamanDraftChange={handleKedalamanDraftChange}
              onEpicenterCoordDraftChange={handleEpicenterCoordDraftChange}
              onObserverCoordDraftChange={handleObserverCoordDraftChange}
            />
          </RevealOnScroll>

          {/* Rekomendasi kesiapsiagaan & tautan langsung ke Chatbot */}
          <RevealOnScroll>
            <SafetyAndFormulaSection input={inputWithActualDistance} result={result} />
          </RevealOnScroll>
        </div>
      </div>

      {/* Screen-reader live region ter-debounce */}
      <p className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </p>

      {/* Ringkasan sticky mobile (390px) saat menggeser kontrol */}
      <div
        aria-label="Ringkasan hasil simulasi"
        className="lg:hidden sticky bottom-0 z-30 -mx-4 px-4 py-2.5 bg-[var(--color-surface-raised)] border-t border-[var(--color-border-strong)] flex items-center justify-between gap-4"
      >
        <div>
          <span className="block text-xs text-[var(--color-text-secondary)]">
            Estimasi di {distanceSync.formattedActualDistance}
          </span>
          <span className="tnum text-base font-bold text-[var(--color-text-primary)]">
            MMI {result.mmi.roman} · {result.mmi.label}
          </span>
        </div>
        <div className="text-right shrink-0">
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
