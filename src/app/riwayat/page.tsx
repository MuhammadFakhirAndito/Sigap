'use client';

import { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { History, Filter, Search, ChevronLeft, ChevronRight, Flame, AlertCircle, RefreshCw, MapPin, Waves, Calendar } from 'lucide-react';

interface GempaItem {
  id: string;
  bmkgKey: string;
  waktuUtc: string;
  lat: number;
  lon: number;
  magnitudo: number;
  kedalamanKm: number;
  wilayah: string;
  potensiTeks: string;
  statusTsunami: string;
  dirasakan: string | null;
  shakemapUrl: string | null;
  jenis: string;
}

interface PaginationMeta {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface SyncMeta {
  lastSuccessAt: string | null;
  lastAttemptAt: string | null;
  lastStatus: string;
}

export default function RiwayatPage() {
  const [data, setData] = useState<GempaItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    page: 1,
    limit: 15,
    totalCount: 0,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const [sync, setSync] = useState<SyncMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Filter States
  const [searchWilayah, setSearchWilayah] = useState('');
  const [minMag, setMinMag] = useState('');
  const [jenisFilter, setJenisFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', currentPage.toString());
      params.set('limit', '15');
      if (searchWilayah.trim()) params.set('wilayah', searchWilayah.trim());
      if (minMag) params.set('minMag', minMag);
      if (jenisFilter) params.set('jenis', jenisFilter);

      const res = await fetch(`/api/gempa?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal memuat data dari database');

      const json = await res.json();
      setData(json.data || []);
      setPagination(json.pagination);
      setSync(json.sync);
    } catch (err) {
      console.warn('Gagal memuat riwayat gempa:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentPage, jenisFilter]);

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const resetFilters = () => {
    setSearchWilayah('');
    setMinMag('');
    setJenisFilter('');
    setCurrentPage(1);
    setTimeout(() => {
      fetchData();
    }, 50);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Title & Sync Notice (FR-DB-03) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400">
              <History className="h-5 w-5" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Riwayat & Katalog Gempa Bumi
            </h1>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500">
            Data tersimpan secara persisten di database PostgreSQL lokal dengan filter multi-parameter dan integrasi simulasi dampak.
          </p>
        </div>

        {/* Sync Status Badge */}
        <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs dark:border-slate-800 dark:bg-slate-900 shadow-xs flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                sync?.lastStatus === 'SUCCESS' ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
              }`}
            />
            <div>
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                Pembaruan Terakhir Sistem:
              </div>
              <div className="text-slate-500 font-mono">
                {sync?.lastSuccessAt
                  ? new Date(sync.lastSuccessAt).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }) + ' WIB'
                  : 'Sinkronisasi awal belum dijalankan'}
              </div>
            </div>
          </div>

          <button
            onClick={() => fetchData()}
            disabled={loading}
            className="rounded-lg p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <form
        onSubmit={handleFilterSubmit}
        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs dark:border-slate-800 dark:bg-slate-900"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          {/* Pencarian Wilayah */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Wilayah / Daerah
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchWilayah}
                onChange={(e) => setSearchWilayah(e.target.value)}
                placeholder="Misal: Jawa Barat, Maluku..."
                className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>
          </div>

          {/* Minimal Magnitudo */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Minimal Magnitudo (M)
            </label>
            <select
              value={minMag}
              onChange={(e) => setMinMag(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Semua Magnitudo</option>
              <option value="4.0">≥ M 4.0</option>
              <option value="5.0">≥ M 5.0 (Gempa Signifikan)</option>
              <option value="6.0">≥ M 6.0 (Kuat / Merusak)</option>
              <option value="7.0">≥ M 7.0 (Sangat Kuat / Potensi Tsunami)</option>
            </select>
          </div>

          {/* Kategori Jenis Gempa */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              Kategori BMKG
            </label>
            <select
              value={jenisFilter}
              onChange={(e) => setJenisFilter(e.target.value)}
              className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-hidden dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            >
              <option value="">Semua Kategori</option>
              <option value="TERKINI">Gempa M 5.0+ (Terkini)</option>
              <option value="DIRASAKAN">Gempa Dirasakan</option>
              <option value="AUTO">Gempa Real-Time (Auto)</option>
            </select>
          </div>

          {/* Tombol Terapkan */}
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-xl bg-rose-600 py-2 px-4 text-xs font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors flex items-center justify-center gap-1.5"
            >
              <Filter className="h-3.5 w-3.5" />
              Terapkan Filter
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="rounded-xl border border-slate-300 py-2 px-3 text-xs font-medium text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </form>

      {/* Tabel & Daftar Gempa */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 dark:bg-slate-950/60 dark:text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Waktu Kejadian (WIB)</th>
                <th className="px-4 py-3.5 text-center">Mag</th>
                <th className="px-4 py-3.5 text-center">Kedalaman</th>
                <th className="px-4 py-3.5">Wilayah & Koordinat</th>
                <th className="px-4 py-3.5">Potensi / Keterangan</th>
                <th className="px-4 py-3.5 text-right">Aksi Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2 text-rose-500" />
                    Mengambil data riwayat gempa dari database...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <AlertCircle className="mx-auto h-8 w-8 text-slate-400 mb-2" />
                    Tidak ada data gempa yang cocok dengan kriteria filter saat ini.
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const dateObj = new Date(item.waktuUtc);
                  const isSevere = item.magnitudo >= 6.0;
                  const isTsunami = item.statusTsunami === 'BERPOTENSI';

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Waktu */}
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {dateObj.toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {dateObj.toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB
                        </div>
                      </td>

                      {/* Magnitudo */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-black ${
                            isSevere
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          M {item.magnitudo.toFixed(1)}
                        </span>
                      </td>

                      {/* Kedalaman */}
                      <td className="px-4 py-3.5 text-center whitespace-nowrap text-slate-700 dark:text-slate-300 font-medium">
                        {item.kedalamanKm} km
                      </td>

                      {/* Wilayah */}
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-slate-900 dark:text-white line-clamp-1">
                          {item.wilayah}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {item.lat.toFixed(2)}, {item.lon.toFixed(2)}
                        </div>
                      </td>

                      {/* Potensi Tsunami / Dirasakan */}
                      <td className="px-4 py-3.5">
                        {isTsunami ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-md">
                            <Waves className="h-3 w-3" /> Berpotensi Tsunami
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-500 line-clamp-1">
                            {item.potensiTeks || (item.dirasakan ? `Dirasakan: ${item.dirasakan}` : 'Aman')}
                          </span>
                        )}
                      </td>

                      {/* Aksi "Simulasikan" (FR-DB-19, TC-DB-11) */}
                      <td className="px-4 py-3.5 text-right whitespace-nowrap">
                        <Link
                          href={`/simulasi?mag=${item.magnitudo}&depth=${item.kedalamanKm}&lat=${item.lat}&lon=${item.lon}&region=${encodeURIComponent(item.wilayah)}`}
                          className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-400 dark:hover:bg-rose-900/60 transition-colors"
                          title="Muat data ini ke halaman Simulasi Dampak Gempa"
                        >
                          <Flame className="h-3.5 w-3.5" />
                          Simulasikan
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <div>
            Menampilkan halaman <strong className="text-slate-800 dark:text-slate-200">{pagination.page}</strong> dari{' '}
            <strong className="text-slate-800 dark:text-slate-200">{pagination.totalPages || 1}</strong> ({pagination.totalCount} total data)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrevPage || loading}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:hover:bg-slate-800"
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </button>
            <button
              onClick={() => setCurrentPage((p) => p + 1)}
              disabled={!pagination.hasNextPage || loading}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 font-medium hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-transparent dark:border-slate-700 dark:hover:bg-slate-800"
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

