import React from "react";
import { DailyCount } from "@/lib/riwayat";

interface RiwayatChartProps {
  series: DailyCount[];
  total: number;
  maxMagnitudo: number | null;
  rentangText: string;
}

function formatDay(key: string, withYear = false): string {
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
    timeZone: "UTC",
  }).format(new Date(`${key}T00:00:00Z`));
}

const nf = new Intl.NumberFormat("id-ID");

export function RiwayatChart({ series, total, maxMagnitudo, rentangText }: RiwayatChartProps) {
  const peak = Math.max(1, ...series.map((d) => d.jumlah));
  const midTick = peak >= 4 ? Math.round(peak / 2) : null;
  const peakDay = series.find((d) => d.jumlah === peak);
  const seriesTotal = series.reduce((a, d) => a + d.jumlah, 0);

  return (
    <section
      aria-labelledby="ringkasan-heading"
      className="rounded-[28px] border border-[var(--color-border)]/75 bg-[var(--color-surface)] p-4 sm:p-6 grid gap-4 lg:grid-cols-[280px_1fr]"
    >
      <h2 id="ringkasan-heading" className="sr-only">
        Ringkasan hasil filter
      </h2>

      <dl className="rounded-[20px] border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)] p-5 flex flex-col justify-between gap-5">
        <div>
          <dt className="text-xs font-medium text-[var(--color-text-secondary)]">Total gempa</dt>
          <dd className="mt-1.5 text-3xl sm:text-4xl font-semibold leading-none tracking-tight text-[var(--color-text-primary)] tnum">
            {nf.format(total)}
          </dd>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[var(--color-border)]/60">
          <div>
            <dt className="text-xs text-[var(--color-text-secondary)]">Magnitudo maks</dt>
            <dd className="mt-1 text-xl sm:text-2xl font-semibold leading-none tracking-tight text-[var(--color-text-primary)] tnum">
              {maxMagnitudo !== null ? maxMagnitudo.toFixed(1).replace(".", ",") : "–"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--color-text-secondary)]">Puncak harian</dt>
            <dd className="mt-1 text-xl sm:text-2xl font-semibold leading-none tracking-tight text-[var(--color-text-primary)] tnum">
              {peakDay ? nf.format(peakDay.jumlah) : "–"}
            </dd>
          </div>
        </div>

        <div className="pt-4 border-t border-[var(--color-border)]/60">
          <dt className="text-xs text-[var(--color-text-secondary)]">Rentang data</dt>
          <dd className="mt-1 text-xs font-medium leading-snug text-[var(--color-text-primary)] tnum">
            {rentangText}
          </dd>
        </div>
      </dl>

      <figure className="rounded-[20px] border border-[var(--color-border)]/70 bg-[var(--color-surface-raised)] p-5 sm:p-6 flex flex-col justify-between min-w-0">
        <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="text-sm font-semibold text-[var(--color-text-primary)]">
            Jumlah gempa per hari
          </span>
          <span className="tnum">
            {series.length} hari terakhir · {nf.format(seriesTotal)} gempa
          </span>
        </figcaption>

        <div className="mt-6 flex items-stretch gap-3 h-36 sm:h-40" aria-hidden="true">
          <div className="flex flex-col justify-between items-end w-8 shrink-0 text-xs leading-none text-[var(--color-text-secondary)] tnum select-none py-[1px]">
            <span>{nf.format(peak)}</span>
            {midTick !== null ? <span>{nf.format(midTick)}</span> : <span />}
            <span>0</span>
          </div>

          <div className="relative flex-1 min-w-0 border-b border-[var(--color-border-strong)]/50">
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-[var(--color-border)]/70 pointer-events-none" />
            {midTick !== null && (
              <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-[var(--color-border)]/50 pointer-events-none" />
            )}

            <div className="relative z-10 h-full flex items-end gap-[3px] sm:gap-[5px]">
              {series.map((d) => {
                const isPeak = d === peakDay && d.jumlah > 0;
                const heightPct = (d.jumlah / peak) * 100;
                return (
                  <div
                    key={d.hari}
                    title={`${formatDay(d.hari, true)}: ${nf.format(d.jumlah)} gempa`}
                    className={`flex-1 min-w-0 rounded-t-[4px] transition-colors duration-150 ${
                      d.jumlah === 0
                        ? "bg-[var(--color-border)]/50"
                        : isPeak
                          ? "bg-[var(--color-cta)]"
                          : "bg-[var(--color-border-strong)]/45 hover:bg-[var(--color-border-strong)]/80"
                    }`}
                    style={{
                      height: d.jumlah === 0 ? "2px" : `max(4px, ${heightPct}%)`,
                    }}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {series.length > 0 && (
          <div className="mt-2.5 pl-11 flex items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)] tnum" aria-hidden="true">
            <span>{formatDay(series[0].hari)}</span>
            {peakDay && (
              <span>
                Puncak {formatDay(peakDay.hari)}: {nf.format(peakDay.jumlah)}
                <span className="hidden sm:inline"> gempa</span>
              </span>
            )}
            <span>{formatDay(series[series.length - 1].hari)}</span>
          </div>
        )}

        <table className="sr-only">
          <caption>Jumlah gempa per hari (WIB) untuk hasil filter</caption>
          <thead>
            <tr>
              <th scope="col">Tanggal</th>
              <th scope="col">Jumlah gempa</th>
            </tr>
          </thead>
          <tbody>
            {series.map((d) => (
              <tr key={d.hari}>
                <td>{formatDay(d.hari, true)}</td>
                <td>{d.jumlah}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figure>
    </section>
  );
}
