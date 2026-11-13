import { syncAllBmkg } from "../lib/bmkg/client";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Starting initial BMKG sync test...");
  const results = await syncAllBmkg();
  console.log("Sync results:", JSON.stringify(results, null, 2));

  const totalGempa = await prisma.gempa.count();
  const logs = await prisma.syncLog.findMany({ take: 5, orderBy: { createdAt: "desc" } });
  console.log(`Total gempa in DB: ${totalGempa}`);
  console.log("Recent SyncLogs:", JSON.stringify(logs, null, 2));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

