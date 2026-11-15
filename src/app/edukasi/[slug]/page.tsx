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
  ArrowUpRight,
  ListChecks,
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
  let allModules: Array<{
    id: string;
    slug: string;
    judul: string;
    urutan: number;
  }> = [];
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
      const [modules, related, syncLog] = await Promise.all([
        prisma.artikel.findMany({
          orderBy: [{ urutan: "asc" }, { updatedAt: "desc" }],
          select: {
            id: true,
            slug: true,
            judul: true,
            urutan: true,
          },
        }),
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

      allModules = modules;
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
        <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-8 flex-1 flex flex-col">
          <NotchNavbar variant="notch" />

          <main className="w-full rounded-b-[32px] md:rounded-b-[40px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-5 sm:px-9 lg:px-11 pt-6 pb-10 flex-1 space-y-6">
            <Link
              href="/edukasi"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-4 py-2 text-xs sm:text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
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
  const penerbitList = Array.from(new Set(article.sumber.map((s) => s.penerbit))).join(", ");
  const formattedUrutan = String(article.urutan || 1).padStart(2, "0");

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-10 flex-1 flex flex-col space-y-8 sm:space-y-10">
        {/* HERO SHELL ARTIKEL: NOTCH NAVBAR + IDENTITAS VISUAL PANDUAN */}
        <section aria-labelledby="article-hero-title" className="w-full">
          <NotchNavbar variant="notch" />

          <div className="relative overflow-hidden rounded-b-[32px] md:rounded-b-[40px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-5 sm:px-9 lg:px-11 pt-5 sm:pt-7 pb-7 sm:pb-10">
            {/* Elemen identitas geometris gelombang seismik di latar kanan */}
            <svg
              aria-hidden="true"
              viewBox="0 0 240 240"
              className="hidden lg:block pointer-events-none absolute -right-10 -bottom-14 w-[300px] h-[300px] text-[var(--color-border-strong)]/25"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
            >
              <circle cx="120" cy="120" r="110" />
              <circle cx="120" cy="120" r="80" />
              <circle cx="120" cy="120" r="50" />
              <circle cx="120" cy="120" r="20" />
              <path d="M120 0v240M0 120h240" />
            </svg>

            <div className="relative z-10 space-y-6">
              {/* Baris Atas: Breadcrumb & Nomor Indeks Panduan */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2">
                  <Link
                    href="/edukasi"
                    className="inline-flex items-center gap-2 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-4 py-2 text-xs sm:text-sm font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                  >
                    <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span>Kembali ke Edukasi</span>
                  </Link>

                  <Link
                    href={`/edukasi?kategori=${article.kategori}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3.5 py-2 text-xs font-medium text-[var(--color-primary-strong)] hover:border-[var(--color-cta)] transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                  >
                    <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>{kategoriLabel}</span>
                  </Link>
                </nav>

                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-3.5 py-1.5 text-xs font-medium tabular-nums">
                  <span>Panduan #{formattedUrutan}</span>
                </span>
              </div>

              {/* Baris Utama: Judul Besar + Ringkasan + Fakta Rujukan */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:items-end">
                <div className="lg:col-span-8 space-y-3">
                  <h1
                    id="article-hero-title"
                    className="text-3xl sm:text-4xl lg:text-5xl font-light tracking-[-0.03em] text-[var(--color-text-primary)] leading-[1.1] [text-wrap:balance]"
                  >
                    {article.judul}
                  </h1>

                  {article.ringkasan && (
                    <p className="max-w-[58ch] text-base sm:text-lg text-[var(--color-text-secondary)] leading-relaxed font-normal [text-wrap:pretty]">
                      {article.ringkasan}
                    </p>
                  )}
                </div>

                <dl className="lg:col-span-4 flex flex-wrap items-center gap-5 sm:gap-6 lg:justify-end pt-2 lg:pt-0 border-t lg:border-t-0 border-[var(--color-border)]">
                  <div>
                    <dd className="text-xl sm:text-2xl font-light tracking-tight text-[var(--color-primary-strong)] tabular-nums">
                      {readingTime} mnt
                    </dd>
                    <dt className="text-xs text-[var(--color-text-secondary)]">
                      Estimasi baca
                    </dt>
                  </div>
                  <div className="h-8 w-px bg-[var(--color-border)]" aria-hidden="true" />
                  <div>
                    <dd className="text-xl sm:text-2xl font-light tracking-tight text-[var(--color-text-primary)] tabular-nums">
                      {article.sumber.length} rujukan
                    </dd>
                    <dt className="text-xs text-[var(--color-text-secondary)]">
                      {penerbitList || "Lembaga resmi"}
                    </dt>
                  </div>
                  <div className="h-8 w-px bg-[var(--color-border)]" aria-hidden="true" />
                  <div>
                    <dd className="text-sm sm:text-base font-medium text-[var(--color-text-primary)] tabular-nums">
                      {formatTanggalIndonesia(article.updatedAt, "short")}
                    </dd>
                    <dt className="text-xs text-[var(--color-text-secondary)]">
                      Diperbarui
                    </dt>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </section>

        {/* KONTEN UTAMA: 2 KOLOM (SIDEBAR DAFTAR ISI & PINTASAN + BIDANG BACA ARTIKEL) */}
        <main className="w-full flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            {/* KOLOM KIRI (4 KOLOM STICKY DI DESKTOP): NAVIGASI MODUL 01-09 & PINTASAN CHATBOT */}
            <aside className="lg:col-span-4 lg:sticky lg:top-6 space-y-5 order-2 lg:order-1">
              {allModules.length > 0 && (
                <nav
                  aria-label="Daftar modul panduan edukasi"
                  className="rounded-[24px] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 sm:p-6 space-y-3.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-[var(--color-primary-strong)]">
                      <ListChecks className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Modul panduan edukasi</span>
                    </div>
                    <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                      01 - {String(allModules.length).padStart(2, "0")}
                    </span>
                  </div>

                  {/* Daftar modul yang bisa digulir hingga modul ke-9 */}
                  <ol className="max-h-[268px] overflow-y-auto pr-1 space-y-1.5 text-xs sm:text-sm [scrollbar-width:thin]">
                    {allModules.map((mod, i) => {
                      const isCurrent = mod.slug === article.slug;
                      const modNumber = String(i + 1).padStart(2, "0");
                      return (
                        <li key={mod.id}>
                          <Link
                            href={`/edukasi/${mod.slug}`}
                            aria-current={isCurrent ? "page" : undefined}
                            className={`group flex items-baseline gap-2.5 rounded-xl px-3 py-2.5 transition-colors min-h-[44px] ${
                              isCurrent
                                ? "bg-[var(--color-cta)] text-[var(--color-on-cta)] font-medium"
                                : "text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
                            }`}
                          >
                            <span
                              className={`text-xs font-semibold tabular-nums shrink-0 ${
                                isCurrent
                                  ? "text-[var(--color-primary)]"
                                  : "text-[var(--color-primary-strong)]"
                              }`}
                            >
                              {modNumber}.
                            </span>
                            <span className="leading-snug [text-wrap:pretty]">
                              {mod.judul}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </nav>
              )}

              {/* KARTU IDENTITAS VERIFIKASI & PINTASAN CHATBOT */}
              <div className="rounded-[24px] bg-[var(--color-surface)] border border-[var(--color-border)] p-5 sm:p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="w-10 h-10 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
                    <img src="/logo/symbol.svg" alt="" width={20} height={20} className="w-5 h-5" />
                  </span>
                  <div className="space-y-1">
                    <h2
                      id="heading-tanya-chatbot"
                      className="text-sm sm:text-base font-medium text-[var(--color-text-primary)]"
                    >
                      Tanyakan topik ini ke asisten SIGAP
                    </h2>
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed [text-wrap:pretty]">
                      Diskusikan langkah kesiapsiagaan untuk situasi rumah atau lingkungan Anda bersama asisten berbasis data BMKG/BNPB.
                    </p>
                  </div>
                </div>

                <Link
                  href={`/chatbot?q=${encodeURIComponent(article.judul)}`}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] active:opacity-85 px-5 py-3 text-xs sm:text-sm font-medium transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" aria-hidden="true" />
                  <span>Tanyakan ke chatbot</span>
                </Link>

                <div className="pt-3 border-t border-[var(--color-border)] flex items-start gap-2 text-xs text-[var(--color-text-secondary)]">
                  <ShieldCheck className="w-4 h-4 text-[var(--color-primary-strong)] shrink-0 mt-0.5" aria-hidden="true" />
                  <span>
                    Materi dirangkum dari publikasi resmi lembaga kebencanaan nasional ({penerbitList || "BMKG/BNPB"}).
                  </span>
                </div>
              </div>
            </aside>

            {/* KOLOM KANAN (8 KOLOM): BIDANG BACA ARTIKEL, SUMBER & MATERI TERKAIT */}
            <div className="lg:col-span-8 space-y-6 sm:space-y-8 min-w-0 order-1 lg:order-2">
              <article className="rounded-[28px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] overflow-hidden">
                {/* Strip Identitas Sumber di Atas Kertas Baca */}
                <div className="bg-[var(--color-surface)]/55 border-b border-[var(--color-border)] px-6 sm:px-8 lg:px-10 py-3.5 flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--color-text-secondary)]">
                  <span className="inline-flex items-center gap-1.5 font-medium text-[var(--color-text-primary)]">
                    <ShieldCheck className="w-4 h-4 text-[var(--color-primary-strong)] shrink-0" aria-hidden="true" />
                    <span>Rujukan terverifikasi: {penerbitList || "BNPB & BMKG"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 tabular-nums">
                    <Calendar className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Pembaruan {formatTanggalIndonesia(article.updatedAt, "long")}</span>
                  </span>
                </div>

                {/* Isi Markdown Artikel */}
                <div
                  className="p-6 sm:p-8 lg:p-10 text-[var(--color-text-primary)] [&>h2:first-child]:mt-2 [&>h2:first-child]:pt-0 [&>h2:first-child]:border-t-0"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              </article>

              {/* SUMBER ARTIKEL INI */}
              <section
                aria-labelledby="heading-sumber-artikel"
                className="rounded-[28px] bg-[var(--color-surface)] border border-[var(--color-border)] overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 px-6 sm:px-8 py-4 border-b border-[var(--color-border)]">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[var(--color-primary-strong)] shrink-0" aria-hidden="true" />
                    <h2
                      id="heading-sumber-artikel"
                      className="text-lg sm:text-xl font-light tracking-[-0.02em] text-[var(--color-text-primary)]"
                    >
                      Sumber artikel ini
                    </h2>
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)] tabular-nums">
                    {article.sumber.length} dokumen
                  </span>
                </div>

                {article.sumber.length === 0 ? (
                  <p className="p-6 sm:p-8 text-sm text-[var(--color-text-secondary)]">
                    Data sumber rujukan untuk artikel ini belum tercatat.
                  </p>
                ) : (
                  <div className="divide-y divide-[var(--color-border)]">
                    {article.sumber.map((s, idx) => {
                      const safeHref = getSafeExternalHref(s.url);
                      return (
                        <div
                          key={s.id}
                          className="px-6 sm:px-8 py-4 sm:py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors hover:bg-[var(--color-surface-raised)]"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--color-text-secondary)]">
                              <strong className="text-[var(--color-primary-strong)] font-semibold tabular-nums">
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
                            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-4 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] transition-colors shrink-0 min-h-[44px] self-start sm:self-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
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

              {/* ARTIKEL TERKAIT */}
              {relatedArticles.length > 0 && (
                <section aria-labelledby="heading-artikel-terkait" className="space-y-4 pt-2">
                  <h2
                    id="heading-artikel-terkait"
                    className="text-lg sm:text-xl font-light tracking-[-0.02em] text-[var(--color-text-primary)] px-1"
                  >
                    Materi terkait dalam kategori ini
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {relatedArticles.map((rel) => (
                      <Link
                        key={rel.id}
                        href={`/edukasi/${rel.slug}`}
                        className="p-5 rounded-[24px] border border-[var(--color-border)] bg-[var(--color-surface-raised)] hover:border-[var(--color-border-strong)] transition-colors flex flex-col justify-between gap-3 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
                      >
                        <div className="space-y-1.5">
                          <span className="text-xs font-medium text-[var(--color-primary-strong)]">
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
                          <ArrowUpRight
                            className="w-3.5 h-3.5 motion-safe:transition-transform motion-safe:group-hover:translate-x-0.5"
                            aria-hidden="true"
                          />
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
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
