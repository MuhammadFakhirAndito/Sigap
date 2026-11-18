"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import {
  DEFAULT_SHELTER_MIN_MMI,
  sampleVibrationFrame,
  type VibrationFrameSample,
  type VibrationProfile,
} from "@/lib/simulasi-visual";
import { buildRoom, type RoomRig } from "./room/buildRoom";

export interface SceneSeekTarget {
  timeSec: number;
  seq: number;
}

interface ThreeRoomSceneProps {
  profile: VibrationProfile;
  isPlaying: boolean;
  /** Jeda menahan bingkai saat ini tanpa mengatur ulang waktu animasi. */
  isPaused?: boolean;
  playSessionKey: number;
  /** Setelah animasi selesai, tampilkan keadaan akhir (benda di lantai) alih-alih ruangan rapi. */
  showFinalState: boolean;
  cameraShakeEnabled?: boolean;
  playbackRate?: number;
  showCharacter?: boolean;
  minMmiForShelter?: number;
  seekTarget?: SceneSeekTarget | null;
  ariaLabel: string;
  onFrameUpdate: (elapsedSec: number, sample: VibrationFrameSample) => void;
  /** Dipanggil tiap bingkai saat diputar (tanpa setState), mis. untuk seismogram. */
  onSample?: (elapsedSec: number, sample: VibrationFrameSample) => void;
  onComplete: () => void;
  onWebglUnavailable: () => void;
}

const CAMERA_HOME = new THREE.Vector3(3.7, 2.75, 4.3);
const TARGET_HOME = new THREE.Vector3(-0.05, 0.85, -0.1);
const AUTO_RESET_AFTER_MS = 4000;
const UI_REPORT_INTERVAL_SEC = 0.05;

function checkWebglSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testCanvas = document.createElement("canvas");
    return Boolean(testCanvas.getContext("webgl2") || testCanvas.getContext("webgl"));
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && Boolean(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches);
}

interface LoopState {
  elapsed: number;
  sessionKey: number;
  completedKey: number;
  lastTs: number | null;
  lastUiReport: number;
  dirty: boolean;
  visible: boolean;
  interacting: boolean;
  lastInteraction: number;
  shakeX: number;
  shakeY: number;
}

