import React from "react";
import Link from "next/link";
import type { KategoriArtikel } from "@prisma/client";
import { ArrowUpRight, BookOpen, Layers, LifeBuoy, ShieldCheck } from "lucide-react";
import { getKategoriLabel } from "@/lib/edukasi";

export interface ArticleNotchedCardProps {
  slug: string;
  judul: string;
  ringkasan?: string | null;
  kategori: KategoriArtikel;
  reversed?: boolean;
  imageSrc: string;
  imageAlt: string;
  imageWidth: number;
  imageHeight: number;
  imagePosition?: string;
}

function renderCategoryIcon(kategori: KategoriArtikel) {
  switch (kategori) {
    case "PENGERTIAN":
      return <Layers className="w-4 h-4" aria-hidden="true" />;
    case "MITIGASI":
      return <ShieldCheck className="w-4 h-4" aria-hidden="true" />;
    case "PENANGGULANGAN":
      return <LifeBuoy className="w-4 h-4" aria-hidden="true" />;
    default:
      return <BookOpen className="w-4 h-4" aria-hidden="true" />;
  }
}

export const ArticleNotchedCard: React.FC<ArticleNotchedCardProps> = ({
  slug,
  judul,
  ringkasan,
  kategori,
  reversed = false,
  imageSrc,
  imageAlt,
  imageWidth,
  imageHeight,
  imagePosition = "object-center",
}) => {
  const labelKategori = getKategoriLabel(kategori);

  return (
    <article className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
      {/* Kartu teks bernotch (di mobile selalu tampil di atas gambar) */}
      <div
        className={`relative lg:col-span-5 ${
          reversed ? "lg:order-2" : "lg:order-1"
        }`}
      >
        <div className="group relative h-full min-h-[260px] lg:min-h-[292px] rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 sm:p-7 flex flex-col justify-between gap-5 transition-colors duration-200 hover:border-[var(--color-border-strong)] motion-reduce:transition-none">
          {/* Cekungan notch sudut kanan atas menyatu dengan latar halaman */}
          <svg
            width="88"
            height="88"
            viewBox="0 0 88 88"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="pointer-events-none absolute -top-px -right-px w-[88px] h-[88px]"
            aria-hidden="true"
          >
            <path
              d="M 0 0 L 88 0 L 88 88 L 87.5 88 C 87.5 74 80 66 66 64 C 40 63 25 48 24 22 C 22 8 14 0.5 0 0.5 Z"
              fill="var(--color-background)"
            />
            <path
              d="M 0 0.5 C 14 0.5 22 8 24 22 C 25 48 40 63 66 64 C 80 66 87.5 74 87.5 88"
              stroke="var(--color-border)"
              strokeWidth="1"
              fill="none"
            />
          </svg>

          {/* Lencana ikon di dalam lekukan sudut kanan atas */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-[10px] right-[10px] w-11 h-11 rounded-full border border-[var(--color-primary-strong)]/45 bg-[var(--color-surface-raised)] text-[var(--color-primary-strong)] flex items-center justify-center transition-colors duration-200 group-hover:bg-[var(--color-primary)] group-hover:border-[var(--color-primary)] group-hover:text-[var(--color-on-primary)] motion-reduce:transition-none"
          >
            {renderCategoryIcon(kategori)}
          </span>

          {/* Pil kategori kiri atas */}
          <div className="pr-20">
            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3.5 py-1 text-xs font-medium text-[var(--color-text-secondary)]">
              {labelKategori}
            </span>
          </div>

          {/* Teks dua-nada khas editorial */}
          <div className="space-y-4">
            <h3 className="text-lg sm:text-xl font-normal leading-snug tracking-[-0.015em] text-[var(--color-text-primary)] [text-wrap:balance]">
              <Link
                href={`/edukasi/${slug}`}
                className="after:absolute after:inset-0 rounded-[28px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
              >
                <span className="font-medium text-[var(--color-text-primary)]">{judul}</span>
                {ringkasan && (
                  <>
                    {" "}
                    <span className="text-[var(--color-text-secondary)]">{ringkasan}</span>
                  </>
                )}
              </Link>
            </h3>

            <div className="inline-flex items-center gap-1.5 min-h-[24px] text-xs font-medium text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-strong)] transition-colors motion-reduce:transition-none">
              <span>Baca modul</span>
              <ArrowUpRight className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </div>
          </div>
        </div>
      </div>

      {/* Panel visual lebar di sisi berlawanan */}
      <div
        className={`lg:col-span-7 overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] h-[220px] sm:h-[260px] lg:h-[292px] ${
          reversed ? "lg:order-1" : "lg:order-2"
        }`}
      >
        <img
          src={imageSrc}
          alt={imageAlt}
          width={imageWidth}
          height={imageHeight}
          loading="lazy"
          className={`w-full h-full object-cover ${imagePosition}`}
        />
      </div>
    </article>
  );
};
