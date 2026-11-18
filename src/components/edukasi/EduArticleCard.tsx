import React from "react";
import Link from "next/link";
import { ArrowUpRight, Clock, type LucideIcon } from "lucide-react";

interface EduArticleCardProps {
  slug: string;
  judul: string;
  ringkasan: string | null;
  kategoriLabel: string;
  readMinutes: number;
  sourceLabels: string[];
  sourceCount: number;
  indexNumber: number;
  icon: LucideIcon;
  featured?: boolean;
  badge?: string;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]";

export function EduArticleCard({
  slug,
  judul,
  ringkasan,
  kategoriLabel,
  readMinutes,
  sourceLabels,
  sourceCount,
  indexNumber,
  icon: Icon,
  featured = false,
  badge,
}: EduArticleCardProps) {
  const number = String(indexNumber).padStart(2, "0");

  // Kartu featured memakai permukaan gelap `cta` sebagai penekanan, bukan warna semantik (DESIGN.md).
  const tone = featured
    ? {
        card: "bg-[var(--color-cta)] text-[var(--color-on-cta)] border-[var(--color-cta)] hover:bg-[color-mix(in_srgb,var(--color-cta)_88%,var(--color-on-cta))]",
        iconWrap: "bg-[var(--color-on-cta)]/10 text-[var(--color-on-cta)]",
        muted: "text-[var(--color-on-cta)]/75",
        chip: "border-[var(--color-on-cta)]/25 text-[var(--color-on-cta)]",
        arrow: "bg-[var(--color-on-cta)] text-[var(--color-cta)]",
      }
    : {
        card: "bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:border-[var(--color-border-strong)]",
        iconWrap: "bg-[var(--color-surface)] text-[var(--color-text-primary)]",
        muted: "text-[var(--color-text-secondary)]",
        chip: "border-[var(--color-border)] text-[var(--color-text-secondary)]",
        arrow:
          "bg-[var(--color-surface)] text-[var(--color-text-primary)] group-hover:bg-[var(--color-cta)] group-hover:text-[var(--color-on-cta)]",
      };

  return (
    <Link
      href={`/edukasi/${slug}`}
      className={`group relative flex h-full flex-col rounded-[28px] border transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 motion-reduce:hover:translate-y-0 ${tone.card} ${focusRing} ${
        featured ? "p-6 sm:p-8 gap-6" : "p-5 sm:p-6 gap-5"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className={`inline-flex shrink-0 items-center justify-center rounded-full ${tone.iconWrap} ${
            featured ? "h-14 w-14" : "h-11 w-11"
          }`}
        >
          <Icon className={featured ? "h-6 w-6" : "h-5 w-5"} strokeWidth={1.75} />
        </span>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {badge && (
            <span className="inline-flex items-center rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-[var(--color-cta)]">
              {badge}
            </span>
          )}
          <span className={`text-xs font-medium tabular-nums ${tone.muted}`}>{number}</span>
        </div>
      </div>

      <div className="flex-1 space-y-2">
        <p className={`text-xs font-medium ${tone.muted}`}>{kategoriLabel}</p>
        <h3
          className={`font-medium leading-snug tracking-[-0.02em] [text-wrap:balance] ${
            featured ? "text-2xl sm:text-[1.75rem]" : "text-lg"
          }`}
        >
          {judul}
        </h3>
        {ringkasan && (
          <p
            className={`text-sm leading-relaxed [text-wrap:pretty] ${tone.muted} ${
              featured ? "max-w-[56ch]" : "line-clamp-3"
            }`}
          >
            {ringkasan}
          </p>
        )}
      </div>

      <div className="flex items-end justify-between gap-3">
        <div className={`flex flex-wrap items-center gap-x-3 gap-y-2 text-xs ${tone.muted}`}>
          <span className="inline-flex items-center gap-1 tabular-nums">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {readMinutes} menit baca
          </span>
          {sourceCount > 0 && (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              <span className="sr-only">
                {sourceCount} sumber: {sourceLabels.join(", ")}
              </span>
              {sourceLabels.map((label) => (
                <span
                  key={label}
                  aria-hidden="true"
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wide ${tone.chip}`}
                >
                  {label}
                </span>
              ))}
            </span>
          )}
        </div>
        <span
          aria-hidden="true"
          className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-[background-color,color,transform] duration-200 group-hover:-translate-y-0.5 motion-reduce:transform-none ${tone.arrow}`}
        >
          <ArrowUpRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}
