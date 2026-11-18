"use client";

import React, { useEffect, useState } from "react";
import { Check, Globe, Radio, Send, Share2 } from "lucide-react";

export type UiLanguage = "id" | "en";

interface HeroQuickToolbarProps {
  shareSummary: string;
}

const STORAGE_KEY = "sigap-lang";

const ID_TO_EN: Record<string, string> = {
  // Navbar & umum
  Beranda: "Home",
  Riwayat: "History",
  Simulasi: "Simulation",
  Chatbot: "Chatbot",
  Edukasi: "Education",
  // Hero
  "Pantau gempa bumi": "Monitor earthquakes",
  untuk: "for",
  "kesiapsiagaan kita": "our preparedness",
  "Data resmi BMKG dan": "Official BMKG data and",
  "edukasi mitigasi terukur": "measurable mitigation guide",
  "Lihat riwayat": "View history",
  "Sumber resmi": "Official source",
  "Perhitungan fisik": "Physical estimate",
  Estimasi: "Estimate",
  "Asisten mitigasi": "Mitigation helper",
  magnitudo: "magnitude",
  "gempa terkini": "latest quake",
  "Data BMKG belum tersedia": "BMKG data unavailable",
  // Section 2
  Pahami: "Understand",
  risiko: "earthquake",
  "gempa sebelum": "risk before",
  "guncangan datang": "the shaking arrives",
  "Data resmi BMKG, kalkulator intensitas MMI & gelombang P/S, serta panduan mitigasi berbasis rujukan.":
    "Official BMKG data, MMI & P/S wave intensity estimator, and reference-based mitigation guides.",
  "Riwayat BMKG": "BMKG History",
  "Simulasi MMI & P/S": "MMI & P/S Sim",
  "Tanya chatbot": "Ask chatbot",
  "catatan gempa": "quake records",
  "skenario simulasi": "sim scenarios",
  "modul edukasi": "edu modules",
  "Gempa terbaru": "Latest earthquake",
  "Data langsung BMKG": "Live BMKG feed",
  "Cadangan lokal": "Local fallback",
  Magnitudo: "Magnitude",
  "Tidak berpotensi tsunami": "No tsunami potential",
  "Potensi tsunami tidak dinyatakan": "Tsunami status unspecified",
  "Waktu (WIB)": "Time (WIB)",
  Kedalaman: "Depth",
  Koordinat: "Coordinates",
  Dirasakan: "Felt intensity",
  "Tidak tercatat dirasakan": "Not recorded as felt",
  "Simulasikan gempa ini": "Simulate this quake",
  "Koneksi data terputus": "Data connection lost",
  "Data gempa terbaru belum tersedia": "Latest earthquake data unavailable",
  "Buka riwayat": "Open history",
  // Section 3
  "01 · Materi rujukan": "01 · Reference modules",
  "Modul edukasi": "Education modules",
  "Pahami mekanisme patahan bumi, kesiapsiagaan rumah tangga, dan tindakan lindungi diri dari rujukan resmi.":
    "Understand earth fault mechanics, household preparedness, and self-protection actions from official sources.",
  "Lihat semua modul": "View all modules",
  Pengertian: "Basics",
  "Proses Geologi": "Geological Process",
  Penanggulangan: "Emergency Response",
  "Mitigasi & Siaga": "Mitigation & Readiness",
  "Baca modul": "Read module",
  // Section 4
  "02 · Simulasi dampak": "02 · Impact simulation",
  "Skenario simulasi sejarah": "Historical simulation scenarios",
  "Lanjutkan pemahaman materi ke estimasi guncangan MMI dan selisih waktu tiba gelombang P/S pada tiga peristiwa besar Indonesia.":
    "Apply your knowledge to MMI shaking estimates and P/S wave arrival intervals across three major Indonesian earthquakes.",
  "Buka simulasi": "Open simulation",
  "Lokasi laut": "Offshore",
  "Lokasi darat": "Onshore",
  "Ringkasan skenario": "Scenario summary",
  Simulasikan: "Simulate",
  // Section 5
  "03 · Berita & konsultasi": "03 · News & consultation",
  "Berita & Chatbot SIGAP": "News & SIGAP Chatbot",
  "Ikuti ringkasan berita kebencanaan dari penerbit terverifikasi atau ajukan pertanyaan mitigasi kepada asisten SIGAP.":
    "Follow verified disaster news summaries or ask mitigation questions to the SIGAP assistant.",
  "Semua berita": "All news",
  "Buka chatbot": "Open chatbot",
  "Liputan media rujukan": "Referenced media coverage",
  "Tautan membuka situs penerbit asli": "Links open original publisher sites",
  "Berita belum tersedia.": "News not yet available.",
  "Asisten edukasi mitigasi berbasis rujukan": "Reference-based mitigation assistant",
  "Tanya langkah keselamatan & konteks gempa terkini":
    "Ask safety steps & latest earthquake context",
  "Ajukan pertanyaan tindakan darurat atau ringkasan data BMKG terbaru. Saat kuota AI terbatas, jawaban otomatis beralih ke FAQ lokal.":
    "Ask about emergency actions or the latest BMKG summary. When AI quota is limited, replies fall back to local FAQs.",
  "Mulai percakapan": "Start conversation",
  "Contoh pertanyaan": "Sample questions",
  "Apa yang harus dilakukan saat gempa terjadi?":
    "What should I do during an earthquake?",
  "Cara menyiapkan tas siaga bencana?":
    "How do I prepare an emergency go-bag?",
  "Apa arti skala MMI pada dampak gempa?":
    "What does the MMI scale mean for quake impact?",
  // Footer
  "SIGAP Gempa: Sistem Informasi & Mitigasi Gempa Bumi Indonesia":
    "SIGAP Gempa: Indonesian Earthquake Information & Mitigation Portal",
  "Sumber Data:": "Data Source:",
  "Situs ini bukan sistem peringatan dini resmi. Informasi disediakan untuk keperluan edukasi dan kesiapsiagaan masyarakat.":
    "This site is not an official early warning system. Information is provided for education and public preparedness.",
  "Daftar Pustaka": "References",
  "Simulasi Edukasi": "Edu Simulation",
  "Design System Token": "Design System Tokens",
};