export default function ThreeRoomScene({
  profile,
  isPlaying,
  isPaused = false,
  playSessionKey,
  showFinalState,
  cameraShakeEnabled = true,
  playbackRate = 1,
  showCharacter = true,
  minMmiForShelter = DEFAULT_SHELTER_MIN_MMI,
  seekTarget = null,
  ariaLabel,
  onFrameUpdate,
  onSample,
  onComplete,
  onWebglUnavailable,
}: ThreeRoomSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);

  // Nilai terbaru dibaca loop rAF lewat ref, sehingga loop tidak perlu dibuat ulang tiap render.
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const showFinalRef = useRef(showFinalState);
  showFinalRef.current = showFinalState;
  const onSampleRef = useRef(onSample);
  onSampleRef.current = onSample;
  const sessionKeyRef = useRef(playSessionKey);
  sessionKeyRef.current = playSessionKey;
  const shakeEnabledRef = useRef(cameraShakeEnabled);
  shakeEnabledRef.current = cameraShakeEnabled;
  const rateRef = useRef(playbackRate);
  rateRef.current = playbackRate;
  const showCharacterRef = useRef(showCharacter);
  showCharacterRef.current = showCharacter;
  const minMmiRef = useRef(minMmiForShelter);
  minMmiRef.current = minMmiForShelter;
  const onFrameUpdateRef = useRef(onFrameUpdate);
  onFrameUpdateRef.current = onFrameUpdate;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onWebglUnavailableRef = useRef(onWebglUnavailable);
  onWebglUnavailableRef.current = onWebglUnavailable;

  const rigRef = useRef<RoomRig | null>(null);
  const stateRef = useRef<LoopState | null>(null);
  const applyAtSecRef = useRef<((elapsedSec: number, idleClockSec?: number) => void) | null>(null);
  const lastSeekSeqRef = useRef(-1);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (!checkWebglSupport()) {
      onWebglUnavailableRef.current();
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "default" });
    } catch {
      onWebglUnavailableRef.current();
      return;
    }

    const initialWidth = Math.max(240, host.clientWidth || 640);
    const initialHeight = Math.max(200, host.clientHeight || 360);
    const isSmall = initialWidth < 640;

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(initialWidth, initialHeight, false);
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.shadowMap.enabled = true;
    // three 0.187 menghapus PCFSoftShadowMap; kelembutan diatur lewat shadow.radius.
    renderer.shadowMap.type = THREE.PCFShadowMap;
    const canvas = renderer.domElement;
    canvas.style.display = "block";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.setAttribute("aria-hidden", "true");
    host.appendChild(canvas);

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(isSmall ? 46 : 36, initialWidth / initialHeight, 0.1, 40);
    camera.position.copy(CAMERA_HOME);

    // Pencahayaan: langit hangat + cahaya utama berbayangan lembut.
    scene.add(new THREE.HemisphereLight("#FFF3E2", "#B5967A", 1.25));
    const sun = new THREE.DirectionalLight("#FFE4C2", 2.4);
    sun.position.set(2.6, 4.8, 3.2);
    sun.castShadow = true;
    sun.shadow.mapSize.set(isSmall ? 1024 : 2048, isSmall ? 1024 : 2048);
    sun.shadow.radius = 4;
    sun.shadow.bias = -0.0004;
    sun.shadow.normalBias = 0.02;
    const shadowCam = sun.shadow.camera;
    shadowCam.left = -2.6;
    shadowCam.right = 2.6;
    shadowCam.top = 2.6;
    shadowCam.bottom = -2.6;
    shadowCam.near = 0.5;
    shadowCam.far = 12;
    scene.add(sun);

    const rig = buildRoom(scene);
    rig.setCharacterVisible(showCharacterRef.current);
    rigRef.current = rig;

    const controls = new OrbitControls(camera, canvas);
    controls.target.copy(TARGET_HOME);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.minDistance = 4.2;
    controls.maxDistance = 8;
    controls.minPolarAngle = 0.55;
    controls.maxPolarAngle = 1.32;
    // Sudut horizontal dibatasi agar sisi terbuka diorama selalu menghadap kamera.
    const homeAzimuth = Math.atan2(CAMERA_HOME.x - TARGET_HOME.x, CAMERA_HOME.z - TARGET_HOME.z);
    controls.minAzimuthAngle = homeAzimuth - 0.6;
    controls.maxAzimuthAngle = homeAzimuth + 0.55;
    controls.update();
    // OrbitControls memasang touch-action: none; kembalikan gulir vertikal halaman di ponsel.
    canvas.style.touchAction = "pan-y";

    const state: LoopState = {
      elapsed: 0,
      sessionKey: -1,
      completedKey: -1,
      lastTs: null,
      lastUiReport: -1,
      dirty: true,
      visible: true,
      interacting: false,
      lastInteraction: 0,
      shakeX: 0,
      shakeY: 0,
    };
    stateRef.current = state;

    applyAtSecRef.current = (elapsedSec, idleClockSec = 0) => {
      const currentProfile = profileRef.current;
      const sample = sampleVibrationFrame(elapsedSec, currentProfile);
      rig.setCharacterVisible(showCharacterRef.current);
      rig.apply(sample, elapsedSec, currentProfile, {
        minMmiForShelter: minMmiRef.current,
        idleClockSec,
      });
      state.elapsed = elapsedSec;
      state.shakeX = 0;
      state.shakeY = 0;
      state.dirty = true;
    };
    applyAtSecRef.current(0, 0);

    controls.addEventListener("start", () => {
      state.interacting = true;
    });
    controls.addEventListener("end", () => {
      state.interacting = false;
      state.lastInteraction = performance.now();
    });
    controls.addEventListener("change", () => {
      state.dirty = true;
    });

    const render = () => {
      // Getaran kamera ditambahkan sementara saat render agar tidak mengganggu OrbitControls.
      const hasShake = state.shakeX !== 0 || state.shakeY !== 0;
      if (hasShake) {
        camera.position.x += state.shakeX;
        camera.position.y += state.shakeY;
      }
      renderer.render(scene, camera);
      if (hasShake) {
        camera.position.x -= state.shakeX;
        camera.position.y -= state.shakeY;
      }
      state.dirty = false;
    };

    let rafId = 0;
    const tick = (now: number) => {
      rafId = requestAnimationFrame(tick);
      if (document.hidden || !state.visible) {
        state.lastTs = null;
        return;
      }
      const dt = state.lastTs === null ? 0 : Math.min(0.1, (now - state.lastTs) / 1000);
      state.lastTs = now;

      if (isPlayingRef.current && !isPausedRef.current) {
        if (state.sessionKey !== sessionKeyRef.current) {
          state.sessionKey = sessionKeyRef.current;
          state.elapsed = 0;
          state.lastUiReport = -1;
        }
        state.elapsed += dt * rateRef.current;
        const currentProfile = profileRef.current;
        const sample = sampleVibrationFrame(state.elapsed, currentProfile);
        rig.setCharacterVisible(showCharacterRef.current);
        rig.apply(sample, state.elapsed, currentProfile, {
          minMmiForShelter: minMmiRef.current,
          idleClockSec: now / 1000,
          dtSec: dt,
        });
        const shakeOn = shakeEnabledRef.current && !prefersReducedMotion();
        state.shakeX = shakeOn ? sample.cameraShakeX : 0;
        state.shakeY = shakeOn ? sample.cameraShakeY : 0;
        state.dirty = true;
        onSampleRef.current?.(state.elapsed, sample);

        const finished = sample.phase === "done";
        if (finished || state.elapsed - state.lastUiReport >= UI_REPORT_INTERVAL_SEC) {
          state.lastUiReport = state.elapsed;
          onFrameUpdateRef.current(Math.min(state.elapsed, currentProfile.durationSec), sample);
        }
        if (finished && state.completedKey !== state.sessionKey) {
          state.completedKey = state.sessionKey;
          onCompleteRef.current();
        }
      } else if (!isPlayingRef.current && !showFinalRef.current && state.elapsed <= 0.001 && showCharacterRef.current && !prefersReducedMotion()) {
        // Napas & lirikan halus karakter saat ruangan menunggu gempa dimulai
        const currentProfile = profileRef.current;
        const sample = sampleVibrationFrame(0, currentProfile);
        rig.apply(sample, 0, currentProfile, {
          minMmiForShelter: minMmiRef.current,
          idleClockSec: now / 1000,
          dtSec: dt,
        });
        state.dirty = true;
      }

      if (isPausedRef.current && (state.shakeX !== 0 || state.shakeY !== 0)) {
        state.shakeX = 0;
        state.shakeY = 0;
        state.dirty = true;
      }

      // Kamera kembali pelan ke posisi awal setelah pengguna berhenti memutar.
      if (
        !state.interacting &&
        now - state.lastInteraction > AUTO_RESET_AFTER_MS &&
        (camera.position.distanceToSquared(CAMERA_HOME) > 1e-4 || controls.target.distanceToSquared(TARGET_HOME) > 1e-4)
      ) {
        const k = prefersReducedMotion() ? 1 : 0.05;
        camera.position.lerp(CAMERA_HOME, k);
        controls.target.lerp(TARGET_HOME, k);
        state.dirty = true;
      }

      if (controls.update()) state.dirty = true;
      if (state.dirty) render();
    };
    rafId = requestAnimationFrame(tick);

    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        state.visible = Boolean(entries[0]?.isIntersecting);
        if (state.visible) state.dirty = true;
      },
      { threshold: 0.05 }
    );
    visibilityObserver.observe(host);

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(240, Math.round(entry.contentRect.width));
      const h = Math.max(200, Math.round(entry.contentRect.height));
      camera.aspect = w / h;
      camera.fov = w < 640 ? 46 : 36;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      state.dirty = true;
    });
    resizeObserver.observe(host);

    return () => {
      cancelAnimationFrame(rafId);
      visibilityObserver.disconnect();
      resizeObserver.disconnect();
      controls.dispose();
      rig.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      stateRef.current = null;
      rigRef.current = null;
      applyAtSecRef.current = null;
      if (canvas.parentNode === host) host.removeChild(canvas);
    };
  }, []);

  // Perbarui visibilitas karakter / ambang MMI segera tanpa membuat ulang konteks WebGL.
  useEffect(() => {
    if (!applyAtSecRef.current || !stateRef.current) return;
    if (isPlaying && !isPaused) {
      rigRef.current?.setCharacterVisible(showCharacter);
      return;
    }
    const targetSec = showFinalState ? profile.durationSec + 1 : stateRef.current.elapsed;
    applyAtSecRef.current(targetSec, 0);
  }, [showCharacter, minMmiForShelter, isPlaying, isPaused, showFinalState, profile]);

  // Scrubbing lini waktu deterministik (maju maupun mundur).
  useEffect(() => {
    if (!seekTarget || seekTarget.seq === lastSeekSeqRef.current) return;
    lastSeekSeqRef.current = seekTarget.seq;
    if (!applyAtSecRef.current || !stateRef.current) return;
    const state = stateRef.current;
    state.sessionKey = playSessionKey;
    if (seekTarget.timeSec < profile.durationSec) {
      state.completedKey = -1;
    }
    state.lastUiReport = seekTarget.timeSec;
    applyAtSecRef.current(seekTarget.timeSec, 0);
  }, [seekTarget, playSessionKey, profile]);

  // Saat tidak diputar: ruangan rapi (awal/berhenti) atau keadaan akhir (setelah selesai).
  useEffect(() => {
    if (isPlaying || !applyAtSecRef.current) return;
    const restSec = showFinalState ? profile.durationSec + 1 : 0;
    applyAtSecRef.current(restSec, 0);
  }, [isPlaying, showFinalState, profile]);

  return (
    <div
      ref={hostRef}
      role="img"
      aria-label={ariaLabel}
      className="w-full h-[320px] sm:h-[420px] rounded-[20px] overflow-hidden border border-[var(--color-border)] bg-[var(--color-surface)] cursor-grab active:cursor-grabbing"
    />
  );
}
