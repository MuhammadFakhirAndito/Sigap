"use client";

import React, { useEffect, useRef } from "react";

interface HeroScrollRockProps {
  targetId: string;
  targetSectionId: string;
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

/**
 * Menggerakkan dan mengecilkan fragmen batu tektonik Hero mengikuti progres
 * scroll menuju slot dekoratif di Section 2 pada layar desktop (`lg:`).
 * Nonaktif secara otomatis pada layar sempit dan saat `prefers-reduced-motion`.
 */
export function HeroScrollRock({
  targetId,
  targetSectionId,
}: HeroScrollRockProps) {
  const rockRef = useRef<HTMLDivElement | null>(null);
  const metricsRef = useRef<ScrollMetrics | null>(null);

  useEffect(() => {
    const rockEl = rockRef.current;
    if (!rockEl) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId = 0;

    const applyTransform = () => {
      rafId = 0;
      const metrics = metricsRef.current;
      if (!metrics || !metrics.active) {
        rockEl.style.transform = "";
        return;
      }

      const raw = Math.min(Math.max(window.scrollY / metrics.endScroll, 0), 1);
      // Smoothstep agar transisi keluar Hero dan mendarat di Section 2 terasa halus tanpa menyentak
      const eased = raw * raw * (3 - 2 * raw);
      const targetScale = metrics.targW / metrics.origW;
      const scale = 1 + (targetScale - 1) * eased;
      const dx = (metrics.targCx - metrics.origCx) * eased;
      const dy = (metrics.targCy - metrics.origCy) * eased;

      rockEl.style.transform = `translate3d(${dx.toFixed(2)}px, ${dy.toFixed(2)}px, 0) scale(${scale.toFixed(4)})`;
    };

    const scheduleApply = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(applyTransform);
    };

    const measure = () => {
      const targetEl = document.getElementById(targetId);
      const sectionEl = document.getElementById(targetSectionId);
      const isDesktop = window.innerWidth >= 1024;

      if (!targetEl || !sectionEl || !isDesktop || motionQuery.matches) {
        metricsRef.current = null;
        rockEl.style.transform = "";
        return;
      }

      // Reset transform sesaat agar koordinat asal terukur murni tanpa sisa offset scroll aktif
      rockEl.style.transform = "none";
      const origRect = rockEl.getBoundingClientRect();
      const targRect = targetEl.getBoundingClientRect();
      const secRect = sectionEl.getBoundingClientRect();

      if (origRect.width <= 0 || targRect.width <= 0) {
        metricsRef.current = null;
        rockEl.style.transform = "";
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

      applyTransform();
    };

    measure();
    if (document.fonts?.ready) {
      void document.fonts.ready.then(measure);
    }

    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(document.body);

    const onScroll = () => scheduleApply();
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
  }, [targetId, targetSectionId]);

  return (
    <div
      ref={rockRef}
      className="order-3 relative z-10 pointer-events-none mt-6 -mx-[8%] w-[116%] lg:mx-0 lg:mt-0 lg:absolute lg:top-[16%] lg:w-[78%] lg:left-[max(-7%,calc((100%_-_100vw)/2_+_16px))] lg:will-change-transform motion-reduce:will-change-auto"
    >
      <img
        src="/images/tectonic-island.png"
        alt="Fragmen lempeng tektonik bumi dengan batuan berlumut dan retakan seismik"
        className="w-full h-auto object-contain select-none"
      />
    </div>
  );
}
