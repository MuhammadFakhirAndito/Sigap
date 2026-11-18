import React from "react";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function EdukasiLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-8 flex-1 flex flex-col space-y-12 sm:space-y-16">
        <section aria-label="Memuat header edukasi" className="w-full">
          <NotchNavbar variant="notch" />
          <div className="rounded-b-[32px] md:rounded-b-[40px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-5 sm:px-9 lg:px-11 pt-5 sm:pt-7 pb-6 sm:pb-8 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
              <div className="space-y-3.5 max-w-2xl">
                <Skeleton className="h-4 w-56 rounded-md" />
                <Skeleton className="h-11 w-72 sm:w-96 rounded-xl" />
                <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Skeleton className="h-11 w-64 rounded-full" />
                  <Skeleton className="h-11 w-40 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Skeleton className="h-14 w-24 rounded-2xl" />
                <Skeleton className="h-14 w-24 rounded-2xl" />
                <Skeleton className="h-14 w-24 rounded-2xl" />
              </div>
            </div>
            <Skeleton className="h-14 w-full rounded-full" />
          </div>
        </section>

        <main className="flex-1 flex flex-col space-y-12">
          <section aria-label="Memuat daftar artikel" className="space-y-8">
            <div className="flex items-center justify-between px-1">
              <div className="space-y-2">
                <Skeleton className="h-4 w-36 rounded-md" />
                <Skeleton className="h-8 w-56 rounded-lg" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>

            {/* Kelompok 1: Fase */}
            <div className="space-y-5">
              <Skeleton className="h-6 w-64 rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
                <Skeleton className="lg:col-span-6 h-64 w-full rounded-[28px]" />
                <Skeleton className="md:col-span-2 lg:col-span-6 h-64 w-full rounded-[28px]" />
                <Skeleton className="lg:col-span-6 h-64 w-full rounded-[28px]" />
                <Skeleton className="md:col-span-2 lg:col-span-6 h-64 w-full rounded-[28px]" />
              </div>
            </div>

            {/* Kelompok 2: Memahami */}
            <div className="space-y-5">
              <Skeleton className="h-6 w-56 rounded-lg" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5">
                <Skeleton className="lg:col-span-4 h-56 w-full rounded-[28px]" />
                <Skeleton className="lg:col-span-4 h-56 w-full rounded-[28px]" />
                <Skeleton className="lg:col-span-4 h-56 w-full rounded-[28px]" />
              </div>
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
