-- AlterTable
ALTER TABLE "artikel" ADD COLUMN IF NOT EXISTS "ringkasan" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "faq_gempa_pertanyaan_key" ON "faq_gempa"("pertanyaan");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "skenario_simulasi_nama_key" ON "skenario_simulasi"("nama");
