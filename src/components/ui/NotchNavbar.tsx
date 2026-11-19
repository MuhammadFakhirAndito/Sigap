"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Bell, Globe, Menu, RotateCcw, Search, ShieldAlert, X } from "lucide-react";
import {
  LANG_EVENT,
  getSavedLanguage,
  setPageLanguage,
  type UiLanguage,
} from "@/lib/i18n";

interface NotchNavbarProps {
  className?: string;
  variant?: "notch" | "pill";
}

type NavbarPanel = "search" | "bell" | "menu" | null;

interface NavbarQuakeItem {
  id: string;
  waktuUtc: string;
  lat: number;
  lon: number;
  magnitudo: number;
  kedalamanKm: number;
  wilayah: string;
  statusTsunami: string;
}

interface GempaApiResponse {
  success?: boolean;
  data?: NavbarQuakeItem[];
}

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/riwayat", label: "Riwayat" },
  { href: "/simulasi", label: "Simulasi" },
  { href: "/chatbot", label: "Chatbot" },
  { href: "/edukasi", label: "Edukasi" },
] as const;

const SEARCH_SHORTCUTS = [
  { href: "/riwayat", label: "Riwayat Gempa" },
  { href: "/edukasi/saat-gempa-terjadi", label: "Panduan Saat Gempa" },
  { href: "/edukasi/tsunami-yang-harus-dilakukan", label: "Jika Ada Tanda Tsunami" },
  { href: "/chatbot", label: "Tanya Chatbot SIGAP" },
] as const;

const EMERGENCY_GUIDES = [
  { href: "/edukasi/saat-gempa-terjadi", label: "Yang dilakukan saat gempa terjadi" },
  { href: "/edukasi/tsunami-yang-harus-dilakukan", label: "Jika ada tanda tsunami" },
  { href: "/edukasi/persiapan-sebelum-gempa", label: "Persiapan sebelum gempa" },
] as const;

const focusRing =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-primary-strong)]";

function formatWibCompact(raw: string): string {
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "Waktu tidak tersedia";
  return (
    new Intl.DateTimeFormat("id-ID", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    }).format(parsed) + " WIB"
  );
}

