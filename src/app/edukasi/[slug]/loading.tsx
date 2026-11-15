import React from "react";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function EdukasiDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-10 flex-1 flex flex-col space-y-8 sm:space-y-10">
        <section aria-label="Memuat header artikel" className="w-full">
          <NotchNavbar variant="notch" />
          <div className="rounded-b-[32px] md:rounded-b-[40px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-5 sm:px-9 lg:px-11 pt-5 sm:pt-7 pb-7 sm:pb-10 space-y-6">
            <div className="flex items-center justify-between gap-3">
              <Skeleton className="h-11 w-48 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-11 w-3/4 rounded-xl" />
              <Skeleton className="h-6 w-2/3 rounded-lg" />
            </div>
          </div>
        </section>

        <main className="w-full flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            <div className="lg:col-span-4 space-y-5 order-2 lg:order-1">
              <Skeleton className="h-48 w-full rounded-[24px]" />
              <Skeleton className="h-48 w-full rounded-[24px]" />
            </div>

            <div className="lg:col-span-8 rounded-[28px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-6 sm:p-8 lg:p-10 space-y-5 order-1 lg:order-2">
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-11/12 rounded-md" />
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-4/5 rounded-md" />
              <Skeleton className="h-7 w-64 rounded-lg mt-6" />
              <Skeleton className="h-5 w-full rounded-md" />
              <Skeleton className="h-5 w-10/12 rounded-md" />
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
