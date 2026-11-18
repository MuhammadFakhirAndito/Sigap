import React from "react";
import { ArrowUpRight } from "lucide-react";
import {
  formatTanggalIndonesia,
  getNewsPublisherSpec,
  getNewsThumbnailVisual,
  getSafeExternalHref,
  getUrlHostname,
} from "@/lib/edukasi";
import { EduSectionHeader } from "./EduSectionHeader";
import { NewsThumbnailImg } from "./NewsThumbnailImg";
import { EmptyState } from "@/components/ui/EmptyState";

export interface BeritaItem {
  id: string;
  judul: string;
  sumber: string;
  domain?: string | null;
  url: string;
  tanggalTerbit: Date;
  ringkasan?: string | null;
  thumbnailUrl?: string | null;
}

interface NewsMetadataListProps {
  beritaList: BeritaItem[];
}

export const NewsMetadataList: React.FC<NewsMetadataListProps> = ({ beritaList }) => {
  return (
    <section id="berita" aria-labelledby="heading-berita" className="scroll-mt-6 space-y-6 sm:space-y-8">
      <EduSectionHeader
        id="heading-berita"
        eyebrow="Arsip pemberitaan"
        title="Berita terkait gempa & mitigasi"
        description="Liputan media massa terverifikasi terkait gempa, megathrust, dan mitigasi. Konten penuh tersedia di situs penerbit asli."
        aside={
          beritaList.length > 0 ? (
            <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1 text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
              {beritaList.length} liputan media
            </span>
          ) : undefined
        }
      />

      {!beritaList || beritaList.length === 0 ? (
        <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6">
          <EmptyState className="border-0 bg-transparent p-0" message="Berita belum tersedia." />
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-5 md:grid-cols-2">
          {beritaList.map((item) => {
            const safeHref = getSafeExternalHref(item.url);
            const publisher = getNewsPublisherSpec(item.sumber);
            const visual = getNewsThumbnailVisual(item.judul);
            const hostname = item.domain || getUrlHostname(item.url);

            return (
              <li key={item.id}>
                <article className="group relative flex h-full flex-col overflow-hidden rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] transition-[background-color,border-color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-[var(--color-border-strong)] motion-reduce:hover:translate-y-0 has-[a:focus-visible]:outline-2 has-[a:focus-visible]:outline-offset-2 has-[a:focus-visible]:outline-[var(--color-primary-strong)]">
                  <div className="aspect-video w-full overflow-hidden bg-[var(--color-surface)]">
                    <NewsThumbnailImg
                      src={item.thumbnailUrl || visual.src}
                      fallbackSrc={visual.src}
                      alt={item.thumbnailUrl ? `Gambar liputan: ${item.judul}` : visual.alt}
                      loading="lazy"
                      width={1280}
                      height={720}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02] motion-reduce:transform-none"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-3 text-xs text-[var(--color-text-secondary)]">
                      <span className="inline-flex min-w-0 items-center gap-2.5">
                        <span
                          aria-hidden="true"
                          className="inline-flex h-7 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-strong)] px-2.5 text-[11px] font-semibold tracking-wide text-[var(--color-text-primary)]"
                        >
                          {publisher.initials}
                        </span>
                        <span className="min-w-0 leading-tight">
                          <span className="block truncate font-medium text-[var(--color-text-primary)]">
                            {item.sumber}
                          </span>
                          {hostname && (
                            <span className="block truncate text-[11px] text-[var(--color-text-secondary)]">
                              {hostname}
                            </span>
                          )}
                        </span>
                      </span>
                      <time
                        dateTime={new Date(item.tanggalTerbit).toISOString()}
                        className="shrink-0 tabular-nums"
                      >
                        {formatTanggalIndonesia(item.tanggalTerbit, "short")}
                      </time>
                    </div>

                    <h3 className="line-clamp-2 text-lg font-medium leading-snug tracking-[-0.01em] text-[var(--color-text-primary)]">
                      {item.judul}
                    </h3>

                    {item.ringkasan && (
                      <p className="line-clamp-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                        {item.ringkasan}
                      </p>
                    )}

                    <div className="mt-auto pt-2">
                      {/* Tautan diregangkan menutupi kartu agar seluruh kartu bisa diketuk. */}
                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Buka berita "${item.judul}" di ${item.sumber} (tab baru)`}
                        className="inline-flex min-h-[44px] items-center gap-1.5 text-sm font-medium text-[var(--color-text-primary)] underline-offset-4 outline-none after:absolute after:inset-0 after:content-[''] group-hover:underline"
                      >
                        <span>Buka di {item.sumber}</span>
                        <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};
