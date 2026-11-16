import * as React from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export interface ScenarioOverlayCardProps {
  /** URL foto lanskap lokal (disimpan di public/images/) */
  imageUrl: string;
  /** Teks alternatif foto dalam bahasa Indonesia */
  imageAlt: string;
  /** Ikon konteks lokasi (laut / darat) di pojok kiri atas */
  icon: React.ReactNode;
  /** Nama skenario historis dari database SkenarioSimulasi */
  title: string;
  /** Ringkasan lokasi, kedalaman, dan koordinat terformat */
  metaLine: string;
  /** Deskripsi singkat skenario historis */
  overview: string;
  /** Magnitudo yang sudah diformat dengan koma lokal (mis. "9,1") */
  magnitudeText: string;
  /** Label tipe lokasi ("Lokasi laut" | "Lokasi darat") */
  locationTypeLabel: string;
  /** Tautan ke /simulasi dengan parameter query preset */
  href: string;
  /** Label aksesibilitas untuk tautan kartu */
  ariaLabel?: string;
}

/**
 * Kartu skenario simulasi berlatar foto dengan pengungkapan aksi saat hover/fokus.
 * Diadaptasi dari pola overlay editorial agar tetap datar (tanpa drop shadow),
 * kontras AA di atas foto lewat scrim gelap #1A1613, serta tetap terbaca di layar sentuh.
 */
export function ScenarioOverlayCard({
  imageUrl,
  imageAlt,
  icon,
  title,
  metaLine,
  overview,
  magnitudeText,
  locationTypeLabel,
  href,
  ariaLabel,
}: ScenarioOverlayCardProps) {
  return (
    <article className="group relative flex min-h-[430px] w-full flex-col justify-between overflow-hidden rounded-[20px] border border-[var(--color-border-strong)] bg-[var(--color-cta)] transition-[border-color,transform] duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-1.5 hover:border-[var(--color-cta)] motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      {/* Latar foto penuh dengan zoom halus saat hover atau fokus */}
      <img
        src={imageUrl}
        alt={imageAlt}
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-[cubic-bezier(0.2,0,0,1)] group-hover:scale-105 group-focus-within:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100 motion-reduce:group-focus-within:scale-100"
      />

      {/* Scrim bawah berbasis --color-cta: menjaga kontras AA tanpa menggelapkan bagian atas foto */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, color-mix(in srgb, var(--color-cta) 88%, transparent) 0%, color-mix(in srgb, var(--color-cta) 68%, transparent) 44%, color-mix(in srgb, var(--color-cta) 34%, transparent) 64%, transparent 82%)",
        }}
      />

      <div className="pointer-events-none relative z-10 flex flex-1 flex-col justify-between p-6 text-[var(--color-on-cta)]">
        {/* Bagian atas: badge ikon bulat */}
        <div className="flex h-28 items-start lg:h-32">
          <span
            aria-hidden="true"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-[var(--color-on-cta)]/40 bg-[var(--color-cta)]/55 text-[var(--color-on-cta)] backdrop-blur-sm"
          >
            {icon}
          </span>
        </div>

        {/* Bagian tengah: metadata skenario; terangkat di desktop saat hover/fokus */}
        <div className="space-y-4 pb-24 lg:pb-0 motion-reduce:lg:pb-24 lg:transition-transform lg:duration-500 lg:ease-[cubic-bezier(0.2,0,0,1)] lg:group-hover:-translate-y-20 lg:group-focus-within:-translate-y-20 motion-reduce:transition-none motion-reduce:lg:group-hover:translate-y-0 motion-reduce:lg:group-focus-within:translate-y-0">
          <div>
            <h3 className="text-2xl font-medium tracking-tight text-[var(--color-on-cta)] leading-snug">
              {title}
            </h3>
            <p className="mt-1 text-xs sm:text-sm text-[var(--color-surface)] tnum">
              {metaLine}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-medium text-[var(--color-on-cta)]">
              Ringkasan skenario
            </h4>
            <p className="mt-1 text-sm text-[var(--color-surface)] leading-relaxed line-clamp-3 md:min-h-[68px]">
              {overview}
            </p>
          </div>
        </div>

        {/* Bagian bawah: magnitudo & CTA; selalu tampil di sentuh/reduced-motion, muncul halus di desktop */}
        <div className="absolute inset-x-0 bottom-0 p-6 opacity-100 translate-y-0 lg:translate-y-4 lg:opacity-0 motion-reduce:lg:opacity-100 motion-reduce:lg:translate-y-0 lg:transition-[opacity,transform] lg:duration-500 lg:ease-[cubic-bezier(0.2,0,0,1)] lg:group-hover:translate-y-0 lg:group-hover:opacity-100 lg:group-focus-within:translate-y-0 lg:group-focus-within:opacity-100 motion-reduce:transition-none">
          <div className="flex items-end justify-between gap-3">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl sm:text-4xl font-medium tracking-tight text-[var(--color-on-cta)] leading-none tnum">
                  {magnitudeText}
                </span>
                <span className="text-sm font-medium text-[var(--color-surface)]">
                  M
                </span>
              </div>
              <span className="mt-1 block text-xs text-[var(--color-surface)]">
                {locationTypeLabel}
              </span>
            </div>

            <span
              data-cta-pill="true"
              aria-hidden="true"
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--color-surface-raised)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] transition-colors duration-200 group-hover:bg-[var(--color-primary)] group-hover:text-[var(--color-on-primary)] motion-reduce:transition-none"
            >
              <span>Simulasikan</span>
              <ArrowRight className="h-4 w-4" />
            </span>
          </div>
        </div>
      </div>

      {/* Tautan overlay penuh setinggi kartu agar tidak terpotong transform konten tengah */}
      <Link
        href={href}
        aria-label={ariaLabel ?? `Simulasikan skenario ${title} (${magnitudeText} M)`}
        className="absolute inset-0 z-20 rounded-[20px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
      />
    </article>
  );
}
