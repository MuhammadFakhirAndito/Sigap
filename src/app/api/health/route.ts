import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const syncSecret = process.env.SYNC_SECRET;
  const authHeader = req.headers.get("x-sync-secret") || req.headers.get("authorization");
  const providedSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;
  const isAuthorized = Boolean(syncSecret && providedSecret === syncSecret);

  let isDbHealthy = false;
  let lastSync: { createdAt: Date; status: string; sumber: string } | null = null;
  let dbLatencyMs = 0;
  let dbError: string | null = null;

  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    isDbHealthy = true;

    if (isAuthorized) {
      const syncRecord = await prisma.syncLog.findFirst({
        where: { status: "OK" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true, status: true, sumber: true },
      });
      lastSync = syncRecord;
    }
  } catch (err: unknown) {
    isDbHealthy = false;
    dbError = err instanceof Error ? err.message : "Database connection failed";
  }

  const overallStatus = isDbHealthy ? "healthy" : "degraded";

  if (!isAuthorized) {
    return NextResponse.json({ status: overallStatus });
  }

  return NextResponse.json({
    status: overallStatus,
    timestamp: new Date().toISOString(),
    database: {
      connected: isDbHealthy,
      latencyMs: dbLatencyMs,
      error: dbError,
    },
    lastSuccessfulSync: lastSync,
  });
}
