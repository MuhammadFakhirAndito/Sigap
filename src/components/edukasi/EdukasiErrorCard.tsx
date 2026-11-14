"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ErrorState } from "@/components/ui/ErrorState";

interface EdukasiErrorCardProps {
  title?: string;
  message: string;
}

export const EdukasiErrorCard: React.FC<EdukasiErrorCardProps> = ({
  title = "Gagal memuat materi edukasi",
  message,
}) => {
  const router = useRouter();

  return (
    <ErrorState
      className="bg-[var(--color-surface-strong)] border border-[var(--color-border)]"
      title={title}
      message={message}
      onRetry={() => router.refresh()}
    />
  );
};

