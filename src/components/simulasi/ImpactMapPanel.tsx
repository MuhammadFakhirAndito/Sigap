"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Info, MapPin } from "lucide-react";
import type { SimulasiInput, SimulasiResult } from "@/lib/simulasi";
import {
  formatAwamRadiusSummary,
  formatKoordinatId,
  nudgePointByKm,
  type DistanceSyncState,
  type GeoPoint,
} from "@/lib/simulasi-visual";
import type { MapClickTarget } from "./LeafletMapCanvas";

const DynamicLeafletMapCanvas = dynamic(() => import("./LeafletMapCanvas"), {
  ssr: false,
  loading: () => (
    <div
      aria-busy="true"
      aria-label="Memuat peta dampak gempa"
      className="w-full h-[320px] sm:h-[380px] rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] animate-pulse flex items-center justify-center text-xs font-medium text-[var(--color-text-secondary)]"
    >
      Memuat peta OpenStreetMap…
    </div>
  ),
});

interface ImpactMapPanelProps {
  input: SimulasiInput;
  result: SimulasiResult;
  epicenter: GeoPoint;
  observer: GeoPoint;
  distanceSync: DistanceSyncState;
  onEpicenterMove: (point: GeoPoint) => void;
  onObserverMove: (point: GeoPoint) => void;
}

const KEYBOARD_STEP_KM = 15;

