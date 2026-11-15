"use client";

import React from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, ChevronDown } from "lucide-react";
import { buildChatbotHandoffUrl, formatIdNumber, type SimulasiInput, type SimulasiResult } from "@/lib/simulasi";

interface SafetyAndFormulaSectionProps {
  input: SimulasiInput;
  result: SimulasiResult;
}

const SAFETY_LINKS = [
  {
    href: "/edukasi/saat-gempa-terjadi",
    title: "Yang dilakukan saat gempa terjadi",
    desc: "Panduan praktis melindungi kepala di dalam bangunan, di luar ruangan, hingga di pantai.",
  },
  {
    href: "/edukasi/tsunami-yang-harus-dilakukan",
    title: "Tindakan saat potensi tsunami",
    desc: "Langkah evakuasi cepat ke tempat tinggi setelah guncangan kuat di wilayah pesisir.",
  },
  {
    href: "/edukasi/skala-mmi",
    title: "Memahami skala MMI (I–XII)",
    desc: "Arti tiap tingkat intensitas guncangan menurut rujukan resmi BMKG.",
  },
];

export function SafetyAndFormulaSection({ input, result }: SafetyAndFormulaSectionProps) {
  const chatbotUrl = buildChatbotHandoffUrl({
    magnitudo: input.magnitudo,
    kedalamanKm: input.kedalamanKm,
    wilayah: input.wilayah,
    mmiRoman: result.mmi.roman,
  });

  return (
    <section aria-label="Rekomendasi keselamatan dan rumus simulasi" className="space-y-6">
      {/* Rekomendasi keselamatan + CTA Chatbot */}
      <div className="bg-[var(--color-surface)] rounded-[28px] p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Rekomendasi kesiapsiagaan
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Pelajari panduan mitigasi terkait skenario M {formatIdNumber(input.magnitudo, 1)} (MMI {result.mmi.roman}) atau diskusikan langsung dengan asisten SIGAP.
            </p>
          </div>

          <Link
            href={chatbotUrl}
            className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] px-6 py-3 min-h-[48px] text-sm font-medium shrink-0 transition-opacity duration-150 hover:opacity-90"
          >
            <span>Tanyakan skenario ini ke chatbot</span>
            <ArrowRight className="w-4 h-4 shrink-0" aria-hidden="true" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {SAFETY_LINKS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-[20px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4 space-y-1.5 transition-colors duration-150 hover:border-[var(--color-border-strong)]"
            >
              <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-primary)]">
                <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Panduan edukasi</span>
              </div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:underline">
                {item.title}
              </p>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* Progressive disclosure rumus & asumsi */}
      <details className="group bg-[var(--color-surface)] rounded-[28px] p-6">
        <summary className="flex items-center justify-between gap-3 list-none text-base font-semibold text-[var(--color-text-primary)] min-h-[44px]">
          <span>Lihat rumus &amp; asumsi simulasi</span>
          <ChevronDown
            className="w-5 h-5 shrink-0 transition-transform duration-200 group-open:rotate-180"
            aria-hidden="true"
          />
        </summary>

        <div className="mt-4 pt-4 border-t border-[var(--color-border)] space-y-4 text-sm text-[var(--color-text-secondary)] leading-relaxed">
          <div className="space-y-1">
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              1. Intensitas MMI (Allen, Wald &amp; Worden, 2012 — Jarak Hiposenter)
            </h3>
            <p className="tnum">
              MMI = 2,085 + 1,428·M − 1,402·ln(√(R_hypo² + r_m²)) + 0,078·ln(R_hypo / 50) [untuk R_hypo &gt; 50 km],
              dengan r_m = −0,209 + 2,042·exp(M − 5). Kalibrasi empiris: Mw 5,0–7,9, jarak &lt; 300 km, kerak aktif dangkal (bukan model subduksi).
            </p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
              <span>Rujukan:</span>
              <a
                href="https://link.springer.com/article/10.1007/s10950-012-9278-7"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center min-h-[44px] rounded-full border border-[var(--color-border-strong)] px-3.5 font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
              >
                Allen, Wald &amp; Worden (2012), J. Seismology
              </a>
              <a
                href="https://raw.githubusercontent.com/gem/oq-engine/master/openquake/hazardlib/gsim/allen_2012_ipe.py"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center min-h-[44px] rounded-full border border-[var(--color-border-strong)] px-3.5 font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]"
              >
                OpenQuake Engine (AllenEtAl2012Rhypo)
              </a>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              2. Energi Seismik, Hiposenter, Waktu Rambat, &amp; Radius
            </h3>
            <p className="tnum">
              log₁₀ E = 1,5·M + 4,8 (joule) · R_hypo = √(R_epi² + d²) · tP = R_hypo / 6,0 km/s · tS = R_hypo / 3,5 km/s · Golden time = tS − tP.
              Radius MMI ≥ III dan MMI ≥ VI dihitung lewat pencarian numerik (bisection) hingga 300 km, dan tidak diekstrapolasi di luar rentang kalibrasi.
            </p>
          </div>

          <div className="space-y-1">
            <h3 className="font-semibold text-[var(--color-text-primary)]">
              3. Indikator Tsunami (Buku Saku BNPB, 2012)
            </h3>
            <p>
              Kriteria edukasi terpenuhi bila pusat gempa berada di laut, magnitudo &gt; 6,8, dan kedalaman ≤ 70 km.
              Jenis sesar dan longsor bawah laut tidak dimodelkan. Peringatan tsunami resmi hanya berasal dari BMKG.
            </p>
          </div>
        </div>
      </details>
    </section>
  );
}
