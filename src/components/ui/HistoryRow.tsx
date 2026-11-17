import React from "react";
import Link from "next/link";
import { CheckCircle2, AlertTriangle, HelpCircle, ArrowUpRight } from "lucide-react";
import { StatusTsunami } from "@prisma/client";
import { tsunamiShortLabel } from "@/lib/riwayat";

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

function formatWib(d: Date): string {
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

const tsunamiStyle: Record<StatusTsunami, { icon: React.ReactNode; cls: string }> = {
  AMAN: {
    icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    cls: "text-[var(--color-success-strong)]",
  },
  BERPOTENSI: {
    icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    cls: "text-[var(--color-error-strong)] font-semibold",
  },
  TIDAK_DINYATAKAN: {
    icon: <HelpCircle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />,
    cls: "text-[var(--color-text-secondary)]",
  },
};

export function HistoryRow({ gempa }: { gempa: GempaItem }) {
  const d = typeof gempa.waktuUtc === "string" ? new Date(gempa.waktuUtc) : gempa.waktuUtc;
  const hrefSimulasi = `/simulasi?m=${gempa.magnitudo}&d=${gempa.kedalamanKm}&lat=${gempa.lat}&lon=${gempa.lon}&wilayah=${encodeURIComponent(gempa.wilayah)}`;
  const mag = gempa.magnitudo.toFixed(1).replace(".", ",");
  const ts = tsunamiStyle[gempa.statusTsunami] ?? tsunamiStyle.TIDAK_DINYATAKAN;

  return (
    <article className="group grid grid-cols-[64px_1fr] md:grid-cols-[72px_minmax(0,1fr)_104px_180px_auto] items-center gap-x-4 md:gap-x-6 gap-y-3 rounded-[24px] border border-[var(--color-border)]/75 bg-[var(--color-surface-raised)] px-4 py-4 md:px-5 md:py-4 transition-colors duration-200 hover:border-[var(--color-border-strong)]">
      <div className="row-span-2 md:row-span-1 self-start md:self-center flex h-14 w-16 md:h-[56px] md:w-[72px] items-center justify-center rounded-[16px] bg-[var(--color-cta)]">
        <p className="text-xl md:text-2xl font-semibold leading-none tracking-tight text-[var(--color-on-cta)] tnum">
          <span className="sr-only">Magnitudo </span>
          {mag}
        </p>
      </div>

      <div className="min-w-0">
        <h3 className="text-[15px] md:text-base font-medium leading-snug text-[var(--color-text-primary)] break-words">
          {gempa.wilayah}
        </h3>
        <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-[var(--color-text-secondary)] tnum">
          <time dateTime={d.toISOString()}>{formatWib(d)}</time>
          <span aria-hidden="true">·</span>
          <span>{formatCoordinate(gempa.lat, gempa.lon)}</span>
          <span className="md:hidden">
            <span aria-hidden="true">· </span>
            Kedalaman {gempa.kedalamanKm} km
          </span>
        </p>
      </div>

      <div className="hidden md:block">
        <span className="block text-xs leading-none text-[var(--color-text-secondary)]">Kedalaman</span>
        <span className="mt-1.5 block text-sm font-medium text-[var(--color-text-primary)] tnum">
          {gempa.kedalamanKm} km
        </span>
      </div>

      <div className="col-start-2 md:col-start-auto min-w-0" title={gempa.potensiTeks || undefined}>
        <span className="hidden md:block text-xs leading-none text-[var(--color-text-secondary)]">
          Potensi tsunami
        </span>
        <p className={`md:mt-1.5 flex items-center gap-1.5 text-xs md:text-sm font-medium ${ts.cls}`}>
          {ts.icon}
          <span>
            <span className="md:hidden">Tsunami: </span>
            {tsunamiShortLabel(gempa.statusTsunami)}
          </span>
        </p>
      </div>

      <Link
        href={hrefSimulasi}
        aria-label={`Simulasikan gempa M ${mag} ${gempa.wilayah}`}
        className="col-span-2 md:col-span-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-full border border-[var(--color-border-strong)] bg-transparent px-4 text-xs font-medium text-[var(--color-text-primary)] transition-colors duration-150 group-hover:bg-[var(--color-cta)] group-hover:text-[var(--color-on-cta)] group-hover:border-[var(--color-cta)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
      >
        Simulasikan
        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
      </Link>
    </article>
  );
}
