import React from "react";
import Link from "next/link";
import { ArrowUpRight, BookOpen, ShieldCheck } from "lucide-react";
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
  indexNumber?: number;
  variant?: "lead" | "companion";
}

export const ArticleFeaturedCard: React.FC<ArticleFeaturedCardProps> = ({
  slug,
  judul,
  ringkasan,
  kategori,
  sumber,
  indexNumber = 1,
  variant = "lead",
}) => {
  const labelKategori = getKategoriLabel(kategori);
  const penerbitList = Array.from(new Set(sumber.map((s) => s.penerbit))).join(", ");
  const formattedIndex = String(indexNumber).padStart(2, "0");

  if (variant === "companion") {
    return (
      <article className="relative w-full h-full rounded-[24px] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors duration-150 hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-raised)] active:opacity-95 group">
        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tabular-nums text-[var(--color-primary-strong)]">
                {formattedIndex}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] text-[var(--color-text-primary)] px-2.5 py-0.5 text-xs font-medium">
                {labelKategori}
              </span>
            </div>

            <span
              aria-hidden="true"
              className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-primary)] transition-colors group-hover:bg-[var(--color-cta)] group-hover:text-[var(--color-on-cta)] group-hover:border-[var(--color-cta)]"
            >
              <ArrowUpRight className="w-4 h-4" />
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-normal tracking-[-0.02em] text-[var(--color-text-primary)] leading-snug [text-wrap:balance]">
            <Link
              href={`/edukasi/${slug}`}
              className="inline-flex items-center min-h-[44px] py-0.5 after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary-strong)] rounded-lg"
            >
              {judul}
            </Link>
          </h3>

          {ringkasan && (
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed [text-wrap:pretty]">
              {ringkasan}
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-[var(--color-border)]/70 flex items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-primary-strong)] shrink-0" aria-hidden="true" />
            <span>
              {sumber.length} sumber ({penerbitList || "Rujukan resmi"})
            </span>
          </span>
        </div>
      </article>
    );
  }

  return (
    <article className="relative w-full h-full rounded-[28px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-6 sm:p-8 lg:p-9 flex flex-col justify-between gap-6 transition-colors duration-150 hover:border-[var(--color-border-strong)] active:opacity-95 group">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center justify-center rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-3 py-1 text-xs font-semibold tabular-nums">
              {formattedIndex}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-strong)]/60 text-[var(--color-text-primary)] px-3 py-1 text-xs font-medium">
              <BookOpen className="w-3.5 h-3.5 shrink-0 text-[var(--color-primary-strong)]" aria-hidden="true" />
              <span>{labelKategori}</span>
            </span>
          </div>

          <span className="text-xs font-medium text-[var(--color-primary-strong)]">
            Panduan utama
          </span>
        </div>

        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-light tracking-[-0.03em] text-[var(--color-text-primary)] leading-[1.15] [text-wrap:balance]">
          <Link
            href={`/edukasi/${slug}`}
            className="inline-flex items-center min-h-[44px] py-1 after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary-strong)] rounded-lg"
          >
            {judul}
          </Link>
        </h3>

        {ringkasan && (
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed max-w-2xl [text-wrap:pretty]">
            {ringkasan}
          </p>
        )}
      </div>

      <div className="pt-5 border-t border-[var(--color-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
          <ShieldCheck className="w-4 h-4 text-[var(--color-primary-strong)] shrink-0 mt-0.5" aria-hidden="true" />
          <span>
            Disusun dari <strong className="font-medium text-[var(--color-text-primary)]">{sumber.length} sumber rujukan</strong> ({penerbitList || "Lembaga rujukan"})
          </span>
        </div>

        <div className="shrink-0 self-start sm:self-center pointer-events-none" aria-hidden="true">
          <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-5 py-2.5 text-xs sm:text-sm font-medium min-h-[44px] transition-colors group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-text-primary)]">
            <span>Baca panduan</span>
            <ArrowUpRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </article>
  );
};
