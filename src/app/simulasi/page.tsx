import React from "react";
import Link from "next/link";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { ArrowLeft, Construction, Activity } from "lucide-react";

interface SimulasiPageProps {
  searchParams: Promise<{
    m?: string;
    d?: string;
    lat?: string;
    lon?: string;
  }>;
}

export default async function SimulasiPlaceholderPage({ searchParams }: SimulasiPageProps) {
  const params = await searchParams;
  const m = params.m;
  const d = params.d;
  const lat = params.lat;
  const lon = params.lon;

  const hasParams = m !== undefined || d !== undefined || lat !== undefined || lon !== undefined;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 pt-4">
        <NotchNavbar variant="pill" />
      </div>

      <main className="w-full max-w-[960px] mx-auto px-4 sm:px-6 py-12 flex-1 flex flex-col items-center justify-center text-center">
        <div className="rounded-[36px] bg-[var(--color-surface)] border border-[var(--color-border)] p-8 sm:p-12 max-w-[640px] w-full space-y-6 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] mx-auto flex items-center justify-center">
            <Construction className="w-7 h-7" aria-hidden="true" />
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold tracking-wider uppercase text-[var(--color-primary)]">
              Fase 4 · Segera Hadir
            </p>
            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-[var(--color-text-primary)]">
              Modul simulasi dampak gempa
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed text-pretty">
              Fitur estimasi dampak fisik, perhitungan intensitas MMI, waktu rambat gelombang P-S, dan potensi tsunami berbasis parameter gempa sedang disiapkan.
            </p>
          </div>

          {hasParams && (
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-4 text-left space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-primary)]">
                <Activity className="w-4 h-4 text-[var(--color-primary)]" />
                <span>Parameter yang diterima dari riwayat:</span>
              </div>
              <dl className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-secondary)]">
                <div>
                  <dt className="text-[11px] text-[var(--color-text-muted)]">Magnitudo</dt>
                  <dd className="font-semibold text-[var(--color-text-primary)] tnum">{m ? `${m} M` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-[var(--color-text-muted)]">Kedalaman</dt>
                  <dd className="font-semibold text-[var(--color-text-primary)] tnum">{d ? `${d} km` : "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-[var(--color-text-muted)]">Lintang</dt>
                  <dd className="font-semibold text-[var(--color-text-primary)] tnum">{lat ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] text-[var(--color-text-muted)]">Bujur</dt>
                  <dd className="font-semibold text-[var(--color-text-primary)] tnum">{lon ?? "—"}</dd>
                </div>
              </dl>
            </div>
          )}

          <div className="pt-2">
            <Link
              href="/riwayat"
              className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-6 py-3 text-sm font-medium hover:opacity-90 active:scale-95 transition-all min-h-[44px]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke riwayat gempa</span>
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

