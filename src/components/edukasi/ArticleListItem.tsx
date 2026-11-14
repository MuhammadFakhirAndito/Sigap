import React from "react";
import Link from "next/link";
import { ArrowRight, ShieldCheck } from "lucide-react";
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
    <article className="relative w-full py-5 sm:py-6 px-2 sm:px-3 transition-colors duration-150 hover:bg-[var(--color-surface-strong)]/80 active:opacity-90 group">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-[var(--color-text-secondary)]">
            {formattedNumber && (
              <span className="font-medium tabular-nums text-[var(--color-text-primary)]">
                {formattedNumber}
              </span>
            )}
            <span className="rounded-full bg-[var(--color-surface-strong)] border border-[var(--color-border)] px-2.5 py-0.5 text-xs font-medium text-[var(--color-text-primary)]">
              {labelKategori}
            </span>
            <span className="inline-flex items-start gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-text-primary)] shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                {sumber.length} sumber ({penerbitList || "Lembaga rujukan"})
              </span>
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-normal tracking-tight text-[var(--color-text-primary)] leading-snug [text-wrap:balance]">
            <Link
              href={`/edukasi/${slug}`}
              className="inline-flex items-center min-h-[44px] py-1 after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary-hover)] rounded"
            >
              {judul}
            </Link>
          </h3>

          {ringkasan && (
            <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed max-w-3xl [text-wrap:pretty]">
              {ringkasan}
            </p>
          )}
        </div>

        <div className="shrink-0 self-end sm:self-center pointer-events-none" aria-hidden="true">
          <span className="w-11 h-11 rounded-full border border-[var(--color-text-muted)] bg-[var(--color-surface-strong)] flex items-center justify-center text-[var(--color-text-primary)] transition-colors group-hover:bg-[var(--color-cta)] group-hover:text-[var(--color-on-cta)] group-hover:border-[var(--color-cta)]">
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </article>
  );
};
