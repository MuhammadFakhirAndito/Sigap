import React from "react";

interface EduSectionHeaderProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  aside?: React.ReactNode;
}

export function EduSectionHeader({ id, eyebrow, title, description, aside }: EduSectionHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-[60ch] space-y-2">
        <p className="text-xs font-medium text-[var(--color-primary-strong)]">{eyebrow}</p>
        <h2
          id={id}
          className="text-2xl sm:text-3xl font-medium tracking-[-0.03em] leading-tight text-[var(--color-text-primary)] [text-wrap:balance]"
        >
          {title}
        </h2>
        {description && (
          <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">
            {description}
          </p>
        )}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </div>
  );
}
