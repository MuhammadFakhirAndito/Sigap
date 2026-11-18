import { prisma } from "@/lib/prisma";
import { fetchBmkgAutogempa } from "@/lib/bmkg/client";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

function mapNormalizedToApiRow(q: NonNullable<Awaited<ReturnType<typeof fetchBmkgAutogempa>>>) {
  return {
    id: q.bmkgKey,
    bmkgKey: q.bmkgKey,
    waktuUtc: q.waktuUtc,
    lat: q.lat,
    lon: q.lon,
    magnitudo: q.magnitudo,
    kedalamanKm: q.kedalamanKm,
    wilayah: q.wilayah,
    potensiTeks: q.potensiTeks,
    statusTsunami: q.statusTsunami,
    dirasakan: q.dirasakan ?? null,
    shakemapUrl: q.shakemapUrl ?? null,
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const mag = searchParams.get("mag");
  const dari = searchParams.get("dari");
  const sampai = searchParams.get("sampai");
  const wilayah = searchParams.get("wilayah");
  const hal = Math.max(1, parseInt(searchParams.get("hal") || "1", 10));
  const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "15", 10)));
  const tipe = searchParams.get("tipe");

  const where: Prisma.GempaWhereInput = {};

  if (mag) {
    const minMag = parseFloat(mag);
    if (!isNaN(minMag)) {
      where.magnitudo = { gte: minMag };
    }
  }

  if (dari || sampai) {
    where.waktuUtc = {};
    if (dari) {
      const startDate = new Date(dari);
      if (!isNaN(startDate.getTime())) {
        where.waktuUtc.gte = startDate;
      }
    }
    if (sampai) {
      const endDate = new Date(sampai);
      if (!isNaN(endDate.getTime())) {
        endDate.setUTCHours(23, 59, 59, 999);
        where.waktuUtc.lte = endDate;
      }
    }
  }

  if (wilayah && wilayah.trim().length > 0) {
    where.wilayah = {
      contains: wilayah.trim(),
      mode: "insensitive",
    };
  }

  if (tipe === "dirasakan") {
    where.isDirasakan = true;
  } else if (tipe === "terkini") {
    where.isTerkini = true;
  } else if (tipe === "auto") {
    where.isAuto = true;
  }

  try {
    const [total, data, lastOkSync, latestSync] = await Promise.all([
      prisma.gempa.count({ where }),
      prisma.gempa.findMany({
        where,
        orderBy: { waktuUtc: "desc" },
        skip: (hal - 1) * limit,
        take: limit,
      }),
      prisma.syncLog.findFirst({
        where: { status: "OK" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.syncLog.findFirst({
        orderBy: { createdAt: "desc" },
        select: { status: true, createdAt: true },
      }),
    ]);

    const hasFilters = Boolean(mag || dari || sampai || (wilayah && wilayah.trim().length > 0) || tipe);
    if (data.length === 0 && hal === 1 && !hasFilters) {
      const auto = await fetchBmkgAutogempa();
      if (auto) {
        return NextResponse.json({
          success: true,
          data: [mapNormalizedToApiRow(auto)],
          pagination: {
            total: 1,
            hal: 1,
            totalHalaman: 1,
            limit,
          },
          lastSyncTime: auto.waktuUtc,
          isBmkgDegraded: latestSync?.status === "ERROR",
        });
      }
    }

    const totalHalaman = Math.ceil(total / limit) || 1;

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        total,
        hal,
        totalHalaman,
        limit,
      },
      lastSyncTime: lastOkSync?.createdAt ?? null,
      isBmkgDegraded: latestSync?.status === "ERROR",
    });
  } catch (err: unknown) {
    console.error("Error reading gempa from DB:", err);
    const hasFilters = Boolean(mag || dari || sampai || (wilayah && wilayah.trim().length > 0) || tipe);
    if (hal === 1 && !hasFilters) {
      const auto = await fetchBmkgAutogempa();
      if (auto) {
        return NextResponse.json({
          success: true,
          degraded: true,
          data: [mapNormalizedToApiRow(auto)],
          pagination: {
            total: 1,
            hal: 1,
            totalHalaman: 1,
            limit,
          },
          lastSyncTime: auto.waktuUtc,
          isBmkgDegraded: false,
        });
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: "Database tidak terjangkau",
        degraded: true,
        data: [],
        pagination: {
          total: 0,
          hal,
          totalHalaman: 0,
          limit,
        },
        lastSyncTime: null,
        isBmkgDegraded: true,
      },
      { status: 500 }
    );
  }
}
