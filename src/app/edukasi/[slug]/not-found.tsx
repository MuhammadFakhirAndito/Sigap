import React from "react";
import Link from "next/link";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowLeft } from "lucide-react";

export default function EdukasiNotFound() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 flex-1 flex flex-col space-y-8">
        <NotchNavbar variant="pill" />

        <main className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full py-12">
          <div className="rounded-3xl border border-[var(--color-border)] bg-[var(--color-surface-strong)] p-8 flex flex-col items-center gap-6 text-center">
            <EmptyState
              className="border-0 bg-transparent p-0"
              message="Artikel edukasi yang Anda cari tidak ditemukan atau belum diterbitkan."
            />
            <Link
              href="/edukasi"
              className="inline-flex items-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-5 py-3 text-sm font-medium hover:bg-[var(--color-primary)] hover:text-[var(--color-text-primary)] transition-colors min-h-[44px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-hover)]"
            >
              <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>Kembali ke Pusat Edukasi</span>
            </Link>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
