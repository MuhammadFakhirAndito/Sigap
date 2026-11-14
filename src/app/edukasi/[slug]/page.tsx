import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { EdukasiErrorCard } from "@/components/edukasi/EdukasiErrorCard";
import { renderSafeMarkdown } from "@/lib/markdown";
import {
  formatTanggalIndonesia,
  formatWibDateTime,
  getKategoriLabel,
  getSafeExternalHref,
} from "@/lib/edukasi";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  MessageSquare,
  BookOpen,
  Calendar,
  Clock,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

type ArtikelWithSumber = Prisma.ArtikelGetPayload<{ include: { sumber: true } }>;

interface ArticleDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

function estimateReadingTime(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 180));
}

export async function generateMetadata({
  params,
}: ArticleDetailPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const article = await prisma.artikel.findUnique({
      where: { slug },
      select: { judul: true, ringkasan: true },
    });

    if (!article) {
      return {
        title: "Artikel Tidak Ditemukan | SIGAP Gempa",
      };
    }

    return {
      title: `${article.judul} | Edukasi SIGAP Gempa`,
      description: article.ringkasan || undefined,
    };
  } catch {
    return {
      title: "Edukasi Mitigasi Gempa | SIGAP Gempa",
    };
  }
}

export default async function ArticleDetailPage({ params }: ArticleDetailPageProps) {
  const { slug } = await params;

  let article: ArtikelWithSumber | null = null;
  let relatedArticles: ArtikelWithSumber[] = [];
  let lastSyncTime: Date | null = null;
  let isDbDegraded = false;

  try {
    const found = await prisma.artikel.findUnique({
      where: { slug },
      include: {
        sumber: true,
      },
    });

    article = found;

    if (found) {
      const [related, syncLog] = await Promise.all([
        prisma.artikel.findMany({
          where: {
            kategori: found.kategori,
            id: { not: found.id },
          },
          orderBy: [{ urutan: "asc" }, { updatedAt: "desc" }],
          take: 2,
          include: {
            sumber: true,
          },
        }),
        prisma.syncLog.findFirst({
          where: { status: "OK" },
          orderBy: { createdAt: "desc" },
        }),
      ]);

      relatedArticles = related;
      if (syncLog) lastSyncTime = syncLog.createdAt;
    }
  } catch (error) {
    console.error("[ARTICLE DETAIL DB ERROR]", error);
    isDbDegraded = true;
  }

  // Pisahkan error koneksi DB (tampil ErrorState lokal) dengan slug kosong (404 notFound).
  if (!isDbDegraded && !article) {
    notFound();
  }

  if (isDbDegraded || !article) {
    return (
      <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
        <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 flex-1 flex flex-col space-y-8">
          <NotchNavbar variant="pill" />

          <main className="w-full max-w-[72ch] mx-auto flex-1 space-y-6 pb-8">
            <Link
              href="/edukasi"
              className="inline-flex items-center gap-1.5 text-sm text-[var(--color-text-primary)] hover:underline min-h-[44px] py-2 px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)] rounded"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Kembali ke Edukasi</span>
            </Link>

            <EdukasiErrorCard
              title="Gagal memuat artikel edukasi"
              message="Koneksi ke basis data sedang mengalami gangguan. Navigasi utama tetap aktif, silakan muat ulang halaman."
            />
          </main>
        </div>

        <Footer />
      </div>
    );
  }

  const htmlContent = await renderSafeMarkdown(article.isi);
  const readingTime = estimateReadingTime(article.isi);
  const kategoriLabel = getKategoriLabel(article.kategori);

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 flex-1 flex flex-col space-y-8 sm:space-y-10">
        <NotchNavbar variant="pill" />

        <main className="w-full max-w-[72ch] mx-auto flex-1 space-y-8 sm:space-y-10 pb-8">
          <nav aria-label="Breadcrumb">
            <div className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm text-[var(--color-text-secondary)]">
              <Link
                href="/edukasi"
                className="inline-flex items-center gap-1.5 text-[var(--color-text-primary)] hover:underline min-h-[44px] py-2 px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)] rounded"
              >
                <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Kembali ke Edukasi</span>
              </Link>
              <span aria-hidden="true">/</span>
              <Link
                href={`/edukasi?kategori=${article.kategori}`}
                className="inline-flex items-center hover:text-[var(--color-text-primary)] hover:underline min-h-[44px] py-2 px-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)] rounded"
              >
                {kategoriLabel}
              </Link>
            </div>
          </nav>

          <article className="space-y-8">
            <div className="space-y-4 pb-6 border-b border-[var(--color-border)]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-[var(--color-text-secondary)]">
                <span className="rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-text-primary)] px-3 py-1 text-xs font-medium">
                  {kategoriLabel}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>{readingTime} menit baca</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                  <span>Diperbarui {formatTanggalIndonesia(article.updatedAt, "long")}</span>
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-normal tracking-[-0.03em] text-[var(--color-text-primary)] leading-[1.15] [text-wrap:balance]">
                {article.judul}
              </h1>

              {article.ringkasan && (
                <p className="max-w-[58ch] text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed font-normal [text-wrap:pretty]">
                  {article.ringkasan}
                </p>
              )}

              <div className="flex items-start gap-2.5 pt-1 text-xs text-[var(--color-text-secondary)]">
                <ShieldCheck className="w-4 h-4 text-[var(--color-text-primary)] shrink-0 mt-0.5" aria-hidden="true" />
                <span className="[text-wrap:pretty]">
                  Materi dirangkum dari publikasi lembaga kebencanaan dan geofisika serta rujukan media terverifikasi.
                </span>
              </div>
            </div>

            <div
              className="text-[var(--color-text-primary)]"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          </article>

          <section aria-labelledby="heading-sumber-artikel" className="pt-8 border-t border-[var(--color-border)] space-y-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[var(--color-text-primary)] shrink-0" aria-hidden="true" />
              <h2 id="heading-sumber-artikel" className="text-lg sm:text-xl font-normal text-[var(--color-text-primary)] tracking-tight">
                Sumber artikel ini
              </h2>
            </div>

            {article.sumber.length === 0 ? (
              <p className="text-sm text-[var(--color-text-secondary)]">
                Data sumber rujukan untuk artikel ini belum tercatat.
              </p>
            ) : (
              <div className="border-t border-b border-[var(--color-border)] divide-y divide-[var(--color-border)]">
                {article.sumber.map((s, idx) => {
                  const safeHref = getSafeExternalHref(s.url);
                  return (
                    <div
                      key={s.id}
                      className="py-4 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                          <strong className="text-[var(--color-text-primary)] font-semibold">
                            [{idx + 1}] {s.penerbit}
                          </strong>
                          <span>Diakses pada {formatTanggalIndonesia(s.tanggalAkses, "long")}</span>
                        </div>
                        <p className="text-sm font-medium text-[var(--color-text-primary)] [text-wrap:pretty]">
                          {s.judul}
                        </p>
                      </div>

                      <a
                        href={safeHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--color-text-primary)] underline decoration-[var(--color-primary)] decoration-2 underline-offset-4 hover:opacity-80 shrink-0 min-h-[44px] py-2 px-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)] rounded"
                        aria-label={`Buka dokumen rujukan ${s.judul} dari ${s.penerbit} (tab baru)`}
                      >
                        <span>Buka dokumen asli</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          <section aria-labelledby="heading-tanya-chatbot" className="pt-2">
            <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 id="heading-tanya-chatbot" className="text-base sm:text-lg font-medium text-[var(--color-text-primary)] [text-wrap:balance]">
                  Punya pertanyaan lanjutan seputar topik ini?
                </h2>
                <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] [text-wrap:pretty]">
                  Ajukan pertanyaan mitigasi spesifik ke asisten kebencanaan SIGAP.
                </p>
              </div>

              <Link
                href={`/chatbot?q=${encodeURIComponent(article.judul)}`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--color-text-muted)] bg-transparent text-[var(--color-text-primary)] hover:border-[var(--color-text-primary)] hover:bg-[var(--color-surface)] active:opacity-85 px-5 py-3 text-sm font-medium transition-colors min-h-[44px] shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)]"
              >
                <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>Tanyakan ke chatbot</span>
              </Link>
            </div>
          </section>

          {relatedArticles.length > 0 && (
            <section aria-labelledby="heading-artikel-terkait" className="pt-6 border-t border-[var(--color-border)] space-y-4">
              <h2 id="heading-artikel-terkait" className="text-lg sm:text-xl font-normal text-[var(--color-text-primary)] tracking-tight">
                Materi terkait dalam kategori ini
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedArticles.map((rel) => (
                  <Link
                    key={rel.id}
                    href={`/edukasi/${rel.slug}`}
                    className="p-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] hover:border-[var(--color-text-primary)]/40 transition-colors flex flex-col justify-between gap-3 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)]"
                  >
                    <div className="space-y-1.5">
                      <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                        {kategoriLabel}
                      </span>
                      <h3 className="text-base font-medium text-[var(--color-text-primary)] leading-snug [text-wrap:balance]">
                        {rel.judul}
                      </h3>
                      {rel.ringkasan && (
                        <p className="text-xs text-[var(--color-text-secondary)] line-clamp-2 leading-relaxed [text-wrap:pretty]">
                          {rel.ringkasan}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-xs font-medium text-[var(--color-text-primary)] pt-1">
                      <span>Baca selengkapnya</span>
                      <ArrowRight className="w-3.5 h-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden="true" />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
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
