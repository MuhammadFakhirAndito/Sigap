import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runBenchmark() {
  console.log("=== PENGUJIAN NFR-DB-01 (KUERI RIWAYAT PADA 10.000 BARIS) ===");

  // 1. EXPLAIN ANALYZE kueri pencarian wilayah (pg_trgm)
  console.log("\n1. Menjalankan EXPLAIN ANALYZE pencarian wilayah (GIN pg_trgm):");
  const explainResult: any = await prisma.$queryRawUnsafe(`
    EXPLAIN ANALYZE
    SELECT id, "bmkgKey", "waktuUtc", lat, lon, magnitudo, "kedalamanKm", wilayah, "potensiTeks", "statusTsunami"
    FROM gempa
    WHERE wilayah ILIKE '%Sukabumi%'
    ORDER BY "waktuUtc" DESC
    LIMIT 15 OFFSET 0;
  `);

  console.log("Output EXPLAIN ANALYZE:");
  explainResult.forEach((row: any) => {
    console.log(row["QUERY PLAN"]);
  });

  // 2. Pengukuran Waktu Nyata Prisma Query (Filter Wilayah + Magnitudo + Paginasi)
  console.log("\n2. Mengukur durasi kueri Prisma (15 baris, wilayah 'Padang', mag >= 4.0):");
  const iterations = 5;
  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    const [count, rows] = await Promise.all([
      prisma.gempa.count({
        where: {
          wilayah: { contains: "Padang", mode: "insensitive" },
          magnitudo: { gte: 4.0 },
        },
      }),
      prisma.gempa.findMany({
        where: {
          wilayah: { contains: "Padang", mode: "insensitive" },
          magnitudo: { gte: 4.0 },
        },
        orderBy: { waktuUtc: "desc" },
        take: 15,
        skip: 0,
      }),
    ]);
    const duration = performance.now() - start;
    times.push(duration);
    console.log(`- Run ${i + 1}: ${duration.toFixed(2)} ms (ditemukan: ${count} total, ${rows.length} baris halaman 1)`);
  }

  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  console.log(`\n=> Rata-rata durasi kueri: ${avg.toFixed(2)} ms (Target NFR-DB-01: < 300 ms). STATUS: ${avg < 300 ? "PASS (LULUS)" : "FAIL"}`);
}

runBenchmark()
  .catch((e) => {
    console.error("Benchmark error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

