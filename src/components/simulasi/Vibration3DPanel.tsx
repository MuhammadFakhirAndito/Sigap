"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { AlertTriangle, ArrowDown, Info, Pause, Play, RotateCcw } from "lucide-react";
import { formatIdNumber, type SimulasiResult } from "@/lib/simulasi";
import {
  CHARACTER_PHASE_META,
  DEFAULT_SHELTER_MIN_MMI,
  getVibrationProfileForMmi,
  intensityVar,
  mmiIntensityStep,
  sampleCharacterState,
  sampleVibrationFrame,
  type CharacterActionPhase,
  type VibrationPhase,
  type VibrationProfile,
} from "@/lib/simulasi-visual";
import type { SceneSeekTarget } from "./ThreeRoomScene";

const DynamicThreeRoomScene = dynamic(() => import("./ThreeRoomScene"), {
  ssr: false,
  loading: () => (
    <div
      aria-busy="true"
      aria-label="Memuat visualisasi ruangan 3D"
      className="w-full h-[320px] sm:h-[420px] rounded-[20px] border border-[var(--color-border)] bg-[var(--color-surface-sunken)] animate-pulse flex items-center justify-center text-xs font-medium text-[var(--color-text-secondary)]"
    >
      Memuat adegan 3D…
    </div>
  ),
});

interface Vibration3DPanelProps {
  result: SimulasiResult;
}

type PlayStatus = "idle" | "playing" | "paused" | "done";

/** Jeda setelah parameter berhenti berubah sebelum animasi diputar otomatis. */
const AUTOPLAY_DEBOUNCE_MS = 600;
/** MMI mulai tingkat ini menampilkan tautan ke rekomendasi keselamatan. */
const SAFETY_LINK_MIN_MMI = 6;

const PHASE_LABEL: Record<VibrationPhase, string> = {
  idle: "Siap diputar",
  p_wave: "Gelombang P tiba",
  gap: "Jeda menuju gelombang S",
  s_wave: "Gelombang S: guncangan utama",
  decay: "Guncangan mereda",
  done: "Selesai",
};

const fmt1 = (n: number) => formatIdNumber(n, 1);

/** Seismogram tipis yang digambar langsung ke canvas tiap bingkai, tanpa re-render React. */
function useSeismogram(profile: VibrationProfile) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointsRef = useRef<{ t: number; v: number }[]>([]);
  const profileRef = useRef(profile);
  profileRef.current = profile;

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const css = getComputedStyle(canvas);
    const ink = css.getPropertyValue("--color-text-primary").trim() || "#1A1613";
    const faint = css.getPropertyValue("--color-border").trim() || "#C4BDB4";
    const { durationSec, sStartSec } = profileRef.current.timeline;
    const mid = h / 2;

    ctx.strokeStyle = faint;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, mid);
    ctx.lineTo(w, mid);
    const sx = (sStartSec / durationSec) * w;
    ctx.moveTo(sx, 4);
    ctx.lineTo(sx, h - 4);
    ctx.stroke();

    const pts = pointsRef.current;
    if (pts.length < 2) return;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = (p.t / durationSec) * w;
      const y = mid - p.v * mid * 0.85;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, []);

  const push = useCallback(
    (t: number, v: number) => {
      pointsRef.current.push({ t, v });
      draw();
    },
    [draw]
  );

  const clear = useCallback(() => {
    pointsRef.current = [];
    draw();
  }, [draw]);

  const seedUpTo = useCallback(
    (targetSec: number) => {
      const p = profileRef.current;
      const pts: { t: number; v: number }[] = [];
      const clamped = Math.max(0, Math.min(targetSec, p.durationSec));
      for (let t = 0; t <= clamped; t += 0.05) {
        pts.push({ t, v: sampleVibrationFrame(t, p).seismo });
      }
      pointsRef.current = pts;
      draw();
    },
    [draw]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const observer = new ResizeObserver(() => draw());
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [draw]);

  return { canvasRef, push, clear, seedUpTo };
}

