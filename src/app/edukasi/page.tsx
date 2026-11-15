import React, { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { EdukasiErrorCard } from "@/components/edukasi/EdukasiErrorCard";
import { CategoryFilter } from "@/components/edukasi/CategoryFilter";
import { ArticleFeaturedCard } from "@/components/edukasi/ArticleFeaturedCard";
import { ArticleListItem } from "@/components/edukasi/ArticleListItem";
import { NewsMetadataList } from "@/components/edukasi/NewsMetadataList";
import { BibliographyList } from "@/components/edukasi/BibliographyList";
import { prisma } from "@/lib/prisma";
import { formatWibDateTime, getKategoriLabel } from "@/lib/edukasi";
import { KategoriArtikel, type Prisma } from "@prisma/client";
import { ShieldCheck } from "lucide-react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Edukasi Mitigasi Gempa | SIGAP Gempa",
  description:
    "Panduan mitigasi gempa bumi Indonesia, pemahaman sesar dan mekanisme geologi, berita terkait, serta daftar pustaka rujukan.",
};

type ArtikelWithSumber = Prisma.ArtikelGetPayload<{ include: { sumber: true } }>;
type BeritaRecord = Prisma.BeritaGetPayload<Record<string, never>>;
type SumberRecord = Prisma.SumberGetPayload<Record<string, never>>;

interface EdukasiPageProps {
  searchParams: Promise<{
    kategori?: string;
  }>;
}

