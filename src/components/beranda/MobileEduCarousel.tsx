"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight } from "lucide-react";
import {
  ArticleNotchedCard,
  type ArticleNotchedCardProps,
} from "@/components/edukasi/ArticleNotchedCard";

export interface MobileEduCarouselItem extends ArticleNotchedCardProps {
  id: string;
}

interface MobileEduCarouselProps {
  items: MobileEduCarouselItem[];
  totalArtikel: number;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]";

export function MobileEduCarousel({ items, totalArtikel }: MobileEduCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  if (items.length === 0) return null;

  const safeIndex = Math.min(activeIndex, items.length - 1);
  const activeItem = items[safeIndex];
  const hasMultiple = items.length > 1;

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!hasMultiple || !touchStartRef.current) return;
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    touchStartRef.current = null;

    // Abaikan geseran vertikal agar gulir halaman tetap alami.
    if (Math.abs(dx) < 40 || Math.abs(dx) <= Math.abs(dy)) return;
    if (dx < 0) {
      handleNext();
    } else {
      handlePrev();
    }
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Modul edukasi"
      className="lg:hidden max-w-[560px] mx-auto w-full space-y-4"
    >
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="touch-pan-y"
      >
        <ArticleNotchedCard
          key={activeItem.id}
          slug={activeItem.slug}
          judul={activeItem.judul}
          ringkasan={activeItem.ringkasan}
          kategori={activeItem.kategori}
          reversed={false}
          imageSrc={activeItem.imageSrc}
          imageAlt={activeItem.imageAlt}
          imageWidth={activeItem.imageWidth}
          imageHeight={activeItem.imageHeight}
          imagePosition={activeItem.imagePosition}
        />
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        {hasMultiple ? (
          <div className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] overflow-hidden">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Modul sebelumnya"
              className={`min-h-[44px] min-w-[48px] flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:bg-[var(--color-surface-sunken)] transition-colors ${focusRing}`}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <span aria-hidden="true" className="w-px h-5 bg-[var(--color-border)]" />
            <button
              type="button"
              onClick={handleNext}
              aria-label="Modul berikutnya"
              className={`min-h-[44px] min-w-[48px] flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:bg-[var(--color-surface-sunken)] transition-colors ${focusRing}`}
            >
              <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3">
          {hasMultiple && (
            <span
              aria-live="polite"
              data-edu-counter=""
              className="text-xs font-medium text-[var(--color-text-secondary)] tnum"
            >
              {safeIndex + 1} / {items.length}
            </span>
          )}
          <Link
            href="/edukasi"
            aria-label={totalArtikel > 0 ? `Lihat semua (${totalArtikel} modul)` : "Lihat semua modul"}
            className={`inline-flex items-center gap-1 min-h-[44px] px-2 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors rounded-full ${focusRing}`}
          >
            <span>Lihat semua</span>
            <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
