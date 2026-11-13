import React from "react";
import { Info } from "lucide-react";
import { Button } from "./Button";

interface EmptyStateProps {
  message: string;
  actionText?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  actionText,
  onAction,
  className = "",
}) => {
  return (
    <div
      className={`bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[28px] p-8 text-center flex flex-col items-center justify-center gap-4 ${className}`}
      role="status"
    >
      <div className="w-12 h-12 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)]">
        <Info className="w-5 h-5" aria-hidden="true" />
      </div>
      <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-md">
        {message}
      </p>
      {actionText && onAction && (
        <Button variant="outline" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
};
