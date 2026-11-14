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
    <section aria-labelledby="heading-berita" className="space-y-4 pt-4">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-[var(--color-border)] pb-3">
        <div>
          <h2 id="heading-berita" className="text-xl sm:text-2xl font-normal tracking-tight text-[var(--color-text-primary)] [text-wrap:balance]">
            Berita terkait gempa & mitigasi
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1 [text-wrap:pretty]">
            Metadata pemberitaan media massa terverifikasi. Konten penuh tersedia di situs penerbit asli.
          </p>
        </div>
        <span className="text-xs text-[var(--color-text-secondary)] font-medium shrink-0">
          {beritaList.length} liputan media
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {beritaList.map((item) => {
          const safeHref = getSafeExternalHref(item.url);
          return (
            <article
              key={item.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-5 flex flex-col justify-between gap-3 transition-colors duration-150 hover:border-[var(--color-text-primary)]/35"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
                  <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)]">
                    <Newspaper className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{item.sumber}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{formatTanggalIndonesia(item.tanggalTerbit, "short")}</span>
                  </span>
                </div>

                <h3 className="text-base font-medium text-[var(--color-text-primary)] leading-snug [text-wrap:balance]">
                  {item.judul}
                </h3>

                {item.ringkasan && (
                  <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed [text-wrap:pretty]">
                    {item.ringkasan}
                  </p>
                )}
              </div>

              <div className="pt-2 border-t border-[var(--color-border)]/70 flex justify-end">
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-primary)] underline decoration-[var(--color-primary)] decoration-2 underline-offset-4 hover:opacity-80 min-h-[44px] py-2 px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)] rounded"
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
