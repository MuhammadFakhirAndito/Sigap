import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";

const prisma = new PrismaClient();

async function countAll() {
  const [artikel, sumber, berita, faq] = await Promise.all([
    prisma.artikel.count(),
    prisma.sumber.count(),
    prisma.berita.count(),
    prisma.faqGempa.count(),
  ]);
  return { artikel, sumber, berita, faq };
}

async function main() {
  console.log("=== PENGUJIAN TC-DB-10: IDEMPOTENSI SEED ===");
  const before = await countAll();
  console.log("Baris saat ini (sebelum seed ulang):", before);

  console.log("Menjalankan seed kedua...");
  execSync("npx prisma db seed", { stdio: "inherit" });

  const after = await countAll();
  console.log("Baris setelah seed kedua:", after);

  const isIdentical =
    before.artikel === after.artikel &&
    before.sumber === after.sumber &&
    before.berita === after.berita &&
    before.faq === after.faq;

  console.log("\nHASIL PENGUJIAN TC-DB-10:");
  console.log(`- Artikel bertambah : ${after.artikel - before.artikel}`);
  console.log(`- Sumber bertambah  : ${after.sumber - before.sumber}`);
  console.log(`- Berita bertambah  : ${after.berita - before.berita}`);
  console.log(`- FAQ bertambah     : ${after.faq - before.faq}`);
  console.log(`- Status Kelulusan  : ${isIdentical ? "LULUS (PASS)" : "GAGAL (FAIL)"}`);

  if (!isIdentical) {
    process.exit(1);
  }
}

main()
  .catch((err) => {
    console.error("Error TC-DB-10:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
