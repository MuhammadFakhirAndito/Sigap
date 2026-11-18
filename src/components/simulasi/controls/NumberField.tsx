"use client";

import React from "react";

interface NumberFieldProps {
  id: string;
  prefix?: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  value: string;
  describedBy: string;
  invalid: boolean;
  onChange: (raw: string) => void;
  /** Kelas warna latar; default `surface-raised` untuk dipakai di atas permukaan `surface`. */
  toneClassName?: string;
}

export function NumberField({
  id,
  prefix,
  unit,
  min,
  max,
  step,
  value,
  describedBy,
  invalid,
  onChange,
  toneClassName = "bg-[var(--color-surface-raised)]",
}: NumberFieldProps) {
  return (
    <div
      className={`flex w-[124px] min-h-[48px] shrink-0 items-center gap-1.5 rounded-full border border-[var(--color-border-strong)] px-4 transition-colors duration-150 focus-within:border-[var(--color-cta)] has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-[var(--color-primary-strong)] ${toneClassName}`}
    >
      {prefix && (
        <span aria-hidden="true" className="shrink-0 text-sm font-medium text-[var(--color-text-secondary)]">
          {prefix}
        </span>
      )}
      <input
        id={id}
        type="number"
        inputMode="decimal"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={invalid}
        aria-describedby={describedBy}
        className="tnum min-h-[44px] w-full min-w-0 bg-transparent text-right text-lg font-semibold text-[var(--color-text-primary)] focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />
      {unit && (
        <span className="shrink-0 text-sm font-medium text-[var(--color-text-secondary)]">{unit}</span>
      )}
    </div>
  );
}
