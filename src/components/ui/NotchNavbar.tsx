"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Menu, X, Search } from "lucide-react";

interface NotchNavbarProps {
  className?: string;
}

export const NotchNavbar: React.FC<NotchNavbarProps> = ({ className = "" }) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/riwayat", label: "Riwayat" },
    { href: "/simulasi", label: "Simulasi" },
    { href: "/chatbot", label: "Chatbot" },
    { href: "/edukasi", label: "Edukasi" },
  ];

  return (
    <header className={`w-full ${className}`}>
      {/* DESKTOP NOTCH HEADER (Persis seperti referensi Verdro) */}
      <div className="hidden md:flex items-end w-full relative z-20 -mb-[1px]">
        {/* Bahu Kiri: Logo SIGAP Gempa */}
        <div className="bg-[var(--color-surface)] rounded-tl-[40px] pl-8 pr-4 h-[64px] flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] rounded-full"
            aria-label="SIGAP Gempa beranda"
          >
            <span className="w-8 h-8 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center shrink-0">
              <Activity className="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
            </span>
            <span className="font-semibold text-lg text-[var(--color-text-primary)] tracking-tight">
              SIGAP <span className="font-normal text-[var(--color-text-secondary)]">Gempa</span>
            </span>
          </Link>
        </div>

        {/* Transisi S-Curve Kiri: Melengkung turun mulus ke dasar notch */}
        <svg
          width="54"
          height="64"
          viewBox="0 0 54 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 block -mr-[1px]"
          aria-hidden="true"
        >
          <path d="M 0 0 C 27 0, 27 64, 54 64 L 0 64 Z" fill="var(--color-surface)" />
        </svg>

        {/* Lekukan Tengah (Notch Cutout): Tautan Navigasi Polos di Atas Kanvas */}
        <nav
          aria-label="Navigasi utama"
          className="flex-1 h-[64px] flex items-center justify-center px-6"
        >
          <ul className="flex items-center gap-8 lg:gap-10">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-all duration-150 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] rounded-full py-1.5 ${
                      isActive
                        ? "font-semibold text-white bg-[var(--color-cta)] px-4 shadow-2xs"
                        : "font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] px-2.5"
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

        {/* Transisi S-Curve Kanan: Melengkung naik mulus ke bahu kanan */}
        <svg
          width="54"
          height="64"
          viewBox="0 0 54 64"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="shrink-0 block -ml-[1px]"
          aria-hidden="true"
        >
          <path d="M 0 64 C 27 64, 27 0, 54 0 L 54 64 Z" fill="var(--color-surface)" />
        </svg>

        {/* Bahu Kanan: Aksi Cepat (Search + Menu seperti referensi) */}
        <div className="bg-[var(--color-surface)] rounded-tr-[40px] pl-4 pr-8 h-[64px] flex items-center gap-2.5 shrink-0">
          <Link
            href="/riwayat"
            className="w-9 h-9 rounded-full bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-primary)] hover:opacity-85 shadow-xs transition-opacity focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
            aria-label="Cari gempa di riwayat"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </Link>
          <button
            type="button"
            className="w-9 h-9 rounded-full flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-surface-raised)]/60 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
            aria-label="Menu navigasi"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* MOBILE TOP NAVBAR (< 768px) */}
      <div className="md:hidden w-full bg-[var(--color-surface)] rounded-[28px] p-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] rounded-full"
          aria-label="SIGAP Gempa beranda"
        >
          <span className="w-8 h-8 rounded-full bg-[var(--color-cta)] text-[var(--color-on-cta)] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4 text-[var(--color-primary)]" aria-hidden="true" />
          </span>
          <span className="font-semibold text-base text-[var(--color-text-primary)] tracking-tight">
            SIGAP <span className="font-normal text-[var(--color-text-secondary)]">Gempa</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/riwayat"
            className="w-10 h-10 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-surface-raised)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] shadow-xs"
            aria-label="Cari gempa di riwayat"
          >
            <Search className="w-4 h-4" aria-hidden="true" />
          </Link>

          <button
            type="button"
            className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full flex items-center justify-center text-[var(--color-text-primary)] bg-[var(--color-surface-raised)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] shadow-xs"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-menu"
            aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Panel */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="mt-2 p-4 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[28px] shadow-sm animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 min-h-[44px] flex items-center rounded-2xl text-base transition-colors ${
                      isActive
                        ? "font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface)]"
                        : "font-normal text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/50"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </header>
  );
};
