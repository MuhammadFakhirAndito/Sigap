"use client";

import React from "react";
import { AlertTriangle, Check, Info, Waves, Clock, Activity } from "lucide-react";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  MMI_SCALE_INFO,
  formatIdNumber,
  type PresetScenarioItem,
  type SimulasiInput,
  type SimulasiResult,
} from "@/lib/simulasi";
import type { UiTipeLokasi } from "@/lib/simulasi-visual";

interface MmiCardProps {
  input: SimulasiInput;
  result: SimulasiResult;
}

export function MmiCard({ input, result }: MmiCardProps) {
  const { mmi } = result;
  const distDecimals =
    input.jarakPengamatKm >= 100 || Number.isInteger(input.jarakPengamatKm) ? 0 : 1;

  return (
    <section
      aria-label="Perkiraan skala intensitas MMI"
      className="bg-[var(--color-surface)] rounded-[28px] p-6 space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Rincian 12 tingkat intensitas MMI di jarak{" "}
            <span className="tnum">{formatIdNumber(input.jarakPengamatKm, distDecimals)} km</span>
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Estimasi empiris Allen, Wald &amp; Worden (2012) pada jarak hiposenter{" "}
            <span className="tnum font-semibold text-[var(--color-text-primary)]">
              {formatIdNumber(result.rhypoKm, 1)} km
            </span>
          </p>
        </div>

        {(mmi.outsideMagRange || mmi.outsideDistRange) && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-warning-strong)] px-3 py-1 text-xs font-medium text-[var(--color-warning-strong)]">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            di luar rentang kalibrasi
          </span>
        )}
      </div>

      {/* Focal MMI display: selalu netral gelap (text-primary), tidak memakai hijau untuk data bahaya */}
      <div className="flex flex-col sm:flex-row sm:items-baseline gap-4 sm:gap-6">
        <div className="flex items-baseline gap-3 shrink-0">
          <span className="tnum text-6xl sm:text-7xl font-bold tracking-tight leading-none text-[var(--color-text-primary)]">
            {mmi.roman}
          </span>
          <span className="text-sm font-semibold text-[var(--color-text-secondary)] tnum whitespace-nowrap">
            MMI · {formatIdNumber(mmi.raw, 1)}
          </span>
        </div>

        <div className="space-y-1">
          <p className="text-base font-semibold text-[var(--color-text-primary)]">
            {mmi.label}
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
            {mmi.description}
          </p>
        </div>
      </div>

      {/* Skala bar 12 segmen I-XII dengan warna netral (cta / surface-sunken) + label teks */}
      <div className="space-y-2">
        <div
          role="img"
          aria-label={`Skala intensitas MMI tingkat ${mmi.roman} dari XII (${mmi.label})`}
          className="grid grid-cols-6 sm:grid-cols-12 gap-1.5"
        >
          {MMI_SCALE_INFO.map((seg) => {
            const filled = seg.level <= mmi.clampedLevel;
            const isCurrent = seg.level === mmi.clampedLevel;
            return (
              <div
                key={seg.level}
                className={`tnum flex items-center justify-center rounded-lg py-2 text-xs font-semibold border transition-colors duration-150 ${
                  filled
                    ? "bg-[var(--color-cta)] text-[var(--color-on-cta)] border-[var(--color-cta)]"
                    : "bg-[var(--color-surface-sunken)] text-[var(--color-text-primary)] border-transparent"
                } ${isCurrent ? "ring-2 ring-[var(--color-border-strong)] ring-offset-1 ring-offset-[var(--color-surface)]" : ""}`}
              >
                {seg.roman}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
          <span>I: Tidak terasa</span>
          <span>VI: Merusak ringan</span>
          <span>XII: Hancur total</span>
        </div>
      </div>

      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border)] pt-3">
        Catatan model: rumus Allen, Wald &amp; Worden (2012) berlaku untuk gempa{" "}
        <strong className="font-semibold text-[var(--color-text-primary)]">
          kerak aktif dangkal (bukan model subduksi)
        </strong>
        , dan tidak memasukkan efek amplifikasi tanah lokal.
      </p>

      {mmi.calibrationNotes.length > 0 && (
        <div
          role="note"
          className="rounded-[16px] bg-[var(--color-surface-raised)] border border-[var(--color-warning-strong)] p-3.5 text-xs text-[var(--color-warning-strong)] space-y-1"
        >
          {mmi.calibrationNotes.map((note, idx) => (
            <p key={idx}>{note}</p>
          ))}
        </div>
      )}
    </section>
  );
}

