"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, ExternalLink, Search, X } from "lucide-react";
import { getSafeExternalHref } from "@/lib/edukasi";
import {
  PUSTAKA_GROUP_LABELS,
  PUSTAKA_GROUP_ORDER,
  getPustakaGroup,
  type PustakaGroupKey,
} from "@/lib/edukasi-visual";
import { EduSectionHeader } from "./EduSectionHeader";

export interface SumberPustakaItem {
  id: string;
  judul: string;
  penerbit: string;
  url: string;
  /** Tanggal akses yang sudah diformat di server (WIB). */
  tanggalAksesText: string;
}

interface BibliographyListProps {
  sumberList: SumberPustakaItem[];
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]";

export const BibliographyList: React.FC<BibliographyListProps> = ({ sumberList }) => {
  const [query, setQuery] = useState("");

  const numbered = useMemo(() => {
    const ordered = PUSTAKA_GROUP_ORDER.flatMap((key) =>
      sumberList.filter((s) => getPustakaGroup(s.penerbit) === key)
    );
    return ordered.map((item, idx) => ({ ...item, nomor: idx + 1, group: getPustakaGroup(item.penerbit) }));
  }, [sumberList]);

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? numbered.filter(
        (s) =>
          s.judul.toLowerCase().includes(normalizedQuery) ||
          s.penerbit.toLowerCase().includes(normalizedQuery)
      )
    : numbered;

  const groups = PUSTAKA_GROUP_ORDER.map((key) => ({
    key,
    items: filtered.filter((s) => s.group === key),
  })).filter((g): g is { key: PustakaGroupKey; items: typeof filtered } => g.items.length > 0);

  if (!sumberList || sumberList.length === 0) {
    return null;
  }

  return (
    <section id="pustaka" aria-labelledby="heading-pustaka" className="scroll-mt-6 space-y-6 sm:space-y-8">
      <EduSectionHeader
        id="heading-pustaka"
        eyebrow="Referensi terverifikasi"
        title="Daftar pustaka & sumber rujukan"
        description="Seluruh artikel edukasi di SIGAP Gempa mengacu pada publikasi lembaga kebencanaan, dokumen geofisika, serta liputan media yang mengutip keterangan resmi."
        aside={
          <span className="inline-flex items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-3 py-1 text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
            {sumberList.length} dokumen sumber
          </span>
        }
      />

      <div className="relative max-w-md">
        <label htmlFor="cari-pustaka" className="sr-only">
          Cari judul dokumen atau lembaga
        </label>
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-secondary)]"
          aria-hidden="true"
        />
        <input
          id="cari-pustaka"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari judul atau lembaga"
          autoComplete="off"
          className={`min-h-[44px] w-full rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] pl-11 pr-11 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] [&::-webkit-search-cancel-button]:appearance-none ${focusRing}`}
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Hapus pencarian"
            className={`absolute right-0.5 top-1/2 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] ${focusRing}`}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {normalizedQuery ? `${filtered.length} dokumen cocok` : ""}
      </p>

      {groups.length === 0 ? (
        <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 text-sm text-[var(--color-text-secondary)]">
          <p>Tidak ada dokumen yang cocok dengan &ldquo;{query.trim()}&rdquo;.</p>
          <button
            type="button"
            onClick={() => setQuery("")}
            className={`mt-3 inline-flex min-h-[44px] items-center rounded-full border border-[var(--color-border-strong)] px-4 text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] ${focusRing}`}
          >
            Tampilkan semua sumber
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <details
              key={group.key}
              // Saat mencari, semua kelompok yang cocok dibuka agar hasil langsung terlihat.
              open={normalizedQuery ? true : undefined}
              className="group/acc rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] open:border-[var(--color-border-strong)]"
            >
              <summary
                className={`flex min-h-[64px] cursor-pointer list-none items-center justify-between gap-4 rounded-[28px] px-5 sm:px-6 [&::-webkit-details-marker]:hidden ${focusRing}`}
              >
                <span className="flex items-baseline gap-3">
                  <span className="text-base font-semibold text-[var(--color-text-primary)]">
                    {PUSTAKA_GROUP_LABELS[group.key]}
                  </span>
                  <span className="text-xs tabular-nums text-[var(--color-text-secondary)]">
                    {group.items.length} dokumen
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface)] transition-transform duration-200 group-open/acc:rotate-180 motion-reduce:transition-none"
                >
                  <ChevronDown className="h-4 w-4" />
                </span>
              </summary>

              <ol className="space-y-1 px-2 pb-2 sm:px-3 sm:pb-3">
                {group.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-col gap-3 rounded-[20px] px-3 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-4 hover:bg-[var(--color-background)]"
                  >
                    <div className="flex min-w-0 gap-3">
                      <span className="w-7 shrink-0 pt-0.5 text-xs font-semibold tabular-nums text-[var(--color-text-secondary)]">
                        [{String(item.nomor).padStart(2, "0")}]
                      </span>
                      <p className="min-w-0 text-sm leading-relaxed text-[var(--color-text-secondary)] [text-wrap:pretty]">
                        <span className="font-semibold text-[var(--color-text-primary)]">{item.penerbit}.</span>{" "}
                        <span className="text-[var(--color-text-primary)]">{item.judul}.</span>{" "}
                        <span className="tabular-nums">Diakses pada {item.tanggalAksesText}.</span>
                      </p>
                    </div>
                    <a
                      href={getSafeExternalHref(item.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Buka dokumen rujukan ${item.judul} dari ${item.penerbit} (tab baru)`}
                      className={`ml-10 inline-flex min-h-[44px] shrink-0 items-center gap-1.5 self-start rounded-full border border-[var(--color-border-strong)] px-4 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-cta)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] sm:ml-0 sm:self-center ${focusRing}`}
                    >
                      <span>Lihat dokumen</span>
                      <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </div>
      )}

      <div className="rounded-[28px] bg-[var(--color-surface)] p-5 sm:p-6 space-y-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          Peta, Layanan Tile, &amp; Pustaka Visualisasi Simulasi
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>
            <strong className="text-[var(--color-text-primary)]">Peta Dasar OpenStreetMap:</strong>{" "}
            <a
              href="https://www.openstreetmap.org/copyright"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[var(--color-text-primary)] underline underline-offset-2"
            >
              © OpenStreetMap contributors
            </a>
            . Catatan privasi &amp; lalu lintas jaringan: permintaan gambar tile peta dikirim langsung dari peramban pengguna ke server OpenStreetMap ketika mode Peta Dampak dibuka.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">Leaflet (v1.9.4):</strong> Pustaka peta interaktif sumber terbuka berlisensi{" "}
            <span className="font-medium text-[var(--color-text-primary)]">BSD-2-Clause</span>.
          </li>
          <li>
            <strong className="text-[var(--color-text-primary)]">Three.js (v0.187.0):</strong> Pustaka visualisasi 3D WebGL berlisensi{" "}
            <span className="font-medium text-[var(--color-text-primary)]">MIT</span>; hanya dimuat ketika mode Getaran 3D dibuka.
          </li>
        </ul>
      </div>
    </section>
  );
};
