"use client";

import React from "react";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { Button } from "@/components/ui/Button";
import { MagnitudeBadge } from "@/components/ui/MagnitudeBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { QuakeCard } from "@/components/ui/QuakeCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ArrowRight, RefreshCw, Search } from "lucide-react";

export default function DesignSystemPage() {
  const colorTokens = [
    { name: "primary", hex: "#B7410E", desc: "Aksen rust-orange (magnitudo, MMI, status penting)" },
    { name: "primary-strong", hex: "#9A3412", desc: "Aksen teks kecil (<18px) agar lolos AA" },
    { name: "cta", hex: "#1A1613", desc: "Warna aksi utama (tombol pill hitam)" },
    { name: "background", hex: "#F6F4F1", desc: "Kanvas utama (abu-abu hangat)" },
    { name: "surface", hex: "#E8E4DF", desc: "Permukaan panel & kartu tingkat 1" },
    { name: "surface-raised", hex: "#FFFDFB", desc: "Permukaan kartu fokus & tombol tingkat 2" },
    { name: "surface-sunken", hex: "#D8D3CC", desc: "Trek slider & placeholder skeleton" },
    { name: "text-primary", hex: "#1A1613", desc: "Teks utama (rasio 16.4:1)" },
    { name: "text-secondary", hex: "#5E5750", desc: "Teks pendukung & subcopy" },
    { name: "border", hex: "#C4BDB4", desc: "Garis pemisah dekoratif" },
    { name: "border-strong", hex: "#7A726A", desc: "Batas kontrol interaktif (3:1)" },
    { name: "success", hex: "#15803D", desc: "Status aman / sinkronisasi normal" },
    { name: "warning", hex: "#B45309", desc: "Status data lama / peringatan" },
    { name: "error", hex: "#B91C1C", desc: "Status potensi tsunami / error" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <NotchNavbar />

      <main className="max-w-[1220px] mx-auto w-full px-4 sm:px-6 py-10 space-y-16">
        {/* Header */}
        <section className="space-y-3">
          <p className="text-xs font-semibold text-[var(--color-primary-strong)]">
            Design System: Token & Komponen
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Spesifikasi Token DESIGN.md v1.1
          </h1>
          <p className="text-base text-[var(--color-text-secondary)] max-w-2xl">
            Seluruh komponen dibangun berlandaskan token CSS-first Tailwind v4 tanpa hardcoded color atau gradient dekoratif. Menjaga ketenangan editorial dan aksesibilitas WCAG 2.2 AA.
          </p>
        </section>

        {/* Color Palette */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            1. Token Warna (Tonal Flat)
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {colorTokens.map((c) => (
              <div
                key={c.name}
                className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-4 flex flex-col justify-between gap-3"
              >
                <div
                  className="w-full h-14 rounded-xl border border-[var(--color-border-strong)]/30"
                  style={{ backgroundColor: c.hex }}
                />
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm text-[var(--color-text-primary)]">{c.name}</span>
                    <span className="text-xs tnum font-mono text-[var(--color-text-secondary)]">{c.hex}</span>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">{c.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Buttons */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            2. Komponen Tombol
          </h2>
          <div className="bg-[var(--color-surface)] rounded-[28px] p-6 flex flex-wrap items-center gap-4">
            <Button variant="cta" icon={<ArrowRight className="w-4 h-4" />}>
              Tombol CTA (button-cta)
            </Button>
            <Button variant="outline">
              Tombol Outline (button-outline)
            </Button>
            <Button variant="icon" aria-label="Cari">
              <Search className="w-4 h-4" />
            </Button>
            <Button variant="ghost">
              Tombol Ghost
            </Button>
            <Button variant="cta" disabled>
              CTA Dinonaktifkan
            </Button>
          </div>
        </section>

        {/* Badges */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            3. Komponen Badge (Magnitudo & Status)
          </h2>
          <div className="bg-[var(--color-surface)] rounded-[28px] p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                MagnitudeBadge (Tabular Figures)
              </h3>
              <div className="flex flex-wrap items-end gap-6">
                <div>
                  <span className="text-xs block text-[var(--color-text-secondary)] mb-1">Small</span>
                  <MagnitudeBadge magnitude={4.8} size="sm" />
                </div>
                <div>
                  <span className="text-xs block text-[var(--color-text-secondary)] mb-1">Medium (Default)</span>
                  <MagnitudeBadge magnitude={5.2} size="md" />
                </div>
                <div>
                  <span className="text-xs block text-[var(--color-text-secondary)] mb-1">Large</span>
                  <MagnitudeBadge magnitude={6.5} size="lg" />
                </div>
                <div>
                  <span className="text-xs block text-[var(--color-text-secondary)] mb-1">Extra Large (Hero)</span>
                  <MagnitudeBadge magnitude={7.4} size="xl" showLabel />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-3">
                StatusBadge (Ikon + Teks, WCAG Compliant)
              </h3>
              <div className="flex flex-wrap gap-3">
                <StatusBadge variant="sync_ok" customText="BMKG Terhubung · diperbarui 2 mnt lalu" />
                <StatusBadge variant="sync_warning" customText="BMKG Tidak Terjangkau · Data 10 Nov" />
                <StatusBadge variant="tsunami_aman" />
                <StatusBadge variant="tsunami_berpotensi" />
                <StatusBadge variant="tsunami_tidak_dinyatakan" />
              </div>
            </div>
          </div>
        </section>

        {/* QuakeCard Preview */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            4. QuakeCard (Hover & Status)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
            <QuakeCard
              quake={{
                magnitudo: 5.4,
                kedalamanKm: 12,
                wilayah: "Pusat gempa berada di laut 78 km BaratDaya Sukabumi",
                waktuUtc: new Date(),
                statusTsunami: "AMAN",
                lat: -7.2,
                lon: 106.8,
              }}
            />
            <QuakeCard
              quake={{
                magnitudo: 7.1,
                kedalamanKm: 25,
                wilayah: "Pusat gempa berada di laut 142 km BaratLaut Maluku Barat Daya",
                waktuUtc: new Date(Date.now() - 3600000 * 5),
                statusTsunami: "BERPOTENSI",
                lat: -7.5,
                lon: 128.2,
              }}
            />
            <QuakeCard
              quake={{
                magnitudo: 4.1,
                kedalamanKm: 10,
                wilayah: "Pusat gempa berada di darat 15 km TimurLaut Cianjur",
                waktuUtc: new Date(Date.now() - 3600000 * 24),
                statusTsunami: "TIDAK_DINYATAKAN",
                lat: -6.8,
                lon: 107.2,
              }}
            />
          </div>
        </section>

        {/* Feedback & Fallback States */}
        <section className="space-y-6">
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border)] pb-2">
            5. State (Skeleton, Empty, Error)
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[var(--color-surface)] rounded-[28px] p-6 space-y-4">
              <h3 className="text-xs font-semibold text-[var(--color-text-secondary)]">Skeleton (Blok Sunken)</h3>
              <Skeleton className="w-20 h-8 rounded-full" />
              <Skeleton className="w-full h-12" />
              <Skeleton className="w-3/4 h-6" />
            </div>

            <EmptyState
              message="Tidak ada data gempa yang sesuai dengan filter pencarian."
              actionText="Reset Filter"
              onAction={() => alert("Reset clicked")}
            />

            <ErrorState
              title="Koneksi BMKG Terputus"
              message="Gagal menyinkronkan data gempa terkini dari server BMKG. Menampilkan data lokal terakhir."
              onRetry={() => alert("Retry clicked")}
            />
          </div>
        </section>
      </main>

      <Footer lastUpdatedText="Diperbarui 11 Nov 2026, 14:45 WIB" />
    </div>
  );
}
