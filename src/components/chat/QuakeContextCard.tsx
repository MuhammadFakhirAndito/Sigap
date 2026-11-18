"use client";

import React from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { intensityVar, magnitudeIntensity } from "@/lib/simulasi-visual";

export interface QuakeContextSummary {
  waktuWib: string;
  waktuUtcIso?: string | null;
  magnitudo: number;
  kedalamanKm: number;
  lat?: number;
  lon?: number;
  koordinat: string;
  wilayah: string;
  potensiTeks: string;
  dirasakan?: string | null;
}

export function formatMagnitudoId(mag: number): string {
  return Number.isFinite(mag) ? mag.toFixed(1).replace(".", ",") : "-";
}

function formatRelativeTimeWib(iso?: string | null): string | null {
  if (!iso) return null;
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return null;
  const diffMs = Date.now() - parsed.getTime();
  if (diffMs < 0) return "baru saja";
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  return `${days} hari lalu`;
}

function getDepthCategoryLabel(kedalamanKm: number): string {
  if (kedalamanKm <= 70) return "Dangkal";
  if (kedalamanKm <= 300) return "Menengah";
  return "Dalam";
}

function simulasiHref(q: QuakeContextSummary): string {
  const base = `/simulasi?m=${q.magnitudo}&d=${q.kedalamanKm}`;
  if (typeof q.lat === "number" && typeof q.lon === "number") {
    return `${base}&lat=${q.lat}&lon=${q.lon}&wilayah=${encodeURIComponent(q.wilayah)}`;
  }
  return base;
}

function buildAskQuakeQuestion(q: QuakeContextSummary): string {
  return `Bagaimana dampak dan langkah kesiapsiagaan untuk gempa terbaru M ${formatMagnitudoId(
    q.magnitudo
  )} di ${q.wilayah} (kedalaman ${q.kedalamanKm} km)?`;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]";

interface QuakeContextCardProps {
  quake: QuakeContextSummary | null | undefined;
  onAskQuake?: (question: string) => void;
}

