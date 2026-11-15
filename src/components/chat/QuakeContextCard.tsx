import React from 'react';
import Link from 'next/link';
import { ArrowUpRight, Info } from 'lucide-react';

export interface QuakeContextSummary {
  waktuWib: string;
  magnitudo: number;
  kedalamanKm: number;
  wilayah: string;
  koordinat: string;
  potensiTeks: string;
}

export function formatMagnitudoId(mag: number): string {
  return Number.isFinite(mag) ? mag.toFixed(1).replace('.', ',') : '-';
}

function simulasiHref(q: QuakeContextSummary): string {
  return `/simulasi?m=${q.magnitudo}&d=${q.kedalamanKm}`;
}

/** Kartu konteks gempa terbaru BMKG untuk kolom kiri (desktop). */
export function QuakeContextCard({ quake }: { quake: QuakeContextSummary | null | undefined }) {
  if (!quake) {
    return (
      <div className="rounded-[var(--radius-2xl)] bg-[var(--color-surface-raised)] p-6 space-y-2">
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">Gempa terbaru</p>
        <p className="text-sm text-[var(--color-text-primary)] [text-wrap:pretty]">
          Data gempa terbaru dari BMKG belum tersedia saat ini. Chatbot tetap dapat menjawab
          pertanyaan mitigasi.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-[var(--radius-2xl)] bg-[var(--color-surface-raised)] p-6">
      <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
        <span className="font-medium">Gempa terbaru</span>
        <span>Sumber: BMKG</span>
      </div>

      <p className="mt-4 flex items-baseline gap-1.5 text-[var(--color-primary-strong)]">
        <span className="text-lg font-medium">M</span>
        <span className="text-6xl font-light leading-none tracking-tight tnum">
          {formatMagnitudoId(quake.magnitudo)}
        </span>
      </p>

      <p className="mt-3 text-sm leading-snug text-[var(--color-text-primary)] [text-wrap:pretty]">
        {quake.wilayah}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--color-border)] pt-4 text-xs">
        <div>
          <dt className="text-[var(--color-text-secondary)]">Kedalaman</dt>
          <dd className="mt-0.5 font-medium text-[var(--color-text-primary)] tnum">
            {quake.kedalamanKm} km
          </dd>
        </div>
        <div>
          <dt className="text-[var(--color-text-secondary)]">Koordinat</dt>
          <dd className="mt-0.5 font-medium text-[var(--color-text-primary)] tnum">
            {quake.koordinat}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[var(--color-text-secondary)]">Waktu</dt>
          <dd className="mt-0.5 font-medium text-[var(--color-text-primary)] tnum">
            {quake.waktuWib}
          </dd>
        </div>
      </dl>

      <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-[var(--color-text-primary)]">
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />
        <span>{quake.potensiTeks}</span>
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <Link
          href="/riwayat"
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] px-4 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-surface-raised)]"
        >
          Lihat riwayat
        </Link>
        <Link
          href={simulasiHref(quake)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-full bg-[var(--color-cta)] px-4 text-xs font-medium text-[var(--color-on-cta)] transition-opacity hover:opacity-90"
        >
          Simulasikan
          <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/** Strip ringkas yang bisa dibuka untuk layar di bawah 1024px. */
export function QuakeContextStrip({ quake }: { quake: QuakeContextSummary | null | undefined }) {
  if (!quake) {
    return (
      <p className="px-4 py-3 text-xs text-[var(--color-text-secondary)] sm:px-6">
        Data gempa terbaru dari BMKG belum tersedia.
      </p>
    );
  }

  return (
    <details className="group px-4 sm:px-6">
      <summary className="flex min-h-[48px] cursor-pointer list-none items-center gap-3 text-sm [&::-webkit-details-marker]:hidden">
        <span className="shrink-0 font-medium text-[var(--color-primary-strong)] tnum">
          M {formatMagnitudoId(quake.magnitudo)}
        </span>
        <span className="min-w-0 flex-1 truncate text-[var(--color-text-primary)]">
          {quake.wilayah}
        </span>
        <span className="shrink-0 text-xs text-[var(--color-text-secondary)] group-open:hidden">
          Detail
        </span>
        <span className="hidden shrink-0 text-xs text-[var(--color-text-secondary)] group-open:inline">
          Tutup
        </span>
      </summary>
      <div className="space-y-1.5 pb-4 text-xs leading-relaxed text-[var(--color-text-primary)]">
        <p className="[text-wrap:pretty]">{quake.wilayah}</p>
        <p className="tnum">
          Kedalaman {quake.kedalamanKm} km · {quake.koordinat}
        </p>
        <p className="tnum">{quake.waktuWib} · Sumber: BMKG</p>
        <p>{quake.potensiTeks}</p>
      </div>
    </details>
  );
}

