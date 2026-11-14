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
  const peakDay = series.find((d) => d.jumlah === peak);
  const seriesTotal = series.reduce((a, d) => a + d.jumlah, 0);

  return (
    <section
      aria-labelledby="ringkasan-heading"
      className="rounded-[28px] bg-[var(--color-surface)] p-6 sm:p-8 grid gap-8 lg:grid-cols-[minmax(0,320px)_1fr] lg:gap-12"
    >
      <h2 id="ringkasan-heading" className="sr-only">
        Ringkasan hasil filter
      </h2>

      <dl className="grid grid-cols-3 lg:grid-cols-1 gap-x-4 gap-y-6 content-start">
        <div>
          <dt className="text-xs text-[var(--color-text-secondary)]">Jumlah gempa</dt>
          <dd className="mt-1 text-2xl sm:text-3xl lg:text-4xl leading-none tracking-tight text-[var(--color-text-primary)] tnum">
            {nf.format(total)}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-text-secondary)]">Magnitudo terbesar</dt>
          <dd className="mt-1 text-2xl sm:text-3xl lg:text-4xl leading-none tracking-tight text-[var(--color-primary)] tnum">
            {maxMagnitudo !== null ? maxMagnitudo.toFixed(1).replace(".", ",") : "–"}
          </dd>
        </div>
        <div>
          <dt className="text-xs text-[var(--color-text-secondary)]">Rentang data</dt>
          <dd className="mt-2 text-sm leading-snug text-[var(--color-text-primary)]">{rentangText}</dd>
        </div>
      </dl>

      <figure className="min-w-0">
        <figcaption className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">
            Jumlah gempa per hari
          </span>
          <span className="tnum">
            {series.length} hari terakhir dari hasil filter · {nf.format(seriesTotal)} gempa
          </span>
        </figcaption>

        <div className="relative mt-5 h-36 sm:h-40" aria-hidden="true">
          <span className="absolute left-0 top-0 -translate-y-1/2 text-xs text-[var(--color-text-muted)] tnum">
            {nf.format(peak)}
          </span>
          <div className="absolute inset-x-0 top-0 border-t border-dashed border-[var(--color-border)]" />
          <div className="absolute inset-0 pl-8 flex items-end gap-[3px] border-b border-[var(--color-border-strong)]/40">
            {series.map((d) => {
              const isPeak = d === peakDay;
              return (
                <div
                  key={d.hari}
                  title={`${formatDay(d.hari, true)}: ${nf.format(d.jumlah)} gempa`}
                  className={`flex-1 min-w-0 rounded-t-[3px] transition-colors duration-200 ${
                    isPeak
                      ? "bg-[var(--color-text-primary)]"
                      : "bg-[var(--color-stone)]/45 hover:bg-[var(--color-stone)]/80"
                  }`}
                  style={{ height: d.jumlah === 0 ? "2px" : `${(d.jumlah / peak) * 100}%` }}
                />
              );
            })}
          </div>
        </div>

        {series.length > 0 && (
          <div className="mt-2 pl-8 flex justify-between text-xs text-[var(--color-text-muted)] tnum" aria-hidden="true">
            <span>{formatDay(series[0].hari)}</span>
            {peakDay && (
              <span className="text-[var(--color-text-secondary)]">
                Puncak {formatDay(peakDay.hari)}: {nf.format(peakDay.jumlah)}
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
