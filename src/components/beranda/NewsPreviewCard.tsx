import React from "react";
import { ExternalLink } from "lucide-react";
import { formatTanggalIndonesia, getSafeExternalHref } from "@/lib/edukasi";

export interface NewsPreviewCardProps {
  judul: string;
  sumber: string;
  url: string;
  tanggalTerbit: Date;
  ringkasan?: string | null;
  thumbnailSrc: string;
  thumbnailAlt: string;
}

interface PublisherBadgeSpec {
  initials: string;
  badgeClassName: string;
}

function getPublisherSpec(sumber: string): PublisherBadgeSpec {
  const normalized = sumber.trim().toLowerCase();
  if (normalized.includes("cnn")) {
    return {
      initials: "CNN",
      badgeClassName: "bg-[var(--color-error)] text-[var(--color-on-cta)]",
    };
  }
  if (normalized.includes("cnbc")) {
    return {
      initials: "CNBC",
      badgeClassName: "bg-[var(--color-primary-strong)] text-[var(--color-on-cta)]",
    };
  }
  if (normalized.includes("bisnis")) {
    return {
      initials: "BI",
      badgeClassName: "bg-[var(--color-cta)] text-[var(--color-on-cta)]",
    };
  }
  const letters = sumber
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  return {
    initials: letters || "BR",
    badgeClassName:
      "bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)]",
  };
}

function getHostname(rawUrl: string): string {
  try {
    return new URL(rawUrl).hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

/**
 * Kartu ringkas metadata berita rujukan dengan monogram penerbit, host sumber,
 * tanggal terbit, serta gambar editorial pendukung.
 */
export function NewsPreviewCard({
  judul,
  sumber,
  url,
  tanggalTerbit,
  ringkasan,
  thumbnailSrc,
  thumbnailAlt,
}: NewsPreviewCardProps) {
  const safeHref = getSafeExternalHref(url);
  const publisher = getPublisherSpec(sumber);
  const hostname = getHostname(url);

  return (
    <article className="group relative rounded-[20px] border border-[var(--color-border)] bg-[var(--color-background)]/75 hover:bg-[var(--color-surface)]/75 active:bg-[var(--color-surface-sunken)] hover:border-[var(--color-border-strong)] p-4 sm:p-5 transition-colors">
      <div className="flex items-start gap-4">
        <div className="min-w-0 flex-1 space-y-2.5">
          {/* Bar atas: monogram penerbit, nama media + domain, tanggal */}
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
                  {sumber}
                </p>
                {hostname && (
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">
                    {hostname}
                  </p>
                )}
              </div>
            </div>

            <span className="text-xs text-[var(--color-text-secondary)] tnum shrink-0">
              {formatTanggalIndonesia(tanggalTerbit, "short")}
            </span>
          </div>

          <h3 className="text-base font-medium text-[var(--color-text-primary)] leading-snug group-hover:text-[var(--color-primary-strong)] transition-colors">
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="after:absolute after:inset-0 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--color-primary-strong)] rounded"
              aria-label={`Buka berita "${judul}" di ${sumber} (tab baru)`}
            >
              <span>{judul}</span>
              <ExternalLink
                className="inline-block w-3.5 h-3.5 ml-1.5 -mt-0.5 text-[var(--color-text-secondary)] group-hover:text-[var(--color-primary-strong)]"
                aria-hidden="true"
              />
            </a>
          </h3>

          {ringkasan && (
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-2">
              {ringkasan}
            </p>
          )}
        </div>

        {/* Thumbnail berita editorial */}
        <div className="w-20 h-20 sm:w-24 sm:h-24 shrink-0 overflow-hidden rounded-[14px] border border-[var(--color-border)] bg-[var(--color-surface)] self-center">
          <img
            src={thumbnailSrc}
            alt={thumbnailAlt}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </article>
  );
}
