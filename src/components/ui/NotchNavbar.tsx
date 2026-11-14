"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Menu, X, Search, Bell } from "lucide-react";

interface NotchNavbarProps {
  className?: string;
  variant?: "notch" | "pill";
}

export const NotchNavbar: React.FC<NotchNavbarProps> = ({
  className = "",
  variant = "notch",
}) => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/riwayat", label: "Riwayat" },
    { href: "/simulasi", label: "Simulasi" },
    { href: "/chatbot", label: "Chatbot" },
    { href: "/edukasi", label: "Edukasi" },
  ];

  // Jika variant="pill" (untuk halaman sekunder seperti /riwayat)
  if (variant === "pill") {
    return (
      <header className={`relative z-30 w-full ${className}`}>
        <div className="flex items-center justify-between gap-4 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2.5 shadow-[0_8px_30px_rgba(13,13,13,0.05)] sm:px-5">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 group" aria-label="SIGAP Gempa beranda">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] transition-transform group-hover:scale-105">
              <Activity className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="text-lg font-medium tracking-tight text-[var(--color-text-primary)]">
              SIGAP <span className="font-normal text-[var(--color-text-secondary)]">Gempa</span>
            </span>
          </Link>

          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 text-sm lg:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition-all duration-150 ${
                    isActive
                      ? "font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface)] shadow-2xs"
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
            <Link
              href="/riwayat"
              aria-label="Cari gempa di riwayat"
              className="grid h-10 w-10 place-items-center rounded-full text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)] active:scale-95"
            >
              <Search className="w-4 h-4" strokeWidth={2.5} />
            </Link>
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Tutup menu navigasi" : "Buka menu navigasi"}
              aria-expanded={mobileMenuOpen}
              className="grid h-10 w-10 place-items-center rounded-full text-[var(--color-text-primary)] transition hover:bg-[var(--color-surface)] active:scale-95"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <div className="mt-2 p-4 bg-[var(--color-surface-strong)] border border-[var(--color-border)] rounded-[28px] shadow-[0_8px_30px_rgba(13,13,13,0.08)]">
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-4 py-3 min-h-[44px] flex items-center rounded-2xl text-base ${
                        isActive
                          ? "font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface)]"
                          : "font-normal text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/60"
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
  }

  // DESKTOP NOTCH HEADER PERSIS VERDRO SCREENSHOT
  return (
    <header className={`w-full ${className}`}>
      {/* DESKTOP NOTCH ROW (>= 1024px) */}
      <div className="hidden lg:flex items-end w-full relative z-30 -mb-[1px]">
        {/* Bahu Kiri: Tab Logo Verdro / SIGAP */}
        <div className="bg-[var(--color-surface)] rounded-tl-[44px] pl-8 pr-5 h-[72px] flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center gap-2.5 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] rounded-full group"
            aria-label="SIGAP Gempa beranda"
          >
            <span className="w-9 h-9 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
              <Activity className="w-4 h-4 text-[var(--color-primary)]" strokeWidth={2.5} aria-hidden="true" />
            </span>
            <span className="font-semibold text-xl text-[var(--color-text-primary)] tracking-tight">
              SIGAP <span className="font-normal text-[var(--color-text-secondary)]">Gempa</span>
            </span>
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
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-all duration-150 py-1.5 focus-visible:outline-2 focus-visible:outline-[var(--color-primary)] ${
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

        {/* Bahu Kanan: Aksi (Search, Bell/Bag, Hamburger) */}
        <div className="bg-[var(--color-surface)] rounded-tr-[44px] pl-5 pr-8 h-[72px] flex items-center gap-2 shrink-0">
          <Link
            href="/riwayat"
            className="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] flex items-center justify-center text-[var(--color-text-primary)] shadow-2xs hover:bg-[var(--color-surface-raised)] transition-all active:scale-95"
            aria-label="Cari gempa di riwayat"
          >
            <Search className="w-4 h-4" strokeWidth={2.2} />
          </Link>
          <button
            type="button"
            className="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] flex items-center justify-center text-[var(--color-text-primary)] shadow-2xs hover:bg-[var(--color-surface-raised)] transition-all active:scale-95"
            aria-label="Notifikasi gempa"
          >
            <Bell className="w-4 h-4" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] flex items-center justify-center text-[var(--color-text-primary)] shadow-2xs hover:bg-[var(--color-surface-raised)] transition-all active:scale-95"
            aria-label="Menu navigasi"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <Menu className="w-4 h-4" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      {/* MOBILE NAVBAR (< 1024px) */}
      <div className="lg:hidden w-full bg-[var(--color-surface)] rounded-t-[32px] p-4 flex items-center justify-between border-b border-[var(--color-border)]/40">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-full"
          aria-label="SIGAP Gempa beranda"
        >
          <span className="w-8 h-8 rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" strokeWidth={2.5} />
          </span>
          <span className="font-semibold text-base text-[var(--color-text-primary)] tracking-tight">
            SIGAP <span className="font-normal text-[var(--color-text-secondary)]">Gempa</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/riwayat"
            className="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] flex items-center justify-center text-[var(--color-text-primary)]"
            aria-label="Cari gempa"
          >
            <Search className="w-4 h-4" />
          </Link>
          <button
            type="button"
            className="w-10 h-10 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] flex items-center justify-center text-[var(--color-text-primary)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden p-4 bg-[var(--color-surface-strong)] border-b border-[var(--color-border)] shadow-sm">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-4 py-3 min-h-[44px] flex items-center rounded-2xl text-base ${
                      isActive
                        ? "font-semibold text-[var(--color-text-primary)] bg-[var(--color-surface)]"
                        : "font-normal text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)]/60"
                    }`}
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
