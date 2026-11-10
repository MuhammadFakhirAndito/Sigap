import Link from 'next/link';
import { Activity, ShieldAlert, Waves, Flame, Clock, MapPin, ChevronRight, AlertTriangle } from 'lucide-react';
import { getLatestEarthquakeData } from '@/lib/bmkg';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const latestResult = await getLatestEarthquakeData();
  const latest = latestResult.data;

  // Ambil waktu sinkronisasi sukses terakhir dari SyncLog (PRD v1.1 Keputusan #9 & FR-DB-03)
  let lastSyncDate: Date | null = null;

  try {
    const lastOkSync = await prisma.syncLog.findFirst({
      where: { status: 'OK' },
      orderBy: { createdAt: 'desc' },
    });
    if (lastOkSync) {
      lastSyncDate = lastOkSync.createdAt;
    } else {
      const fallbackStatus = await prisma.syncStatus.findUnique({ where: { id: 'bmkg_sync' } });
      lastSyncDate = fallbackStatus?.lastSuccessAt || null;
    }
  } catch (err) {
    console.warn('Database offline / belum migrasi:', err);
  }

  const isTsunamiWarning =
    latest?.Potensi &&
    !latest.Potensi.toLowerCase().includes('tidak berpotensi');

  return (
    <div className="space-y-10 pb-16">
      {/* Sync Status Banner (FR-DB-03) */}
      <section className="bg-slate-900 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400"></span>
            <span>
              Sumber Data:{' '}
              <strong className="text-white">
                {latestResult.source === 'BMKG'
                  ? 'Langsung dari BMKG (Live)'
                  : latestResult.source === 'CACHE'
                  ? 'Redis Cache (< 60s)'
                  : 'PostgreSQL Database Fallback'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span>
              Data Terakhir Disinkronkan:{' '}
              <span className="text-slate-100 font-mono">
                {lastSyncDate
                  ? new Date(lastSyncDate).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
                  : 'Belum tercatat'}
              </span>
            </span>
            <Link
              href="/status"
              className="text-rose-400 hover:text-rose-300 font-medium underline flex items-center gap-1"
            >
              Cek Health
            </Link>
          </div>
        </div>
      </section>

      {/* Hero Section & Gempa Terkini Real-Time */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Heading & Quick Overview */}
          <div className="lg:col-span-7 space-y-6">
            <Badge
              variant="secondary"
              className="gap-2 bg-rose-100 text-rose-700 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 text-xs py-1 px-3"
            >
              <Activity className="h-3.5 w-3.5 animate-pulse text-rose-600" />
              Sistem Tanggap & Mitigasi Gempa Indonesia
            </Badge>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Pantau Cepat, <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-600 to-amber-500">Simulasikan Dampak</span>, dan Siaga Bencana.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
              SIGAP menggabungkan data telemetri seismik BMKG dengan mesin simulasi redaman jarak dan asisten cerdas AI. Dilengkapi basis data berkeandalan tinggi untuk menjaga ketersediaan informasi saat server utama padam.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link href="/simulasi">
                <Button className="h-11 gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 px-5 text-sm font-semibold text-white shadow-lg shadow-rose-600/25 hover:from-rose-700 hover:to-amber-700 hover:scale-105 active:scale-95 transition-all">
                  <Flame className="h-4 w-4" />
                  Mulai Simulasi Gempa
                </Button>
              </Link>
              <Link href="/riwayat">
                <Button
                  variant="outline"
                  className="h-11 gap-2 rounded-xl border-slate-300 bg-white px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
                >
                  Riwayat & Arsip Gempa
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Right Column: Hero Live Earthquake Card */}
          <div className="lg:col-span-5">
            {latest ? (
              <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-xl dark:border-slate-800 dark:bg-slate-900">
                {/* Header Card */}
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-600"></span>
                    </span>
                    <Badge variant="outline" className="border-rose-200 text-rose-600 dark:border-rose-900 dark:text-rose-400 font-bold uppercase tracking-wider text-[11px]">
                      Gempabumi Terkini (M5.0+)
                    </Badge>
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {latest.Tanggal} · {latest.Jam}
                  </span>
                </div>

                {/* Magnitude & Potensi */}
                <div className="my-6 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-500">Magnitudo</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black text-rose-600 dark:text-rose-500 tracking-tight">
                        {latest.Magnitude}
                      </span>
                      <span className="text-lg font-bold text-slate-400">SR</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-500">Kedalaman</span>
                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                      {latest.Kedalaman}
                    </div>
                  </div>
                </div>

                {/* Region & Coordinates */}
                <div className="space-y-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-start gap-2.5">
                    <MapPin className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {latest.Wilayah}
                      </h4>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        Koordinat: {latest.Lintang} - {latest.Bujur} ({latest.Coordinates})
                      </p>
                    </div>
                  </div>

                  {/* Tsunami Status Alert */}
                  <Alert
                    className={cn(
                      'p-3 text-xs',
                      isTsunamiWarning
                        ? 'border-rose-200 bg-rose-100 text-rose-800 dark:border-rose-900 dark:bg-rose-950/70 dark:text-rose-300'
                        : 'border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/70 dark:text-emerald-300'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {isTsunamiWarning ? (
                        <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
                      ) : (
                        <Waves className="h-4 w-4 shrink-0 text-emerald-600" />
                      )}
                      <AlertDescription className="font-medium">
                        {latest.Potensi || 'Tidak ada data potensi tsunami'}
                      </AlertDescription>
                    </div>
                  </Alert>
                </div>

                {/* Card Action Buttons (FR-DB-19) */}
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <Link
                    href={`/simulasi?mag=${latest.Magnitude}&depth=${latest.Kedalaman.replace(/[^0-9.]/g, '')}&lat=${latest.Coordinates.split(',')[0]?.trim()}&lon=${latest.Coordinates.split(',')[1]?.trim()}&region=${encodeURIComponent(latest.Wilayah)}`}
                  >
                    <Button className="w-full gap-1.5 rounded-xl bg-slate-900 py-2.5 text-xs font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200 transition-colors">
                      <Flame className="h-3.5 w-3.5 text-amber-400" />
                      Simulasikan Gempa Ini
                    </Button>
                  </Link>

                  <Link href="/riwayat">
                    <Button
                      variant="outline"
                      className="w-full gap-1.5 rounded-xl border-slate-200 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
                    >
                      Lihat Semua Riwayat
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <Card className="rounded-3xl border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900 space-y-3">
                <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                <Skeleton className="h-4 w-40 mx-auto" />
                <p className="text-xs text-slate-500">Menghubungkan layanan data gempa...</p>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* 4 Pilar Fitur Utama Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Fitur Terpadu Siaga Bencana
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Arsitektur yang dirancang untuk kecepatan informasi, ketahanan infrastruktur, dan kemudahan mitigasi.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1 */}
          <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <CardHeader className="p-0 space-y-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                <Flame className="h-6 w-6" />
              </div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                Simulasi Dampak Interaktif
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <p className="text-xs text-slate-500 leading-relaxed">
                Kalkulasi instan skala MMI (I–XII), estimasi energi TNT, radius isoseismal, hingga perbandingan ketahanan bangunan standar vs tahan gempa.
              </p>
              <Link href="/simulasi" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline">
                Buka Simulasi <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Card 2 */}
          <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <CardHeader className="p-0 space-y-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400">
                <Waves className="h-6 w-6" />
              </div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                Golden Time & Gelombang P-S
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <p className="text-xs text-slate-500 leading-relaxed">
                Ketahui selisih detik berharga antara kedatangan gelombang primer (P) dan sekunder (S) untuk tindakan penyelamatan darurat.
              </p>
              <Link href="/simulasi" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-amber-600 hover:underline">
                Pelajari Rambatan <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>

          {/* Card 3 */}
          <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <CardHeader className="p-0 space-y-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
                <ShieldAlert className="h-6 w-6" />
              </div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                Chatbot AI Berkonteks Gempa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <p className="text-xs text-slate-500 leading-relaxed">
                Didukung model Gemini dengan Lightweight RAG gempa BMKG faktual dan fallback bertingkat rule-based saat server AI offline.
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue-600">
                Klik Ikon Chat di Pojok Kanan
              </span>
            </CardContent>
          </Card>

          {/* Card 4 */}
          <Card className="rounded-2xl border-slate-200 bg-white p-5 shadow-xs dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
            <CardHeader className="p-0 space-y-2">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
                <Activity className="h-6 w-6" />
              </div>
              <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
                Observabilitas Sistem & DB
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-2">
              <p className="text-xs text-slate-500 leading-relaxed">
                Arsitektur tangguh dengan PostgreSQL, Redis cache, rate limiting IP, logging metrik waktu respons, dan feedback kepuasan laporan kuliah.
              </p>
              <Link href="/status" className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline">
                Pantau Sistem <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
