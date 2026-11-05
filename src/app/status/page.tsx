'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, Database, HardDrive, Globe, RefreshCw, CheckCircle2, AlertTriangle, XCircle, Clock, Server, Terminal } from 'lucide-react';

interface HealthData {
  status: 'healthy' | 'degraded';
  timestamp: string;
  totalLatencyMs: number;
  components: {
    database: { ok: boolean; latencyMs: number; message: string };
    cache: { ok: boolean; mode: string; message: string };
    bmkgApi: { ok: boolean; latencyMs: number; message: string };
  };
  syncStatus: {
    id: string;
    lastSuccessAt: string | null;
    lastAttemptAt: string;
    lastStatus: string;
    errorMessage: string | null;
  } | null;
}

export default function StatusPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.warn('Gagal memuat health data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 15000);
    return () => clearInterval(interval);
  }, []);

  const triggerSync = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/sync/bmkg', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setSyncResult(`✅ Sinkronisasi berhasil! ${data.totalUpserted} data diperbarui.`);
        fetchHealth();
      } else {
        setSyncResult(`❌ Sinkronisasi gagal: ${data.error || data.message}`);
      }
    } catch (err: any) {
      setSyncResult(`❌ Terjadi kesalahan jaringan: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Observabilitas Sistem & Keandalan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Pemantauan komponen infrastruktur PostgreSQL, Redis, keterjangkauan API BMKG, dan metrik kesehatan untuk bahan evaluasi kuliah.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHealth}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-rose-500' : ''}`} />
          Perbarui Status
        </button>
      </div>

      {/* Status Utama */}
      <div
        className={`rounded-3xl border p-6 ${
          health?.status === 'healthy'
            ? 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-900/60 dark:bg-emerald-950/20'
            : 'border-amber-200 bg-amber-50/50 dark:border-amber-900/60 dark:bg-amber-950/20'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {health?.status === 'healthy' ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-amber-600" />
            )}
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Status Kesehatan Sistem Terpadu
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                {health?.status === 'healthy'
                  ? 'Semua Komponen Operasional Optimal (Healthy)'
                  : 'Sistem Beroperasi dalam Mode Penurunan Anggun (Degraded)'}
              </h2>
            </div>
          </div>

          <div className="text-right text-xs text-slate-500 font-mono">
            Latensi Total: <span className="font-bold text-slate-800 dark:text-slate-200">{health?.totalLatencyMs || 0} ms</span>
          </div>
        </div>
      </div>

      {/* Grid 3 Komponen Inti */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* PostgreSQL */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-blue-600" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                PostgreSQL (Prisma)
              </span>
            </div>
            {health?.components.database.ok ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Online
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                <XCircle className="h-3 w-3" /> Terdegradasi
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Waktu Respon:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {health?.components.database.latencyMs || 0} ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status Koneksi:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {health?.components.database.message}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            Port 5432 dilindungi di localhost VPS via firewall & Docker network internal (TC-DB-06).
          </div>
        </div>

        {/* Redis Cache & Rate Limit */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-red-600" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                Redis (Cache & RL)
              </span>
            </div>
            {health?.components.cache.ok ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Redis Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-full">
                <AlertTriangle className="h-3 w-3" /> In-Memory Fallback
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Mode Operasi:</span>
              <span className="font-mono font-semibold uppercase text-slate-800 dark:text-slate-200">
                {health?.components.cache.mode}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Status Keterhubungan:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {health?.components.cache.message}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            Mengatur rate limiting IP (10 req/menit), pembatas kuota harian Gemini, dan cache respons.
          </div>
        </div>

        {/* BMKG API Endpoint */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-600" />
              <span className="font-bold text-sm text-slate-900 dark:text-white">
                BMKG API Gateway
              </span>
            </div>
            {health?.components.bmkgApi.ok ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="h-3 w-3" /> Terjangkau
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                <XCircle className="h-3 w-3" /> Gangguan Server
              </span>
            )}
          </div>

          <div className="text-xs text-slate-500 space-y-1">
            <div className="flex justify-between">
              <span>Ping Latensi:</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {health?.components.bmkgApi.latencyMs || 0} ms
              </span>
            </div>
            <div className="flex justify-between">
              <span>Kondisi Respons:</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {health?.components.bmkgApi.message}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-50 dark:bg-slate-950 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
            Jika BMKG padam, SIGAP otomatis menyajikan data terakhir dari PostgreSQL (TC-DB-02).
          </div>
        </div>
      </div>

      {/* Manual Sync Trigger Section */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
              <Terminal className="h-5 w-5 text-rose-600" />
              Pengujian Sinkronisasi BMKG Manual (Cron Simulator)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Jalankan sinkronisasi data dari BMKG ke PostgreSQL secara manual untuk menguji skenario idempotensi (TC-DB-01) dan pembaruan timestamp.
            </p>
          </div>

          <button
            onClick={triggerSync}
            disabled={syncing}
            className="shrink-0 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin text-rose-500' : ''}`} />
            {syncing ? 'Menghubungi BMKG...' : 'Jalankan Sinkronisasi Sekarang'}
          </button>
        </div>

        {syncResult && (
          <div className="rounded-xl bg-slate-50 dark:bg-slate-950 p-3 text-xs font-mono border border-slate-200 dark:border-slate-800">
            {syncResult}
          </div>
        )}

        {health?.syncStatus && (
          <div className="pt-2 text-xs text-slate-400 grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              Waktu Sinkronisasi Sukses Terakhir:{' '}
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">
                {health.syncStatus.lastSuccessAt
                  ? new Date(health.syncStatus.lastSuccessAt).toLocaleString('id-ID')
                  : 'Belum pernah'}
              </span>
            </div>
            <div>
              Status Terakhir:{' '}
              <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                {health.syncStatus.lastStatus}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