export const NotchNavbar: React.FC<NotchNavbarProps> = ({
  className = "",
  variant = "notch",
}) => {
  const pathname = usePathname();
  const router = useRouter();

  const [activePanel, setActivePanel] = useState<NavbarPanel>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [quakes, setQuakes] = useState<NavbarQuakeItem[]>([]);
  const [quakeLoading, setQuakeLoading] = useState(false);
  const [quakeError, setQuakeError] = useState(false);
  const [quakeLoadedOnce, setQuakeLoadedOnce] = useState(false);
  const [lang, setLang] = useState<UiLanguage>("id");

  const headerRef = useRef<HTMLElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  const fetchLatestQuakes = useCallback(async () => {
    setQuakeLoading(true);
    setQuakeError(false);
    try {
      const res = await fetch("/api/gempa?limit=3", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = (await res.json()) as GempaApiResponse;
      setQuakes(Array.isArray(json.data) ? json.data.slice(0, 3) : []);
      setQuakeLoadedOnce(true);
    } catch {
      setQuakeError(true);
    } finally {
      setQuakeLoading(false);
    }
  }, []);

  useEffect(() => {
    setActivePanel(null);
  }, [pathname]);

  useEffect(() => {
    if (!activePanel) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePanel(null);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setActivePanel(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [activePanel]);

  useEffect(() => {
    if (activePanel === "search") {
      const timer = window.setTimeout(() => searchInputRef.current?.focus(), 40);
      return () => window.clearTimeout(timer);
    }
    if (activePanel === "bell" && !quakeLoadedOnce && !quakeLoading) {
      void fetchLatestQuakes();
    }
  }, [activePanel, quakeLoadedOnce, quakeLoading, fetchLatestQuakes]);

  const togglePanel = (panel: Exclude<NavbarPanel, null>) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  const handleSearchSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = searchQuery.trim();
    setActivePanel(null);
    router.push(trimmed ? `/riwayat?wilayah=${encodeURIComponent(trimmed)}` : "/riwayat");
  };

  const actionBtnClass = (isOpen: boolean, sizeClass = "w-10 h-10") =>
    `${sizeClass} rounded-full border flex items-center justify-center transition-all active:scale-95 ${focusRing} ${
      isOpen
        ? "border-[var(--color-cta)] bg-[var(--color-cta)] text-[var(--color-on-cta)]"
        : "border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] hover:bg-[var(--color-background)]"
    }`;

  const renderPanelDrawer = () => {
    if (!activePanel) return null;

    return (
      <div
        role="region"
        aria-label={
          activePanel === "search"
            ? "Pencarian wilayah gempa"
            : activePanel === "bell"
              ? "Notifikasi gempa terkini BMKG"
              : "Menu navigasi dan panduan darurat"
        }
        className="absolute left-0 right-0 lg:left-auto lg:right-0 mt-2.5 lg:w-[440px] z-50 rounded-[28px] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-5 text-[var(--color-text-primary)]"
      >
        {activePanel === "search" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                Cari wilayah gempa
              </p>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                aria-label="Tutup panel pencarian"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] ${focusRing}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <label htmlFor="nav-quake-search" className="sr-only">
                Cari nama wilayah gempa
              </label>
              <input
                ref={searchInputRef}
                id="nav-quake-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Mis. Maluku, Sukabumi, Lombok"
                className={`min-h-[44px] flex-1 min-w-0 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-background)] px-4 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)] ${focusRing}`}
              />
              <button
                type="submit"
                className={`inline-flex min-h-[44px] shrink-0 items-center justify-center rounded-full bg-[var(--color-cta)] px-5 text-sm font-medium text-[var(--color-on-cta)] hover:bg-[var(--color-primary)] hover:text-[var(--color-on-primary)] transition-colors ${focusRing}`}
              >
                Cari
              </button>
            </form>

            <div className="space-y-2 pt-1">
              <p className="text-xs font-medium text-[var(--color-text-secondary)]">
                Pintasan cepat
              </p>
              <div className="flex flex-wrap gap-2">
                {SEARCH_SHORTCUTS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setActivePanel(null)}
                    className={`inline-flex min-h-[44px] items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 text-xs font-medium text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)] transition-colors ${focusRing}`}
                  >
                    <span>{item.label}</span>
                    <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-text-secondary)]" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {activePanel === "bell" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                  Gempa terkini BMKG
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  Data pemantauan bukan peringatan dini resmi
                </p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => void fetchLatestQuakes()}
                  disabled={quakeLoading}
                  aria-label="Muat ulang daftar gempa terkini"
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] disabled:opacity-50 ${focusRing}`}
                >
                  <RotateCcw className={`w-4 h-4 ${quakeLoading ? "animate-spin" : ""}`} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setActivePanel(null)}
                  aria-label="Tutup panel notifikasi gempa"
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] ${focusRing}`}
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {quakeLoading && quakes.length === 0 ? (
              <div className="space-y-2.5" aria-busy="true">
                {Array.from({ length: 3 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="h-16 rounded-[18px] bg-[var(--color-surface-sunken)] animate-pulse"
                  />
                ))}
              </div>
            ) : quakeError && quakes.length === 0 ? (
              <div className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-background)] p-4 text-xs text-[var(--color-text-secondary)] space-y-2.5">
                <p>Data gempa terbaru belum dapat dimuat saat ini.</p>
                <button
                  type="button"
                  onClick={() => void fetchLatestQuakes()}
                  className={`inline-flex min-h-[44px] items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-4 font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface)] ${focusRing}`}
                >
                  Coba lagi
                </button>
              </div>
            ) : quakes.length === 0 ? (
              <p className="rounded-[18px] bg-[var(--color-background)] p-4 text-xs text-[var(--color-text-secondary)]">
                Belum ada catatan gempa terbaru yang dapat ditampilkan.
              </p>
            ) : (
              <ul className="space-y-2">
                {quakes.map((q) => {
                  const magText = Number(q.magnitudo).toFixed(1).replace(".", ",");
                  const simHref = `/simulasi?m=${q.magnitudo}&d=${q.kedalamanKm}&lat=${q.lat}&lon=${q.lon}&wilayah=${encodeURIComponent(q.wilayah)}`;
                  return (
                    <li
                      key={q.id}
                      className="rounded-[18px] border border-[var(--color-border)] bg-[var(--color-background)] px-3.5 py-3 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center rounded-full bg-[var(--color-cta)] px-2.5 py-0.5 text-xs font-semibold text-[var(--color-on-cta)] tnum">
                            M {magText}
                          </span>
                          <span className="text-xs text-[var(--color-text-secondary)] tnum truncate">
                            {formatWibCompact(q.waktuUtc)} · {q.kedalamanKm} km
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm font-medium text-[var(--color-text-primary)] line-clamp-1">
                          {q.wilayah}
                        </p>
                      </div>
                      <Link
                        href={simHref}
                        onClick={() => setActivePanel(null)}
                        className={`inline-flex min-h-[44px] shrink-0 items-center rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-3 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-cta)] hover:text-[var(--color-on-cta)] hover:border-[var(--color-cta)] transition-colors ${focusRing}`}
                      >
                        Simulasikan
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            <div className="pt-1 flex justify-end">
              <Link
                href="/riwayat"
                onClick={() => setActivePanel(null)}
                className={`inline-flex min-h-[44px] items-center gap-1.5 px-2 text-xs font-medium text-[var(--color-text-primary)] hover:text-[var(--color-primary-strong)] ${focusRing}`}
              >
                <span>Lihat semua di Riwayat</span>
                <ArrowUpRight className="w-3.5 h-3.5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        )}

        {activePanel === "menu" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-secondary)]">
                Navigasi utama
              </p>
              <button
                type="button"
                onClick={() => setActivePanel(null)}
                aria-label="Tutup menu navigasi"
                className={`inline-flex h-9 w-9 items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)] ${focusRing}`}
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            <ul className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => {
                const isActive = isLinkActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setActivePanel(null)}
                      className={`px-4 py-2.5 min-h-[44px] flex items-center justify-between rounded-2xl text-sm transition-colors ${focusRing} ${
                        isActive
                          ? "font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface)]"
                          : "font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-background)] hover:text-[var(--color-text-primary)]"
                      }`}
                      aria-current={isActive ? "page" : undefined}
                    >
                      <span>{link.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 opacity-60" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="pt-3 border-t border-[var(--color-border)] space-y-2">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-primary-strong)]">
                <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Panduan darurat</span>
              </p>
              <ul className="flex flex-col gap-1">
                {EMERGENCY_GUIDES.map((guide) => (
                  <li key={guide.href}>
                    <Link
                      href={guide.href}
                      onClick={() => setActivePanel(null)}
                      className={`px-4 py-2.5 min-h-[44px] flex items-center justify-between rounded-2xl text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-colors ${focusRing}`}
                    >
                      <span>{guide.label}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[var(--color-text-secondary)] shrink-0" aria-hidden="true" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-[var(--color-border)] flex items-center justify-between gap-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)]">
                <Globe className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Bahasa</span>
              </span>
              <div data-no-translate="true" className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border)] bg-[var(--color-background)] p-1">
                {(["id", "en"] as const).map((code) => {
                  const active = lang === code;
                  return (
                    <button
                      key={code}
                      type="button"
                      onClick={() => {
                        setLang(code);
                        setPageLanguage(code);
                      }}
                      aria-pressed={active}
                      className={`min-h-[44px] min-w-[44px] rounded-full px-3 text-xs font-semibold uppercase transition-colors ${focusRing} ${
                        active
                          ? "bg-[var(--color-cta)] text-[var(--color-on-cta)]"
                          : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                      }`}
                    >
                      {code}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Jika variant="pill" (untuk halaman sekunder seperti /riwayat)
  if (variant === "pill") {
    return (
      <header ref={headerRef} className={`relative z-40 w-full ${className}`}>
        <div className="flex items-center justify-between gap-4 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-3 py-2.5 sm:px-5">
          <Link
            href="/"
            className={`flex shrink-0 items-center group rounded-full ${focusRing}`}
            aria-label="SIGAP Gempa beranda"
          >
            <img
              src="/logo/logo-primary.svg"
              alt="SIGAP Gempa"
              width={117}
              height={48}
              className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 text-sm lg:flex">
            {NAV_LINKS.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition-all duration-150 ${focusRing} ${
                    isActive
                      ? "font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-1.5">
            <button
              type="button"
              aria-label="Cari wilayah gempa"
              aria-expanded={activePanel === "search"}
              onClick={() => togglePanel("search")}
              className={actionBtnClass(activePanel === "search")}
            >
              <Search className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Notifikasi gempa terkini"
              aria-expanded={activePanel === "bell"}
              onClick={() => togglePanel("bell")}
              className={actionBtnClass(activePanel === "bell")}
            >
              <Bell className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label={activePanel === "menu" ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={activePanel === "menu"}
              className={actionBtnClass(activePanel === "menu")}
              onClick={() => togglePanel("menu")}
            >
              {activePanel === "menu" ? (
                <X className="w-5 h-5" aria-hidden="true" />
              ) : (
                <Menu className="w-5 h-5" strokeWidth={2.5} aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        {renderPanelDrawer()}
      </header>
    );
  }

  // DESKTOP NOTCH HEADER SESUAI DESIGN SYSTEM
  return (
    <header ref={headerRef} className={`relative z-40 w-full ${className}`}>
      {/* DESKTOP NOTCH ROW (>= 1024px) */}
      <div className="hidden lg:flex items-end w-full relative z-30 -mb-[1px]">
        {/* Bahu Kiri: Tab Logo SIGAP Gempa */}
        <div className="bg-[var(--color-surface)] rounded-tl-[44px] pl-6 pr-5 h-[72px] flex items-center shrink-0">
          <Link
            href="/"
            className={`flex items-center rounded-full group ${focusRing}`}
            aria-label="SIGAP Gempa beranda"
          >
            <img
              src="/logo/logo-primary.svg"
              alt="SIGAP Gempa"
              width={131}
              height={54}
              className="h-[52px] w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>
        </div>

        {/* Transisi Lengkung S-Curve Kiri: Melengkung turun ke notch */}
        <svg
          width="56"
          height="72"
          viewBox="0 0 56 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 block -mr-[1px]"
          aria-hidden="true"
        >
          <path d="M 0 0 C 28 0, 28 72, 56 72 L 0 72 Z" fill="var(--color-surface)" />
        </svg>

        {/* Lekukan Notch Tengah: Menampilkan Kanvas dan Link Navigasi */}
        <nav
          aria-label="Navigasi utama"
          className="flex-1 h-[72px] flex items-center justify-center px-4"
        >
          <ul className="flex items-center gap-7 lg:gap-9">
            {NAV_LINKS.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-all duration-150 py-1.5 rounded ${focusRing} ${
                      isActive
                        ? "font-semibold text-[var(--color-text-primary)]"
                        : "font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Transisi Lengkung S-Curve Kanan: Melengkung naik ke bahu kanan */}
        <svg
          width="56"
          height="72"
          viewBox="0 0 56 72"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 block -ml-[1px]"
          aria-hidden="true"
        >
          <path d="M 0 72 C 28 72, 28 0, 56 0 L 56 72 Z" fill="var(--color-surface)" />
        </svg>

        {/* Bahu Kanan: Aksi (Search, Bell, Menu) */}
        <div className="bg-[var(--color-surface)] rounded-tr-[44px] pl-5 pr-8 h-[72px] flex items-center gap-2 shrink-0">
          <button
            type="button"
            className={actionBtnClass(activePanel === "search")}
            aria-label="Cari wilayah gempa"
            aria-expanded={activePanel === "search"}
            onClick={() => togglePanel("search")}
          >
            <Search className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={actionBtnClass(activePanel === "bell")}
            aria-label="Notifikasi gempa terkini"
            aria-expanded={activePanel === "bell"}
            onClick={() => togglePanel("bell")}
          >
            <Bell className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
          </button>
          <button
            type="button"
            className={actionBtnClass(activePanel === "menu")}
            aria-label={activePanel === "menu" ? "Tutup menu navigasi" : "Menu navigasi"}
            aria-expanded={activePanel === "menu"}
            onClick={() => togglePanel("menu")}
          >
            {activePanel === "menu" ? (
              <X className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Menu className="w-4 h-4" strokeWidth={2.2} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* MOBILE NAVBAR (< 1024px) */}
      <div className="lg:hidden w-full bg-[var(--color-surface)] rounded-t-[32px] p-4 flex items-center justify-between border-b border-[var(--color-border)]/40">
        <Link
          href="/"
          className={`flex items-center rounded-full ${focusRing}`}
          aria-label="SIGAP Gempa beranda"
        >
          <img
            src="/logo/logo-primary.svg"
            alt="SIGAP Gempa"
            width={107}
            height={44}
            className="h-11 w-auto object-contain"
          />
        </Link>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            className={actionBtnClass(activePanel === "search")}
            aria-label="Cari wilayah gempa"
            aria-expanded={activePanel === "search"}
            onClick={() => togglePanel("search")}
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={actionBtnClass(activePanel === "bell")}
            aria-label="Notifikasi gempa terkini"
            aria-expanded={activePanel === "bell"}
            onClick={() => togglePanel("bell")}
          >
            <Bell className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            className={actionBtnClass(activePanel === "menu")}
            onClick={() => togglePanel("menu")}
            aria-label={activePanel === "menu" ? "Tutup menu" : "Buka menu"}
            aria-expanded={activePanel === "menu"}
          >
            {activePanel === "menu" ? (
              <X className="w-4 h-4" aria-hidden="true" />
            ) : (
              <Menu className="w-4 h-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {renderPanelDrawer()}
    </header>
  );
};
