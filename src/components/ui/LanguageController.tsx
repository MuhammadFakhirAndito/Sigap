"use client";

import { useCallback, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  LANG_EVENT,
  applyPageLanguage,
  detectReactFiberKey,
  getSavedLanguage,
  isTranslationMutating,
} from "@/lib/i18n";

const MAX_HYDRATION_RETRIES = 160;
const HYDRATION_RETRY_MS = 50;

/**
 * Menjaga bahasa UI pilihan pengguna tetap aktif di seluruh rute (/riwayat, /simulasi, /chatbot, /edukasi)
 * sambil menunggu node di dalam batas Suspense selesai terhidrasi oleh React sebelum memutasi teks.
 */
export function LanguageController() {
  const pathname = usePathname();
  const markerRef = useRef<HTMLSpanElement | null>(null);
  const retryTimerRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);

  const cancelPendingRetry = useCallback(() => {
    if (retryTimerRef.current !== null) {
      window.clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  const runTranslate = useCallback(() => {
    cancelPendingRetry();
    if (getSavedLanguage() !== "en") return;
    const fiberKey = detectReactFiberKey(markerRef.current);
    const { skippedUnhydrated } = applyPageLanguage("en", {
      requireHydratedKey: fiberKey,
    });
    if (skippedUnhydrated && retryCountRef.current < MAX_HYDRATION_RETRIES) {
      retryCountRef.current += 1;
      retryTimerRef.current = window.setTimeout(() => {
        runTranslate();
      }, HYDRATION_RETRY_MS);
    } else if (!skippedUnhydrated) {
      retryCountRef.current = 0;
    }
  }, [cancelPendingRetry]);

  useEffect(() => {
    retryCountRef.current = 0;
    if (getSavedLanguage() === "en") {
      runTranslate();
    }
    return cancelPendingRetry;
  }, [pathname, runTranslate, cancelPendingRetry]);

  useEffect(() => {
    let rafId = 0;

    const scheduleApply = () => {
      if (getSavedLanguage() !== "en") return;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = 0;
        if (getSavedLanguage() === "en") {
          runTranslate();
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
      if (getSavedLanguage() === "en") {
        retryCountRef.current = 0;
        runTranslate();
      } else {
        cancelPendingRetry();
        applyPageLanguage("id");
      }
    };

    window.addEventListener(LANG_EVENT, handleLangEvent);
    window.addEventListener("storage", handleLangEvent);

    return () => {
      observer.disconnect();
      if (rafId) cancelAnimationFrame(rafId);
      cancelPendingRetry();
      window.removeEventListener(LANG_EVENT, handleLangEvent);
      window.removeEventListener("storage", handleLangEvent);
    };
  }, [runTranslate, cancelPendingRetry]);

  return <span ref={markerRef} data-sigap-lang-marker="" hidden aria-hidden="true" />;
}
