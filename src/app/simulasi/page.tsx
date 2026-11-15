import React from "react";
import type { Metadata } from "next";
import { NotchNavbar } from "@/components/ui/NotchNavbar";
import { Footer } from "@/components/ui/Footer";
import { SimulasiWorkspace } from "@/components/simulasi/SimulasiWorkspace";
import { prisma } from "@/lib/prisma";
import {
  parseSimulasiSearchParams,
  type PresetScenarioItem,
} from "@/lib/simulasi";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Simulasi Dampak Gempa | SIGAP Gempa",
  description:
    "Simulasi edukasi dampak gempa bumi (skala MMI, energi seismik, radius guncangan, waktu rambat gelombang P/S, dan indikator kriteria tsunami).",
};

interface SimulasiPageProps {
  searchParams: Promise<{
    m?: string;
    d?: string;
    lat?: string;
    lon?: string;
    jarak?: string;
    lokasi?: string;
    wilayah?: string;
  }>;
}

export default async function SimulasiPage({ searchParams }: SimulasiPageProps) {
  const params = await searchParams;
  const initialUrlState = parseSimulasiSearchParams(params);

  let presets: PresetScenarioItem[] = [];
  let presetsLoadError = false;

  try {
    const rows = await prisma.skenarioSimulasi.findMany({
      orderBy: [{ urutan: "asc" }, { nama: "asc" }],
      include: { sumber: true },
    });

    presets = rows.map((row) => ({
      id: row.id,
      nama: row.nama,
      magnitudo: row.magnitudo,
      kedalamanKm: row.kedalamanKm,
      lat: row.lat,
      lon: row.lon,
      tipeLokasi: row.tipeLokasi,
      deskripsiSingkat: row.deskripsiSingkat,
      urutan: row.urutan,
      sumberUrl: row.sumber?.url ?? null,
      sumberJudul: row.sumber?.judul ?? null,
      sumberPenerbit: row.sumber?.penerbit ?? null,
    }));
  } catch (err) {
    // Jika database sedang padam, halaman simulasi tetap tampil dalam mode Kustom (degradasi anggun).
    console.warn("[SIMULASI] Gagal memuat preset SkenarioSimulasi:", err);
    presetsLoadError = true;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-background)]">
      <NotchNavbar />

      <main className="flex-1 max-w-[1220px] mx-auto w-full px-4 sm:px-6 pt-8 pb-16 space-y-8">
        <header className="space-y-2 max-w-2xl">
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[var(--color-text-primary)]">
            Simulasi dampak gempa
          </h1>
          <p className="text-base text-[var(--color-text-secondary)] leading-relaxed">
            Atur parameter dan lihat perkiraan guncangan, waktu rambat gelombang, dan potensi tsunami secara langsung di peramban.
          </p>
        </header>

        <SimulasiWorkspace
          presets={presets}
          presetsLoadError={presetsLoadError}
          initialUrlState={initialUrlState}
        />
      </main>

      <Footer />
    </div>
  );
}
