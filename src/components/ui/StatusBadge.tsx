import React from "react";
import { CheckCircle2, AlertTriangle, HelpCircle } from "lucide-react";

export type StatusBadgeVariant =
  | "sync_ok"
  | "sync_warning"
  | "tsunami_aman"
  | "tsunami_berpotensi"
  | "tsunami_tidak_dinyatakan";

interface StatusBadgeProps {
  variant: StatusBadgeVariant;
  customText?: string;
  className?: string;
  onSurface?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  variant,
  customText,
  className = "",
}) => {
  let text = customText || "";
  let icon: React.ReactNode = null;
  let colorClasses = "";

  switch (variant) {
    case "sync_ok":
      text = text || "BMKG terhubung";
      icon = <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--color-success-strong)]" aria-hidden="true" />;
      colorClasses = "bg-[var(--color-surface-raised)] text-[var(--color-success-strong)] border border-[var(--color-success-strong)]";
      break;

    case "sync_warning":
      text = text || "BMKG tidak terjangkau";
      icon = <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[var(--color-warning-strong)]" aria-hidden="true" />;
      colorClasses = "bg-[var(--color-surface-raised)] text-[var(--color-warning-strong)] border border-[var(--color-warning-strong)]";
      break;

    case "tsunami_aman":
      text = text || "Tidak berpotensi tsunami";
      icon = <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[var(--color-success-strong)]" aria-hidden="true" />;
      colorClasses = "bg-[var(--color-surface-raised)] text-[var(--color-success-strong)] border border-[var(--color-success-strong)]";
      break;

    case "tsunami_berpotensi":
      text = text || "Berpotensi tsunami";
      icon = <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-[var(--color-error-strong)]" aria-hidden="true" />;
      colorClasses = "bg-[var(--color-surface-raised)] text-[var(--color-error-strong)] border border-[var(--color-error-strong)]";
      break;

    case "tsunami_tidak_dinyatakan":
    default:
      text = text || "Tidak dinyatakan";
      icon = <HelpCircle className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-secondary)]" aria-hidden="true" />;
      colorClasses = "bg-[var(--color-surface)] text-[var(--color-text-secondary)] border border-[var(--color-border-strong)]";
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[11px] sm:text-xs font-medium whitespace-nowrap shrink-0 tracking-normal transition-colors duration-150 ${colorClasses} ${className}`}
      role="status"
    >
      {icon}
      <span className="whitespace-nowrap">{text}</span>
    </span>
  );
};
