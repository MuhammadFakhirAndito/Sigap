"use client";

import React, { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, Info, Play, Square } from "lucide-react";
import { formatIdNumber, type SimulasiResult } from "@/lib/simulasi";
import {
  ANIMATION_TOTAL_DURATION_SEC,
  getVibrationProfileForMmi,
  type VibrationFrameSample,
} from "@/lib/simulasi-visual";

const DynamicThreeRoomScene = dynamic(() => import("./ThreeRoomScene"), {
  ssr: false,
  loading: () => (
    <div
      aria-busy="true"
      aria-label="Memuat visualisasi ruangan 3D"
      className="w-full h-[300px] sm:h-[360px] rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] animate-pulse flex items-center justify-center text-xs font-medium text-[var(--color-text-secondary)]"
    >
      Memuat adegan 3D…
    </div>
  ),
});

interface Vibration3DPanelProps {
  result: SimulasiResult;
}

function getPhaseLabel(phase: VibrationFrameSample["phase"]): string {
  switch (phase) {
    case "p_wave":
      return "Gelombang Primer (P) — awal ringan";
    case "s_wave":
      return "Gelombang Sekunder (S) — guncangan utama";
    case "decay":
      return "Guncangan mereda";
    case "done":
      return "Selesai";
    default:
      return "Siap diputar";
  }
}

export function Vibration3DPanel({ result }: Vibration3DPanelProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playSessionKey, setPlaySessionKey] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [phase, setPhase] = useState<VibrationFrameSample["phase"]>("idle");
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const profile = useMemo(
    () =>
      getVibrationProfileForMmi(result.mmi.clampedLevel, {
        reducedMotion,
      }),
    [result.mmi.clampedLevel, reducedMotion]
  );

  // Bila tingkat MMI berubah saat memutar atau selesai, hentikan pemutaran agar sinkron & nyaman
  useEffect(() => {
    setIsPlaying(false);
    setElapsedSec(0);
    setPhase("idle");
  }, [result.mmi.clampedLevel]);

  const handleStart = () => {
    setElapsedSec(0);
    setPhase("p_wave");
    setPlaySessionKey((k) => k + 1);
    setIsPlaying(true);
  };

  const handleStop = () => {
    setIsPlaying(false);
    setElapsedSec(0);
    setPhase("idle");
  };

  const progressPct = Math.min(
    100,
    Math.round((elapsedSec / ANIMATION_TOTAL_DURATION_SEC) * 100)
  );

  return (
    <section
      id="panel-mode-3d"
      role="tabpanel"
      aria-labelledby="tab-mode-3d"
      className="bg-[var(--color-surface)] rounded-[28px] p-5 sm:p-6 space-y-5"
    >
      {/* Header kontrol Putar / Berhenti + label peringatan wajib */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            Ilustrasi getaran, bukan simulasi kekuatan bangunan
          </p>
          <p className="text-xs font-medium text-[var(--color-warning-strong)] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Animasi getaran. Hentikan jika tidak nyaman.</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={webglUnavailable || isPlaying}
            onClick={handleStart}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-4 text-xs font-semibold transition-colors duration-150 hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>
              {phase === "done" ? "Putar ulang getaran" : "Mulai getaran"}
            </span>
          </button>

          <button
            type="button"
            disabled={webglUnavailable || (!isPlaying && phase === "idle")}
            onClick={handleStop}
            className="inline-flex items-center justify-center gap-2 min-h-[44px] rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] px-4 text-xs font-semibold transition-colors duration-150 hover:bg-[var(--color-background)] disabled:opacity-50"
          >
            <Square className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Berhenti</span>
          </button>
        </div>
      </div>

      {/* Pemberitahuan prefers-reduced-motion bila aktif */}
      {profile.reducedMotion && profile.reducedMotionNotice && (
        <div
          role="note"
          className="rounded-[16px] bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[var(--color-text-primary)]"
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{profile.reducedMotionNotice}</span>
        </div>
      )}

      {/* Area kanvas Three.js ATAU fallback bersih jika WebGL tidak tersedia */}
      {webglUnavailable ? (
        <div
          role="region"
          aria-label="Fallback visualisasi getaran tanpa WebGL"
          className="rounded-[20px] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 sm:p-6 space-y-3"
        >
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Visualisasi 3D (WebGL) tidak tersedia di peramban ini
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Perangkat atau mode peramban Anda tidak mengaktifkan akselerasi WebGL. Anda tetap dapat membaca estimasi intensitas MMI, jeda gelombang P ke S, serta rincian dampak resmi BMKG di bawah ini.
          </p>
        </div>
      ) : (
        <DynamicThreeRoomScene
          profile={profile}
          isPlaying={isPlaying}
          playSessionKey={playSessionKey}
          onFrameUpdate={(sec, sample) => {
            setElapsedSec(sec);
            setPhase(sample.phase);
          }}
          onComplete={() => {
            setIsPlaying(false);
            setElapsedSec(ANIMATION_TOTAL_DURATION_SEC);
            setPhase("done");
          }}
          onWebglUnavailable={() => {
            setIsPlaying(false);
            setWebglUnavailable(true);
          }}
        />
      )}

      {/* Status fase & progres ~12 detik + jeda gelombang P ke S aktual */}
      <div className="rounded-[18px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-semibold text-[var(--color-text-primary)]">
            Fase animasi: {getPhaseLabel(phase)}
          </span>
          <span className="tnum font-semibold text-[var(--color-text-secondary)]">
            {formatIdNumber(elapsedSec, 1)} / {formatIdNumber(ANIMATION_TOTAL_DURATION_SEC, 1)} detik
          </span>
        </div>

        <div
          role="progressbar"
          aria-label="Progres pemutaran simulasi getaran 12 detik"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progressPct}
          className="h-2 w-full rounded-full bg-[var(--color-surface-sunken)] overflow-hidden"
        >
          <div
            className="h-full w-full origin-left rounded-full bg-[var(--color-cta)] transition-transform duration-75"
            style={{ transform: `scaleX(${progressPct / 100})` }}
          />
        </div>

        <p className="tnum text-xs font-medium text-[var(--color-text-primary)]">
          Jeda gelombang P ke S di jarak ini: ±{" "}
          {formatIdNumber(result.goldenTimeSeconds, 1)} detik
        </p>
      </div>

      {/* Deskripsi terstruktur memisahkan kutipan BMKG vs efek ilustratif SIGAP */}
      <div
        aria-label="Penjelasan dampak BMKG dan ilustrasi adegan 3D"
        className="grid grid-cols-1 md:grid-cols-2 gap-3"
      >
        <div className="rounded-[18px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4 space-y-1.5">
          <span className="block text-xs font-semibold text-[var(--color-text-secondary)]">
            Deskripsi dampak (Sumber: Skala MMI BMKG)
          </span>
          <p className="text-sm font-semibold text-[var(--color-text-primary)] tnum">
            MMI {profile.roman}: {profile.bmkgLabel}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            &ldquo;{profile.bmkgQuote}&rdquo;
          </p>
        </div>

        <div className="rounded-[18px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4 space-y-1.5">
          <span className="block text-xs font-semibold text-[var(--color-text-secondary)]">
            Efek animasi 3D (Ilustrasi SIGAP)
          </span>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            {profile.illustrativeEffectTitle}
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {profile.illustrativeEffectDescription} Catatan: gerak lampu, gelas, dan benda di rak adalah pilihan visual ilustratif SIGAP untuk membedakan tingkat guncangan, bukan teks resmi BMKG maupun perhitungan struktur bangunan.
          </p>
        </div>
      </div>
    </section>
  );
}
