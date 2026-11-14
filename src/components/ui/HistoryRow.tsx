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
  const hrefSimulasi = `/simulasi?m=${gempa.magnitudo}&d=${gempa.kedalamanKm}&lat=${gempa.lat}&lon=${gempa.lon}`;
  const mag = gempa.magnitudo.toFixed(1).replace(".", ",");
  const ts = tsunamiStyle[gempa.statusTsunami] ?? tsunamiStyle.TIDAK_DINYATAKAN;

  return (
    <article className="grid grid-cols-[56px_1fr] md:grid-cols-[64px_minmax(0,1fr)_96px_168px_auto] items-center gap-x-4 gap-y-3 rounded-[20px] md:rounded-none bg-[var(--color-surface)] md:bg-transparent px-4 py-4 md:px-6 md:py-4 transition-colors duration-200 hover:bg-[var(--color-surface-raised)]">
      <p className="row-span-2 md:row-span-1 self-start md:self-center text-2xl md:text-3xl leading-none tracking-tight text-[var(--color-primary)] tnum">
        <span className="sr-only">Magnitudo </span>
        {mag}
      </p>

      <div className="min-w-0">
        <h3 className="text-base font-medium leading-snug text-[var(--color-text-primary)] break-words">
          {gempa.wilayah}
        </h3>
        <p className="mt-1 text-xs text-[var(--color-text-secondary)] tnum">
          <time dateTime={d.toISOString()}>{formatWib(d)}</time>
          <span aria-hidden="true"> · </span>
          {formatCoordinate(gempa.lat, gempa.lon)}
          <span className="md:hidden">
            <span aria-hidden="true"> · </span>
            {gempa.kedalamanKm} km
          </span>
        </p>
      </div>

      <p className="hidden md:block text-sm text-[var(--color-text-primary)] tnum">
        {gempa.kedalamanKm} km
        <span className="block text-xs text-[var(--color-text-muted)]">kedalaman</span>
      </p>

      <p
        className={`col-start-2 md:col-start-auto inline-flex items-center gap-1.5 text-xs ${ts.cls}`}
        title={gempa.potensiTeks || undefined}
      >
        {ts.icon}
        <span>{tsunamiShortLabel(gempa.statusTsunami)}</span>
      </p>

      <Link
        href={hrefSimulasi}
        aria-label={`Simulasikan gempa M ${mag} ${gempa.wilayah}`}
        className="col-span-2 md:col-span-1 inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-full border border-[var(--color-border-strong)]/50 px-4 text-xs font-medium text-[var(--color-text-primary)] transition-colors duration-150 hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)]"
      >
        Simulasikan
        <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
      </Link>
    </article>
  );
}
