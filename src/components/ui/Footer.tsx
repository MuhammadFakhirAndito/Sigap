import React from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

interface FooterProps {
  lastUpdatedText?: string;
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({
  lastUpdatedText,
  className = "",
}) => {
  return (
    <footer
      className={`mt-auto border-t border-[var(--color-border)] bg-[var(--color-surface)]/60 py-10 px-4 sm:px-6 ${className}`}
      role="contentinfo"
    >
      <div className="max-w-[1220px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="space-y-1.5">
          <p className="font-semibold text-sm text-[var(--color-text-primary)]">
            SIGAP Gempa: Sistem Informasi & Mitigasi Gempa Bumi Indonesia
          </p>
          <p className="text-xs text-[var(--color-text-secondary)]">
            Sumber Data:{" "}
            <a
              href="https://www.bmkg.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] rounded-sm"
            >
              Badan Meteorologi, Klimatologi, dan Geofisika (BMKG)
              <ExternalLink className="w-3 h-3 ml-0.5" aria-hidden="true" />
            </a>
            {lastUpdatedText ? ` · ${lastUpdatedText}` : ""}
          </p>
          <p className="text-xs font-medium text-[var(--color-text-secondary)] pt-1">
            Situs ini bukan sistem peringatan dini resmi. Informasi disediakan untuk keperluan edukasi dan kesiapsiagaan masyarakat.
          </p>
        </div>

        <nav aria-label="Tautan Footer" className="flex flex-wrap items-center justify-center gap-4 text-xs text-[var(--color-text-secondary)]">
          <Link
            href="/edukasi"
            className="hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] p-1 rounded-sm"
          >
            Daftar Pustaka
          </Link>
          <Link
            href="/simulasi"
            className="hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] p-1 rounded-sm"
          >
            Simulasi Edukasi
          </Link>
          <Link
            href="/_design"
            className="hover:text-[var(--color-text-primary)] focus-visible:outline-2 focus-visible:outline-[var(--color-primary-strong)] p-1 rounded-sm"
          >
            Design System Token
          </Link>
        </nav>
      </div>
    </footer>
  );
};
