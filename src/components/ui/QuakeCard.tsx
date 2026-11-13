import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { MagnitudeBadge } from "./MagnitudeBadge";
import { StatusBadge } from "./StatusBadge";
import { StatusTsunamiType } from "@/types/bmkg";

export interface QuakeCardData {
  id?: string;
  magnitudo: number;
  kedalamanKm: number;
  wilayah: string;
  waktuUtc: Date | string;
  statusTsunami?: StatusTsunamiType;
  lat?: number;
  lon?: number;
}

interface QuakeCardProps {
  quake: QuakeCardData;
  className?: string;
}

export const QuakeCard: React.FC<QuakeCardProps> = ({ quake, className = "" }) => {
  const dateObj = typeof quake.waktuUtc === "string" ? new Date(quake.waktuUtc) : quake.waktuUtc;
  const timeFormatted = !isNaN(dateObj.getTime())
    ? new Intl.DateTimeFormat("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Jakarta",
      }).format(dateObj) + " WIB"
    : "Waktu tidak diketahui";

  const hrefSimulasi = `/simulasi?m=${quake.magnitudo}&d=${quake.kedalamanKm}&lat=${quake.lat ?? 0}&lon=${quake.lon ?? 0}`;

  return (
    <article
      className={`group relative bg-[var(--color-surface)] hover:bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[28px] p-5 sm:p-6 transition-colors duration-200 flex flex-col justify-between gap-4 ${className}`}
    >
      {/* Top row: Magnitude & Top-right Arrow Button */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <MagnitudeBadge magnitude={quake.magnitudo} size="md" />
          <span className="text-xs text-[var(--color-text-secondary)] font-medium">
            Kedalaman {quake.kedalamanKm} km
          </span>
        </div>

        <Link
          href={hrefSimulasi}
          className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
          aria-label={`Simulasikan gempa M${quake.magnitudo} di ${quake.wilayah}`}
        >
          <ArrowUpRight className="w-5 h-5 text-[var(--color-on-cta)]" aria-hidden="true" />
        </Link>
      </div>

      {/* Middle row: Wilayah */}
      <div className="flex-1 my-1">
        <h3 className="font-semibold text-base sm:text-lg text-[var(--color-text-primary)] line-clamp-2 leading-snug">
          {quake.wilayah}
        </h3>
      </div>

      {/* Bottom row: Waktu & Status Tsunami */}
      <div className="pt-2 border-t border-[var(--color-border)]/60 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
        <time dateTime={dateObj.toISOString()} className="tnum font-normal">
          {timeFormatted}
        </time>

        {quake.statusTsunami && (
          <StatusBadge
            variant={
              quake.statusTsunami === "AMAN"
                ? "tsunami_aman"
                : quake.statusTsunami === "BERPOTENSI"
                ? "tsunami_berpotensi"
                : "tsunami_tidak_dinyatakan"
            }
            onSurface={false}
          />
        )}
      </div>
    </article>
  );
};
