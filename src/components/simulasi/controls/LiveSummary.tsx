import React from "react";
import { AlertTriangle, Info } from "lucide-react";
import type { SimulasiResult } from "@/lib/simulasi";
import { intensityVar, mmiIntensityStep } from "@/lib/simulasi-visual";

interface LiveSummaryProps {
  result: SimulasiResult;
  distanceLabel: string;
}

/**
 * Ringkasan MMI di lokasi pengamat, dari `result` yang sudah dihitung SimulasiWorkspace.
 * Hanya tampil di layar lebar: di bawah lg, bar sticky di SimulasiWorkspace sudah menampilkannya.
 */
export function LiveSummary({ result, distanceLabel }: LiveSummaryProps) {
  const { mmi } = result;
  const color = intensityVar(mmiIntensityStep(mmi.clampedLevel));
  const outside = mmi.outsideMagRange || mmi.outsideDistRange;

  return (
    <div className="hidden rounded-[28px] bg-[var(--color-surface-raised)] p-5 sm:p-6 lg:block">
      <p className="text-sm text-[var(--color-text-secondary)]">Perkiraan di lokasi Anda, {distanceLabel} dari pusat gempa</p>

      <div className="mt-3 flex items-center gap-4">
        <span
          className="tnum flex h-16 min-w-16 items-center justify-center rounded-[20px] px-3 text-[2rem] font-bold leading-none text-[var(--color-on-cta)]"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        >
          {mmi.roman}
        </span>
        <div className="min-w-0">
          <p className="text-xl font-semibold leading-tight text-[var(--color-text-primary)]">
            <span className="sr-only">Intensitas MMI {mmi.roman}: </span>
            {mmi.label}
          </p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)] tnum">
            Energi ≈ {result.energy.text}
          </p>
        </div>
      </div>

      <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{mmi.description}</p>

      {outside && (
        <p className="mt-3 flex items-start gap-2 text-sm font-medium text-[var(--color-warning-strong)]">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Di luar rentang kalibrasi rumus, hasil hanya gambaran kasar.</span>
        </p>
      )}

      <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
        <Info className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Estimasi edukasi, bukan data resmi BMKG
      </p>
    </div>
  );
}
