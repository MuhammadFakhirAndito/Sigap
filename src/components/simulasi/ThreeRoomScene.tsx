"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  sampleVibrationFrame,
  type VibrationFrameSample,
  type VibrationProfile,
} from "@/lib/simulasi-visual";

interface ThreeRoomSceneProps {
  profile: VibrationProfile;
  isPlaying: boolean;
  playSessionKey: number;
  onFrameUpdate: (elapsedSec: number, sample: VibrationFrameSample) => void;
  onComplete: () => void;
  onWebglUnavailable: () => void;
}

function checkWebglSupport(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const testCanvas = document.createElement("canvas");
    const gl =
      testCanvas.getContext("webgl2", { failIfMajorPerformanceCaveat: false }) ||
      testCanvas.getContext("webgl", { failIfMajorPerformanceCaveat: false }) ||
      testCanvas.getContext("experimental-webgl");
    return Boolean(gl);
  } catch {
    return false;
  }
}

function disposeSceneResources(root: THREE.Object3D): void {
  root.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.geometry.dispose();
      if (Array.isArray(obj.material)) {
        for (const mat of obj.material) {
          mat.dispose();
        }
      } else {
        obj.material.dispose();
      }
    }
  });
}

export default function ThreeRoomScene({
  profile,
  isPlaying,
  playSessionKey,
  onFrameUpdate,
  onComplete,
  onWebglUnavailable,
}: ThreeRoomSceneProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const profileRef = useRef<VibrationProfile>(profile);
  profileRef.current = profile;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const onFrameUpdateRef = useRef(onFrameUpdate);
  onFrameUpdateRef.current = onFrameUpdate;
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;
  const onWebglUnavailableRef = useRef(onWebglUnavailable);
  onWebglUnavailableRef.current = onWebglUnavailable;

  const applySampleFnRef = useRef<((sample: VibrationFrameSample) => void) | null>(null);
  const renderOnceFnRef = useRef<(() => void) | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Bangun scene Three.js low-poly satu kali saat komponen dipasang
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    if (!checkWebglSupport()) {
      onWebglUnavailableRef.current();
      return;
    }

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "low-power",
        alpha: false,
      });
    } catch {
      onWebglUnavailableRef.current();
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf6f4f1); // DESIGN.md --color-background

    const width = Math.max(240, host.clientWidth || 640);
    const height = Math.max(200, host.clientHeight || 340);

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 40);
    camera.position.set(2.9, 2.15, 3.65);
    camera.lookAt(0, 0.72, 0);
    renderer.setSize(width, height, false);

    // Pencahayaan netral datar agar bentuk potongan ruangan terbaca tanpa gradasi berlebihan
    const ambient = new THREE.AmbientLight(0xfffdfb, 1.35);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xfffdfb, 1.25);
    keyLight.position.set(3.5, 5.2, 4.2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xe8e4df, 0.45);
    fillLight.position.set(-3.0, 2.0, 2.5);
    scene.add(fillLight);

    // Grup akar ruangan yang bergerak mengikuti getaran P & S
    const roomGroup = new THREE.Group();
    scene.add(roomGroup);

    // Palet netral sesuai DESIGN.md (tanpa hijau, tanpa merah)
    const matFloor = new THREE.MeshLambertMaterial({ color: 0xd8d3cc });
    const matBackWall = new THREE.MeshLambertMaterial({ color: 0xe8e4df });
    const matSideWall = new THREE.MeshLambertMaterial({ color: 0xded9d2 });
    const matTrim = new THREE.MeshLambertMaterial({ color: 0xc4bdb4 });
    const matDark = new THREE.MeshLambertMaterial({ color: 0x1a1613 });
    const matMid = new THREE.MeshLambertMaterial({ color: 0x7a726a });
    const matLightObj = new THREE.MeshLambertMaterial({ color: 0xfffdfb });

    // Lantai
    const floor = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.12, 2.6), matFloor);
    floor.position.set(0, -0.06, 0);
    roomGroup.add(floor);

    // Plint lantai
    const baseboardBack = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.04), matTrim);
    baseboardBack.position.set(0, 0.04, -1.24);
    roomGroup.add(baseboardBack);

    // Dinding belakang
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(3.2, 2.2, 0.12), matBackWall);
    backWall.position.set(0, 1.1, -1.3);
    roomGroup.add(backWall);

    // Dinding kiri
    const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.2, 2.6), matSideWall);
    leftWall.position.set(-1.6, 1.1, 0);
    roomGroup.add(leftWall);

    // Bingkai jendela dekoratif netral pada dinding belakang untuk memberi skala ruangan
    const windowFrame = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.72, 0.03), matTrim);
    windowFrame.position.set(0.75, 1.32, -1.23);
    roomGroup.add(windowFrame);

    const windowPane = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.035), matLightObj);
    windowPane.position.set(0.75, 1.32, -1.225);
    roomGroup.add(windowPane);

    // Lampu gantung dengan titik pivot di langit-langit (y = 2.15)
    const lampPivot = new THREE.Group();
    lampPivot.position.set(0.05, 2.15, -0.05);
    roomGroup.add(lampPivot);

    const lampCord = new THREE.Mesh(
      new THREE.CylinderGeometry(0.015, 0.015, 0.56, 8),
      matDark
    );
    lampCord.position.set(0, -0.28, 0);
    lampPivot.add(lampCord);

    const lampShade = new THREE.Mesh(
      new THREE.ConeGeometry(0.24, 0.19, 12),
      matDark
    );
    lampShade.position.set(0, -0.58, 0);
    lampPivot.add(lampShade);

    const lampBulb = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.07, 0.08),
      matLightObj
    );
    lampBulb.position.set(0, -0.66, 0);
    lampPivot.add(lampBulb);

    // Rak dinding + 3 benda di atasnya
    const shelfBoard = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.06, 0.28), matMid);
    shelfBoard.position.set(-0.65, 1.38, -1.1);
    roomGroup.add(shelfBoard);

    const shelfItemBaseY = 1.41;
    const shelfItemPositions: [number, number, number][] = [
      [-0.95, shelfItemBaseY + 0.1, -1.08],
      [-0.65, shelfItemBaseY + 0.08, -1.08],
      [-0.36, shelfItemBaseY + 0.11, -1.08],
    ];

    const shelfBox = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.12), matDark);
    const shelfCanister = new THREE.Mesh(
      new THREE.CylinderGeometry(0.065, 0.065, 0.16, 10),
      matLightObj
    );
    const shelfBook = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.22, 0.14), matTrim);
    const shelfItems = [shelfBox, shelfCanister, shelfBook] as const;

    shelfItems.forEach((item, idx) => {
      const [ix, iy, iz] = shelfItemPositions[idx];
      item.position.set(ix, iy, iz);
      roomGroup.add(item);
    });

    // Meja tengah + gelas di atasnya
    const tableGroup = new THREE.Group();
    const tableBaseX = 0.28;
    const tableBaseZ = 0.12;
    tableGroup.position.set(tableBaseX, 0, tableBaseZ);
    roomGroup.add(tableGroup);

    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.07, 0.68), matDark);
    tableTop.position.set(0, 0.62, 0);
    tableGroup.add(tableTop);

    const legGeo = new THREE.BoxGeometry(0.06, 0.59, 0.06);
    const legOffsets: [number, number][] = [
      [-0.49, -0.27],
      [0.49, -0.27],
      [-0.49, 0.27],
      [0.49, 0.27],
    ];
    for (const [lx, lz] of legOffsets) {
      const leg = new THREE.Mesh(legGeo, matMid);
      leg.position.set(lx, 0.295, lz);
      tableGroup.add(leg);
    }

    // Gelas air di atas meja
    const glassBaseX = 0.08;
    const glassBaseY = 0.655 + 0.075;
    const glassBaseZ = 0.04;
    const glassMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(0.055, 0.045, 0.15, 12),
      matLightObj
    );
    glassMesh.position.set(glassBaseX, glassBaseY, glassBaseZ);
    tableGroup.add(glassMesh);

    const glassRim = new THREE.Mesh(
      new THREE.CylinderGeometry(0.057, 0.057, 0.015, 12),
      matDark
    );
    glassRim.position.set(0, 0.07, 0);
    glassMesh.add(glassRim);

    // Kursi rendah / meja samping sebagai perabot yang dapat bergeser di MMI VII+
    const sideChair = new THREE.Group();
    const chairBaseX = -0.82;
    const chairBaseZ = 0.38;
    sideChair.position.set(chairBaseX, 0, chairBaseZ);
    roomGroup.add(sideChair);

    const chairSeat = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.06, 0.44), matMid);
    chairSeat.position.set(0, 0.42, 0);
    sideChair.add(chairSeat);

    const chairBack = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.42, 0.44), matDark);
    chairBack.position.set(-0.2, 0.64, 0);
    sideChair.add(chairBack);

    const chairLegGeo = new THREE.BoxGeometry(0.045, 0.4, 0.045);
    const chairLegOffsets: [number, number][] = [
      [-0.18, -0.17],
      [0.18, -0.17],
      [-0.18, 0.17],
      [0.18, 0.17],
    ];
    for (const [cx, cz] of chairLegOffsets) {
      const cLeg = new THREE.Mesh(chairLegGeo, matDark);
      cLeg.position.set(cx, 0.2, cz);
      sideChair.add(cLeg);
    }

    const applySample = (sample: VibrationFrameSample) => {
      roomGroup.position.set(sample.roomOffsetX, 0, sample.roomOffsetZ);
      lampPivot.rotation.set(sample.lampAngleX, 0, sample.lampAngleZ);

      // Gelas bergeser lalu rebah/terjatuh saat intensitas sangat tinggi
      const glassFallYOffset = sample.glassFallProgress * -0.58;
      const glassFallZOffset = sample.glassFallProgress * 0.26;
      const glassFallRotZ = sample.glassFallProgress * 1.45;
      glassMesh.position.set(
        glassBaseX + sample.glassOffsetX,
        glassBaseY + glassFallYOffset,
        glassBaseZ + glassFallZOffset
      );
      glassMesh.rotation.set(0, 0, glassFallRotZ);

      // Tiga benda di rak bergeser & sebagian terjatuh sesuai progres
      shelfItems.forEach((item, idx) => {
        const [bx, by, bz] = shelfItemPositions[idx];
        const dropP = sample.shelfDropProgresses[idx];
        item.position.set(
          bx + sample.shelfItemOffsets[idx] + dropP * 0.08,
          by - dropP * 1.32,
          bz + dropP * 0.34
        );
        item.rotation.set(dropP * 1.2, 0, dropP * (idx === 1 ? -1.4 : 1.1));
      });

      // Pergeseran ringan meja & kursi samping pada MMI VII+
      tableGroup.position.set(tableBaseX + sample.furnitureOffsetX * 0.55, 0, tableBaseZ);
      sideChair.position.set(chairBaseX + sample.furnitureOffsetX, 0, chairBaseZ);
      sideChair.rotation.y = sample.furnitureYawRad;
    };

    const renderOnce = () => {
      renderer.render(scene, camera);
    };

    applySampleFnRef.current = applySample;
    renderOnceFnRef.current = renderOnce;

    // Render frame diam awal (render-on-demand, tidak memutar loop saat diam)
    applySample(sampleVibrationFrame(0, profileRef.current));
    renderOnce();

    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const w = Math.max(240, Math.round(entry.contentRect.width));
      const h = Math.max(200, Math.round(entry.contentRect.height));
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h, false);
      renderOnce();
    });
    resizeObserver.observe(host);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      resizeObserver.disconnect();
      applySampleFnRef.current = null;
      renderOnceFnRef.current = null;
      disposeSceneResources(scene);
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Jalankan loop requestAnimationFrame HANYA ketika sedang memutar animasi;
  // jeda otomatis saat tab tersembunyi, dan berhenti bersih saat selesai.
  useEffect(() => {
    if (!applySampleFnRef.current || !renderOnceFnRef.current) return;

    if (!isPlaying) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      const idleSample = sampleVibrationFrame(0, profileRef.current);
      applySampleFnRef.current(idleSample);
      renderOnceFnRef.current();
      return;
    }

    let accumulatedSec = 0;
    let lastTimestampMs: number | null = null;
    let lastUiReportSec = -1;

    const tick = (nowMs: number) => {
      if (!isPlayingRef.current) return;

      if (document.hidden) {
        lastTimestampMs = null;
        rafIdRef.current = requestAnimationFrame(tick);
        return;
      }

      if (lastTimestampMs !== null) {
        const dtSec = Math.min(0.1, Math.max(0, (nowMs - lastTimestampMs) / 1000));
        accumulatedSec += dtSec;
      }
      lastTimestampMs = nowMs;

      const currentProfile = profileRef.current;
      const sample = sampleVibrationFrame(accumulatedSec, currentProfile);
      applySampleFnRef.current?.(sample);
      renderOnceFnRef.current?.();

      // Throttle pembaruan state React agar tidak memicu re-render 60x/detik saat frame tinggi
      if (accumulatedSec - lastUiReportSec >= 0.08 || sample.phase === "done") {
        lastUiReportSec = accumulatedSec;
        onFrameUpdateRef.current(
          Math.min(accumulatedSec, currentProfile.durationSec),
          sample
        );
      }

      if (sample.phase === "done") {
        rafIdRef.current = null;
        onCompleteRef.current();
        return;
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        lastTimestampMs = performance.now();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, playSessionKey]);

  return (
    <div
      ref={hostRef}
      className="w-full h-[300px] sm:h-[360px] rounded-[20px] overflow-hidden border border-[var(--color-border-strong)] bg-[var(--color-background)]"
    />
  );
}
