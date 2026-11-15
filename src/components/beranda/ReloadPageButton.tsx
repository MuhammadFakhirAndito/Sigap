"use client";

import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

export function ReloadPageButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="inline-flex items-center justify-center gap-1.5 min-h-[44px] rounded-full bg-[var(--color-cta)] px-5 text-sm font-medium text-[var(--color-on-cta)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] active:bg-[var(--color-primary-strong)] active:text-[var(--color-on-cta)] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]"
    >
      <RefreshCw className="w-4 h-4" aria-hidden="true" />
      <span>Muat ulang data</span>
    </button>
  );
}
