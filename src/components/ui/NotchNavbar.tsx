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
    <header className={`relative z-30 w-full ${className}`}>
      {/* FLOATING PILL NAVBAR PERSIS INDEX-1.HTML */}
      <div className="flex items-center justify-between gap-4 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-strong)] px-3 py-2.5 shadow-[0_8px_30px_rgba(13,13,13,0.05)] sm:px-5">
        {/* Brand / Logo */}
        <Link href="/" className="flex shrink-0 items-center gap-2.5 group" aria-label="SIGAP Gempa beranda">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-[var(--color-primary-subtle)] text-[var(--color-primary)] transition-transform group-hover:scale-105">
            <Activity className="w-4 h-4" strokeWidth={2.5} aria-hidden="true" />
          </span>
          <span className="text-lg font-medium tracking-tight text-[var(--color-text-primary)]">
            SIGAP <span className="font-normal text-[var(--color-text-secondary)]">Gempa</span>
          </span>
        </Link>

        {/* Center Nav Links */}
        <nav aria-label="Navigasi utama" className="hidden items-center gap-1 text-sm lg:flex">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-2 text-sm transition-all duration-150 ${
                  isActive
                    ? "font-medium text-[var(--color-text-primary)] bg-[var(--color-surface)] shadow-2xs"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text-primary)]"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Icon Actions */}
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

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div
          id="mobile-menu"
          className="mt-2 p-4 bg-[var(--color-surface-strong)] border border-[var(--color-border)] rounded-[28px] shadow-[0_8px_30px_rgba(13,13,13,0.08)] animate-in fade-in slide-in-from-top-2 duration-200"
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
};
