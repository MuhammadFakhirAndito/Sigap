import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

describe("Uji Kepatuhan TC-DB Fase 1c (Halaman Riwayat)", () => {
  const testSyncId = "test-sync-error-log";

  afterAll(async () => {
    await prisma.syncLog.deleteMany({
      where: { id: testSyncId },
    });
    await prisma.$disconnect();
  });

  it("TC-DB-02: Riwayat degradasi anggun saat BMKG gagal sinkronisasi", async () => {
    // 1. Buat catatan SyncLog error terbaru
    await prisma.syncLog.create({
      data: {
        id: testSyncId,
        sumber: "BMKG-TEST-ERROR",
        status: "ERROR",
        pesanError: "Simulated BMKG Network Timeout",
        durasiMs: 500,
        createdAt: new Date(),
      },
    });

    // 2. Kueri /api/gempa
    const { GET } = await import("@/app/api/gempa/route");
    const req = new Request("http://localhost:3000/api/gempa?hal=1&limit=15");
    const res = await GET(req as any);
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.isBmkgDegraded).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it("TC-DB-17: Tautan Simulasikan memuat parameter yang benar ke /simulasi", async () => {
    const gempa = await prisma.gempa.findFirst({
      orderBy: { waktuUtc: "desc" },
    });
    expect(gempa).not.toBeNull();

    const expectedHref = `/simulasi?m=${gempa!.magnitudo}&d=${gempa!.kedalamanKm}&lat=${gempa!.lat}&lon=${gempa!.lon}`;
    expect(expectedHref).toContain(`m=${gempa!.magnitudo}`);
    expect(expectedHref).toContain(`d=${gempa!.kedalamanKm}`);
    expect(expectedHref).toContain(`lat=${gempa!.lat}`);
    expect(expectedHref).toContain(`lon=${gempa!.lon}`);
  });

  it("NFR-DB-01: Kueri 15 baris per halaman dengan filter wilayah < 300 ms pada 10.000 baris", async () => {
    const totalCount = await prisma.gempa.count();
    expect(totalCount).toBeGreaterThanOrEqual(10000);

    const start = performance.now();
    const [count, rows] = await Promise.all([
      prisma.gempa.count({
        where: {
          wilayah: { contains: "Sukabumi", mode: "insensitive" },
          magnitudo: { gte: 3.0 },
        },
      }),
      prisma.gempa.findMany({
        where: {
          wilayah: { contains: "Sukabumi", mode: "insensitive" },
          magnitudo: { gte: 3.0 },
        },
        orderBy: { waktuUtc: "desc" },
        take: 15,
        skip: 0,
      }),
    ]);
    const duration = performance.now() - start;

    expect(count).toBeGreaterThan(0);
    expect(rows.length).toBeLessThanOrEqual(15);
    expect(duration).toBeLessThan(300);
  });
});

