import React from "react";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = "", ...props }) => {
  return (
    <div
      className={`bg-[var(--color-surface-sunken)] rounded-2xl animate-pulse ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
};
