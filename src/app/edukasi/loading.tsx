import React from "react";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function EdukasiLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 flex-1 flex flex-col space-y-8 sm:space-y-10">
        <NotchNavbar variant="pill" />

        <main className="flex-1 flex flex-col space-y-8 pb-8">
          <div className="space-y-3 pt-2">
            <Skeleton className="h-11 w-72 sm:w-96 rounded-xl" />
            <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
          </div>

          <div className="flex items-center gap-2 overflow-hidden py-1">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={idx} className="h-11 w-28 sm:w-32 shrink-0 rounded-full" />
            ))}
          </div>

          <section aria-label="Memuat daftar artikel" className="space-y-6">
            <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
              <Skeleton className="h-7 w-52 rounded-lg" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>

            <Skeleton className="h-56 w-full rounded-3xl" />

            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={idx} className="h-28 w-full rounded-2xl" />
              ))}
            </div>
          </section>
        </main>
      </div>

      <Footer />
    </div>
  );
}
