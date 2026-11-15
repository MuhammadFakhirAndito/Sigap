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
    <section aria-labelledby="heading-pustaka" className="space-y-5 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 pb-4 border-b border-[var(--color-border)] px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary-strong)]">
            <BookMarked className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Referensi terverifikasi</span>
          </div>
          <h2
            id="heading-pustaka"
            className="text-xl sm:text-2xl font-light tracking-[-0.02em] text-[var(--color-text-primary)] [text-wrap:balance]"
          >
            Daftar pustaka & sumber rujukan
          </h2>
          <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] max-w-2xl [text-wrap:pretty]">
            Seluruh artikel edukasi di SIGAP Gempa mengacu pada publikasi lembaga kebencanaan, dokumen geofisika, serta liputan media yang mengutip keterangan resmi.
          </p>
        </div>

        <span className="inline-flex items-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-secondary)] font-medium shrink-0 self-start sm:self-auto tabular-nums">
          {sumberList.length} dokumen sumber
        </span>
      </div>

      <div className="rounded-[28px] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
        <ul className="divide-y divide-[var(--color-border)]">
          {sumberList.map((item, idx) => {
            const safeHref = getSafeExternalHref(item.url);
            const formattedIdx = String(idx + 1).padStart(2, "0");
            return (
              <li
                key={item.id}
                className="py-4 sm:py-5 px-5 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-[var(--color-surface-raised)]"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                    <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--color-text-primary)]">
                      <span className="tabular-nums text-[var(--color-primary-strong)]">
                        [{formattedIdx}]
                      </span>
                      <span>{item.penerbit}</span>
                    </span>
                    <span className="tabular-nums">
                      Diakses pada {formatTanggalIndonesia(item.tanggalAkses, "long")}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-medium text-[var(--color-text-primary)] leading-snug [text-wrap:pretty]">
                    {item.judul}
                  </p>
                </div>

                <div className="shrink-0 self-start sm:self-center">
                  <a
                    href={safeHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] min-h-[44px] py-2 px-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
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

        <div className="rounded-[20px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4 sm:p-5 space-y-2 text-xs text-[var(--color-text-secondary)] leading-relaxed">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Peta, Layanan Tile, &amp; Pustaka Visualisasi Simulasi
          </p>
          <ul className="space-y-1.5 list-disc pl-5">
            <li>
              <strong className="text-[var(--color-text-primary)]">Peta Dasar OpenStreetMap:</strong>{" "}
              <a
                href="https://www.openstreetmap.org/copyright"
                target="_blank"
                rel="noopener noreferrer"
                className="underline underline-offset-2 text-[var(--color-text-primary)] font-medium"
              >
                © OpenStreetMap contributors
              </a>
              . Catatan privasi &amp; lalu lintas jaringan: permintaan gambar tile peta dikirim langsung dari peramban pengguna ke server OpenStreetMap ketika mode Peta Dampak dibuka.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">Leaflet (v1.9.4):</strong>{" "}
              Pustaka peta interaktif sumber terbuka berlisensi{" "}
              <span className="font-medium text-[var(--color-text-primary)]">BSD-2-Clause</span>.
            </li>
            <li>
              <strong className="text-[var(--color-text-primary)]">Three.js (v0.187.0):</strong>{" "}
              Pustaka visualisasi 3D WebGL berlisensi{" "}
              <span className="font-medium text-[var(--color-text-primary)]">MIT</span>; hanya dimuat ketika mode Getaran 3D dibuka.
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
};
