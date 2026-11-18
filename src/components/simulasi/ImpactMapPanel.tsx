"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Info, Loader2, LocateFixed } from "lucide-react";
import type { RadiusEstimate, SimulasiInput, SimulasiResult } from "@/lib/simulasi";
import {
  formatKoordinatId,
  intensityVar,
  mmiIntensityStep,
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
      className="w-full h-[360px] sm:h-[460px] rounded-[20px] bg-[var(--color-surface-sunken)] animate-pulse flex items-center justify-center text-xs font-medium text-[var(--color-text-secondary)]"
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

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]";

// Glyph kecil yang meniru penanda di peta, supaya teks dan peta terbaca sebagai satu legenda.
function EpicenterGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 28 28" fill="none" aria-hidden="true" className="shrink-0">
      <circle cx="14" cy="14" r="12" fill="var(--color-surface-raised)" stroke="var(--color-cta)" strokeWidth="3" />
      <circle cx="14" cy="14" r="5" fill="var(--color-cta)" />
    </svg>
  );
}

function ObserverGlyph() {
  return (
    <svg width="16" height="18" viewBox="0 0 30 34" fill="none" aria-hidden="true" className="shrink-0">
      <path
        d="M15 2C8.373 2 3 7.373 3 14C3 22.75 15 32 15 32C15 32 27 22.75 27 14C27 7.373 21.627 2 15 2Z"
        fill="var(--color-cta)"
      />
      <circle cx="15" cy="14" r="4.5" fill="var(--color-surface-raised)" />
    </svg>
  );
}

function radiusValue(estimate: RadiusEstimate): string {
  if (estimate.status === "in_range" && estimate.radiusKm !== null) {
    return `± ${Math.round(estimate.radiusKm).toLocaleString("id-ID")} km`;
  }
  if (estimate.status === "beyond_300") return "> 300 km";
  return "–";
}

function radiusNote(estimate: RadiusEstimate): string | null {
  if (estimate.status === "beyond_300") return "di luar rentang kalibrasi";
  if (estimate.status === "not_reached") return estimate.displayText;
  if (estimate.status === "out_of_mag_calibration") return "tidak dapat diperkirakan";
  return null;
}

