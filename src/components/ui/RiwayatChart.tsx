import React from "react";
import { GempaItem } from "./HistoryRow";

interface RiwayatChartProps {
  data: GempaItem[];
  totalData: number;
}

export function RiwayatChart({ data, totalData }: RiwayatChartProps) {
  if (data.length === 0) return null;

  // Tampilkan hingga 15 gempa aktif pada halaman ini
  const items = data.slice(0, 15);
  const maxMag = 8.0;

  return (
    <section
      aria-label="Grafik distribusi magnitudo gempa"
      className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-7 space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
        <div>
          <h2 className="text-sm sm:text-base font-semibold text-[var(--color-text-primary)]">
            Distribusi magnitudo pada halaman ini
          </h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Menampilkan perbandingan magnitudo dari {items.length} kejadian terkini
          </p>
        </div>
        <span className="text-xs text-[var(--color-text-secondary)] tnum">
          {items.length} dari {totalData} gempa
        </span>
      </div>

      {/* SVG Bar Chart Murni Tanpa Library */}
      <div className="pt-2">
        <div className="h-32 w-full flex items-end gap-1.5 sm:gap-2 px-1 border-b border-[var(--color-border)] pb-2 overflow-x-auto">
          {items.map((item, idx) => {
            const heightPercent = Math.min(
              100,
              Math.max(12, (item.magnitudo / maxMag) * 100)
            );
            const isHigh = item.magnitudo >= 5.0;

            return (
              <div
                key={item.id || idx}
                className="group relative flex-1 min-w-[22px] max-w-[48px] flex flex-col items-center gap-1.5"
                title={`${item.wilayah}: ${item.magnitudo} M`}
              >
                {/* Nilai Magnitudo Floating */}
                <span className="absolute -top-6 text-[11px] font-semibold text-[var(--color-text-primary)] opacity-0 group-hover:opacity-100 transition-opacity tnum whitespace-nowrap bg-[var(--color-surface-strong)] px-1.5 py-0.5 rounded shadow-2xs border border-[var(--color-border)] pointer-events-none z-10">
                  {item.magnitudo.toFixed(1).replace(".", ",")} M
                </span>

                {/* Batang Bar SVG / CSS */}
                <div
                  className={`w-full rounded-t-lg transition-all duration-200 border ${
                    isHigh
                      ? "bg-[var(--color-primary)] border-[var(--color-primary)] opacity-90 group-hover:opacity-100"
                      : "bg-[var(--color-surface-raised)] border-[var(--color-border)] group-hover:bg-[var(--color-primary-subtle)]"
                  }`}
                  style={{ height: `${heightPercent}%` }}
                />

                {/* Nomor Urut */}
                <span className="text-[10px] text-[var(--color-text-muted)] tnum">
                  #{idx + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabel Ringkas Tersembunyi untuk Aksesibilitas (Screen Readers) */}
      <div className="sr-only">
        <table>
          <caption>Daftar magnitudo gempa yang ditampilkan</caption>
          <thead>
            <tr>
              <th scope="col">Nomor</th>
              <th scope="col">Magnitudo</th>
              <th scope="col">Wilayah</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id}>
                <td>#{i + 1}</td>
                <td>{item.magnitudo} M</td>
                <td>{item.wilayah}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
