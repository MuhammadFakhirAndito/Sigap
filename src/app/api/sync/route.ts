import { syncAllBmkg, syncSource } from "@/lib/bmkg/client";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const syncSecret = process.env.SYNC_SECRET;
  const authHeader = req.headers.get("x-sync-secret") || req.headers.get("authorization");

  const providedSecret = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : authHeader;

  if (!syncSecret || providedSecret !== syncSecret) {
    return NextResponse.json(
      { error: "Unauthorized: Header x-sync-secret tidak valid atau tidak disertakan" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(req.url);
  const source = searchParams.get("source") as "autogempa" | "terkini" | "dirasakan" | null;

  try {
    if (source && ["autogempa", "terkini", "dirasakan"].includes(source)) {
      const result = await syncSource(source);
      return NextResponse.json({ success: true, result });
    }

    const results = await syncAllBmkg();
    return NextResponse.json({ success: true, results });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Sync error";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
