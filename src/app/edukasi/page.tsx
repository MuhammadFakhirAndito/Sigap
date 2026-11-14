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
  const remainingArticles = artikelList.slice(1);
  const activeKategoriLabel = selectedKategori ? getKategoriLabel(selectedKategori) : null;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 flex-1 flex flex-col space-y-8 sm:space-y-10">
        {/* NotchNavbar sudah merender landmark <header> secara internal */}
        <NotchNavbar variant="pill" />

        <main className="flex-1 flex flex-col space-y-8 sm:space-y-10 pb-8">
          <section aria-labelledby="heading-edukasi" className="space-y-2.5 pt-1">
            <h1
              id="heading-edukasi"
              className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-[-0.03em] text-[var(--color-text-primary)] leading-tight [text-wrap:balance]"
            >
              Edukasi mitigasi gempa
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] max-w-2xl leading-relaxed [text-wrap:pretty]">
              Panduan mitigasi gempa dan langkah penyelamatan diri dari rujukan resmi nasional.
            </p>
          </section>

          <Suspense fallback={<Skeleton className="h-11 w-full rounded-full" />}>
            <CategoryFilter currentCategory={selectedKategori || "semua"} />
          </Suspense>

          {isDbDegraded ? (
            <div className="py-4">
              <EdukasiErrorCard
                title="Gagal memuat materi edukasi"
                message="Koneksi ke basis data sedang mengalami gangguan. Navigasi halaman lain tetap tersedia, silakan muat ulang beberapa saat lagi."
              />
            </div>
          ) : (
            <div className="space-y-12">
              <section aria-labelledby="heading-daftar-artikel" className="space-y-5">
                <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
                  <h2
                    id="heading-daftar-artikel"
                    className="text-xl sm:text-2xl font-normal tracking-tight text-[var(--color-text-primary)] [text-wrap:balance]"
                  >
                    {activeKategoriLabel
                      ? `Kategori: ${activeKategoriLabel}`
                      : "Semua materi panduan"}
                  </h2>
                  <span className="text-xs text-[var(--color-text-secondary)] font-medium">
                    {artikelList.length} artikel
                  </span>
                </div>

                {artikelList.length === 0 ? (
                  <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-8 flex flex-col items-center gap-4 text-center">
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
                        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-5 py-2.5 text-xs sm:text-sm font-medium hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)]"
                      >
                        <span>Lihat semua</span>
                      </Link>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {featuredArticle && (
                      <ArticleFeaturedCard
                        slug={featuredArticle.slug}
                        judul={featuredArticle.judul}
                        ringkasan={featuredArticle.ringkasan}
                        kategori={featuredArticle.kategori}
                        sumber={featuredArticle.sumber}
                      />
                    )}

                    {remainingArticles.length > 0 && (
                      <div className="border-t border-b border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                        {remainingArticles.map((article, idx) => (
                          <ArticleListItem
                            key={article.id}
                            slug={article.slug}
                            judul={article.judul}
                            ringkasan={article.ringkasan}
                            kategori={article.kategori}
                            sumber={article.sumber}
                            indexNumber={idx + 2}
                          />
                        ))}
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
