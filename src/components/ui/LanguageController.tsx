"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  LANG_EVENT,
  applyPageLanguage,
  getSavedLanguage,
  isTranslationMutating,
} from "@/lib/i18n";

/**
 * Menjaga bahasa UI pilihan pengguna tetap aktif di seluruh rute (/riwayat, /simulasi, /chatbot, /edukasi)
 * termasuk saat tab atau konten dinamis dirender setelah navigasi.
 */
export function LanguageController() {
  const pathname = usePathname();

  useEffect(() => {
    const current = getSavedLanguage();
    if (current === "en") {
      applyPageLanguage("en");
    }
  }, [pathname]);

  useEffect(() => {
    let rafId = 0;

    const scheduleApply = () => {
      if (getSavedLanguage() !== "en") return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (getSavedLanguage() === "en") {
          applyPageLanguage("en");
        }
      });
    };

    const observer = new MutationObserver(() => {
      if (isTranslationMutating()) return;
      scheduleApply();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    const handleLangEvent = () => {
      applyPageLanguage(getSavedLanguage());
    };

    window.addEventListener(LANG_EVENT, handleLangEvent);
    window.addEventListener("storage", handleLangEvent);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener(LANG_EVENT, handleLangEvent);
      window.removeEventListener("storage", handleLangEvent);
    };
  }, []);

  return null;
}
