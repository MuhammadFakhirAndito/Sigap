import React from "react";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function EdukasiLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-8 flex-1 flex flex-col space-y-8 sm:space-y-10">
        <section aria-label="Memuat header edukasi" className="w-full">
          <NotchNavbar variant="notch" />
          <div className="rounded-b-[32px] md:rounded-b-[40px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-5 sm:px-9 lg:px-11 pt-5 sm:pt-7 pb-6 sm:pb-8 space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-4 w-56 rounded-md" />
              <Skeleton className="h-11 w-72 sm:w-96 rounded-xl" />
              <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
            </div>
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        </section>

        <main className="flex-1 flex flex-col space-y-8">
          <section aria-label="Memuat daftar artikel" className="space-y-5">
            <div className="flex items-center justify-between px-1">
              <Skeleton className="h-7 w-52 rounded-lg" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
              <Skeleton className="lg:col-span-7 h-72 w-full rounded-[28px]" />
              <div className="lg:col-span-5 flex flex-col gap-5">
                <Skeleton className="h-32 w-full rounded-[24px]" />
                <Skeleton className="h-32 w-full rounded-[24px]" />
              </div>
            </div>

            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-24 w-full rounded-[20px]" />
              ))}
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
