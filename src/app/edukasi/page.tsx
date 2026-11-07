import { BookOpen, Shield, ExternalLink, Bookmark, Newspaper } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export const dynamic = 'force-dynamic';

export default async function EdukasiPage() {
  let artikels: any[] = [];
  let sumbers: any[] = [];
  let beritas: any[] = [];

  try {
    [artikels, sumbers, beritas] = await Promise.all([
      prisma.artikel.findMany({
        include: { sumber: true },
        orderBy: { urutan: 'asc' },
      }),
      prisma.sumber.findMany({
        orderBy: { judul: 'asc' },
      }),
      prisma.berita.findMany({
        orderBy: { tanggalTerbit: 'desc' },
        take: 6,
      }),
    ]);
  } catch (err) {
    console.warn('Gagal memuat artikel dari database:', err);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Edukasi Kebencanaan & Mitigasi Gempa
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Modul pembelajaran interaktif, panduan kesiapsiagaan darurat keluarga, dan daftar pustaka sumber primer resmi.
            </p>
          </div>
        </div>
      </div>

      {/* Grid: Educational Articles & News */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Educational Articles */}
        <div className="lg:col-span-8 space-y-8">
          {artikels.length === 0 ? (
            <Card className="rounded-2xl border-slate-200 p-8 text-center text-slate-500 dark:border-slate-800">
              Belum ada artikel edukasi termuat dari database. Jalankan <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-rose-600 font-mono">npm run db:seed</code> untuk mengisi konten awal.
            </Card>
          ) : (
            artikels.map((artikel) => (
              <Card
                key={artikel.id}
                id={artikel.slug}
                className="rounded-3xl border-slate-200 bg-white p-6 sm:p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900 space-y-4"
              >
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-rose-50 font-bold text-rose-600 dark:bg-rose-950/60 dark:text-rose-400">
                    {artikel.kategori}
                  </Badge>
                  <span className="text-xs text-slate-400">
                    Modul #{artikel.urutan}
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-snug">
                  {artikel.judul}
                </h2>

                <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                  {artikel.isi}
                </div>

                {/* Relasi Sumber / Daftar Pustaka (FR-DB-07) */}
                {artikel.sumber && artikel.sumber.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 mb-2">
                      <Bookmark className="h-3.5 w-3.5 text-blue-500" />
                      Sumber Rujukan & Daftar Pustaka:
                    </span>
                    <ul className="space-y-1.5">
                      {artikel.sumber.map((s: any) => (
                        <li key={s.id} className="text-xs text-slate-500 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400"></span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {s.penerbit}:
                          </span>{' '}
                          <span>{s.judul}</span>
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-0.5 ml-1"
                          >
                            Tautan <ExternalLink className="h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Card>
            ))
          )}
        </div>

        {/* Right Column: News & Official Bibliography (FR-DB-05, FR-DB-07) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Berita Terkait */}
          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Newspaper className="h-4 w-4 text-rose-600" />
                Warta & Publikasi Kebencanaan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {beritas.length === 0 ? (
                <p className="text-xs text-slate-400">Belum ada metadata berita tersimpan.</p>
              ) : (
                <div className="space-y-4">
                  {beritas.map((berita) => (
                    <div
                      key={berita.id}
                      className="border-b border-slate-100 dark:border-slate-800 pb-3 last:border-0 last:pb-0"
                    >
                      <Badge variant="outline" className="text-[10px] font-bold text-rose-600 border-rose-200 uppercase">
                        {berita.sumber}
                      </Badge>
                      <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-1 leading-snug">
                        <a
                          href={berita.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline flex items-start justify-between gap-1"
                        >
                          {berita.judul}
                          <ExternalLink className="h-3 w-3 shrink-0 text-slate-400 mt-0.5" />
                        </a>
                      </h4>
                      {berita.ringkasan && (
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {berita.ringkasan}
                        </p>
                      )}
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        {new Date(berita.tanggalTerbit).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Daftar Pustaka Lengkap */}
          <Card className="rounded-3xl border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-slate-900">
            <CardHeader className="p-0 mb-4">
              <CardTitle className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="h-4 w-4 text-emerald-600" />
                Lembaga Resmi & Rujukan
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-3">
                {sumbers.map((s, idx) => (
                  <div key={s.id} className="text-xs">
                    {idx > 0 && <Separator className="my-2" />}
                    <div className="font-semibold text-slate-800 dark:text-slate-200">{s.penerbit}</div>
                    <div className="text-slate-500 text-[11px] mt-0.5">{s.judul}</div>
                    <a
                      href={s.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 mt-0.5"
                    >
                      Kunjungi Portal <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
