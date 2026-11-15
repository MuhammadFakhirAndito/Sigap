import React from "react";
import { ExternalLink, Newspaper, Calendar } from "lucide-react";
import { formatTanggalIndonesia, getSafeExternalHref } from "@/lib/edukasi";

export interface BeritaItem {
  id: string;
  judul: string;
  sumber: string;
  url: string;
  tanggalTerbit: Date;
  ringkasan?: string | null;
}

interface NewsMetadataListProps {
  beritaList: BeritaItem[];
}

export const NewsMetadataList: React.FC<NewsMetadataListProps> = ({ beritaList }) => {
  if (!beritaList || beritaList.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="heading-berita" className="space-y-5 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-[var(--color-border)] px-1">
        <div className="space-y-1">
          <p className="text-xs font-medium text-[var(--color-primary-strong)]">
            Arsip pemberitaan
          </p>
          <h2
            id="heading-berita"
            className="text-xl sm:text-2xl font-light tracking-[-0.02em] text-[var(--color-text-primary)] [text-wrap:balance]"
          >
            Berita terkait gempa & mitigasi
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] [text-wrap:pretty]">
            Metadata pemberitaan media massa terverifikasi. Konten penuh tersedia di situs penerbit asli.
          </p>
        </div>
        <span className="inline-flex items-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-secondary)] font-medium shrink-0 self-start sm:self-auto tabular-nums">
          {beritaList.length} liputan media
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {beritaList.map((item) => {
          const safeHref = getSafeExternalHref(item.url);
          return (
            <article
              key={item.id}
              className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors duration-150 hover:border-[var(--color-border-strong)]"
            >
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-2.5 py-1 font-medium text-[var(--color-text-primary)]">
                    <Newspaper className="w-3.5 h-3.5 shrink-0 text-[var(--color-primary-strong)]" aria-hidden="true" />
                    <span>{item.sumber}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formatTanggalIndonesia(item.tanggalTerbit, "short")}</span>
                  </span>
                </div>

                <h3 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)] leading-snug [text-wrap:balance]">
                  {item.judul}
                </h3>

                {item.ringkasan && (
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed [text-wrap:pretty]">
                    {item.ringkasan}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-[var(--color-border)]/70 flex justify-end">
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-strong)] px-4 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                  aria-label={`Buka berita "${item.judul}" di ${item.sumber} (tab baru)`}
                >
                  <span>Buka di {item.sumber}</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                </a>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};