/** Kartu konteks gempa terbaru BMKG berpola editorial bersih untuk kolom kiri (desktop). */
export function QuakeContextCard({ quake, onAskQuake }: QuakeContextCardProps) {
  if (!quake) {
    return (
      <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 space-y-2">
        <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="font-medium text-[var(--color-text-primary)]">Gempa terbaru</span>
          <span>BMKG</span>
        </div>
        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed [text-wrap:pretty]">
          Data gempa terbaru dari BMKG belum tersedia saat ini. Asisten tetap dapat menjawab
          pertanyaan mitigasi dan kesiapsiagaan.
        </p>
      </div>
    );
  }

  const intensity = magnitudeIntensity(quake.magnitudo);
  const accentColor = intensityVar(intensity.step);
  const relativeText = formatRelativeTimeWib(quake.waktuUtcIso);
  const depthLabel = getDepthCategoryLabel(quake.kedalamanKm);
  const dirasakanLabel =
    quake.dirasakan && quake.dirasakan.trim() !== "" && quake.dirasakan.trim() !== "-"
      ? quake.dirasakan.trim()
      : "Tidak tercatat dirasakan";

  return (
    <div className="rounded-[var(--radius-2xl)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
      <div className="flex items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
        <span className="inline-flex items-center gap-2 font-medium text-[var(--color-text-primary)]">
          <span
            aria-hidden="true"
            className="h-2 w-2 rounded-full motion-safe:animate-pulse"
            style={{ backgroundColor: accentColor }}
          />
          <span>Gempa terbaru{relativeText ? ` · ${relativeText}` : ""}</span>
        </span>
        <span>BMKG</span>
      </div>

      <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span
          className="inline-flex items-baseline gap-1 leading-none"
          style={{ color: accentColor }}
        >
          <span className="text-lg font-medium">M</span>
          <span className="text-[3.5rem] font-normal leading-none tracking-[-0.04em] tnum">
            {formatMagnitudoId(quake.magnitudo)}
          </span>
        </span>
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">
          · {intensity.label}
        </span>
      </p>

      <p className="mt-3 text-base font-medium leading-snug text-[var(--color-text-primary)] [text-wrap:pretty]">
        {quake.wilayah}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3 border-t border-[var(--color-border)] pt-4 text-xs">
        <div className="min-w-0">
          <dt className="text-[var(--color-text-secondary)]">Kedalaman</dt>
          <dd className="mt-0.5 font-medium text-[var(--color-text-primary)] tnum">
            {quake.kedalamanKm} km ({depthLabel})
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[var(--color-text-secondary)]">Koordinat</dt>
          <dd className="mt-0.5 font-medium text-[var(--color-text-primary)] tnum">
            {quake.koordinat}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[var(--color-text-secondary)]">Waktu</dt>
          <dd className="mt-0.5 font-medium text-[var(--color-text-primary)] tnum">
            {quake.waktuWib}
          </dd>
        </div>
        <div className="min-w-0">
          <dt className="text-[var(--color-text-secondary)]">Dirasakan</dt>
          <dd className="mt-0.5 font-medium text-[var(--color-text-primary)] break-words">
            {dirasakanLabel}
          </dd>
        </div>
      </dl>

      <p className="mt-4 border-t border-[var(--color-border)] pt-3 text-xs leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">
        {quake.potensiTeks}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        {onAskQuake && (
          <button
            type="button"
            onClick={() => onAskQuake(buildAskQuakeQuestion(quake))}
            className={`inline-flex min-h-[44px] items-center justify-center rounded-full bg-[var(--color-cta)] px-4 text-xs font-medium text-[var(--color-on-cta)] transition-colors hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] ${focusRing}`}
          >
            Tanyakan gempa ini
          </button>
        )}

        <Link
          href={simulasiHref(quake)}
          className={`inline-flex min-h-[44px] items-center gap-1 text-xs font-medium text-[var(--color-text-primary)] underline-offset-4 hover:underline ${focusRing}`}
        >
          <span>Simulasikan</span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </Link>

        <Link
          href="/riwayat"
          className={`inline-flex min-h-[44px] items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] underline-offset-4 hover:text-[var(--color-text-primary)] hover:underline ${focusRing}`}
        >
          <span>Lihat riwayat</span>
          <ArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

/** Strip ringkas yang dapat dibuka untuk layar di bawah 1024px. */
export function QuakeContextStrip({ quake, onAskQuake }: QuakeContextCardProps) {
  if (!quake) {
    return (
      <p className="px-4 py-3 text-xs text-[var(--color-text-secondary)] sm:px-6">
        Data gempa terbaru dari BMKG belum tersedia.
      </p>
    );
  }

  const intensity = magnitudeIntensity(quake.magnitudo);
  const accentColor = intensityVar(intensity.step);
  const relativeText = formatRelativeTimeWib(quake.waktuUtcIso);
  const depthLabel = getDepthCategoryLabel(quake.kedalamanKm);
  const dirasakanLabel =
    quake.dirasakan && quake.dirasakan.trim() !== "" && quake.dirasakan.trim() !== "-"
      ? quake.dirasakan.trim()
      : "Tidak tercatat dirasakan";

  return (
    <details className="group px-4 sm:px-6">
      <summary
        className={`flex min-h-[50px] cursor-pointer list-none items-center gap-2.5 text-sm [&::-webkit-details-marker]:hidden ${focusRing}`}
      >
        <span
          aria-hidden="true"
          className="h-2 w-2 shrink-0 rounded-full motion-safe:animate-pulse"
          style={{ backgroundColor: accentColor }}
        />
        <span className="shrink-0 font-semibold tnum" style={{ color: accentColor }}>
          M {formatMagnitudoId(quake.magnitudo)}
        </span>
        <span className="shrink-0 text-xs text-[var(--color-text-secondary)]">
          · {intensity.label}
        </span>
        <span className="min-w-0 flex-1 truncate text-[var(--color-text-primary)]">
          {quake.wilayah}
        </span>
        <span className="shrink-0 text-xs font-medium text-[var(--color-text-secondary)] group-open:hidden">
          Detail
        </span>
        <span className="hidden shrink-0 text-xs font-medium text-[var(--color-text-secondary)] group-open:inline">
          Tutup
        </span>
      </summary>

      <div className="space-y-3 pb-4 pt-1 text-xs leading-relaxed text-[var(--color-text-primary)]">
        <p className="font-medium [text-wrap:pretty]">{quake.wilayah}</p>
        <div className="space-y-1 text-[var(--color-text-secondary)]">
          <p className="tnum">
            Kedalaman {quake.kedalamanKm} km ({depthLabel}) · {quake.koordinat}
          </p>
          <p className="tnum">
            {quake.waktuWib}
            {relativeText ? ` (${relativeText})` : ""} · BMKG
          </p>
          <p>Dirasakan: {dirasakanLabel}</p>
          <p className="text-[var(--color-text-primary)]">{quake.potensiTeks}</p>
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
          {onAskQuake && (
            <button
              type="button"
              onClick={() => onAskQuake(buildAskQuakeQuestion(quake))}
              className={`inline-flex min-h-[44px] items-center rounded-full bg-[var(--color-cta)] px-4 text-xs font-medium text-[var(--color-on-cta)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors ${focusRing}`}
            >
              Tanyakan gempa ini
            </button>
          )}
          <Link
            href={simulasiHref(quake)}
            className={`inline-flex min-h-[44px] items-center gap-1 text-xs font-medium text-[var(--color-text-primary)] underline-offset-4 hover:underline ${focusRing}`}
          >
            <span>Simulasikan</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
          <Link
            href="/riwayat"
            className={`inline-flex min-h-[44px] items-center gap-1 text-xs font-medium text-[var(--color-text-secondary)] underline-offset-4 hover:text-[var(--color-text-primary)] hover:underline ${focusRing}`}
          >
            <span>Lihat riwayat</span>
            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </details>
  );
}