export function Vibration3DPanel({ result }: Vibration3DPanelProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [status, setStatus] = useState<PlayStatus>("idle");
  const [playSessionKey, setPlaySessionKey] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [phase, setPhase] = useState<VibrationPhase>("idle");
  const [slowMotion, setSlowMotion] = useState(false);
  const [cameraShake, setCameraShake] = useState(true);
  const [showCharacter, setShowCharacter] = useState(true);
  const [seekTarget, setSeekTarget] = useState<SceneSeekTarget | null>(null);
  const seekSeqRef = useRef(0);
  const [webglUnavailable, setWebglUnavailable] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener?.("change", update);
    return () => media.removeEventListener?.("change", update);
  }, []);

  const level = result.mmi.clampedLevel;
  const profile = useMemo(
    () =>
      getVibrationProfileForMmi(level, {
        reducedMotion,
        tpSeconds: result.tpSeconds,
        tsSeconds: result.tsSeconds,
      }),
    [level, result.tpSeconds, result.tsSeconds, reducedMotion]
  );
  const { timeline, durationSec } = profile;
  const seismogram = useSeismogram(profile);
  const minMmiForShelter = DEFAULT_SHELTER_MIN_MMI;

  const start = useCallback(() => {
    seismogram.clear();
    setSeekTarget(null);
    setElapsedSec(0);
    setPhase("p_wave");
    setPlaySessionKey((k) => k + 1);
    setStatus("playing");
  }, [seismogram]);

  const handleScrub = useCallback(
    (rawSec: number) => {
      const clamped = Math.max(0, Math.min(durationSec, rawSec));
      const frameSample = sampleVibrationFrame(clamped, profile);
      seekSeqRef.current += 1;
      setSeekTarget({ timeSec: clamped, seq: seekSeqRef.current });
      setElapsedSec(clamped);
      setPhase(frameSample.phase);
      seismogram.seedUpTo(clamped);
      if (clamped >= durationSec) {
        setStatus("done");
      } else {
        setStatus("paused");
      }
    },
    [durationSec, profile, seismogram]
  );

  // Saat parameter berubah: ruangan langsung kembali tenang, lalu diputar sekali setelah
  // parameter diam AUTOPLAY_DEBOUNCE_MS. Ini juga memutar animasi saat tab 3D pertama dibuka.
  const profileKey = `${level}|${fmt1(timeline.compressedGapSec)}|${reducedMotion}`;
  useEffect(() => {
    setStatus("idle");
    setElapsedSec(0);
    setPhase("idle");
    setSeekTarget(null);
    seismogram.clear();
    if (reducedMotion || webglUnavailable) return;
    const timer = window.setTimeout(start, AUTOPLAY_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
    // seismogram dan start stabil (useCallback); efek hanya bergantung pada kunci parameter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileKey, webglUnavailable]);

  const togglePause = () => {
    setStatus((s) => (s === "playing" ? "paused" : s === "paused" ? "playing" : s));
  };

  const currentSample = useMemo(() => {
    const querySec = status === "idle" ? 0 : status === "done" ? durationSec + 1 : elapsedSec;
    return sampleVibrationFrame(querySec, profile);
  }, [status, durationSec, elapsedSec, profile]);

  const characterState = useMemo(() => {
    const querySec = status === "idle" ? 0 : status === "done" ? durationSec + 1 : elapsedSec;
    return sampleCharacterState(querySec, currentSample, profile, { minMmiForShelter });
  }, [status, durationSec, elapsedSec, currentSample, profile, minMmiForShelter]);

  const characterMeta = CHARACTER_PHASE_META[characterState.actionPhase];
  const shelterSteps: { key: CharacterActionPhase; title: string }[] = [
    { key: "DROP", title: "1. Drop (Merunduk)" },
    { key: "COVER", title: "2. Cover (Berlindung)" },
    { key: "HOLD_ON", title: "3. Hold On (Berpegangan)" },
  ];

  const intensityColor = intensityVar(mmiIntensityStep(level));
  const shakeAllowed = !reducedMotion;
  const playheadPct = Math.min(100, (elapsedSec / durationSec) * 100);
  const pct = (sec: number) => `${(sec / durationSec) * 100}%`;

  const btnBase =
    "inline-flex items-center justify-center gap-1 xl:gap-1.5 whitespace-nowrap min-h-[44px] rounded-full px-2.5 xl:px-3 text-[11px] xl:text-xs font-semibold transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)] disabled:cursor-not-allowed disabled:opacity-50";
  const btnOutline = `${btnBase} border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] enabled:hover:bg-[var(--color-surface)] enabled:active:bg-[var(--color-surface-sunken)]`;
  const toggleCls = (on: boolean) =>
    `${btnBase} border ${
      on
        ? "border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] enabled:hover:bg-[var(--color-surface)]"
        : "border-[var(--color-border)] bg-transparent text-[var(--color-text-secondary)] enabled:hover:bg-[var(--color-surface-raised)]"
    }`;
  const toggleDot = (on: boolean) =>
    `h-2 w-2 shrink-0 rounded-full ${on ? "bg-[var(--color-primary)]" : "bg-[var(--color-border)]"}`;

  return (
    <section
      id="panel-mode-3d"
      role="tabpanel"
      aria-labelledby="tab-mode-3d"
      className="p-4 sm:p-6 space-y-4"
    >
      <div className="space-y-3">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Ilustrasi edukasi (bukan simulasi kekuatan bangunan)
          </p>
          <p className="text-xs font-medium text-[var(--color-warning-strong)] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Tekan Jeda jika kurang nyaman</span>
          </p>
        </div>

        <div
          role="group"
          aria-label="Kontrol animasi getaran"
          className="flex flex-wrap min-[1140px]:flex-nowrap items-center gap-1.5"
        >
          <button
            type="button"
            disabled={webglUnavailable}
            onClick={start}
            className={`${btnBase} bg-[var(--color-cta)] text-[var(--color-on-cta)] enabled:hover:bg-[var(--color-border-strong)]`}
          >
            {status === "idle" ? (
              <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <RotateCcw className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{status === "idle" ? "Mulai gempa" : "Putar ulang"}</span>
          </button>

          <button
            type="button"
            disabled={webglUnavailable || status === "idle" || status === "done"}
            onClick={togglePause}
            className={btnOutline}
          >
            {status === "paused" ? (
              <Play className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            ) : (
              <Pause className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            )}
            <span>{status === "paused" ? "Lanjutkan" : "Jeda"}</span>
          </button>

          <button
            type="button"
            aria-pressed={slowMotion}
            disabled={webglUnavailable}
            onClick={() => setSlowMotion((v) => !v)}
            className={toggleCls(slowMotion)}
          >
            <span aria-hidden="true" className={toggleDot(slowMotion)} />
            <span className="tnum">Lambat 0,25×</span>
          </button>

          <button
            type="button"
            aria-pressed={shakeAllowed && cameraShake}
            disabled={webglUnavailable || !shakeAllowed}
            title={shakeAllowed ? undefined : "Nonaktif karena mode gerakan dikurangi"}
            onClick={() => setCameraShake((v) => !v)}
            className={`${toggleCls(shakeAllowed && cameraShake)} min-[1140px]:ml-auto`}
          >
            <span aria-hidden="true" className={toggleDot(shakeAllowed && cameraShake)} />
            <span>Getaran kamera</span>
          </button>

          <button
            type="button"
            aria-pressed={showCharacter}
            disabled={webglUnavailable}
            title="Peragaan berlindung di bawah meja untuk melindungi kepala dari benda jatuh (jangan lari keluar saat guncangan)"
            onClick={() => setShowCharacter((v) => !v)}
            className={toggleCls(showCharacter)}
          >
            <span aria-hidden="true" className={toggleDot(showCharacter)} />
            <span>Tampilkan karakter</span>
          </button>
        </div>
      </div>

      {reducedMotion && (
        <div
          role="note"
          className="rounded-[16px] bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3.5 py-2.5 flex items-start gap-2 text-xs text-[var(--color-text-primary)]"
        >
          <Info className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            {profile.reducedMotionNotice} Animasi tidak diputar otomatis dan getaran kamera dimatikan; tekan
            &ldquo;Mulai gempa&rdquo; untuk memutar versi lembut.
          </span>
        </div>
      )}

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
            Perangkat atau mode peramban Anda tidak mengaktifkan akselerasi WebGL. Anda tetap dapat membaca estimasi
            intensitas MMI, jeda gelombang P ke S, serta rincian dampak resmi BMKG di bawah ini.
          </p>
        </div>
      ) : (
        <div className="relative">
          <DynamicThreeRoomScene
            profile={profile}
            isPlaying={status === "playing" || status === "paused"}
            isPaused={status === "paused"}
            playSessionKey={playSessionKey}
            showFinalState={status === "done"}
            cameraShakeEnabled={shakeAllowed && cameraShake}
            playbackRate={slowMotion ? 0.25 : 1}
            showCharacter={showCharacter}
            minMmiForShelter={minMmiForShelter}
            seekTarget={seekTarget}
            ariaLabel={`Ilustrasi ruangan 3D untuk MMI ${profile.roman} (${profile.bmkgLabel}): ${profile.illustrativeEffectDescription}`}
            onFrameUpdate={(sec, sample) => {
              setElapsedSec(sec);
              setPhase(sample.phase);
            }}
            onSample={(sec, sample) => seismogram.push(sec, sample.seismo)}
            onComplete={() => {
              setStatus("done");
              setElapsedSec(durationSec);
              setPhase("done");
            }}
            onWebglUnavailable={() => {
              setStatus("idle");
              setWebglUnavailable(true);
            }}
          />

          {/* HUD: tidak menangkap pointer agar kamera tetap bisa diputar. */}
          <div className="pointer-events-none absolute inset-x-2.5 sm:inset-x-3 top-2.5 sm:top-3 flex flex-wrap items-start justify-between gap-1.5 sm:gap-2">
            <p className="flex items-baseline gap-1.5 sm:gap-2 rounded-[12px] sm:rounded-[14px] bg-[var(--color-surface-raised)]/90 px-2.5 sm:px-3 py-1 sm:py-1.5">
              <span className="text-[11px] sm:text-xs font-medium text-[var(--color-text-secondary)]">MMI</span>
              <span className="text-xl sm:text-2xl font-semibold leading-none tnum" style={{ color: intensityColor }}>
                {profile.roman}
              </span>
              <span className="text-xs sm:text-sm font-semibold text-[var(--color-text-primary)]">{profile.bmkgLabel}</span>
            </p>
            <div className="flex flex-col items-end gap-1 ml-auto max-w-full">
              <p className="rounded-full bg-[var(--color-surface-raised)]/90 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs font-medium text-[var(--color-text-primary)] text-right">
                <span aria-live="polite">{PHASE_LABEL[phase]}</span>
                <span className="ml-1.5 sm:ml-2 tnum text-[var(--color-text-secondary)]">
                  {fmt1(elapsedSec)} / {fmt1(durationSec)} dtk
                </span>
              </p>
              {showCharacter && (
                <p className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)]/95 px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-semibold text-[var(--color-text-primary)]">
                  <span
                    aria-hidden="true"
                    className={`h-2 w-2 rounded-full ${
                      characterState.sheltering
                        ? "bg-[var(--color-primary-strong)]"
                        : characterState.actionPhase === "DROP" || characterState.actionPhase === "ALERT"
                          ? "bg-[var(--color-warning-strong)]"
                          : "bg-[var(--color-border-strong)]"
                    }`}
                  />
                  <span aria-live="polite">{characterMeta.badge}</span>
                </p>
              )}
            </div>
          </div>

          <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-[12px] bg-[var(--color-surface-raised)]/85 px-2 py-1">
            <span className="sr-only">Seismogram ilustratif guncangan tanah</span>
            <canvas ref={seismogram.canvasRef} aria-hidden="true" className="block h-10 w-full" />
          </div>
        </div>
      )}

      <div className="rounded-[20px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4 space-y-3.5">
        <div className="space-y-1">
          <div className="relative h-11 flex items-center">
            <div
              aria-hidden="true"
              className="relative h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-sunken)]"
            >
              <span
                className="absolute inset-y-0 bg-[var(--color-border-strong)]"
                style={{ left: 0, width: pct(timeline.pEndSec) }}
              />
              <span
                className="absolute inset-y-0"
                style={{
                  left: pct(timeline.sStartSec),
                  width: pct(timeline.sEndSec - timeline.sStartSec),
                  backgroundColor: intensityColor,
                }}
              />
              <span
                className="absolute inset-y-0 opacity-40"
                style={{
                  left: pct(timeline.sEndSec),
                  right: 0,
                  backgroundColor: intensityColor,
                }}
              />
              <span
                className="absolute -inset-y-0.5 w-1.5 -translate-x-1/2 rounded-full bg-[var(--color-cta)]"
                style={{ left: `${playheadPct}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={durationSec}
              step={0.05}
              value={Math.min(elapsedSec, durationSec)}
              disabled={webglUnavailable}
              onChange={(e) => handleScrub(Number(e.target.value))}
              aria-label="Geser posisi waktu animasi gempa dan karakter"
              aria-valuetext={`${fmt1(elapsedSec)} dari ${fmt1(durationSec)} detik, ${PHASE_LABEL[phase]}`}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
          </div>
          <div aria-hidden="true" className="relative h-4 text-xs font-semibold text-[var(--color-text-primary)]">
            <span className="absolute left-0">P</span>
            <span className="absolute -translate-x-1/2" style={{ left: pct(timeline.sStartSec) }}>
              S
            </span>
            <span className="absolute right-0 font-medium text-[var(--color-text-secondary)]">mereda</span>
          </div>
          <p className="text-[11px] text-[var(--color-text-secondary)] tnum">
            Waktu nyata: P {fmt1(profile.real.tpSeconds)} dtk · S {fmt1(profile.real.tsSeconds)} dtk · Golden time{" "}
            {fmt1(profile.real.goldenTimeSeconds)} dtk
          </p>
        </div>

        {showCharacter && !webglUnavailable && (
          <div
            aria-label="Langkah Drop, Cover, Hold On"
            className="border-t border-[var(--color-border)] pt-3 flex flex-wrap items-center gap-1.5 text-xs"
          >
            {shelterSteps.map((step, idx) => {
              const active = characterState.actionPhase === step.key;
              return (
                <React.Fragment key={step.key}>
                  {idx > 0 && (
                    <span aria-hidden="true" className="text-[var(--color-text-secondary)]">
                      →
                    </span>
                  )}
                  <span
                    className={`whitespace-nowrap rounded-md px-2.5 py-1 font-semibold transition-colors ${
                      active
                        ? "bg-[var(--color-primary-strong)] text-[var(--color-on-cta)]"
                        : "text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {step.title}
                  </span>
                </React.Fragment>
              );
            })}
          </div>
        )}

        <p className="border-t border-[var(--color-border)] pt-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          <strong className="font-semibold text-[var(--color-text-primary)]">
            Skala MMI {profile.roman} (BMKG):
          </strong>{" "}
          {profile.bmkgQuote}
        </p>

        {level >= SAFETY_LINK_MIN_MMI && (
          <a
            href="#rekomendasi-keselamatan"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-semibold text-[var(--color-text-primary)] underline decoration-2 underline-offset-4 hover:decoration-[var(--color-primary)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
          >
            <ArrowDown className="w-4 h-4 shrink-0" aria-hidden="true" />
            Lihat yang harus dilakukan
          </a>
        )}
      </div>
    </section>
  );
}
