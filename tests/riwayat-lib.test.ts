import { describe, it, expect } from "vitest";
import { fillDailySeries, paginationItems, wibDayKey, windowStartUtc } from "@/lib/riwayat";

describe("wibDayKey", () => {
  it("memakai tanggal WIB, bukan UTC", () => {
    // 17:30 UTC = 00:30 WIB hari berikutnya
    expect(wibDayKey(new Date("2026-11-13T17:30:00Z"))).toBe("2026-11-14");
  });
});

describe("windowStartUtc", () => {
  it("dimulai 00:00 WIB, 29 hari sebelum hari terakhir", () => {
    expect(windowStartUtc("2026-11-14", 30).toISOString()).toBe("2026-10-15T17:00:00.000Z");
  });
});

describe("fillDailySeries", () => {
  it("mengisi hari kosong dengan 0 dan berurutan", () => {
    const s = fillDailySeries([{ hari: "2026-11-14", jumlah: 3 }], "2026-11-14", 3);
    expect(s).toEqual([
      { hari: "2026-11-12", jumlah: 0 },
      { hari: "2026-11-13", jumlah: 0 },
      { hari: "2026-11-14", jumlah: 3 },
    ]);
  });
  it("memotong hari sebelum awal filter", () => {
    const s = fillDailySeries([], "2026-11-14", 30, "2026-11-13");
    expect(s.map((d) => d.hari)).toEqual(["2026-11-13", "2026-11-14"]);
  });
});

describe("paginationItems", () => {
  it("menampilkan semua bila sedikit", () => {
    expect(paginationItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
  });
  it("awal", () => {
    expect(paginationItems(1, 669)).toEqual([1, 2, 3, "gap", 669]);
  });
  it("tengah", () => {
    expect(paginationItems(50, 669)).toEqual([1, "gap", 49, 50, 51, "gap", 669]);
  });
  it("akhir", () => {
    expect(paginationItems(669, 669)).toEqual([1, "gap", 667, 668, 669]);
  });
});

