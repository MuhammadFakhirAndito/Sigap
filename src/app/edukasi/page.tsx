import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, ShieldCheck } from "lucide-react";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { EdukasiErrorCard } from "@/components/edukasi/EdukasiErrorCard";
import { CategoryFilter } from "@/components/edukasi/CategoryFilter";
import { EduArticleCard } from "@/components/edukasi/EduArticleCard";
import { EduSectionHeader } from "@/components/edukasi/EduSectionHeader";
import { NewsMetadataList } from "@/components/edukasi/NewsMetadataList";
import { BibliographyList } from "@/components/edukasi/BibliographyList";
import { RevealOnScroll } from "@/components/edukasi/RevealOnScroll";
import { prisma } from "@/lib/prisma";
import { getLatestEarthquakeNews, type DynamicBeritaItem } from "@/lib/news-rss";
import {
  formatTanggalIndonesia,
  formatWibDateTime,
  getKategoriLabel,
} from "@/lib/edukasi";
import {
  BASICS_ARTICLE_SLUG,
  EMERGENCY_ARTICLE_SLUG,
  estimateReadMinutes,
  getArticleIcon,
  groupArticles,
  isFeaturedArticle,
  uniqueShortPublishers,
} from "@/lib/edukasi-visual";
import { KategoriArtikel, type Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edukasi Mitigasi Gempa | SIGAP Gempa",
  description:
    "Panduan mitigasi gempa bumi Indonesia, pemahaman sesar dan mekanisme geologi, berita terkait, serta daftar pustaka rujukan.",
};

type ArtikelWithSumber = Prisma.ArtikelGetPayload<{ include: { sumber: true } }>;
type SumberRecord = Prisma.SumberGetPayload<Record<string, never>>;

interface EdukasiPageProps {
  searchParams: Promise<{
    kategori?: string;
  }>;
}

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]";

function getCardColSpan(items: ArtikelWithSumber[], idx: number): string {
  const hasFeatured = items.some((a) => isFeaturedArticle(a.slug));
  const currentFeatured = isFeaturedArticle(items[idx].slug);

  if (hasFeatured) {
    if (items.length % 2 === 1 && idx === items.length - 1) {
      return "md:col-span-2 lg:col-span-12";
    }
    // Pada md (2 kolom), pastikan kartu standar tunggal sebelum featured mengisi baris agar tidak menyisakan lubang grid.
    const nextIsFeatured = idx + 1 < items.length && isFeaturedArticle(items[idx + 1].slug);
    const prevWasFeatured = idx > 0 && isFeaturedArticle(items[idx - 1].slug);
    if (currentFeatured) {
      return "md:col-span-2 lg:col-span-6";
    }
    if (nextIsFeatured && (idx === 0 || prevWasFeatured)) {
      return "md:col-span-2 lg:col-span-6";
    }
    return "lg:col-span-6";
  }

  const total = items.length;
  const remainderLg = total % 3;
  const inTrailingLg = remainderLg !== 0 && idx >= total - remainderLg;
  const lgSpan =
    inTrailingLg && remainderLg === 1
      ? "lg:col-span-12"
      : inTrailingLg && remainderLg === 2
        ? "lg:col-span-6"
        : "lg:col-span-4";
  const mdSpan = total % 2 === 1 && idx === total - 1 ? "md:col-span-2" : "";

  return `${mdSpan} ${lgSpan}`.trim();
}

