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
            <Skeleton className="h-14 w-full rounded-full bg-[var(--color-surface-raised)]" />
          </div>
        </section>

        <Skeleton className="h-52 w-full rounded-[28px]" />

        <div
          aria-busy="true"
          aria-label="Memuat 5 baris riwayat gempa"
          className="rounded-[28px] border border-[var(--color-border)] bg-[var(--color-surface)] divide-y divide-[var(--color-border)] overflow-hidden"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-4 flex items-center justify-between gap-4">
              <Skeleton className="h-8 w-14 rounded-lg bg-[var(--color-surface-raised)]" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 rounded-md bg-[var(--color-surface-raised)]" />
                <Skeleton className="h-3 w-1/3 rounded-md bg-[var(--color-surface-raised)]" />
              </div>
              <Skeleton className="h-9 w-28 rounded-full bg-[var(--color-surface-raised)]" />
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}

