import Link from 'next/link';
import { Waves, ExternalLink, Shield } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 mt-auto">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-rose-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
              SIGAP (Sistem Informasi, Simulasi Dampak & Mitigasi Cerdas)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1">
              <Shield className="h-3.5 w-3.5 text-emerald-500" /> Data Resmi Terintegrasi BMKG
            </span>
            <a
              href="https://www.bmkg.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-0.5"
            >
              Portal BMKG <ExternalLink className="h-3 w-3" />
            </a>
            <a
              href="https://bnpb.go.id"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center gap-0.5"
            >
              BNPB <ExternalLink className="h-3 w-3" />
            </a>
            <Link href="/status" className="hover:underline text-rose-600 dark:text-rose-400">
              Healthcheck & Observabilitas
            </Link>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-400">
          Proyek Penguatan Teknis & Evaluasi Akademik Rekayasa Web · PostgreSQL, Redis & AI Fallback Bertingkat
        </div>
      </div>
    </footer>
  );
}

