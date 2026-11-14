"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { EDUKASI_CATEGORIES } from "@/lib/edukasi";

interface CategoryFilterProps {
  currentCategory: string;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ currentCategory }) => {
  const activeRef = useRef<HTMLAnchorElement | null>(null);

  useEffect(() => {
    const el = activeRef.current;
    if (!el) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({
      inline: "center",
      block: "nearest",
      behavior: reduced ? "auto" : "smooth",
    });
  }, [currentCategory]);

  return (
    <nav aria-label="Filter kategori edukasi" className="w-full">
      {/* Geser horizontal di mobile 390px dengan pill aktif otomatis digulir ke viewport */}
      <div className="flex items-center gap-2 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0">
        {EDUKASI_CATEGORIES.map((cat) => {
          const isActive =
            (cat.key === "semua" && (!currentCategory || currentCategory === "semua")) ||
            currentCategory?.toUpperCase() === cat.key.toUpperCase();
          const href = cat.key === "semua" ? "/edukasi" : `/edukasi?kategori=${cat.key}`;

          return (
            <Link
              key={cat.key}
              ref={isActive ? activeRef : undefined}
              href={href}
              scroll={false}
              aria-current={isActive ? "true" : undefined}
              className={`shrink-0 inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors duration-150 active:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)] ${
                isActive
                  ? "bg-[var(--color-cta)] text-[var(--color-on-cta)]"
                  : "bg-[var(--color-surface-strong)] text-[var(--color-text-primary)] border border-[var(--color-text-muted)] hover:border-[var(--color-text-primary)] hover:bg-[var(--color-surface)]"
              }`}
            >
              {cat.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