interface MetricsGridProps {
  input: SimulasiInput;
  result: SimulasiResult;
}

export function MetricsGrid({ input, result }: MetricsGridProps) {
  return (
    <section
      aria-label="Ringkasan energi, jarak hiposenter, dan radius guncangan"
      className="grid grid-cols-1 sm:grid-cols-2 gap-4"
    >
      <div className="bg-[var(--color-surface)] rounded-[24px] p-5 space-y-1.5">
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">
          Estimasi energi seismik
        </p>
        <p className="tnum text-2xl font-bold text-[var(--color-text-primary)]">
          {result.energy.mantissa} × 10<sup>{result.energy.exponent}</sup> J
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] tnum">
          M {formatIdNumber(input.magnitudo, 1)}, Gutenberg-Richter
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-[24px] p-5 space-y-1.5">
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">
          Jarak hiposenter
        </p>
        <p className="tnum text-2xl font-bold text-[var(--color-text-primary)]">
          {formatIdNumber(result.rhypoKm, 1)} km
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] tnum">
          √({formatIdNumber(input.jarakPengamatKm, 0)}² + {formatIdNumber(input.kedalamanKm, 1)}²)
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-[24px] p-5 space-y-1.5">
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">
          Radius terasa (MMI ≥ III)
        </p>
        <p className="tnum text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] leading-snug">
          {result.radiusFeltIII.displayText}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Terasa nyata di dalam rumah
        </p>
      </div>

      <div className="bg-[var(--color-surface)] rounded-[24px] p-5 space-y-1.5">
        <p className="text-xs font-medium text-[var(--color-text-secondary)]">
          Radius merusak ringan (MMI ≥ VI)
        </p>
        <p className="tnum text-lg sm:text-xl font-semibold text-[var(--color-text-primary)] leading-snug">
          {result.radiusDamagingVI.displayText}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)]">
          Potensi plester retak / jatuh (skala BMKG)
        </p>
      </div>
    </section>
  );
}

interface TravelTimeCardProps {
  result: SimulasiResult;
}

export function TravelTimeCard({ result }: TravelTimeCardProps) {
  const maxSeconds = Math.max(result.tsSeconds, 1);
  const pPct = Math.min(100, (result.tpSeconds / maxSeconds) * 100);

  return (
    <section
      aria-label="Perkiraan waktu rambat gelombang P dan S"
      className="bg-[var(--color-surface)] rounded-[28px] p-6 space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text-primary)]">
            <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
            <h2>Waktu rambat gelombang seismik</h2>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Rata-rata kerak bumi: P = 6,0 km/s · S = 3,5 km/s
          </p>
        </div>

        <div className="rounded-[16px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-4 py-2.5">
          <span className="block text-xs text-[var(--color-text-secondary)]">
            Golden time (tS − tP)
          </span>
          <span className="tnum text-2xl font-bold text-[var(--color-text-primary)]">
            {formatIdNumber(result.goldenTimeSeconds, 1)} detik
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-primary)]">
            <span className="inline-flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              Gelombang Primer (tP)
            </span>
            <span className="tnum font-semibold">
              {formatIdNumber(result.tpSeconds, 1)} detik
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-[var(--color-surface-sunken)] overflow-hidden">
            <div
              className="h-full w-full origin-left rounded-full bg-[var(--color-text-secondary)] transition-transform duration-200 motion-reduce:transition-none"
              style={{ transform: `scaleX(${pPct / 100})` }}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs font-medium text-[var(--color-text-primary)]">
            <span className="inline-flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" aria-hidden="true" />
              Gelombang Sekunder (tS)
            </span>
            <span className="tnum font-semibold">
              {formatIdNumber(result.tsSeconds, 1)} detik
            </span>
          </div>
          <div className="h-3 w-full rounded-full bg-[var(--color-surface-sunken)] overflow-hidden">
            <div
              className="h-full w-full rounded-full bg-[var(--color-cta)]"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

interface TsunamiCardProps {
  input: SimulasiInput;
  result: SimulasiResult;
  activePreset: PresetScenarioItem | null;
  uiTipeLokasi: UiTipeLokasi;
}

