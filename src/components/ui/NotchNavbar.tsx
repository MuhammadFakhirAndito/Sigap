"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search, Bell } from "lucide-react";

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

  const isLinkActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  // Jika variant="pill" (untuk halaman sekunder seperti /riwayat)
  if (variant === "pill") {
    return (
      <header className={`relative z-30 w-full ${className}`}>
        <div className="flex items-center justify-between gap-4 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] px-3 py-2.5 sm:px-5">
          <Link href="/" className="flex shrink-0 items-center group focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] rounded-full" aria-label="SIGAP Gempa beranda">
            <img
              src="/logo/logo-primary.svg"
              alt="SIGAP Gempa"
              width={117}
              height={48}
              className="h-10 sm:h-11 w-auto object-contain transition-transform group-hover:scale-[1.02]"
            />
          </Link>

          <nav aria-label="Navigasi utama" className="hidden items-center gap-1 text-sm lg:flex">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-4 py-2 text-sm transition-all duration-150 ${
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
          <div className="mt-2 p-4 bg-[var(--color-surface-raised)] border border-[var(--color-border)] rounded-[28px]">
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

  // DESKTOP NOTCH HEADER SESUAI DESIGN SYSTEM
  return (
    <header className={`w-full ${className}`}>
      {/* DESKTOP NOTCH ROW (>= 1024px) */}
      <div className="hidden lg:flex items-end w-full relative z-30 -mb-[1px]">
        {/* Bahu Kiri: Tab Logo SIGAP Gempa */}
        <div className="bg-[var(--color-surface)] rounded-tl-[44px] pl-6 pr-5 h-[72px] flex items-center shrink-0">
          <Link
            href="/"
            className="flex items-center focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] rounded-full group"
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
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.href);
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={`text-sm transition-all duration-150 py-1.5 focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] ${
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
            className="w-10 h-10 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-all active:scale-95"
            aria-label="Cari gempa di riwayat"
          >
            <Search className="w-4 h-4" strokeWidth={2.2} />
          </Link>
          <button
            type="button"
            className="w-10 h-10 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-all active:scale-95"
            aria-label="Notifikasi gempa"
          >
            <Bell className="w-4 h-4" strokeWidth={2.2} />
          </button>
          <button
            type="button"
            className="w-10 h-10 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-primary)] hover:bg-[var(--color-background)] transition-all active:scale-95"
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
          className="flex items-center rounded-full focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)]"
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

        <div className="flex items-center gap-2">
          <Link
            href="/riwayat"
            className="w-10 h-10 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-primary)]"
            aria-label="Cari gempa"
          >
            <Search className="w-4 h-4" />
          </Link>
          <button
            type="button"
            className="w-10 h-10 rounded-full border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] flex items-center justify-center text-[var(--color-text-primary)]"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden p-4 bg-[var(--color-surface-raised)] border-b border-[var(--color-border)]">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const isActive = isLinkActive(link.href);
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