function RadiusStat({
  label,
  mmi,
  estimate,
  swatchColor,
}: {
  label: string;
  mmi: string;
  estimate: RadiusEstimate;
  swatchColor: string;
}) {
  const note = radiusNote(estimate);
  return (
    <div className="min-w-0">
      <p className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
        <span
          aria-hidden="true"
          className="inline-block w-3.5 h-3.5 shrink-0 rounded-full border-2"
          style={{
            borderColor: swatchColor,
            backgroundColor: `color-mix(in srgb, ${swatchColor} 25%, transparent)`,
          }}
        />
        <span>
          {label} <span className="whitespace-nowrap tnum">(MMI ≥ {mmi})</span>
        </span>
      </p>
      <p className="mt-2 whitespace-nowrap text-3xl font-semibold leading-none tracking-tight text-[var(--color-text-primary)] tnum">
        {radiusValue(estimate)}
      </p>
      {note && <p className="mt-2 text-xs text-[var(--color-text-secondary)]">{note}</p>}
    </div>
  );
}

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
  const [gpsStatus, setGpsStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [gpsMessage, setGpsMessage] = useState<string | null>(null);

  const handleRequestGps = () => {
    setClickTarget("observer");
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      setGpsStatus("error");
      setGpsMessage("Peramban Anda tidak mendukung fitur geolokasi GPS.");
      return;
    }

    setGpsStatus("loading");
    setGpsMessage(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const nextPoint: GeoPoint = {
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        };
        onObserverMove(nextPoint);
        setGpsStatus("success");
        setGpsMessage(
          `Lokasi GPS berhasil diterapkan (${formatKoordinatId(nextPoint.lat, nextPoint.lon)}).`
        );
      },
      (err) => {
        setGpsStatus("error");
        if (err.code === err.PERMISSION_DENIED) {
          setGpsMessage(
            "Izin lokasi ditolak. Izinkan akses lokasi pada peramban Anda untuk memakai GPS."
          );
        } else if (err.code === err.TIMEOUT) {
          setGpsMessage("Waktu pencarian sinyal GPS habis. Coba lagi atau klik langsung di peta.");
        } else {
          setGpsMessage("Gagal mendeteksi lokasi GPS perangkat. Silakan coba lagi.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  };

  const isOutOfMagRange =
    result.radiusFeltIII.status === "out_of_mag_calibration" &&
    result.radiusDamagingVI.status === "out_of_mag_calibration";
  const showsCalibrationEdge =
    result.radiusFeltIII.status === "beyond_300" || result.radiusDamagingVI.status === "beyond_300";

  const targets: { value: MapClickTarget; label: string; glyph: React.ReactNode }[] = [
    { value: "observer", label: "Lokasi Anda", glyph: <ObserverGlyph /> },
    { value: "epicenter", label: "Pusat gempa", glyph: <EpicenterGlyph /> },
  ];

  const nudges = [
    { label: "utara", icon: ArrowUp, dLat: KEYBOARD_STEP_KM, dLon: 0 },
    { label: "selatan", icon: ArrowDown, dLat: -KEYBOARD_STEP_KM, dLon: 0 },
    { label: "barat", icon: ArrowLeft, dLat: 0, dLon: -KEYBOARD_STEP_KM },
    { label: "timur", icon: ArrowRight, dLat: 0, dLon: KEYBOARD_STEP_KM },
  ];

  return (
    <section
      id="panel-mode-peta"
      role="tabpanel"
      aria-labelledby="tab-mode-peta"
      className="p-4 sm:p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span id="map-click-label" className="text-sm text-[var(--color-text-secondary)]">
            Klik peta untuk memindah
          </span>
          <div role="group" aria-labelledby="map-click-label" className="flex items-center gap-2">
            {targets.map((t) => {
              const active = clickTarget === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setClickTarget(t.value);
                    if (t.value === "observer") {
                      handleRequestGps();
                    }
                  }}
                  className={`inline-flex min-h-[44px] items-center gap-2 px-2 text-base decoration-2 underline-offset-8 transition-colors duration-150 active:text-[var(--color-primary-strong)] ${focusRing} ${
                    active
                      ? "font-semibold text-[var(--color-text-primary)] underline decoration-[var(--color-cta)]"
                      : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {t.glyph}
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="button"
          onClick={handleRequestGps}
          disabled={gpsStatus === "loading"}
          className={`inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3.5 text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] disabled:opacity-60 transition-colors duration-150 ${focusRing}`}
        >
          {gpsStatus === "loading" ? (
            <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin" aria-hidden="true" />
          ) : (
            <LocateFixed className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          )}
          <span>{gpsStatus === "loading" ? "Mencari GPS…" : "Gunakan GPS"}</span>
        </button>
      </div>

      {gpsMessage && (
        <p
          role={gpsStatus === "error" ? "alert" : "status"}
          className={`text-xs px-3.5 py-2 rounded-[14px] border ${
            gpsStatus === "error"
              ? "bg-[var(--color-surface-raised)] border-[var(--color-warning-strong)] text-[var(--color-warning-strong)]"
              : "bg-[var(--color-surface-raised)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
          }`}
        >
          {gpsMessage}
        </p>
      )}

      <DynamicLeafletMapCanvas
        epicenter={epicenter}
        observer={observer}
        radiusFeltIII={result.radiusFeltIII}
        radiusDamagingVI={result.radiusDamagingVI}
        clickTarget={clickTarget}
        onEpicenterMove={onEpicenterMove}
        onObserverMove={onObserverMove}
      />

      {/* Lingkaran sengaja tidak digambar bila M di luar rentang kalibrasi rumus. */}
      {isOutOfMagRange && (
        <div
          role="note"
          className="rounded-[16px] bg-[var(--color-surface-raised)] border border-[var(--color-warning-strong)] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[var(--color-warning-strong)]"
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Lingkaran radius tidak digambar karena magnitudo{" "}
            <strong className="tnum">M {input.magnitudo.toFixed(1).replace(".", ",")}</strong> berada di luar
            rentang kalibrasi rumus Allen, Wald &amp; Worden (2012) (Mw 5,0–7,9). Model tidak mengekstrapolasi
            secara paksa.
          </span>
        </div>
      )}

      {/* Ringkasan teks di luar peta: tetap terbaca oleh pembaca layar dan saat tile peta gagal dimuat. */}
      <div
        aria-label="Ringkasan teks peta dampak gempa"
        className="rounded-[20px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-5 sm:p-6 space-y-5"
      >
        <div className="grid grid-cols-2 gap-5">
          <RadiusStat
            label="Terasa"
            mmi="III"
            estimate={result.radiusFeltIII}
            swatchColor={intensityVar(mmiIntensityStep(3))}
          />
          <RadiusStat
            label="Merusak ringan"
            mmi="VI"
            estimate={result.radiusDamagingVI}
            swatchColor={intensityVar(mmiIntensityStep(6))}
          />
          {showsCalibrationEdge && (
            <p className="col-span-2 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span
                aria-hidden="true"
                className="inline-block w-3.5 h-3.5 shrink-0 rounded-full border border-dashed border-[var(--color-cta)]/60"
              />
              Garis putus-putus: batas kalibrasi 300 km
            </p>
          )}
        </div>

        <div className="pt-5 border-t border-[var(--color-border)] grid gap-4 sm:grid-cols-2">
          <div className="flex items-start gap-3 min-w-0">
            <span className="mt-0.5">
              <EpicenterGlyph />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">Pusat gempa</p>
              <p className="text-sm text-[var(--color-text-secondary)] tnum">
                {formatKoordinatId(epicenter.lat, epicenter.lon)}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 min-w-0">
            <span className="mt-0.5">
              <ObserverGlyph />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Anda, <span className="tnum">{distanceSync.formattedActualDistance}</span>{" "}
                <span className="font-normal text-[var(--color-text-secondary)]">dari pusat</span>
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] tnum">
                {formatKoordinatId(observer.lat, observer.lon)}
                {distanceSync.isBeyondCalibratedRange ? ", di luar kalibrasi 300 km" : ""}
              </p>
            </div>
          </div>
        </div>

        {/* Jalur keyboard untuk memindahkan titik "Anda" tanpa menyeret penanda di peta. */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span id="nudge-label" className="text-sm text-[var(--color-text-secondary)]">
            Geser titik Anda {KEYBOARD_STEP_KM} km
          </span>
          <div role="group" aria-labelledby="nudge-label" className="flex items-center gap-1">
            {nudges.map(({ label, icon: Icon, dLat, dLon }) => (
              <button
                key={label}
                type="button"
                aria-label={`Geser lokasi Anda ke ${label} ${KEYBOARD_STEP_KM} kilometer`}
                title={`Ke ${label}`}
                onClick={() => onObserverMove(nudgePointByKm(observer, dLat, dLon))}
                className={`inline-flex w-11 h-11 items-center justify-center rounded-full border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] active:bg-[var(--color-border-strong)] transition-colors duration-150 ${focusRing}`}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
