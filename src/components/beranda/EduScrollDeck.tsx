"use client";

import React, { useEffect, useRef } from "react";

interface EduScrollDeckProps {
  children: React.ReactNode;
}

interface RowTargets {
  rowEl: HTMLElement;
  textEl: HTMLElement | null;
  mediaEl: HTMLElement | null;
  imgEl: HTMLElement | null;
  reversed: boolean;
  topDoc: number;
  height: number;
}

function clamp01(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

/**
 * Menggerakkan kartu modul edukasi zig-zag (Section 3) secara halus mengikuti guliran layar.
 * Dua belah kartu (teks bernotch & foto diorama) bertemu ke sumbu tengah seirama guliran
 * dengan exponential damping ala HeroScrollRock, serta paralaks ringan di dalam bingkai foto.
 * Seluruh konten tetap terlihat tanpa JS maupun saat prefers-reduced-motion aktif.
 */
export function EduScrollDeck({ children }: EduScrollDeckProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;

    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    let rafId = 0;
    let lastTs = 0;
    let active = false;
    let isDesktop = false;
    let headerTopDoc = 0;
    let rows: RowTargets[] = [];
    let currentHeaderP = 1;
    let targetHeaderP = 1;
    let currentEnterP: number[] = [];
    let targetEnterP: number[] = [];
    let currentPassP: number[] = [];
    let targetPassP: number[] = [];

    const clearStyles = () => {
      const headerEl = rootEl.querySelector<HTMLElement>("[data-edu-header]");
      if (headerEl) headerEl.style.transform = "";
      const allRows = rootEl.querySelectorAll<HTMLElement>("[data-edu-row]");
      allRows.forEach((rowEl) => {
        const textEl = rowEl.querySelector<HTMLElement>("[data-edu-text]");
        const mediaEl = rowEl.querySelector<HTMLElement>("[data-edu-media]");
        const imgEl = rowEl.querySelector<HTMLElement>("[data-edu-img]");
        if (textEl) textEl.style.transform = "";
        if (mediaEl) mediaEl.style.transform = "";
        if (imgEl) imgEl.style.transform = "";
      });
    };

    const render = () => {
      if (!active) return;

      const headerEl = rootEl.querySelector<HTMLElement>("[data-edu-header]");
      if (headerEl) {
        const headerEase = 1 - Math.pow(1 - currentHeaderP, 2.3);
        const hy = (1 - headerEase) * 14;
        headerEl.style.transform =
          hy > 0.05 ? `translate3d(0, ${hy.toFixed(2)}px, 0)` : "";
      }

      rows.forEach((row, i) => {
        const enter = currentEnterP[i] ?? 1;
        const pass = currentPassP[i] ?? 0.5;
        const ease = 1 - Math.pow(1 - enter, 2.4);
        const remaining = 1 - ease;

        // Pada layar desktop zig-zag, dua kolom bertemu menyilang menuju garis tengah; di mobile hanya geser vertikal.
        const lateralPx = isDesktop ? 22 * remaining : 0;
        const verticalPx = 18 * remaining;
        const textSign = row.reversed ? 1 : -1;
        const mediaSign = -textSign;

        if (row.textEl) {
          const tx = textSign * lateralPx;
          row.textEl.style.transform =
            remaining > 0.002
              ? `translate3d(${tx.toFixed(2)}px, ${verticalPx.toFixed(2)}px, 0)`
              : "";
        }

        if (row.mediaEl) {
          const mx = mediaSign * lateralPx;
          row.mediaEl.style.transform =
            remaining > 0.002
              ? `translate3d(${mx.toFixed(2)}px, ${verticalPx.toFixed(2)}px, 0)`
              : "";
        }

        if (row.imgEl) {
          // Skala minimum 1.09 menjamin paralaks +-9px tetap tertutup rapi oleh overflow-hidden.
          const imgScale = 1.12 - 0.03 * ease;
          const parallaxRange = isDesktop ? 10 : 7;
          const py = (0.5 - pass) * 2 * parallaxRange;
          row.imgEl.style.transform = `translate3d(0, ${py.toFixed(2)}px, 0) scale(${imgScale.toFixed(4)})`;
        }
      });
    };

    const computeTargets = (immediate = false) => {
      if (!active) return;

      const sy = window.scrollY;
      const vh = window.innerHeight || 900;

      // Header muncul penuh saat berada di 65% viewport
      const headerEnterStart = headerTopDoc - vh * 0.96;
      const headerEnterEnd = headerTopDoc - vh * 0.62;
      targetHeaderP = clamp01(
        (sy - headerEnterStart) / Math.max(1, headerEnterEnd - headerEnterStart)
      );

      rows.forEach((row, i) => {
        const enterStart = row.topDoc - vh * 0.98;
        const enterEnd = row.topDoc - vh * 0.56;
        targetEnterP[i] = clamp01(
          (sy - enterStart) / Math.max(1, enterEnd - enterStart)
        );

        const passStart = row.topDoc - vh;
        const passEnd = row.topDoc + row.height;
        targetPassP[i] = clamp01(
          (sy - passStart) / Math.max(1, passEnd - passStart)
        );
      });

      if (immediate) {
        currentHeaderP = targetHeaderP;
        currentEnterP = [...targetEnterP];
        currentPassP = [...targetPassP];
        render();
      } else {
        startTick();
      }
    };

    const tick = (ts: number) => {
      if (!active) {
        rafId = 0;
        return;
      }

      const dt = lastTs ? Math.min((ts - lastTs) / 1000, 0.05) : 0.016;
      lastTs = ts;
      const factor = 1 - Math.exp(-12 * dt);

      let settled = true;
      const dh = targetHeaderP - currentHeaderP;
      if (Math.abs(dh) > 0.0005) {
        currentHeaderP += dh * factor;
        settled = false;
      } else {
        currentHeaderP = targetHeaderP;
      }

      for (let i = 0; i < rows.length; i++) {
        const de = (targetEnterP[i] ?? 1) - (currentEnterP[i] ?? 1);
        const dp = (targetPassP[i] ?? 0.5) - (currentPassP[i] ?? 0.5);

        if (Math.abs(de) > 0.0005) {
          currentEnterP[i] = (currentEnterP[i] ?? 1) + de * factor;
          settled = false;
        } else {
          currentEnterP[i] = targetEnterP[i] ?? 1;
        }

        if (Math.abs(dp) > 0.0005) {
          currentPassP[i] = (currentPassP[i] ?? 0.5) + dp * factor;
          settled = false;
        } else {
          currentPassP[i] = targetPassP[i] ?? 0.5;
        }
      }

      render();

      if (settled) {
        rafId = 0;
        lastTs = 0;
        return;
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const startTick = () => {
      if (rafId !== 0 || !active) return;
      lastTs = 0;
      rafId = window.requestAnimationFrame(tick);
    };

    const measure = () => {
      if (motionQuery.matches) {
        active = false;
        if (rafId !== 0) {
          window.cancelAnimationFrame(rafId);
          rafId = 0;
        }
        clearStyles();
        return;
      }

      isDesktop = window.innerWidth >= 1024;
      active = true;
      clearStyles();

      const sy = window.scrollY;
      const headerEl = rootEl.querySelector<HTMLElement>("[data-edu-header]");
      headerTopDoc = headerEl ? headerEl.getBoundingClientRect().top + sy : 0;

      const rowNodes = Array.from(rootEl.querySelectorAll<HTMLElement>("[data-edu-row]"));
      rows = rowNodes.map((rowEl) => {
        const rect = rowEl.getBoundingClientRect();
        return {
          rowEl,
          textEl: rowEl.querySelector<HTMLElement>("[data-edu-text]"),
          mediaEl: rowEl.querySelector<HTMLElement>("[data-edu-media]"),
          imgEl: rowEl.querySelector<HTMLElement>("[data-edu-img]"),
          reversed: rowEl.dataset.reversed === "true",
          topDoc: rect.top + sy,
          height: Math.max(1, rect.height),
        };
      });

      if (targetEnterP.length !== rows.length) {
        currentEnterP = rows.map(() => 1);
        targetEnterP = rows.map(() => 1);
        currentPassP = rows.map(() => 0.5);
        targetPassP = rows.map(() => 0.5);
      }

      computeTargets(true);
    };

    measure();
    if (document.fonts?.ready) {
      void document.fonts.ready.then(measure);
    }

    const resizeObserver = new ResizeObserver(() => measure());
    resizeObserver.observe(document.body);

    const onScroll = () => computeTargets(false);
    const onResize = () => measure();
    const onMotionChange = () => measure();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    motionQuery.addEventListener("change", onMotionChange);

    return () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
      }
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      motionQuery.removeEventListener("change", onMotionChange);
      clearStyles();
    };
  }, []);

  return (
    <div ref={rootRef} className="w-full">
      {children}
    </div>
  );
}
