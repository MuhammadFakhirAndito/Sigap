"use client";

import React, { useEffect, useRef, useState } from "react";

interface RevealOnScrollProps {
  children: React.ReactNode;
  className?: string;
  delayMs?: number;
}

/**
 * Fade-in ringan saat bagian masuk viewport. Render awal selalu terlihat (aman tanpa JS);
 * hanya elemen yang masih di bawah layar yang disembunyikan lalu dimunculkan.
 */
export function RevealOnScroll({ children, className = "", delayMs = 0 }: RevealOnScrollProps) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [phase, setPhase] = useState<"static" | "hidden" | "shown">("static");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;

    setPhase("hidden");
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setPhase("shown");
          observer.disconnect();
        }
      },
      { rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const motion =
    phase === "static"
      ? ""
      : `transition-[opacity,transform] duration-[600ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          phase === "hidden" ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
        }`;

  return (
    <div
      ref={ref}
      style={phase === "shown" && delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
      className={`${motion} ${className}`}
    >
      {children}
    </div>
  );
}