export function ImpactMapPanel({
  input,
  result,
  epicenter,
  observer,
  distanceSync,
  onEpicenterMove,
  onObserverMove,
}: ImpactMapPanelProps) {
  const [clickTarget, setClickTarget] = useState<MapClickTarget>("observer");

  const feltSummary = formatAwamRadiusSummary("Terasa", result.radiusFeltIII);
  const damagingSummary = formatAwamRadiusSummary(
    "Mulai merusak ringan",
    result.radiusDamagingVI
  );

  const isOutOfMagRange =
    result.radiusFeltIII.status === "out_of_mag_calibration" &&
    result.radiusDamagingVI.status === "out_of_mag_calibration";

  return (
    <section
      id="panel-mode-peta"
      role="tabpanel"
      aria-labelledby="tab-mode-peta"
      className="p-4 sm:p-6 space-y-4 sm:space-y-5"
    >
      {/* Bilah kontrol peta: target klik + kontrol keyboard marker "Anda" */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
            Klik peta:
          </span>
          <div
            role="group"
            aria-label="Pilih target saat mengklik peta"
            className="inline-flex rounded-[14px] bg-[var(--color-surface-sunken)] border border-[var(--color-border)] p-1 gap-1"
          >
            <button
              type="button"
              aria-pressed={clickTarget === "observer"}
              onClick={() => setClickTarget("observer")}
              className={`min-h-[44px] rounded-[10px] px-3 text-xs transition-colors duration-150 ${
                clickTarget === "observer"
                  ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] font-semibold border border-[var(--color-border)]"
                  : "text-[var(--color-text-secondary)] font-medium border border-transparent hover:text-[var(--color-text-primary)]"
              }`}
            >
              Lokasi Anda
            </button>
            <button
              type="button"
              aria-pressed={clickTarget === "epicenter"}
              onClick={() => setClickTarget("epicenter")}
              className={`min-h-[44px] rounded-[10px] px-3 text-xs transition-colors duration-150 ${
                clickTarget === "epicenter"
                  ? "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] font-semibold border border-[var(--color-border)]"
                  : "text-[var(--color-text-secondary)] font-medium border border-transparent hover:text-[var(--color-text-primary)]"
              }`}
            >
              Pusat gempa
            </button>
          </div>
        </div>

        {/* Jalur keyboard untuk memindahkan marker "Anda" tanpa mouse */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2">
          <span className="text-xs font-medium text-[var(--color-text-secondary)] whitespace-nowrap">
            Geser &ldquo;Anda&rdquo; ({KEYBOARD_STEP_KM} km)
          </span>
          <div
            role="group"
            aria-label="Kontrol keyboard posisi titik Anda"
            className="inline-flex items-center rounded-[14px] bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)]/60 divide-x divide-[var(--color-border)] overflow-hidden"
          >
            <button
              type="button"
              aria-label={`Geser lokasi Anda ke utara ${KEYBOARD_STEP_KM} kilometer`}
              onClick={() =>
                onObserverMove(nudgePointByKm(observer, KEYBOARD_STEP_KM, 0))
              }
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:bg-[var(--color-surface-sunken)] transition-colors duration-150"
            >
              <ArrowUp className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Geser lokasi Anda ke selatan ${KEYBOARD_STEP_KM} kilometer`}
              onClick={() =>
                onObserverMove(nudgePointByKm(observer, -KEYBOARD_STEP_KM, 0))
              }
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:bg-[var(--color-surface-sunken)] transition-colors duration-150"
            >
              <ArrowDown className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Geser lokasi Anda ke barat ${KEYBOARD_STEP_KM} kilometer`}
              onClick={() =>
                onObserverMove(nudgePointByKm(observer, 0, -KEYBOARD_STEP_KM))
              }
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:bg-[var(--color-surface-sunken)] transition-colors duration-150"
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={`Geser lokasi Anda ke timur ${KEYBOARD_STEP_KM} kilometer`}
              onClick={() =>
                onObserverMove(nudgePointByKm(observer, 0, KEYBOARD_STEP_KM))
              }
              className="inline-flex items-center justify-center min-w-[44px] min-h-[44px] text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:bg-[var(--color-surface-sunken)] transition-colors duration-150"
            >
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* Kanvas Leaflet client-only */}
      <DynamicLeafletMapCanvas
        epicenter={epicenter}
        observer={observer}
        radiusFeltIII={result.radiusFeltIII}
        radiusDamagingVI={result.radiusDamagingVI}
        clickTarget={clickTarget}
        onEpicenterMove={onEpicenterMove}
        onObserverMove={onObserverMove}
      />

      {/* Penjelasan bila M di luar rentang kalibrasi 5,0–7,9 sehingga lingkaran sengaja tidak digambar */}
      {isOutOfMagRange && (
        <div
          role="note"
          className="rounded-[16px] bg-[var(--color-surface-raised)] border border-[var(--color-warning-strong)] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[var(--color-warning-strong)]"
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Lingkaran radius tidak digambar karena magnitudo{" "}
            <strong className="tnum">
              M {input.magnitudo.toFixed(1).replace(".", ",")}
            </strong>{" "}
            berada di luar rentang kalibrasi rumus Allen, Wald &amp; Worden (2012) (Mw 5,0–7,9). Model tidak mengekstrapolasi secara paksa.
          </span>
        </div>
      )}

      {/* Ringkasan teks hasil DI LUAR peta (selalu tersedia untuk screen reader, keyboard, dan mode offline) */}
      <div
        aria-label="Ringkasan teks peta dampak gempa"
        className="space-y-4 rounded-[20px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4 sm:p-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-[14px] bg-[var(--color-surface)] px-3.5 py-3 space-y-0.5">
            <span className="block text-xs font-medium text-[var(--color-text-secondary)]">
              Radius guncangan terasa (MMI ≥ III)
            </span>
            <p className="tnum text-sm font-semibold text-[var(--color-text-primary)]">
              {feltSummary}
            </p>
          </div>

          <div className="rounded-[14px] bg-[var(--color-surface)] px-3.5 py-3 space-y-0.5">
            <span className="block text-xs font-medium text-[var(--color-text-secondary)]">
              Radius guncangan merusak ringan (MMI ≥ VI)
            </span>
            <p className="tnum text-sm font-semibold text-[var(--color-text-primary)]">
              {damagingSummary}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-text-primary)]" aria-hidden="true" />
            <div>
              <span className="block font-semibold text-[var(--color-text-primary)]">
                Pusat gempa
              </span>
              <span className="tnum">
                {formatKoordinatId(epicenter.lat, epicenter.lon)}
              </span>
            </div>
          </div>

          <div className="flex items-start gap-2 text-[var(--color-text-secondary)]">
            <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--color-text-primary)]" aria-hidden="true" />
            <div>
              <span className="block font-semibold text-[var(--color-text-primary)]">
                Titik &ldquo;Anda&rdquo; ({distanceSync.formattedActualDistance})
              </span>
              <span className="tnum">
                {formatKoordinatId(observer.lat, observer.lon)}
                {distanceSync.isBeyondCalibratedRange
                  ? " · di luar kalibrasi 300 km"
                  : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Legenda lingkaran netral gelap (tanpa warna hijau atau merah untuk data kebahayaan) */}
        <div className="pt-2 border-t border-[var(--color-border)] flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-3.5 h-3.5 rounded-full border border-[var(--color-cta)] bg-[var(--color-cta)]/15"
            />
            Merusak ringan (MMI ≥ VI)
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-3.5 h-3.5 rounded-full border border-[var(--color-cta)]/60 bg-[var(--color-cta)]/5"
            />
            Terasa (MMI ≥ III)
          </span>
          <span className="inline-flex items-center gap-2">
            <span
              aria-hidden="true"
              className="inline-block w-3.5 h-3.5 rounded-full border border-dashed border-[var(--color-cta)]/60"
            />
            Batas kalibrasi 300 km (&gt; 300 km)
          </span>
        </div>
      </div>
    </section>
  );
}
