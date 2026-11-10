'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Flame, Waves, Clock, Zap, MapPin, Building, AlertTriangle, Sliders, Info } from 'lucide-react';
import { calculateEarthquakeSimulation } from '@/lib/simulation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface PresetScenario {
  id: string;
  nama: string;
  magnitudo: number;
  kedalamanKm: number;
  lat: number;
  lon: number;
  tipeLokasi: 'DARAT' | 'LAUT';
  deskripsiSingkat?: string;
}

function SimulasiContent() {
  const searchParams = useSearchParams();

  // Parameter simulasi interaktif
  const [magnitudo, setMagnitudo] = useState<number>(6.5);
  const [kedalamanKm, setKedalamanKm] = useState<number>(15);
  const [lat, setLat] = useState<number>(-6.8);
  const [lon, setLon] = useState<number>(107.6);
  const [tipeLokasi, setTipeLokasi] = useState<'DARAT' | 'LAUT'>('DARAT');
  const [namaLokasi, setNamaLokasi] = useState<string>('Wilayah Uji Simulasi');

  // Preset skenario gempa bersejarah (FR-DB-16)
  const [presets, setPresets] = useState<PresetScenario[]>([]);

  // Baca query params jika diarahkan dari halaman Riwayat Gempa (FR-DB-19, TC-DB-11)
  useEffect(() => {
    const magParam = searchParams.get('mag');
    const depthParam = searchParams.get('depth');
    const latParam = searchParams.get('lat');
    const lonParam = searchParams.get('lon');
    const regionParam = searchParams.get('region');

    if (magParam) setMagnitudo(parseFloat(magParam));
    if (depthParam) setKedalamanKm(parseFloat(depthParam));
    if (latParam) setLat(parseFloat(latParam));
    if (lonParam) setLon(parseFloat(lonParam));
    if (regionParam) setNamaLokasi(decodeURIComponent(regionParam));
  }, [searchParams]);

  // Muat preset skenario dari endpoint
  useEffect(() => {
    async function loadPresets() {
      try {
        const res = await fetch('/api/simulasi/skenario');
        const json = await res.json();
        if (json.presets) {
          setPresets(json.presets);
        }
      } catch (err) {
        console.warn('Gagal memuat preset:', err);
      }
    }
    loadPresets();
  }, []);

  const handleSelectPreset = (p: PresetScenario) => {
    setMagnitudo(p.magnitudo);
    setKedalamanKm(p.kedalamanKm);
    setLat(p.lat);
    setLon(p.lon);
    setTipeLokasi(p.tipeLokasi);
    setNamaLokasi(p.nama);
  };

  // Kalkulasi estimasi dampak client-side secara instan & reaktif (TC-DB-10)
  const result = useMemo(() => {
    return calculateEarthquakeSimulation({
      magnitudo,
      kedalamanKm,
      lat,
      lon,
      tipeLokasi,
      namaLokasi,
    });
  }, [magnitudo, kedalamanKm, lat, lon, tipeLokasi, namaLokasi]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800 space-y-4">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-rose-600 to-amber-500 text-white shadow-md shadow-rose-500/20">
            <Flame className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Simulator Dampak & Risiko Seismik
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Uji parameter magnitudo dan kedalaman hiposentrum secara dinamis untuk mengestimasi skala intensitas MMI, radius kerusakan, Golden Time gelombang P-S, dan kerentanan struktur.
            </p>
          </div>
        </div>

        {/* Disclaimer Edukasi Resmi (PRD v1.1 Keputusan #10 & FR-DB-17) */}
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 flex items-center gap-2">
          <Info className="h-4 w-4 shrink-0 text-amber-600" />
          <span>
            <strong>Disclaimer Edukasi:</strong> Seluruh output simulasi (skala MMI, radius, energi TNT, dan waktu rambat) adalah <em>estimasi edukasi, bukan data resmi BMKG</em>. Informasi resmi gempabumi dan peringatan dini tsunami hanya dirilis oleh BMKG.
          </span>
        </div>
      </div>

      {/* Preset Gempa Bersejarah Banner */}
      {presets.length > 0 && (
        <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2.5 flex items-center gap-1.5">
            <Zap className="h-3.5 w-3.5 text-amber-500" />
            Pilih Skenario Gempa Nyata & Preset Historis:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={cn(
                  'p-3 rounded-xl border text-left transition-all',
                  magnitudo === preset.magnitudo && kedalamanKm === preset.kedalamanKm
                    ? 'border-rose-500 bg-rose-50/60 dark:bg-rose-950/40 dark:border-rose-800 ring-2 ring-rose-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-slate-50/50 hover:bg-white dark:border-slate-800 dark:bg-slate-950 dark:hover:bg-slate-900'
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-xs text-slate-900 dark:text-white">
                    {preset.nama}
                  </span>
                  <Badge variant="secondary" className="font-black text-xs text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-950 px-1.5 py-0.5 rounded">
                    M {preset.magnitudo.toFixed(1)}
                  </Badge>
                </div>
                <p className="mt-1 text-[11px] text-slate-500 line-clamp-2">
                  {preset.deskripsiSingkat}
                </p>
              </button>
            ))}
          </div>
        </Card>
      )}

      {/* Main Grid: Control Panel (Left) & Results (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Control Panel (Sliders & Inputs) */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Sliders className="h-4 w-4 text-rose-600" />
                Kontrol Parameter Seismik
              </h3>
              <Badge variant="outline" className="text-[10px]">Reaktif Client-Side</Badge>
            </div>

            {/* Slider Magnitudo */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Kekuatan Magnitudo (M)
                </label>
                <span className="font-black text-rose-600 dark:text-rose-400 text-base bg-rose-50 dark:bg-rose-950/60 px-2.5 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900">
                  M {magnitudo.toFixed(1)}
                </span>
              </div>
              <Slider
                value={[magnitudo]}
                onValueChange={(val: any) => setMagnitudo(Array.isArray(val) ? val[0] : val)}
                min={3.0}
                max={9.5}
                step={0.1}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>3.0 (Ringan)</span>
                <span>6.0 (Kuat)</span>
                <span>9.5 (Mega Gempa)</span>
              </div>
            </div>

            {/* Slider Kedalaman */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Kedalaman Hiposentrum
                </label>
                <span className="font-bold text-slate-800 dark:text-slate-200 text-sm bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                  {kedalamanKm} km
                </span>
              </div>
              <Slider
                value={[kedalamanKm]}
                onValueChange={(val: any) => setKedalamanKm(Array.isArray(val) ? val[0] : val)}
                min={5}
                max={300}
                step={5}
                className="py-2"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>5 km (Sangat Dangkal)</span>
                <span>70 km (Dangkal)</span>
                <span>300 km (Dalam)</span>
              </div>
            </div>

            {/* Tipe Lokasi (Darat vs Laut) */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Zona Pusat Gempa
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTipeLokasi('DARAT')}
                  className={cn(
                    'py-2 px-3 text-xs font-semibold transition-all h-9',
                    tipeLokasi === 'DARAT'
                      ? 'border-amber-600 bg-amber-50 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400'
                  )}
                >
                  Episentrum Darat
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setTipeLokasi('LAUT')}
                  className={cn(
                    'py-2 px-3 text-xs font-semibold transition-all h-9',
                    tipeLokasi === 'LAUT'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 dark:bg-blue-950/60 dark:text-blue-300'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-400'
                  )}
                >
                  Episentrum Laut
                </Button>
              </div>
            </div>

            {/* Koordinat & Label Lokasi */}
            <div className="space-y-3 pt-2">
              <Separator />
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Nama / Label Wilayah
                </label>
                <Input
                  type="text"
                  value={namaLokasi}
                  onChange={(e) => setNamaLokasi(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Latitude</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={lat}
                    onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                    className="text-xs font-mono h-8"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Longitude</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={lon}
                    onChange={(e) => setLon(parseFloat(e.target.value) || 0)}
                    className="text-xs font-mono h-8"
                  />
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Output: Calculations & Visualization */}
        <div className="lg:col-span-7 space-y-6">
          {/* Key Output Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Card 1: Intensitas Episentrum */}
            <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-500">Skala Puncak Episentrum</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-600 dark:text-rose-500">
                  MMI {result.intensitasEpisentrumRomawi}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  ({result.intensitasEpisentrumMmi}/12)
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                Guncangan maksimal di pusat episentrum
              </p>
            </Card>

            {/* Card 2: Pelepasan Energi */}
            <Card className="rounded-2xl border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900">
              <span className="text-xs text-slate-500">Estimasi Energi (TNT)</span>
              <div className="mt-2 text-2xl font-black text-amber-600 dark:text-amber-500">
                {result.energiTntTon > 1e6
                  ? `${(result.energiTntTon / 1e6).toFixed(1)} Megaton`
                  : result.energiTntTon > 1e3
                  ? `${(result.energiTntTon / 1e3).toFixed(1)} Kiloton`
                  : `${Math.round(result.energiTntTon)} Ton`}
              </div>
              <p className="mt-1 text-[11px] text-slate-400">
                {result.energiJoule.toExponential(2)} Joule
              </p>
            </Card>

            {/* Card 3: Potensi Tsunami */}
            <Alert
              className={cn(
                'rounded-2xl p-4 shadow-xs',
                result.statusTsunami.potensi
                  ? 'border-rose-200 bg-rose-50 dark:border-rose-900 dark:bg-rose-950/50'
                  : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/50'
              )}
            >
              <span className="text-xs text-slate-600 dark:text-slate-400">Indikator Tsunami</span>
              <div className="mt-2 flex items-center gap-2">
                {result.statusTsunami.potensi ? (
                  <AlertTriangle className="h-5 w-5 text-rose-600" />
                ) : (
                  <Waves className="h-5 w-5 text-emerald-600" />
                )}
                <AlertDescription
                  className={cn(
                    'text-lg font-black',
                    result.statusTsunami.potensi ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
                  )}
                >
                  {result.statusTsunami.level}
                </AlertDescription>
              </div>
              <p className="mt-1 text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                {result.statusTsunami.keterangan}
              </p>
            </Alert>
          </div>

          {/* Isoseismal Radii (Radius Zona Dampak) */}
          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-rose-600" />
              Radius Wilayah Sebaran Guncangan (Isoseismal)
            </h3>

            <div className="space-y-3">
              {result.zonaDampak.map((zona, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className="mt-0.5 h-3.5 w-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: zona.color }}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          Skala MMI {zona.mmi}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium">
                          ({zona.label})
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {zona.deskripsi}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-slate-400">Radius Jangkauan</span>
                    <div className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                      ~ {zona.radiusKm} km
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Golden Time & Wave Travel Time Table */}
          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-600" />
                Waktu Rambat Gelombang P & S (Golden Time Penyelamatan)
              </CardTitle>
              <p className="text-xs text-slate-500 mt-1">
                Gelombang Primer (P) merambat ~6.0 km/detik, disusul Gelombang Sekunder perusak (S) ~3.5 km/detik. Selisih detik ini adalah jendela evakuasi emas Anda.
              </p>
            </CardHeader>

            <div className="overflow-x-auto">
              <Table className="text-xs">
                <TableHeader className="bg-slate-50 dark:bg-slate-950 text-slate-500 text-[10px] uppercase">
                  <TableRow>
                    <TableHead className="px-3 py-2">Jarak Pengamat</TableHead>
                    <TableHead className="px-3 py-2">Tiba Gelombang P</TableHead>
                    <TableHead className="px-3 py-2">Tiba Gelombang S</TableHead>
                    <TableHead className="px-3 py-2 font-bold text-rose-600">Golden Time (Detik Emas)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="font-mono">
                  {result.goldenTimeTabel.map((row, idx) => (
                    <TableRow key={idx} className="hover:bg-slate-50/50">
                      <TableCell className="px-3 py-2.5 font-sans font-medium text-slate-800 dark:text-slate-200">
                        {row.jarakKm} km dari episentrum
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                        +{row.pWaveSeconds} detik
                      </TableCell>
                      <TableCell className="px-3 py-2.5 text-slate-600 dark:text-slate-400">
                        +{row.sWaveSeconds} detik
                      </TableCell>
                      <TableCell className="px-3 py-2.5 font-bold text-rose-600 dark:text-rose-400">
                        {row.goldenTimeSeconds} detik bersiap
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Structure Comparison: Non-Engineered vs Earthquake Resistant (FR-DB-18) */}
          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 mb-4">
              <Building className="h-4 w-4 text-blue-600" />
              Perbandingan Kerentanan Struktur Bangunan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Standar Non-Engineered */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                    Bangunan Tanpa Tulangan SNI
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      'text-[10px] font-black px-2 py-0.5 rounded',
                      result.responsStruktur.standar.tingkatKerusakan === 'HANCUR TOTAL' ||
                      result.responsStruktur.standar.tingkatKerusakan === 'BERAT'
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    )}
                  >
                    {result.responsStruktur.standar.tingkatKerusakan}
                  </Badge>
                </div>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {result.responsStruktur.standar.deskripsi}
                </p>

                <div className="mt-3 text-[11px] space-y-1">
                  <strong className="text-slate-700 dark:text-slate-300 block">Protokol:</strong>
                  {result.responsStruktur.standar.rekomendasi.map((r, i) => (
                    <li key={i} className="text-slate-500 list-disc ml-3">{r}</li>
                  ))}
                </div>
              </div>

              {/* Engineered Structure */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900/60 dark:bg-emerald-950/20">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-emerald-900 dark:text-emerald-300">
                    Rumah Tahan Gempa (SNI 1726)
                  </span>
                  <Badge className="text-[10px] font-black px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-300">
                    {result.responsStruktur.tahanGempa.tingkatKerusakan}
                  </Badge>
                </div>

                <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {result.responsStruktur.tahanGempa.deskripsi}
                </p>

                <div className="mt-3 text-[11px] space-y-1">
                  <strong className="text-slate-700 dark:text-slate-300 block">Protokol:</strong>
                  {result.responsStruktur.tahanGempa.rekomendasi.map((r, i) => (
                    <li key={i} className="text-slate-500 list-disc ml-3">{r}</li>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function SimulasiPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500">Memuat modul simulator gempa...</div>}>
      <SimulasiContent />
    </Suspense>
  );
}
