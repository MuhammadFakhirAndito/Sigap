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
  const normalizedLokasi = params.lokasi?.trim().toUpperCase();
  const hasExplicitUrlLokasi =
    normalizedLokasi === "DARAT" || normalizedLokasi === "LAUT";

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
    <div className="min-h-screen flex flex-col bg-[var(--color-background)] overflow-x-clip">
      <div className="w-full max-w-[1320px] mx-auto px-4 sm:px-7 lg:px-8 pt-4 sm:pt-6 pb-10 sm:pb-14 flex-1 flex flex-col space-y-6 sm:space-y-8">
        {/* SHELL ATAS: NOTCH NAVBAR + HEADER EDITORIAL HALAMAN SIMULASI */}
        <section aria-labelledby="heading-simulasi" className="w-full">
          <NotchNavbar variant="notch" />

          <div className="rounded-b-[32px] md:rounded-b-[40px] bg-[var(--color-surface)] border-b border-x border-[var(--color-border)]/60 px-5 sm:px-9 lg:px-11 pt-5 sm:pt-7 pb-6 sm:pb-8">
            <div className="space-y-2 max-w-2xl">
              <h1
                id="heading-simulasi"
                className="text-3xl sm:text-4xl lg:text-[2.75rem] font-medium tracking-[-0.03em] leading-[1.1] text-[var(--color-text-primary)] [text-wrap:balance]"
              >
                Simulasi dampak gempa
              </h1>
              <p className="text-sm sm:text-base text-[var(--color-text-secondary)] leading-relaxed [text-wrap:pretty]">
                Atur parameter untuk melihat estimasi guncangan, waktu gelombang, dan potensi tsunami.
              </p>
            </div>
          </div>
        </section>

        <main className="flex-1">
          <SimulasiWorkspace
            presets={presets}
            presetsLoadError={presetsLoadError}
            initialUrlState={initialUrlState}
            hasExplicitUrlLokasi={hasExplicitUrlLokasi}
          />
        </main>
      </div>

      <Footer />
    </div>
  );
}