export function TsunamiCard({
  input,
  result,
  activePreset,
  uiTipeLokasi,
}: TsunamiCardProps) {
  const { tsunami } = result;
  const isSpecialCoastalPreset =
    activePreset &&
    (activePreset.nama.includes("Palu") || activePreset.nama.includes("Lombok"));

  return (
    <section
      aria-label="Indikator kriteria tsunami simulasi"
      className="bg-[var(--color-surface)] rounded-[28px] p-6 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-[var(--color-text-primary)]" aria-hidden="true" />
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Indikator kriteria tsunami
          </h3>
        </div>

        {uiTipeLokasi === "BELUM_DIPILIH" ? (
          <span
            role="status"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3 py-1 text-xs font-medium text-[var(--color-text-primary)]"
          >
            <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Tipe lokasi belum dipilih</span>
          </span>
        ) : tsunami.meetsCriteria ? (
          <StatusBadge
            variant="tsunami_berpotensi"
            customText={tsunami.badgeLabel}
          />
        ) : (
          /* Netral (bukan hijau) agar tidak memberi kesan aman pada bahaya tsunami lokal */
          <span
            role="status"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] px-3 py-1 text-xs font-medium text-[var(--color-text-primary)]"
          >
            <Info className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>{tsunami.badgeLabel}</span>
          </span>
        )}
      </div>

      {uiTipeLokasi === "BELUM_DIPILIH" ? (
        <div className="space-y-2 rounded-[16px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] p-4">
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            Pilih tipe lokasi untuk melihat indikator tsunami
          </p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            Pada mode Kustom, status lokasi pusat gempa (Darat atau Laut) sengaja belum ditetapkan agar tidak memberi asumsi keliru. Pilih Darat atau Laut pada bagian Parameter lanjutan di atas.
          </p>
        </div>
      ) : (
        <>
          <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
            {tsunami.explanation}
          </p>

          {/* Checklist 3 syarat BNPB 2012 */}
          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            {[
              { label: "Lokasi di laut", ok: input.tipeLokasi === "LAUT" },
              { label: "Magnitudo > 6,8", ok: input.magnitudo > 6.8 },
              { label: "Kedalaman ≤ 70 km", ok: input.kedalamanKm <= 70 },
            ].map((item) => (
              <li
                key={item.label}
                className="flex items-center gap-2 rounded-[14px] bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-3 py-2 text-[var(--color-text-primary)]"
              >
                {item.ok ? (
                  <Check className="w-3.5 h-3.5 shrink-0 text-[var(--color-text-primary)]" aria-hidden="true" />
                ) : (
                  <span className="w-3.5 h-3.5 shrink-0 text-center font-semibold text-[var(--color-text-secondary)]" aria-hidden="true">
                    ×
                  </span>
                )}
                <span className={item.ok ? "font-semibold" : "text-[var(--color-text-secondary)]"}>
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Catatan wajib mengenai Palu 2018 & Lombok 2018 selalu tampil di UI di samping indikator tsunami */}
      <div className="rounded-[16px] bg-[var(--color-surface-raised)] border border-[var(--color-border-strong)] p-4 space-y-2 text-xs leading-relaxed text-[var(--color-text-primary)]">
        {isSpecialCoastalPreset && activePreset.deskripsiSingkat && (
          <p className="font-medium border-b border-[var(--color-border)] pb-2">
            {activePreset.deskripsiSingkat}
          </p>
        )}
        <p>
          <strong className="font-semibold">Peringatan keterbatasan model (kasus Palu 2018 &amp; Lombok 2018):</strong>{" "}
          Simulasi hanya memakai tiga parameter Buku Saku BNPB (2012) tanpa memodelkan{" "}
          <strong className="font-semibold">longsor bawah laut</strong> maupun{" "}
          <strong className="font-semibold">jenis sesar</strong>. Pada kejadian Palu 2018, pusat gempa
          tercatat di darat dekat garis pantai namun memicu tsunami besar akibat longsor bawah laut;
          demikian pula pada Lombok 2018 yang berada dekat pantai utara. Hasil{" "}
          <em>&ldquo;Tidak memenuhi kriteria simulasi&rdquo;</em> tidak boleh dianggap jaminan aman.
        </p>
      </div>

      <p className="text-xs font-semibold text-[var(--color-text-primary)]">
        Indikator edukasi. Peringatan tsunami resmi hanya dari BMKG.
      </p>
    </section>
  );
}
