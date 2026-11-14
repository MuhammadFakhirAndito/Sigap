import React from "react";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { Skeleton } from "@/components/ui/Skeleton";

export default function EdukasiDetailLoading() {
  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 flex-1 flex flex-col space-y-8 sm:space-y-10">
        <NotchNavbar variant="pill" />

        <main className="w-full max-w-[72ch] mx-auto flex-1 space-y-8 pb-8">
          <Skeleton className="h-11 w-48 rounded-full" />

          <div className="space-y-4 pb-6 border-b border-[var(--color-border)]">
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-28 rounded-full" />
              <Skeleton className="h-5 w-24 rounded-md" />
            </div>
            <Skeleton className="h-10 w-full rounded-xl" />
            <Skeleton className="h-10 w-3/4 rounded-xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-11/12 rounded-md" />
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-4/5 rounded-md" />
            <Skeleton className="h-7 w-64 rounded-lg mt-6" />
            <Skeleton className="h-5 w-full rounded-md" />
            <Skeleton className="h-5 w-10/12 rounded-md" />
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
