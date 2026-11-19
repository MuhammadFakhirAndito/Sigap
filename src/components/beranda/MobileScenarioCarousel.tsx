"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ChevronLeft, ChevronRight, Mountain, Waves } from "lucide-react";
import { ScenarioOverlayCard } from "@/components/beranda/ScenarioOverlayCard";

export interface MobileScenarioCarouselItem {
  id: string;
  imageUrl: string;
  imageAlt: string;
  tipeLokasi: string;
  title: string;
  metaLine: string;
  overview: string;
  magnitudeText: string;
  locationTypeLabel: string;
  href: string;
}

interface MobileScenarioCarouselProps {
  items: MobileScenarioCarouselItem[];
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]";

export function MobileScenarioCarousel({ items }: MobileScenarioCarouselProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  if (items.length === 0) return null;

  const hasMultiple = items.length > 1;
  const safeIndex = Math.min(activeIndex, items.length - 1);

  const scrollToSlide = (nextIdx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const bounded = (nextIdx + items.length) % items.length;
    const slide = track.children.item(bounded) as HTMLElement | null;
    setActiveIndex(bounded);
    if (!slide) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    const targetLeft = slide.offsetLeft - Math.max(0, (track.clientWidth - slide.clientWidth) / 2);
    track.scrollTo({
      left: Math.max(0, targetLeft),
      behavior: reduced ? "auto" : "smooth",
    });
  };

  const handleScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const center = track.scrollLeft + track.clientWidth / 2;
    let closestIdx = 0;
    let closestDist = Infinity;
    for (let i = 0; i < track.children.length; i++) {
      const child = track.children.item(i) as HTMLElement | null;
      if (!child) continue;
      const childCenter = child.offsetLeft + child.clientWidth / 2;
      const dist = Math.abs(childCenter - center);
      if (dist < closestDist) {
        closestDist = dist;
        closestIdx = i;
      }
    }
    if (closestIdx !== activeIndex) {
      setActiveIndex(closestIdx);
    }
  };

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Skenario simulasi sejarah"
      className="md:hidden space-y-3"
    >
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex gap-3.5 overflow-x-auto snap-x snap-mandatory pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((item) => (
          <div key={item.id} className="w-[86%] shrink-0 snap-center">
            <ScenarioOverlayCard
              imageUrl={item.imageUrl}
              imageAlt={item.imageAlt}
              icon={
                item.tipeLokasi === "LAUT" ? (
                  <Waves className="h-5 w-5" />
                ) : (
                  <Mountain className="h-5 w-5" />
                )
              }
              title={item.title}
              metaLine={item.metaLine}
              overview={item.overview}
              magnitudeText={item.magnitudeText}
              locationTypeLabel={item.locationTypeLabel}
              href={item.href}
            />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        {hasMultiple ? (
          <div className="inline-flex items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] overflow-hidden">
            <button
              type="button"
              onClick={() => scrollToSlide(safeIndex - 1)}
              aria-label="Skenario sebelumnya"
              className={`min-h-[44px] min-w-[48px] flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:bg-[var(--color-surface-sunken)] transition-colors ${focusRing}`}
            >
              <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <span aria-hidden="true" className="w-px h-5 bg-[var(--color-border)]" />
            <button
              type="button"
              onClick={() => scrollToSlide(safeIndex + 1)}
              aria-label="Skenario berikutnya"
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
              data-scenario-counter=""
              className="text-xs font-medium text-[var(--color-text-secondary)] tnum"
            >
              {safeIndex + 1} / {items.length}
            </span>
          )}
          <Link
            href="/simulasi"
            className={`inline-flex items-center gap-1 min-h-[44px] px-2 text-sm font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] transition-colors rounded-full ${focusRing}`}
          >
            <span>Buka simulasi</span>
            <ArrowUpRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </div>
  );
}
