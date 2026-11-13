import React from "react";

interface MagnitudeBadgeProps {
  magnitude: number | string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  showLabel?: boolean;
}

export const MagnitudeBadge: React.FC<MagnitudeBadgeProps> = ({
  magnitude,
  size = "md",
  className = "",
  showLabel = false,
}) => {
  const num = typeof magnitude === "string" ? parseFloat(magnitude) : magnitude;
  const formatted = isNaN(num) ? "0,0" : num.toFixed(1).replace(".", ",");

  let sizeClasses = "text-base font-semibold px-2.5 py-1 rounded-full";
  if (size === "sm") {
    sizeClasses = "text-sm font-semibold px-2 py-0.5 rounded-full";
  } else if (size === "lg") {
    sizeClasses = "text-2xl font-bold px-3.5 py-1.5 rounded-full";
  } else if (size === "xl") {
    sizeClasses = "text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight";
  }

  if (size === "xl") {
    return (
      <div className={`flex flex-col ${className}`}>
        {showLabel && (
          <span className="text-xs font-semibold text-[var(--color-text-secondary)] mb-1">
            Magnitudo
          </span>
        )}
        <span
          className={`tnum text-[var(--color-primary)] ${sizeClasses}`}
          style={{ fontVariantNumeric: "tabular-nums" }}
        >
          {formatted}
        </span>
      </div>
    );
  }

  return (
    <span
      className={`tnum inline-flex items-center justify-center bg-[var(--color-surface-raised)] text-[var(--color-primary)] border border-[var(--color-border)] shadow-xs ${sizeClasses} ${className}`}
      style={{ fontVariantNumeric: "tabular-nums" }}
    >
      <span className="sr-only">Magnitudo: </span>
      {formatted}
      {showLabel && <span className="ml-1 text-xs text-[var(--color-text-secondary)]">SR</span>}
    </span>
  );
};