export default async function EdukasiPage({ searchParams }: EdukasiPageProps) {
  const params = await searchParams;
  const rawKategori = params.kategori?.toUpperCase();
  const validKategori = Object.values(KategoriArtikel) as string[];
  const selectedKategori = validKategori.includes(rawKategori || "")
    ? (rawKategori as KategoriArtikel)
    : undefined;

  let artikelList: ArtikelWithSumber[] = [];
  let beritaList: BeritaRecord[] = [];
  let sumberList: SumberRecord[] = [];
  let lastSyncTime: Date | null = null;
  let isDbDegraded = false;

  try {
    const [artikels, beritas, sumbers, syncLog] = await Promise.all([
      prisma.artikel.findMany({
        where: selectedKategori ? { kategori: selectedKategori } : undefined,
        orderBy: [{ urutan: "asc" }, { updatedAt: "desc" }],
        include: {
          sumber: true,
        },
      }),
      prisma.berita.findMany({
        orderBy: { tanggalTerbit: "desc" },
        take: 4,
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
    beritaList = beritas;
    sumberList = sumbers;
    if (syncLog) lastSyncTime = syncLog.createdAt;
  } catch (error) {
    console.error("[EDUKASI DB ERROR]", error);
    isDbDegraded = true;
  }

  const featuredArticle = artikelList[0];
  const companionArticles = artikelList.slice(1, 3);
  const directoryArticles = artikelList.slice(3);
  const activeKategoriLabel = selectedKategori ? getKategoriLabel(selectedKategori) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-8 flex-1 flex flex-col space-y-8 sm:space-y-10">
        {/* SHELL ATAS: NOTCH NAVBAR + HEADER EDITORIAL + SEGMENTED FILTER TRAY */}
        <section aria-labelledby="heading-edukasi" className="w-full">
          <NotchNavbar variant="notch" />

          <div className="rounded-b-[32px] md:rounded-b-[40px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-5 sm:px-9 lg:px-11 pt-5 sm:pt-7 pb-6 sm:pb-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div className="space-y-2.5 max-w-2xl">
                <div className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-primary-strong)]">
                  <ShieldCheck className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Basis pengetahuan resmi BMKG, BNPB & PVMBG</span>
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
              </div>

              {!isDbDegraded && (
                <dl className="flex flex-wrap items-center gap-5 sm:gap-7 lg:shrink-0 pt-2 lg:pt-0">
                  <div>
                    <dd className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--color-primary-strong)] tabular-nums">
                      {artikelList.length}
                    </dd>
                    <dt className="text-xs text-[var(--color-text-secondary)]">
                      {selectedKategori ? "Panduan kategori" : "Materi panduan"}
                    </dt>
                  </div>
                  <div className="h-8 w-px bg-[var(--color-border)]" aria-hidden="true" />
                  <div>
                    <dd className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--color-text-primary)] tabular-nums">
                      {sumberList.length}
                    </dd>
                    <dt className="text-xs text-[var(--color-text-secondary)]">
                      Sumber rujukan
                    </dt>
                  </div>
                  <div className="h-8 w-px bg-[var(--color-border)]" aria-hidden="true" />
                  <div>
                    <dd className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--color-text-primary)] tabular-nums">
                      {beritaList.length}
                    </dd>
                    <dt className="text-xs text-[var(--color-text-secondary)]">
                      Liputan terkait
                    </dt>
                  </div>
                </dl>
              )}
            </div>

            <div className="pt-2">
              <Suspense fallback={<Skeleton className="h-14 w-full rounded-full" />}>
                <CategoryFilter currentCategory={selectedKategori || "semua"} />
              </Suspense>
            </div>
          </div>
        </section>

        <main className="flex-1 flex flex-col space-y-8 sm:space-y-10">
          {isDbDegraded ? (
            <div className="py-2">
              <EdukasiErrorCard
                title="Gagal memuat materi edukasi"
                message="Koneksi ke basis data sedang mengalami gangguan. Navigasi halaman lain tetap tersedia, silakan muat ulang beberapa saat lagi."
              />
            </div>
          ) : (
            <div className="space-y-10 sm:space-y-12">
              <section aria-labelledby="heading-daftar-artikel" className="space-y-5">
                <div className="flex items-center justify-between gap-3 px-1">
                  <div className="flex items-center gap-2.5">
                    <h2
                      id="heading-daftar-artikel"
                      className="text-xl sm:text-2xl font-light tracking-[-0.02em] text-[var(--color-text-primary)] [text-wrap:balance]"
                    >
                      {activeKategoriLabel
                        ? `Kategori: ${activeKategoriLabel}`
                        : "Semua materi panduan"}
                    </h2>
                    {selectedKategori && (
                      <Link
                        href="/edukasi"
                        className="inline-flex items-center justify-center min-h-[44px] px-3.5 py-1.5 rounded-full bg-[var(--color-surface)] border border-[var(--color-border-strong)] text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)] transition-colors"
                      >
                        Reset filter
                      </Link>
                    )}
                  </div>
                  <span className="inline-flex items-center rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-text-secondary)] font-medium tabular-nums">
                    {artikelList.length} artikel
                  </span>
                </div>

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
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-5 py-2.5 text-xs sm:text-sm font-medium hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                      >
                        <span>Lihat semua</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Bento Editorial: Lead Card (7 kolom) + 2 Companion Cards (5 kolom) */}
                    <div
                      className={`grid grid-cols-1 gap-4 sm:gap-5 ${
                        companionArticles.length > 0 ? "lg:grid-cols-12" : ""
                      }`}
                    >
                      {featuredArticle && (
                        <div className={companionArticles.length > 0 ? "lg:col-span-7" : ""}>
                          <ArticleFeaturedCard
                            slug={featuredArticle.slug}
                            judul={featuredArticle.judul}
                            ringkasan={featuredArticle.ringkasan}
                            kategori={featuredArticle.kategori}
                            sumber={featuredArticle.sumber}
                            indexNumber={1}
                            variant="lead"
                          />
                        </div>
                      )}

                      {companionArticles.length > 0 && (
                        <div className="lg:col-span-5 flex flex-col gap-4 sm:gap-5">
                          {companionArticles.map((article, idx) => (
                            <ArticleFeaturedCard
                              key={article.id}
                              slug={article.slug}
                              judul={article.judul}
                              ringkasan={article.ringkasan}
                              kategori={article.kategori}
                              sumber={article.sumber}
                              indexNumber={idx + 2}
                              variant="companion"
                            />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Direktori Materi Lengkap (Artikel ke-4 dst.) */}
                    {directoryArticles.length > 0 && (
                      <div className="rounded-[28px] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden">
                        <div className="flex items-center justify-between px-5 sm:px-7 py-3.5 border-b border-[var(--color-border)]">
                          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                            Indeks materi lanjutan
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                            04 - {String(artikelList.length).padStart(2, "0")}
                          </span>
                        </div>
                        <div className="divide-y divide-[var(--color-border)]">
                          {directoryArticles.map((article, idx) => (
                            <ArticleListItem
                              key={article.id}
                              slug={article.slug}
                              judul={article.judul}
                              ringkasan={article.ringkasan}
                              kategori={article.kategori}
                              sumber={article.sumber}
                              indexNumber={idx + 4}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>

              <NewsMetadataList beritaList={beritaList} />

              <BibliographyList sumberList={sumberList} />
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
