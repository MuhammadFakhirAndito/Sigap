/**
 * FIXTURE DEV: 10.000 Baris Gempa Sintetis (Pengujian NFR-DB-01)
 * 
 * PERINGATAN:
 * Skrip ini HANYA untuk lingkungan pengujian dan pengembangan (dev/test).
 * Dilarang keras dijalankan di lingkungan produksi.
 */

import { PrismaClient, StatusTsunami } from "@prisma/client";

const prisma = new PrismaClient();

if (process.env.NODE_ENV === "production") {
  console.error("CRITICAL: Dilarang menjalankan skrip seed fixture sintetis di lingkungan PRODUKSI!");
  process.exit(1);
}

const DAFTAR_WILAYAH = [
  "Pusat gempa berada di darat 15 km barat daya Sukabumi",
  "Pusat gempa berada di laut 45 km barat daya Padang",
  "Pusat gempa berada di laut 85 km barat laut Banda Aceh",
  "Pusat gempa berada di darat 20 km timur laut Jayapura",
  "Pusat gempa berada di laut 32 km tenggara Ambon",
  "Pusat gempa berada di darat 10 km barat daya Mataram, Lombok",
  "Pusat gempa berada di laut 55 km barat daya Bantul, D.I. Yogyakarta",
  "Pusat gempa berada di darat 18 km barat laut Palu, Sulawesi Tengah",
  "Pusat gempa berada di laut 60 km timur laut Maumere, NTT",
  "Pusat gempa berada di laut 40 km barat daya Bengkulu",
  "Pusat gempa berada di darat 25 km tenggara Bukittinggi",
  "Pusat gempa berada di laut 70 km tenggara Malang, Jawa Timur",
  "Pusat gempa berada di laut 52 km barat daya Meulaboh, Aceh Barat",
  "Pusat gempa berada di darat 12 km barat laut Tarakan, Kaltara",
  "Pusat gempa berada di laut 90 km barat laut Ternate, Maluku Utara",
];

async function main() {
  const args = process.argv.slice(2);
  const isCleanOnly = args.includes("--clean");

  if (isCleanOnly) {
    console.log("Membersihkan data fixture sintetis...");
    const deleted = await prisma.gempa.deleteMany({
      where: {
        bmkgKey: { startsWith: "SYNTH-DEV-" },
      },
    });
    console.log(`Berhasil menghapus ${deleted.count} data fixture sintetis.`);
    return;
  }

  const existingCount = await prisma.gempa.count({
    where: {
      bmkgKey: { startsWith: "SYNTH-DEV-" },
    },
  });

  if (existingCount >= 10000) {
    console.log(`Data fixture sintetis sudah ada (${existingCount} baris). Tidak perlu seed ulang.`);
    return;
  }

  const targetCount = 10000 - existingCount;
  console.log(`Memulai seeding ${targetCount} baris gempa sintetis untuk NFR-DB-01...`);

  const batchSize = 1000;
  const batches = Math.ceil(targetCount / batchSize);
  const baseTime = Date.now();

  for (let b = 0; b < batches; b++) {
    const currentBatchCount = Math.min(batchSize, targetCount - b * batchSize);
    const records = [];

    for (let i = 0; i < currentBatchCount; i++) {
      const idx = existingCount + b * batchSize + i;
      // Rentang waktu gempa acak dalam 365 hari terakhir
      const randomOffsetDays = Math.floor(Math.random() * 365);
      const randomOffsetMs = Math.floor(Math.random() * 86400000);
      const waktuUtc = new Date(baseTime - randomOffsetDays * 86400000 - randomOffsetMs);

      // Koordinat Indonesia: Lat -11 s/d 6, Lon 95 s/d 141
      const lat = parseFloat((-11 + Math.random() * 17).toFixed(4));
      const lon = parseFloat((95 + Math.random() * 46).toFixed(4));
      const magnitudo = parseFloat((2.5 + Math.random() * 5.5).toFixed(1)); // 2.5 - 8.0
      const kedalamanKm = Math.floor(5 + Math.random() * 300); // 5 - 305 km
      const wilayahTemplate = DAFTAR_WILAYAH[idx % DAFTAR_WILAYAH.length];
      const wilayah = `${wilayahTemplate} [SYNTH-DEV #${idx}]`;

      const statusTsunami: StatusTsunami =
        magnitudo >= 7.0 && kedalamanKm <= 50 ? StatusTsunami.BERPOTENSI : StatusTsunami.AMAN;
      const potensiTeks =
        statusTsunami === StatusTsunami.BERPOTENSI
          ? "Berpotensi tsunami [DATA SINTETIS FIXTURE DEV]"
          : "Tidak berpotensi tsunami [DATA SINTETIS FIXTURE DEV]";

      records.push({
        bmkgKey: `SYNTH-DEV-${idx.toString().padStart(6, "0")}`,
        waktuUtc,
        lat,
        lon,
        magnitudo,
        kedalamanKm,
        wilayah,
        potensiTeks,
        statusTsunami,
        isAuto: idx % 10 === 0,
        isTerkini: magnitudo >= 5.0,
        isDirasakan: magnitudo >= 3.5,
      });
    }

    await prisma.gempa.createMany({
      data: records,
      skipDuplicates: true,
    });

    console.log(`Progress: Batch ${b + 1}/${batches} selesai (${(b + 1) * currentBatchCount} baris tersimpan).`);
  }

  const finalCount = await prisma.gempa.count();
  console.log(`Selesai! Total baris tabel gempa sekarang: ${finalCount} baris.`);
}

main()
  .catch((e) => {
    console.error("Error menjalankan fixture:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