export default async function EdukasiPage({ searchParams }: EdukasiPageProps) {
  const params = await searchParams;
  const rawKategori = params.kategori?.toUpperCase();
  const validKategori = Object.values(KategoriArtikel) as string[];
  const selectedKategori = validKategori.includes(rawKategori || "")
    ? (rawKategori as KategoriArtikel)
    : undefined;

  let artikelList: ArtikelWithSumber[] = [];
  let beritaList: DynamicBeritaItem[] = [];
  let sumberList: SumberRecord[] = [];
  let lastSyncTime: Date | null = null;
  let isDbDegraded = false;

  const newsPromise = getLatestEarthquakeNews().catch(() => []);

  try {
    const [artikels, sumbers, syncLog] = await Promise.all([
      prisma.artikel.findMany({
        where: selectedKategori ? { kategori: selectedKategori } : undefined,
        orderBy: [{ urutan: "asc" }, { updatedAt: "desc" }],
        include: {
          sumber: true,
        },
      }),
      prisma.sumber.findMany({
        orderBy: [{ penerbit: "asc" }, { judul: "asc" }],
      }),
      prisma.syncLog.findFirst({
        where: { status: "OK" },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    artikelList = artikels;
    sumberList = sumbers;
    if (syncLog) lastSyncTime = syncLog.createdAt;
  } catch (error) {
    console.error("[EDUKASI DB ERROR]", error);
    isDbDegraded = true;
  }

  beritaList = await newsPromise;

  const activeKategoriLabel = selectedKategori ? getKategoriLabel(selectedKategori) : null;
  const groupedArticles = groupArticles(artikelList);
  const formattedSumberList = sumberList.map((s) => ({
    id: s.id,
    judul: s.judul,
    penerbit: s.penerbit,
    url: s.url,
    tanggalAksesText: formatTanggalIndonesia(s.tanggalAkses, "long"),
  }));

  let runningIndex = 0;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-8 flex-1 flex flex-col space-y-12 sm:space-y-16">
        {/* SHELL ATAS: NOTCH NAVBAR + HERO + TAUTAN LOMPAT + FILTER KATEGORI */}
        <section aria-labelledby="heading-edukasi" className="w-full">
          <NotchNavbar variant="notch" />

          <div className="rounded-b-[32px] md:rounded-b-[40px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-5 sm:px-9 lg:px-11 pt-5 sm:pt-7 pb-6 sm:pb-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="space-y-3.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary-strong)]">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Basis pengetahuan resmi BMKG, BNPB &amp; PVMBG</span>
                </div>
                <h1
                  id="heading-edukasi"
                  className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-[-0.03em] text-[var(--color-text-primary)] leading-[1.08] [text-wrap:balance]"
                >
                  Edukasi mitigasi gempa
                </h1>
                <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed [text-wrap:pretty]">
                  Panduan langkah penyelamatan diri, pemahaman sesar dan mekanisme geologi, serta rujukan resmi kebencanaan nasional.
                </p>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href={`/edukasi/${EMERGENCY_ARTICLE_SLUG}`}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--color-cta)] px-5 py-2.5 text-sm font-medium text-[var(--color-on-cta)] hover:bg-[color-mix(in_srgb,var(--color-cta)_88%,var(--color-on-cta))] transition-colors ${focusRing}`}
                  >
                    <span>Apa yang harus dilakukan sekarang?</span>
                    <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
                  </Link>
                  <Link
                    href={`/edukasi/${BASICS_ARTICLE_SLUG}`}
                    className={`inline-flex min-h-[44px] items-center gap-2 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-5 py-2.5 text-sm font-medium text-[var(--color-text-primary)] hover:border-[var(--color-cta)] transition-colors ${focusRing}`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Mulai dari dasar</span>
                  </Link>
                </div>
              </div>

              {!isDbDegraded && (
                <nav
                  aria-label="Navigasi cepat bagian halaman edukasi"
                  className="flex flex-wrap items-center gap-2 sm:gap-3 lg:shrink-0 pt-1 lg:pt-0"
                >
                  <a
                    href="#materi"
                    className={`group inline-flex min-h-[44px] flex-col justify-center rounded-[16px] px-3 py-2 transition-colors hover:bg-[var(--color-surface-raised)] ${focusRing}`}
                  >
                    <span className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--color-primary-strong)] tabular-nums leading-none">
                      {artikelList.length}
                    </span>
                    <span className="mt-1 text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                      {selectedKategori ? "Panduan kategori" : "Materi panduan"}
                    </span>
                  </a>
                  <div className="h-8 w-px bg-[var(--color-border)]" aria-hidden="true" />
                  <a
                    href="#pustaka"
                    className={`group inline-flex min-h-[44px] flex-col justify-center rounded-[16px] px-3 py-2 transition-colors hover:bg-[var(--color-surface-raised)] ${focusRing}`}
                  >
                    <span className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--color-text-primary)] tabular-nums leading-none">
                      {sumberList.length}
                    </span>
                    <span className="mt-1 text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                      Sumber rujukan
                    </span>
                  </a>
                  <div className="h-8 w-px bg-[var(--color-border)]" aria-hidden="true" />
                  <a
                    href="#berita"
                    className={`group inline-flex min-h-[44px] flex-col justify-center rounded-[16px] px-3 py-2 transition-colors hover:bg-[var(--color-surface-raised)] ${focusRing}`}
                  >
                    <span className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--color-text-primary)] tabular-nums leading-none">
                      {beritaList.length}
                    </span>
                    <span className="mt-1 text-xs text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                      Liputan terkait
                    </span>
                  </a>
                </nav>
              )}
            </div>

            <div className="pt-1">
              <Suspense fallback={<Skeleton className="h-14 w-full rounded-full" />}>
                <CategoryFilter currentCategory={selectedKategori || "semua"} />
              </Suspense>
            </div>
          </div>
        </section>

        <main className="flex-1 flex flex-col space-y-12 sm:space-y-16">
          {isDbDegraded ? (
            <div className="py-2">
              <EdukasiErrorCard
                title="Gagal memuat materi edukasi"
                message="Koneksi ke basis data sedang mengalami gangguan. Navigasi halaman lain tetap tersedia, silakan muat ulang beberapa saat lagi."
              />
            </div>
          ) : (
            <div className="space-y-12 sm:space-y-16">
              <section
                id="materi"
                aria-labelledby="heading-daftar-artikel"
                className="scroll-mt-6 space-y-8"
              >
                <EduSectionHeader
                  id="heading-daftar-artikel"
                  eyebrow="Panduan kesiapsiagaan"
                  title={
                    activeKategoriLabel
                      ? `Kategori: ${activeKategoriLabel}`
                      : "Semua materi panduan"
                  }
                  aside={
                    <div className="flex flex-wrap items-center gap-2.5">
                      {selectedKategori && (
                        <Link
                          href="/edukasi"
                          className={`inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] transition-colors ${focusRing}`}
                        >
                          Reset filter
                        </Link>
                      )}
                      <span className="inline-flex items-center rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-secondary)] font-medium tabular-nums">
                        {artikelList.length} artikel
                      </span>
                    </div>
                  }
                />

                {artikelList.length === 0 ? (
                  <div className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] p-8 sm:p-10 flex flex-col items-center gap-4 text-center">
                    <EmptyState
                      className="border-0 bg-transparent p-0"
                      message={
                        selectedKategori
                          ? "Belum ada artikel di kategori ini."
                          : "Belum ada materi edukasi yang tersedia saat ini."
                      }
                    />
                    {selectedKategori && (
                      <Link
                        href="/edukasi"
                        className={`inline-flex items-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-5 py-2.5 text-xs sm:text-sm font-medium hover:bg-[color-mix(in_srgb,var(--color-cta)_88%,var(--color-on-cta))] transition-colors min-h-[44px] ${focusRing}`}
                      >
                        <span>Lihat semua</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-10 sm:space-y-12">
                    {groupedArticles.map(({ spec, items }, groupIdx) => (
                      <RevealOnScroll key={spec.key} delayMs={groupIdx * 80}>
                        <div className="space-y-5">
                          <div className="flex items-baseline justify-between gap-3 px-1">
                            <h3 className="text-lg sm:text-xl font-medium tracking-[-0.02em] text-[var(--color-text-primary)]">
                              {spec.title}
                            </h3>
                            <span className="text-xs font-medium tabular-nums text-[var(--color-text-secondary)]">
                              {items.length} materi
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
                            {items.map((article, idx) => {
                              runningIndex += 1;
                              const currentNumber = runningIndex;
                              const featured = isFeaturedArticle(article.slug);
                              const badge =
                                article.slug === EMERGENCY_ARTICLE_SLUG
                                  ? "Panduan utama"
                                  : undefined;

                              return (
                                <div
                                  key={article.id}
                                  className={getCardColSpan(items, idx)}
                                >
                                  <EduArticleCard
                                    slug={article.slug}
                                    judul={article.judul}
                                    ringkasan={article.ringkasan}
                                    kategoriLabel={getKategoriLabel(article.kategori)}
                                    readMinutes={estimateReadMinutes(article.isi)}
                                    sourceLabels={uniqueShortPublishers(article.sumber)}
                                    sourceCount={article.sumber.length}
                                    indexNumber={currentNumber}
                                    icon={getArticleIcon(article.slug)}
                                    featured={featured}
                                    badge={badge}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </RevealOnScroll>
                    ))}
                  </div>
                )}
              </section>

              <RevealOnScroll>
                <NewsMetadataList beritaList={beritaList} />
              </RevealOnScroll>

              <RevealOnScroll>
                <BibliographyList sumberList={formattedSumberList} />
              </RevealOnScroll>
            </div>
          )}
        </main>
      </div>

      <Footer
        lastUpdatedText={
          lastSyncTime ? `Disinkronkan ${formatWibDateTime(lastSyncTime)}` : undefined
        }
      />
    </div>
  );
}
