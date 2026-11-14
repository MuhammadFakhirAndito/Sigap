import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import type { KategoriArtikel } from "@prisma/client";
import { getKategoriLabel } from "@/lib/edukasi";

export interface SumberSummary {
  id: string;
  judul: string;
  penerbit: string;
  url: string;
}

export interface ArticleFeaturedCardProps {
  slug: string;
  judul: string;
  ringkasan?: string | null;
  kategori: KategoriArtikel;
  sumber: SumberSummary[];
}

export const ArticleFeaturedCard: React.FC<ArticleFeaturedCardProps> = ({
  slug,
  judul,
  ringkasan,
  kategori,
  sumber,
}) => {
  const labelKategori = getKategoriLabel(kategori);
  const penerbitList = Array.from(new Set(sumber.map((s) => s.penerbit))).join(", ");

  return (
    <article className="relative w-full rounded-3xl bg-[var(--color-surface-strong)] border border-[var(--color-border)] p-6 sm:p-8 lg:p-10 transition-colors duration-150 hover:border-[var(--color-text-primary)]/40 active:opacity-95 group">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
        <div className="space-y-3.5 max-w-3xl">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-text-primary)] px-3 py-1 text-xs font-medium">
              <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>{labelKategori}</span>
            </span>
          </div>

          <h3 className="text-2xl sm:text-3xl font-normal tracking-[-0.02em] text-[var(--color-text-primary)] leading-tight [text-wrap:balance]">
            <Link
              href={`/edukasi/${slug}`}
              className="inline-flex items-center min-h-[44px] py-1 after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary-hover)] rounded-lg"
            >
              {judul}
            </Link>
          </h3>

          {ringkasan && (
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-2xl [text-wrap:pretty]">
              {ringkasan}
            </p>
          )}

          <div className="flex items-start gap-2 pt-1 text-xs text-[var(--color-text-secondary)]">
            <ShieldCheck className="w-4 h-4 text-[var(--color-text-primary)] shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {sumber.length} sumber rujukan ({penerbitList || "Lembaga rujukan"})
            </span>
          </div>
        </div>

        <div className="shrink-0 self-start md:self-center pointer-events-none" aria-hidden="true">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-5 py-3 text-sm font-medium min-h-[44px] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-text-primary)]">
            <span>Baca artikel</span>
            <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </article>
  );
};
