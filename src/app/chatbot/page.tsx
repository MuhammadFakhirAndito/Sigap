import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { ArrowLeft, MessageSquare } from "lucide-react";

export const metadata: Metadata = {
  title: "Chatbot Mitigasi Gempa | SIGAP Gempa",
  description:
    "Asisten tanya jawab kontekstual kebencanaan dan mitigasi gempa SIGAP Gempa (sedang disiapkan pada Fase 3).",
};

interface ChatbotPlaceholderPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export default async function ChatbotPlaceholderPage({
  searchParams,
}: ChatbotPlaceholderPageProps) {
  const params = await searchParams;
  const queryTopic = params.q?.trim();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6">
        <NotchNavbar variant="pill" />
      </div>

      <main className="w-full max-w-[72ch] mx-auto px-4 sm:px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <div className="rounded-3xl bg-[var(--color-surface-strong)] border border-[var(--color-border)] p-8 sm:p-10 w-full space-y-6">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-text-primary)] mx-auto flex items-center justify-center">
            <MessageSquare className="w-6 h-6" aria-hidden="true" />
          </div>

          <div className="space-y-2.5">
            <p className="text-xs font-medium text-[var(--color-text-secondary)]">
              Fase 3 · Sedang Disiapkan
            </p>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[var(--color-text-primary)] [text-wrap:balance]">
              Asisten tanya jawab mitigasi gempa
            </h1>
            <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed [text-wrap:pretty]">
              Halaman chatbot kontekstual dengan dukungan FAQ resmi kebencanaan sedang dikembangkan pada tahap berikutnya.
            </p>
          </div>

          {queryTopic && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-left space-y-1">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                Topik pertanyaan yang diteruskan dari artikel:
              </p>
              <p className="text-sm font-medium text-[var(--color-text-primary)]">
                {queryTopic}
              </p>
            </div>
          )}

          <div className="pt-1 flex justify-center">
            <Link
              href="/edukasi"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-6 py-3 text-sm font-medium hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)]"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Kembali ke Pusat Edukasi</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

