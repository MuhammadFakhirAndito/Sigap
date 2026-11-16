import React from "react";
import { ExternalLink, Calendar } from "lucide-react";
import {
  formatTanggalIndonesia,
  getNewsPublisherSpec,
  getNewsThumbnailVisual,
  getSafeExternalHref,
  getUrlHostname,
} from "@/lib/edukasi";

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
            Berita terkait gempa &amp; mitigasi
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
          const publisher = getNewsPublisherSpec(item.sumber);
          const hostname = getUrlHostname(item.url);
          const visual = getNewsThumbnailVisual(item.judul);

          return (
            <article
              key={item.id}
              className="rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-5 sm:p-6 flex flex-col justify-between gap-4 transition-colors duration-150 hover:border-[var(--color-border-strong)]"
            >
              <div className="space-y-4">
                {/* Bar penerbit: monogram media + domain + tanggal */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      aria-hidden="true"
                      className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-xs font-semibold tracking-tight ${publisher.badgeClassName}`}
                    >
                      {publisher.initials}
                    </span>
                    <div className="min-w-0 leading-tight">
                      <p className="text-xs font-medium text-[var(--color-text-primary)] truncate">
                        {item.sumber}
                      </p>
                      {hostname && (
                        <p className="text-xs text-[var(--color-text-secondary)] truncate">
                          {hostname}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-text-secondary)] tabular-nums shrink-0">
                    <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formatTanggalIndonesia(item.tanggalTerbit, "short")}</span>
                  </span>
                </div>

                {/* Konten judul + ringkasan berdampingan dengan thumbnail editorial */}
                <div className="flex items-start gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <h3 className="text-base sm:text-lg font-medium text-[var(--color-text-primary)] leading-snug [text-wrap:balance]">
                      {item.judul}
                    </h3>

                    {item.ringkasan && (
                      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed [text-wrap:pretty] line-clamp-3">
                        {item.ringkasan}
                      </p>
                    )}
                  </div>

                  <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)]">
                    <img
                      src={visual.src}
                      alt={visual.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-3 border-t border-[var(--color-border)]/70 flex justify-end">
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-strong)] px-4 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] active:bg-[var(--color-primary-strong)] active:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
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
