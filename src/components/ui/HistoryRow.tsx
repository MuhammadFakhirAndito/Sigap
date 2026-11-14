import React from "react";
import Link from "next/link";
import { MagnitudeBadge } from "./MagnitudeBadge";
import { StatusBadge } from "./StatusBadge";
import { Clock, Layers, Compass, ArrowUpRight } from "lucide-react";
import { StatusTsunami } from "@prisma/client";

export interface GempaItem {
  id: string;
  waktuUtc: Date | string;
  magnitudo: number;
  kedalamanKm: number;
  lat: number;
  lon: number;
  wilayah: string;
  potensiTeks: string;
  statusTsunami: StatusTsunami;
}

interface HistoryRowProps {
  gempa: GempaItem;
}

function formatWib(dateInput: Date | string): string {
  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "Waktu tidak tersedia";
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(d) + " WIB"
  );
}

function formatCoordinate(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(2).replace(".", ",")}° ${lat < 0 ? "LS" : "LU"}`;
  const lonStr = `${Math.abs(lon).toFixed(2).replace(".", ",")}° ${lon < 0 ? "BB" : "BT"}`;
  return `${latStr}, ${lonStr}`;
}

export function HistoryRow({ gempa }: HistoryRowProps) {
  const dateObj = typeof gempa.waktuUtc === "string" ? new Date(gempa.waktuUtc) : gempa.waktuUtc;
  const hrefSimulasi = `/simulasi?m=${gempa.magnitudo}&d=${gempa.kedalamanKm}&lat=${gempa.lat}&lon=${gempa.lon}`;

  const tsunamiVariant =
    gempa.statusTsunami === "AMAN"
      ? "tsunami_aman"
      : gempa.statusTsunami === "BERPOTENSI"
      ? "tsunami_berpotensi"
      : "tsunami_tidak_dinyatakan";

  return (
    <article
      className="group rounded-[24px] sm:rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-4 sm:p-5 transition-all duration-200 hover:bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] shadow-2xs"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Kolom Info: Magnitudo & Rincian Geografis */}
        <div className="flex items-start gap-3.5 sm:gap-4">
          <div className="shrink-0 pt-0.5">
            <MagnitudeBadge magnitude={gempa.magnitudo} size="md" />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <h3 className="text-base sm:text-lg font-semibold tracking-tight text-[var(--color-text-primary)] leading-snug break-words">
              {gempa.wilayah}
            </h3>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--color-text-secondary)]">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
                <time dateTime={dateObj.toISOString()} className="tnum">
                  {formatWib(dateObj)}
                </time>
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
                <span className="tnum">Kedalaman {gempa.kedalamanKm} km</span>
              </span>

              <span className="inline-flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
                <span className="tnum">{formatCoordinate(gempa.lat, gempa.lon)}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Kolom Aksi & Status Tsunami: di mobile tumpuk vertikal dengan tombol lebar penuh */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between sm:justify-end gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-[var(--color-border)]/60">
          <div className="self-start sm:self-center">
            <StatusBadge
              variant={tsunamiVariant}
              customText={gempa.potensiTeks || undefined}
              onSurface={false}
            />
          </div>

          <Link
            href={hrefSimulasi}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-4 py-2.5 sm:py-1.5 sm:pl-4 sm:pr-1.5 min-h-[44px] text-xs font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] transition-all duration-150 active:scale-95 shadow-2xs group/btn"
            title={`Simulasikan dampak gempa ${gempa.wilayah}`}
          >
            <span>Simulasikan</span>
            <span className="flex h-7 w-7 sm:h-8 sm:w-8 items-center justify-center rounded-full bg-[var(--color-surface)] group-hover/btn:bg-white/15 transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-text-primary)] group-hover/btn:text-white" aria-hidden="true" />
            </span>
          </Link>
        </div>
      </div>
    </article>
  );
}