const recordedOriginalText = new WeakMap<Text, string>();
const trackedNodes = new Set<Text>();

function translateDynamicPattern(trimmed: string): string | null {
  const modulCount = trimmed.match(/^Lihat semua \((\d+) modul\)$/);
  if (modulCount) return `View all (${modulCount[1]} modules)`;

  const depthMatch = trimmed.match(/^Kedalaman\s+(.+)$/);
  if (depthMatch) return `Depth ${depthMatch[1]}`;

  return null;
}

function applyPageLanguage(lang: UiLanguage) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;

  if (lang === "id") {
    for (const node of trackedNodes) {
      if (!node.isConnected) {
        trackedNodes.delete(node);
        continue;
      }
      const original = recordedOriginalText.get(node);
      if (original !== undefined && node.nodeValue !== original) {
        node.nodeValue = original;
      }
    }
    return;
  }

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let current: Node | null;
  while ((current = walker.nextNode())) {
    const textNode = current as Text;
    const parent = textNode.parentElement;
    if (!parent) continue;
    const tag = parent.tagName;
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "NOSCRIPT") continue;
    if (parent.closest("[data-no-translate='true']")) continue;

    const raw = textNode.nodeValue ?? "";
    const trimmed = raw.trim();
    if (!trimmed) continue;

    const translated = ID_TO_EN[trimmed] ?? translateDynamicPattern(trimmed);
    if (!translated) continue;

    if (!recordedOriginalText.has(textNode)) {
      recordedOriginalText.set(textNode, raw);
      trackedNodes.add(textNode);
    }

    const leading = raw.match(/^\s*/)?.[0] ?? "";
    const trailing = raw.match(/\s*$/)?.[0] ?? "";
    textNode.nodeValue = `${leading}${translated}${trailing}`;
  }
}

