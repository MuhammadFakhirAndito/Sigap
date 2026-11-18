import React from "react";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function RiwayatLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-8 flex-1 flex flex-col space-y-6 sm:space-y-8">
        <section aria-label="Memuat riwayat gempa" className="w-full">
          <NotchNavbar variant="notch" />
          <div className="rounded-b-[32px] md:rounded-b-[40px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-6 sm:px-9 lg:px-11 pt-5 sm:pt-7 pb-6 sm:pb-8 space-y-6">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64 rounded-xl bg-[var(--color-surface-raised)]" />
              <Skeleton className="h-4 w-96 max-w-full rounded-lg bg-[var(--color-surface-raised)]" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-14 w-full rounded-lg bg-[var(--color-surface-raised)]" />
              <Skeleton className="h-11 w-2/3 rounded-lg bg-[var(--color-surface-raised)]" />
            </div>
          </div>
        </section>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-[320px_1fr]">
          <Skeleton className="h-60 w-full rounded-[28px]" />
          <Skeleton className="h-60 w-full rounded-[28px]" />
        </div>

        <div
          aria-busy="true"
          aria-label="Memuat 5 baris riwayat gempa"
          className="space-y-2.5 sm:space-y-3"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center gap-4 md:gap-6 rounded-[24px] border border-[var(--color-border)]/75 bg-[var(--color-surface-raised)] px-4 py-4 md:px-5"
            >
              <Skeleton className="h-14 w-16 md:w-[72px] shrink-0 rounded-[16px]" />
              <div className="flex-1 min-w-0 space-y-2">
                <Skeleton className="h-4 w-2/3 rounded-md" />
                <Skeleton className="h-3 w-1/3 rounded-md" />
              </div>
              <Skeleton className="hidden md:block h-11 w-32 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

