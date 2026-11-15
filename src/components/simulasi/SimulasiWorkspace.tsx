"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Compass, Info, Layers } from "lucide-react";
import {
  DEFAULT_SIMULASI_INPUT,
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
  calculateBearingDeg,
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

interface SimulasiWorkspaceProps {
  presets: PresetScenarioItem[];
  presetsLoadError: boolean;
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
  presetsLoadError,
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
  const [selectedPresetId, setSelectedPresetId] = useState<string>("kustom");
  const [urlWarnings, setUrlWarnings] = useState<string[]>(initialUrlState.warnings);

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

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    setUrlWarnings([]);
    if (presetId === "kustom") return;

    const found = presets.find((p) => p.id === presetId);
    if (!found) return;

    const preservedKm = validInput.jarakPengamatKm;
    const prevBearing = calculateBearingDeg(epicenterPoint, observerPoint);
    const nextEpicenter: GeoPoint = { lat: clampSafeLat(found.lat), lon: normalizeLongitude(found.lon) };
    const nextObserver = destinationPointFromBearingKm(
      nextEpicenter,
      preservedKm,
      Number.isFinite(prevBearing) ? prevBearing : DEFAULT_OBSERVER_BEARING_DEG
    );

    const nextInput: SimulasiInput = {
      magnitudo: found.magnitudo,
      kedalamanKm: found.kedalamanKm,
      lat: nextEpicenter.lat,
      lon: nextEpicenter.lon,
      jarakPengamatKm: preservedKm,
      tipeLokasi: found.tipeLokasi,
      wilayah: found.nama,
    };

    setValidInput(nextInput);
    setUiTipeLokasi(found.tipeLokasi);
    setObserverPoint(nextObserver);
    setDrafts(inputToDrafts(nextInput));
    setObserverDrafts(pointToObserverDrafts(nextObserver));
    setErrors({});
    setObserverErrors({});
  };

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

  const handleReset = () => {
    const defaultEpicenter: GeoPoint = {
      lat: DEFAULT_SIMULASI_INPUT.lat,
      lon: DEFAULT_SIMULASI_INPUT.lon,
    };
    const defaultObserver = destinationPointFromBearingKm(
      defaultEpicenter,
      DEFAULT_SIMULASI_INPUT.jarakPengamatKm,
      DEFAULT_OBSERVER_BEARING_DEG
    );
    setSelectedPresetId("kustom");
    setValidInput(DEFAULT_SIMULASI_INPUT);
    setUiTipeLokasi("BELUM_DIPILIH");
    setObserverPoint(defaultObserver);
    setDrafts(inputToDrafts(DEFAULT_SIMULASI_INPUT));
    setObserverDrafts(pointToObserverDrafts(defaultObserver));
    setErrors({});
    setObserverErrors({});
    setUrlWarnings([]);
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

      {/* Ringkasan sticky atas di mobile (390px): tidak menutupi kontrol di atas saat initial viewport */}
      <div
        aria-label="Ringkasan hasil simulasi"
        className="lg:hidden sticky top-2 z-30 rounded-[20px] bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-4 py-3 flex items-center justify-between gap-4"
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

      {/* Layout 2 kolom desktop: panel 3 kontrol + preset | panggung visualisasi & detail lanjutan */}
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
            distanceSync={distanceSync}
            onSelectPreset={handleSelectPreset}
            onSliderChange={handleSliderOrDistChange}
            onDraftChange={handleSliderDraftChange}
            onKedalamanPresetSelect={handleKedalamanPresetSelect}
            onReset={handleReset}
          />
        </div>

        <div className="lg:col-span-7 space-y-5">
          {/* Baris atas hasil: Segmented Mode Switcher + Label wajib */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div
              role="tablist"
              aria-label="Pilih mode tampilan simulasi"
              onKeyDown={handleModeKeyDown}
              className="inline-flex rounded-full bg-[var(--color-surface)] border border-[var(--color-border-strong)] p-1 gap-1"
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
                className={`inline-flex items-center gap-1.5 min-h-[44px] rounded-full px-4 text-xs sm:text-sm font-semibold transition-colors duration-150 ${
                  activeMode === "peta"
                    ? "bg-[var(--color-cta)] text-[var(--color-on-cta)]"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                }`}
              >
                <Compass className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Peta dampak</span>
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
                className={`inline-flex items-center gap-1.5 min-h-[44px] rounded-full px-4 text-xs sm:text-sm font-semibold transition-colors duration-150 ${
                  activeMode === "3d"
                    ? "bg-[var(--color-cta)] text-[var(--color-on-cta)]"
                    : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Getaran 3D</span>
              </button>
            </div>

            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-4 py-2 text-xs font-semibold text-[var(--color-text-primary)]">
              <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              Estimasi edukasi, bukan data resmi BMKG
            </span>
          </div>

          {/* Ringkasan getaran awam + angka MMI kecil netral gelap (tampil di KEDUA mode) */}
          <section
            aria-label="Ringkasan intensitas guncangan di lokasi Anda"
            className="bg-[var(--color-surface)] rounded-[24px] p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start sm:items-center gap-3.5">
              {/* Angka MMI kecil netral gelap (TANPA hijau / token success) */}
              <div className="shrink-0 rounded-[16px] bg-[var(--color-cta)] text-[var(--color-on-cta)] px-3.5 py-2 text-center min-w-[78px]">
                <span className="block text-xs font-medium opacity-80">
                  MMI
                </span>
                <span className="tnum block text-2xl font-bold leading-tight">
                  {result.mmi.roman}
                </span>
                <span className="tnum block text-xs opacity-85">
                  {formatIdNumber(result.mmi.raw, 1)}
                </span>
              </div>

              <div className="space-y-1">
                <p className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
                  {result.mmi.label}
                </p>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  {result.mmi.description}
                </p>
                <p className="tnum text-xs font-medium text-[var(--color-text-primary)]">
                  <span>
                    Jarak Anda:{" "}
                    <strong className="font-semibold">
                      {distanceSync.formattedActualDistance}
                    </strong>
                  </span>
                  <span className="mx-2 text-[var(--color-text-secondary)]" aria-hidden="true">|</span>
                  <span>
                    Jeda P ke S:{" "}
                    <strong className="font-semibold">
                      {formatIdNumber(result.goldenTimeSeconds, 1)} detik
                    </strong>
                  </span>
                </p>
              </div>
            </div>

            {(result.mmi.outsideMagRange || result.mmi.outsideDistRange) && (
              <span className="inline-flex items-center gap-1.5 self-start sm:self-center shrink-0 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-warning-strong)] px-3 py-1 text-xs font-medium text-[var(--color-warning-strong)]">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>di luar kalibrasi</span>
              </span>
            )}
          </section>

          {/* Panggung mode aktif: default Peta dampak; Getaran 3D dimuat dinamis HANYA saat dibuka */}
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

          {/* Detail lanjutan: tertutup secara default */}
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

          {/* Rekomendasi kesiapsiagaan & tautan langsung ke Chatbot */}
          <SafetyAndFormulaSection input={inputWithActualDistance} result={result} />
        </div>
      </div>

      {/* Screen-reader live region ter-debounce */}
      <p className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </p>
    </div>
  );
}
