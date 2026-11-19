"use client";

import React, { useEffect, useState } from "react";
import { Check, Globe, Radio, Send, Share2 } from "lucide-react";
import {
  LANG_EVENT,
  getSavedLanguage,
  setPageLanguage,
  type UiLanguage,
} from "@/lib/i18n";

interface HeroQuickToolbarProps {
  shareSummary: string;
}

export function HeroQuickToolbar({ shareSummary }: HeroQuickToolbarProps) {
  const [lang, setLang] = useState<UiLanguage>("id");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLang(getSavedLanguage());
    const sync = () => setLang(getSavedLanguage());
    window.addEventListener(LANG_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(LANG_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
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
    setPageLanguage(nextLang);
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
          aria-label={
            lang === "en"
              ? "Open official BMKG Telegram channel @infobmkg (new tab)"
              : "Buka kanal Telegram resmi BMKG @infobmkg (tab baru)"
          }
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
