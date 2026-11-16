/**
 * Pembersih data uji/fixture dev sebelum promosi atau pembuatan dump demo bersih.
 * Menghapus:
 *  - Gempa sintetis benchmark NFR-DB-01 (bmkgKey berawalan "SYNTH-DEV-")
 *  - Catatan ChatLog uji berlabel dev/test (ipHash berawalan "test-" atau pertanyaan "[DEV-TEST]")
 *  - Catatan KuotaHarian model uji ("test-*")
 * Opsional `--reset-chat`: hapus seluruh ChatLog & KuotaHarian uji lokal saat menyiapkan DB demo baru.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const resetAllChat = args.includes("--reset-chat");

  const deletedSynth = await prisma.gempa.deleteMany({
    where: { bmkgKey: { startsWith: "SYNTH-DEV-" } },
  });

  const deletedTestQuota = await prisma.kuotaHarian.deleteMany({
    where: {
      model: { startsWith: "test-" },
    },
  });

  const deletedChat = await prisma.chatLog.deleteMany({
    where: resetAllChat
      ? {}
      : {
          OR: [
            { ipHash: { startsWith: "test-" } },
            { pertanyaan: { startsWith: "[DEV-TEST]" } },
            { model: { startsWith: "test-" } },
          ],
        },
  });

  console.log("[CLEAN-DEV-FIXTURES] Selesai:");
  console.log(`- Gempa sintetis (SYNTH-DEV-*) dihapus: ${deletedSynth.count}`);
  console.log(`- KuotaHarian uji (test-*) dihapus    : ${deletedTestQuota.count}`);
  console.log(
    `- ChatLog ${resetAllChat ? "(seluruh chat lokal)" : "(berlabel uji)"} dihapus : ${deletedChat.count}`
  );
}

main()
  .catch((err) => {
    console.error("[CLEAN-DEV-FIXTURES] Gagal:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
