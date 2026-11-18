"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Menganimasikan angka menuju `target` (ease-out kubik). Saat `prefers-reduced-motion`
 * aktif, angka langsung melompat. Hanya untuk tampilan: nilai yang dihitung tidak lewat sini.
 */
export function useAnimatedNumber(target: number, durationMs = 220): number {
  const [display, setDisplay] = useState(target);
  const currentRef = useRef(target);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || currentRef.current === target) {
      currentRef.current = target;
      setDisplay(target);
      return;
    }

    const from = currentRef.current;
    const startedAt = performance.now();
    let frame = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;
      currentRef.current = value;
      setDisplay(value);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, durationMs]);

  return display;
}