export function HeroQuickToolbar({ shareSummary }: HeroQuickToolbarProps) {
  const [lang, setLang] = useState<UiLanguage>("id");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "en") {
        setLang("en");
        applyPageLanguage("en");
      }
    } catch {
      // Abaikan bila localStorage diblokir.
    }
  }, []);

  const handleJumpToLatest = () => {
    const target = document.getElementById("ringkasan-sigap-section");
    if (!target) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: "SIGAP Gempa",
          text: shareSummary,
          url: shareUrl,
        });
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
      }
    }

    const clipboardText = `${shareSummary} — ${shareUrl}`;
    let copySucceeded = false;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(clipboardText);
        copySucceeded = true;
      } catch {
        copySucceeded = false;
      }
    }
    if (!copySucceeded) {
      const textarea = document.createElement("textarea");
      textarea.value = clipboardText;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand("copy");
      } finally {
        document.body.removeChild(textarea);
      }
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const selectLanguage = (nextLang: UiLanguage) => {
    setLang(nextLang);
    applyPageLanguage(nextLang);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextLang);
    } catch {
      // Abaikan bila localStorage diblokir.
    }
  };

  const focusClass =
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]";

  return (
    <div className="hidden lg:flex flex-col gap-10 absolute top-[6%] left-11 z-30">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleJumpToLatest}
          title={lang === "en" ? "Jump to latest earthquake" : "Pantau gempa terbaru"}
          aria-label={lang === "en" ? "Jump to latest earthquake summary" : "Lompat ke ringkasan gempa terbaru"}
          className={`w-7 h-7 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center hover:opacity-85 transition-opacity ${focusClass}`}
        >
          <Radio className="w-3.5 h-3.5" aria-hidden="true" />
        </button>

        <a
          href="https://t.me/infobmkg"
          target="_blank"
          rel="noopener noreferrer"
          title={lang === "en" ? "Official BMKG Telegram @infobmkg" : "Kanal Telegram resmi @infobmkg"}
          aria-label={lang === "en" ? "Open official BMKG Telegram channel @infobmkg (new tab)" : "Buka kanal Telegram resmi BMKG @infobmkg (tab baru)"}
          className={`w-7 h-7 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center hover:opacity-85 transition-opacity ${focusClass}`}
        >
          <Send className="w-3.5 h-3.5" aria-hidden="true" />
        </a>

        <button
          type="button"
          onClick={handleShare}
          title={lang === "en" ? "Share or copy link" : "Bagikan atau salin tautan"}
          aria-label={lang === "en" ? "Share or copy latest earthquake link" : "Bagikan atau salin tautan gempa terbaru"}
          className={`w-7 h-7 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center hover:opacity-85 transition-opacity ${focusClass}`}
        >
          {copied ? (
            <Check className="w-3.5 h-3.5" aria-hidden="true" />
          ) : (
            <Share2 className="w-3.5 h-3.5" aria-hidden="true" />
          )}
        </button>

        {copied && (
          <span
            role="status"
            data-no-translate="true"
            className="ml-1 rounded-full bg-[var(--color-surface-raised)] border border-[var(--color-border)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--color-text-primary)] whitespace-nowrap"
          >
            {lang === "en" ? "Link copied" : "Tautan disalin"}
          </span>
        )}
      </div>

      <div
        data-no-translate="true"
        className="flex flex-col items-start gap-2 pl-1 text-[12px] leading-none"
      >
        <button
          type="button"
          onClick={() => selectLanguage(lang === "id" ? "en" : "id")}
          title={lang === "en" ? "Switch to Indonesian" : "Ganti ke Bahasa Inggris"}
          aria-label={lang === "en" ? "Switch language to Indonesian" : "Ganti bahasa ke Inggris"}
          className={`w-6 h-6 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center hover:bg-[var(--color-background)] transition-colors ${focusClass}`}
        >
          <Globe className="w-3.5 h-3.5 text-[var(--color-text-primary)]" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={() => selectLanguage("id")}
          aria-pressed={lang === "id"}
          className={`pt-1 leading-none rounded-sm transition-colors ${focusClass} ${
            lang === "id"
              ? "font-medium text-[var(--color-text-primary)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          ID
        </button>
        <button
          type="button"
          onClick={() => selectLanguage("en")}
          aria-pressed={lang === "en"}
          className={`leading-none rounded-sm transition-colors ${focusClass} ${
            lang === "en"
              ? "font-medium text-[var(--color-text-primary)]"
              : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
