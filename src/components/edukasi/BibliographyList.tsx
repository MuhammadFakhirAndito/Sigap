import React from "react";
import { ExternalLink, BookMarked } from "lucide-react";
import { formatTanggalIndonesia, getSafeExternalHref } from "@/lib/edukasi";

export interface SumberPustakaItem {
  id: string;
  judul: string;
  penerbit: string;
  url: string;
  tanggalAkses: Date;
}

interface BibliographyListProps {
  sumberList: SumberPustakaItem[];
}

export const BibliographyList: React.FC<BibliographyListProps> = ({ sumberList }) => {
  if (!sumberList || sumberList.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="heading-pustaka" className="space-y-4 pt-6 border-t border-[var(--color-border)]">
      <div className="flex items-center gap-2">
        <BookMarked className="w-5 h-5 text-[var(--color-text-primary)] shrink-0" aria-hidden="true" />
        <h2 id="heading-pustaka" className="text-xl sm:text-2xl font-normal tracking-tight text-[var(--color-text-primary)] [text-wrap:balance]">
          Daftar pustaka & sumber rujukan
        </h2>
      </div>
      <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl [text-wrap:pretty]">
        Seluruh artikel edukasi di SIGAP Gempa mengacu pada publikasi lembaga kebencanaan, dokumen geofisika, serta liputan media yang mengutip keterangan resmi.
      </p>

      <div className="border-t border-b border-[var(--color-border)]">
        <ul className="divide-y divide-[var(--color-border)]">
          {sumberList.map((item, idx) => {
            const safeHref = getSafeExternalHref(item.url);
            return (
              <li
                key={item.id}
                className="py-4 px-2 sm:px-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-colors hover:bg-[var(--color-surface-strong)]"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                    <span className="font-semibold text-[var(--color-text-primary)]">
                      [{idx + 1}] {item.penerbit}
                    </span>
                    <span>Diakses pada {formatTanggalIndonesia(item.tanggalAkses, "long")}</span>
                  </div>
                  <p className="text-sm sm:text-base font-normal text-[var(--color-text-primary)] leading-snug [text-wrap:pretty]">
                    {item.judul}
                  </p>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  <a
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-primary)] underline decoration-[var(--color-primary)] decoration-2 underline-offset-4 min-h-[44px] py-2 px-3 rounded-full hover:bg-[var(--color-surface-strong)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)]"
                    aria-label={`Buka dokumen rujukan ${item.judul} dari ${item.penerbit} (tab baru)`}
                  >
                    <span>Lihat dokumen</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
};
