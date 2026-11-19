"use client";

import React, { useEffect, useRef } from "react";

interface HeroScrollRockProps {
  targetId: string;
  targetSectionId: string;
  reticleId?: string;
}

interface ScrollMetrics {
  origCx: number;
  origCy: number;
  origW: number;
  targCx: number;
  targCy: number;
  targW: number;
  endScroll: number;
  active: boolean;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Menggerakkan dan mengecilkan fragmen batu tektonik Hero mengikuti progres
 * scroll menuju slot dekoratif di Section 2 pada layar desktop (`lg:`).
 * Memakai kurva susut cepat + lengkungan gerak ke kanan agar tidak menutupi
 * tipografi Section 2, dengan exponential damping agar guliran roda mouse halus.
 */
export function HeroScrollRock({
  targetId,
  targetSectionId,
  reticleId,
}: HeroScrollRockProps) {
  const rockRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef<ScrollMetrics | null>(null);

  useEffect(() => {
    const rockEl = rockRef.current;
    if (!rockEl) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId = 0;
    let lastTs = 0;
    let currentProgress = 0;
    let targetProgress = 0;

    const renderProgress = (p: number) => {
      const metrics = metricsRef.current;
      const reticleEl = reticleId ? document.getElementById(reticleId) : null;

      if (!metrics || !metrics.active) {
        rockEl.style.transform = "";
        if (reticleEl) {
          reticleEl.style.opacity = "";
          reticleEl.style.transform = "";
        }
        return;
      }

      // Susut lebih awal saat keluar Hero supaya batu segera ramping di ruang terbuka
      const easeScale = 1 - Math.pow(1 - p, 2.35);
      const easeMove = p * p * (3 - 2 * p);
      const arcX = Math.sin(Math.PI * p) * 120;
      const rotateDeg = Math.sin(Math.PI * p) * -5.5;

      const targetScale = metrics.targW / metrics.origW;
      const scale = 1 + (targetScale - 1) * easeScale;
      const dx = (metrics.targCx - metrics.origCx) * easeMove + arcX;
      const dy = (metrics.targCy - metrics.origCy) * easeMove;

      rockEl.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) rotate(${rotateDeg.toFixed(2)}deg) scale(${scale.toFixed(4)})`;

      if (reticleEl) {
        const dock = clamp01((p - 0.62) / 0.38);
        const dockEase = dock * dock * (3 - 2 * dock);
        reticleEl.style.opacity = (dockEase * 0.72).toFixed(3);
        reticleEl.style.transform = `scale(${(0.84 + 0.16 * dockEase).toFixed(4)})`;
      }
    };

    const tick = (ts: number) => {
      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
      lastTs = ts;

      const factor = 1 - Math.exp(-13 * dt);
      currentProgress += (targetProgress - currentProgress) * factor;

      if (Math.abs(targetProgress - currentProgress) < 0.0004) {
        currentProgress = targetProgress;
        renderProgress(currentProgress);
        rafId = 0;
        lastTs = 0;
        return;
      }

      renderProgress(currentProgress);
      rafId = window.requestAnimationFrame(tick);
    };

    const startTick = () => {
      if (rafId !== 0) return;
      lastTs = 0;
      rafId = window.requestAnimationFrame(tick);
    };

    const syncTarget = (immediate = false) => {
      const metrics = metricsRef.current;
      if (!metrics || !metrics.active) {
        targetProgress = 0;
        currentProgress = 0;
        renderProgress(0);
        return;
      }

      targetProgress = clamp01(window.scrollY / metrics.endScroll);
      if (immediate) {
        currentProgress = targetProgress;
        renderProgress(currentProgress);
      } else {
        startTick();
      }
    };

    const measure = () => {
      const targetEl = document.getElementById(targetId);
      const sectionEl = document.getElementById(targetSectionId);
      const isDesktop = window.innerWidth >= 1024;

      if (!targetEl || !sectionEl || !isDesktop || motionQuery.matches) {
        metricsRef.current = null;
        if (rafId !== 0) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        renderProgress(0);
        return;
      }

      // Reset transform sesaat agar koordinat asal terukur murni tanpa sisa offset scroll aktif
      rockEl.style.transform = "none";
      const origRect = rockEl.getBoundingClientRect();
      const targRect = targetEl.getBoundingClientRect();
      const secRect = sectionEl.getBoundingClientRect();

      if (origRect.width <= 0 || targRect.width <= 0) {
        metricsRef.current = null;
        renderProgress(0);
        return;
      }

      const sx = window.scrollX;
      const sy = window.scrollY;

      metricsRef.current = {
        origCx: origRect.left + origRect.width / 2 + sx,
        origCy: origRect.top + origRect.height / 2 + sy,
        origW: origRect.width,
        targCx: targRect.left + targRect.width / 2 + sx,
        targCy: targRect.top + targRect.height / 2 + sy,
        targW: targRect.width,
        endScroll: Math.max(1, secRect.top + sy),
        active: true,
      };

      syncTarget(true);
    };

    measure();
    if (document.fonts?.ready) {
      void document.fonts.ready.then(measure);
    }

    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(document.body);

    const onScroll = () => syncTarget(false);
    const onResize = () => measure();
    const onMotionChange = () => measure();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      motionQuery.removeEventListener("change", onMotionChange);
    };
  }, [targetId, targetSectionId, reticleId]);

  return (
    <div
      ref={rockRef}
      className="relative z-10 pointer-events-none -mx-5 sm:-mx-9 w-[calc(100%+40px)] sm:w-[calc(100%+72px)] pt-3 lg:order-none lg:mx-0 lg:mt-0 lg:pt-0 lg:absolute lg:top-[16%] lg:w-[78%] lg:left-[max(-7%,calc((100%_-_100vw)/2_+_16px))] lg:will-change-transform motion-reduce:will-change-auto"
    >
      <img
        src="/images/tectonic-island.png"
        alt="Fragmen lempeng tektonik bumi dengan batuan berlumut dan retakan seismik"
        width={1519}
        height={948}
        fetchPriority="high"
        className="w-full h-auto object-contain select-none"
      />
    </div>
  );
}
