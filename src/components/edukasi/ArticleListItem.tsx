import React from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import type { KategoriArtikel } from "@prisma/client";
import { getKategoriLabel } from "@/lib/edukasi";
import type { SumberSummary } from "./ArticleFeaturedCard";

export interface ArticleListItemProps {
  slug: string;
  judul: string;
  ringkasan?: string | null;
  kategori: KategoriArtikel;
  sumber: SumberSummary[];
  indexNumber?: number;
}

export const ArticleListItem: React.FC<ArticleListItemProps> = ({
  slug,
  judul,
  ringkasan,
  kategori,
  sumber,
  indexNumber,
}) => {
  const labelKategori = getKategoriLabel(kategori);
  const penerbitList = Array.from(new Set(sumber.map((s) => s.penerbit))).join(", ");
  const formattedNumber =
    typeof indexNumber === "number" ? String(indexNumber).padStart(2, "0") : null;

  return (
    <article className="relative w-full py-5 sm:py-6 px-5 sm:px-7 transition-colors duration-150 hover:bg-[var(--color-surface-raised)] active:opacity-90 group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
          {formattedNumber && (
            <span className="shrink-0 text-sm sm:text-base font-semibold tabular-nums text-[var(--color-primary-strong)] pt-0.5">
              {formattedNumber}
            </span>
          )}

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--color-text-secondary)]">
              <span className="rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-primary)]">
                {labelKategori}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-primary-strong)] shrink-0" aria-hidden="true" />
                <span>
                  {sumber.length} sumber ({penerbitList || "Lembaga rujukan"})
                </span>
              </span>
            </div>

            <h3 className="text-base sm:text-lg font-medium tracking-tight text-[var(--color-text-primary)] leading-snug [text-wrap:balance]">
              <Link
                href={`/edukasi/${slug}`}
                className="inline-flex items-center min-h-[44px] py-0.5 after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary-strong)] rounded"
              >
                {judul}
              </Link>
            </h3>

            {ringkasan && (
              <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed max-w-3xl [text-wrap:pretty]">
                {ringkasan}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 self-end sm:self-center pointer-events-none" aria-hidden="true">
          <span className="w-11 h-11 rounded-full border border-[var(--color-border-strong)]/60 bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-primary)] transition-colors group-hover:bg-[var(--color-cta)] group-hover:text-[var(--color-on-cta)] group-hover:border-[var(--color-cta)]">
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </article>
  );
};
