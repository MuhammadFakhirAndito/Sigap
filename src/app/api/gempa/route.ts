import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";

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
        // Akhir hari sampai pukul 23:59:59.999 UTC
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
    const [total, data, lastSync] = await Promise.all([
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
    ]);

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
      lastSyncTime: lastSync?.createdAt ?? null,
    });
  } catch (err: unknown) {
    console.error("Error reading gempa from DB:", err);
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
      },
      { status: 500 }
    );
  }
}
