import React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./Button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Terjadi Kendala Memuat Data",
  message,
  onRetry,
  className = "",
}) => {
  return (
    <div
      className={`bg-[var(--color-surface)] border border-[var(--color-warning)]/40 rounded-[28px] p-6 sm:p-8 text-center flex flex-col items-center justify-center gap-3 ${className}`}
      role="alert"
    >
      <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-warning)]/40 flex items-center justify-center text-[var(--color-warning-strong)]">
        <AlertCircle className="w-6 h-6" aria-hidden="true" />
      </div>

      <h3 className="font-semibold text-base sm:text-lg text-[var(--color-text-primary)]">
        {title}
      </h3>

      <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
        {message}
      </p>

      {onRetry && (
        <Button
          variant="outline"
          onClick={onRetry}
          icon={<RefreshCw className="w-4 h-4" aria-hidden="true" />}
          className="mt-2"
        >
          Coba Lagi
        </Button>
      )}
    </div>
  );
};
