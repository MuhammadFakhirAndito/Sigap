"use client";

import React from "react";
import type {
  SimulasiInput,
  SimulasiNumericField,
  SimulasiResult,
  SimulasiValidationErrors,
} from "@/lib/simulasi";
import type { DistanceSyncState } from "@/lib/simulasi-visual";
import { MagnitudeControl } from "./controls/MagnitudeControl";
import { DepthControl } from "./controls/DepthControl";
import { DistanceControl } from "./controls/DistanceControl";
import { LiveSummary } from "./controls/LiveSummary";

export type SimulasiDraftStrings = Record<SimulasiNumericField, string>;

interface ControlPanelProps {
  validInput: SimulasiInput;
  drafts: SimulasiDraftStrings;
  errors: SimulasiValidationErrors;
  distanceSync: DistanceSyncState;
  result: SimulasiResult;
  onSliderChange: (field: "magnitudo" | "jarakPengamatKm", val: number) => void;
  onDraftChange: (field: "magnitudo" | "jarakPengamatKm", raw: string) => void;
  onKedalamanPresetSelect: (depthKm: number) => void;
}

/**
 * Hierarki: magnitudo = fokus (permukaan raised, angka terbesar); kedalaman, jarak
 * = permukaan `surface`; ringkasan MMI = raised. Antar-bagian dipisah jarak dan permukaan, bukan garis.
 */
export function ControlPanel({
  validInput,
  drafts,
  errors,
  distanceSync,
  result,
  onSliderChange,
  onDraftChange,
  onKedalamanPresetSelect,
}: ControlPanelProps) {
  return (
    <section aria-label="Panel parameter simulasi gempa" className="space-y-4">
      <MagnitudeControl
        value={validInput.magnitudo}
        draftValue={drafts.magnitudo}
        error={errors.magnitudo}
        onSliderChange={(v) => onSliderChange("magnitudo", v)}
        onDraftChange={(s) => onDraftChange("magnitudo", s)}
      />

      <DepthControl
        depthKm={validInput.kedalamanKm}
        error={errors.kedalamanKm}
        onSelect={onKedalamanPresetSelect}
      />

      <DistanceControl
        value={validInput.jarakPengamatKm}
        draftValue={drafts.jarakPengamatKm}
        error={errors.jarakPengamatKm}
        distanceSync={distanceSync}
        onSliderChange={(v) => onSliderChange("jarakPengamatKm", v)}
        onDraftChange={(s) => onDraftChange("jarakPengamatKm", s)}
      />

      <LiveSummary result={result} distanceLabel={distanceSync.formattedActualDistance} />
    </section >
  );
}
