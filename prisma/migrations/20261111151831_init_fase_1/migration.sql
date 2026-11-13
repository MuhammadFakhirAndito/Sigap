-- CreateEnum
CREATE TYPE "StatusTsunami" AS ENUM ('AMAN', 'BERPOTENSI', 'TIDAK_DINYATAKAN');

-- CreateEnum
CREATE TYPE "KategoriArtikel" AS ENUM ('PENGERTIAN', 'PROSES', 'PENANGGULANGAN', 'MITIGASI', 'LAINNYA');

-- CreateEnum
CREATE TYPE "TipeLokasi" AS ENUM ('DARAT', 'LAUT');

-- CreateEnum
CREATE TYPE "ChatSource" AS ENUM ('LLM', 'FALLBACK');

-- CreateTable
CREATE TABLE "gempa" (
    "id" TEXT NOT NULL,
    "bmkgKey" TEXT NOT NULL,
    "waktuUtc" TIMESTAMP(3) NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "magnitudo" DOUBLE PRECISION NOT NULL,
    "kedalamanKm" DOUBLE PRECISION NOT NULL,
    "wilayah" TEXT NOT NULL,
    "potensiTeks" TEXT NOT NULL,
    "statusTsunami" "StatusTsunami" NOT NULL DEFAULT 'TIDAK_DINYATAKAN',
    "dirasakan" TEXT,
    "shakemapUrl" TEXT,
    "isAuto" BOOLEAN NOT NULL DEFAULT false,
    "isTerkini" BOOLEAN NOT NULL DEFAULT false,
    "isDirasakan" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gempa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sync_log" (
    "id" TEXT NOT NULL,
    "sumber" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "jumlahBaru" INTEGER NOT NULL DEFAULT 0,
    "jumlahDiperbarui" INTEGER NOT NULL DEFAULT 0,
    "pesanError" TEXT,
    "durasiMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "berita" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "sumber" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tanggalTerbit" TIMESTAMP(3) NOT NULL,
    "ringkasan" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "berita_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "artikel" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "kategori" "KategoriArtikel" NOT NULL,
    "isi" TEXT NOT NULL,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "artikel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sumber" (
    "id" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "penerbit" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tanggalAkses" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sumber_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faq_gempa" (
    "id" TEXT NOT NULL,
    "kataKunci" TEXT[],
    "pertanyaan" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,
    "aktif" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "faq_gempa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_log" (
    "id" TEXT NOT NULL,
    "pertanyaan" TEXT NOT NULL,
    "jawaban" TEXT NOT NULL,
    "source" "ChatSource" NOT NULL,
    "model" TEXT,
    "responseTimeMs" INTEGER,
    "isHelpful" BOOLEAN,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_log_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kuota_harian" (
    "id" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "tanggal" DATE NOT NULL,
    "jumlah" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "kuota_harian_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "skenario_simulasi" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "magnitudo" DOUBLE PRECISION NOT NULL,
    "kedalamanKm" DOUBLE PRECISION NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "tipeLokasi" "TipeLokasi" NOT NULL,
    "deskripsiSingkat" TEXT,
    "urutan" INTEGER NOT NULL DEFAULT 0,
    "sumberId" TEXT,

    CONSTRAINT "skenario_simulasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_ArtikelSumber" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ArtikelSumber_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "gempa_bmkgKey_key" ON "gempa"("bmkgKey");

-- CreateIndex
CREATE INDEX "gempa_waktuUtc_idx" ON "gempa"("waktuUtc" DESC);

-- CreateIndex
CREATE INDEX "gempa_magnitudo_idx" ON "gempa"("magnitudo");

-- CreateIndex
CREATE INDEX "sync_log_createdAt_idx" ON "sync_log"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "berita_url_key" ON "berita"("url");

-- CreateIndex
CREATE UNIQUE INDEX "artikel_slug_key" ON "artikel"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sumber_url_key" ON "sumber"("url");

-- CreateIndex
CREATE INDEX "chat_log_createdAt_idx" ON "chat_log"("createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "kuota_harian_model_tanggal_key" ON "kuota_harian"("model", "tanggal");

-- CreateIndex
CREATE INDEX "_ArtikelSumber_B_index" ON "_ArtikelSumber"("B");

-- AddForeignKey
ALTER TABLE "skenario_simulasi" ADD CONSTRAINT "skenario_simulasi_sumberId_fkey" FOREIGN KEY ("sumberId") REFERENCES "sumber"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtikelSumber" ADD CONSTRAINT "_ArtikelSumber_A_fkey" FOREIGN KEY ("A") REFERENCES "artikel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ArtikelSumber" ADD CONSTRAINT "_ArtikelSumber_B_fkey" FOREIGN KEY ("B") REFERENCES "sumber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
