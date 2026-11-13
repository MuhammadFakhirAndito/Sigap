import { prisma } from "@/lib/prisma";
import {
  BmkgAutogempaResponse,
  BmkgMultiGempaResponse,
  NormalizedGempa,
} from "@/types/bmkg";
import { normalizeBmkgGempa } from "./parser";

const BMKG_BASE_URL = "https://data.bmkg.go.id/DataMKG/TEWS";

export async function fetchBmkgAutogempa(): Promise<NormalizedGempa | null> {
  try {
    const res = await fetch(`${BMKG_BASE_URL}/autogempa.json`, {
      next: { revalidate: 60 },
      headers: {
        Accept: "application/json",
        "User-Agent": "SIGAP-Gempa/1.0",
      },
    });

    if (!res.ok) {
      console.error(`BMKG autogempa fetch failed with status ${res.status}`);
      return null;
    }

    const data: BmkgAutogempaResponse = await res.json();
    if (!data?.Infogempa?.gempa) {
      return null;
    }

    return normalizeBmkgGempa(data.Infogempa.gempa);
  } catch (err) {
    console.error("Error fetching BMKG autogempa:", err);
    return null;
  }
}

export async function fetchBmkgTerkini(): Promise<NormalizedGempa[]> {
  try {
    const res = await fetch(`${BMKG_BASE_URL}/gempaterkini.json`, {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
        "User-Agent": "SIGAP-Gempa/1.0",
      },
    });

    if (!res.ok) return [];

    const data: BmkgMultiGempaResponse = await res.json();
    const list = data?.Infogempa?.gempa || [];
    return list.map(normalizeBmkgGempa);
  } catch (err) {
    console.error("Error fetching BMKG gempa terkini:", err);
    return [];
  }
}

export async function fetchBmkgDirasakan(): Promise<NormalizedGempa[]> {
  try {
    const res = await fetch(`${BMKG_BASE_URL}/gempadirasakan.json`, {
      next: { revalidate: 300 },
      headers: {
        Accept: "application/json",
        "User-Agent": "SIGAP-Gempa/1.0",
      },
    });

    if (!res.ok) return [];

    const data: BmkgMultiGempaResponse = await res.json();
    const list = data?.Infogempa?.gempa || [];
    return list.map(normalizeBmkgGempa);
  } catch (err) {
    console.error("Error fetching BMKG gempa dirasakan:", err);
    return [];
  }
}

interface SyncResult {
  sumber: string;
  status: "OK" | "GAGAL";
  jumlahBaru: number;
  jumlahDiperbarui: number;
  pesanError?: string;
  durasiMs: number;
}

export async function syncSource(
  source: "autogempa" | "terkini" | "dirasakan"
): Promise<SyncResult> {
  const startTime = Date.now();
  let items: NormalizedGempa[] = [];
  let isAuto = false;
  let isTerkini = false;
  let isDirasakan = false;

  try {
    if (source === "autogempa") {
      isAuto = true;
      const single = await fetchBmkgAutogempa();
      if (single) items = [single];
    } else if (source === "terkini") {
      isTerkini = true;
      items = await fetchBmkgTerkini();
    } else if (source === "dirasakan") {
      isDirasakan = true;
      items = await fetchBmkgDirasakan();
    }

    if (items.length === 0) {
      const durasiMs = Date.now() - startTime;
      await prisma.syncLog.create({
        data: {
          sumber: source,
          status: "GAGAL",
          jumlahBaru: 0,
          jumlahDiperbarui: 0,
          pesanError: "Tidak ada data yang diterima dari BMKG",
          durasiMs,
        },
      });
      return {
        sumber: source,
        status: "GAGAL",
        jumlahBaru: 0,
        jumlahDiperbarui: 0,
        pesanError: "Tidak ada data yang diterima dari BMKG",
        durasiMs,
      };
    }

    let jumlahBaru = 0;
    let jumlahDiperbarui = 0;

    for (const item of items) {
      const existing = await prisma.gempa.findUnique({
        where: { bmkgKey: item.bmkgKey },
      });

      if (!existing) {
        await prisma.gempa.create({
          data: {
            bmkgKey: item.bmkgKey,
            waktuUtc: item.waktuUtc,
            lat: item.lat,
            lon: item.lon,
            magnitudo: item.magnitudo,
            kedalamanKm: item.kedalamanKm,
            wilayah: item.wilayah,
            potensiTeks: item.potensiTeks,
            statusTsunami: item.statusTsunami,
            dirasakan: item.dirasakan,
            shakemapUrl: item.shakemapUrl,
            isAuto,
            isTerkini,
            isDirasakan,
          },
        });
        jumlahBaru++;
      } else {
        await prisma.gempa.update({
          where: { bmkgKey: item.bmkgKey },
          data: {
            lat: item.lat,
            lon: item.lon,
            magnitudo: item.magnitudo,
            kedalamanKm: item.kedalamanKm,
            wilayah: item.wilayah,
            potensiTeks: item.potensiTeks,
            statusTsunami: item.statusTsunami,
            dirasakan: item.dirasakan ?? existing.dirasakan,
            shakemapUrl: item.shakemapUrl ?? existing.shakemapUrl,
            // Flag hanya DINYALAKAN (OR logic)
            isAuto: isAuto ? true : existing.isAuto,
            isTerkini: isTerkini ? true : existing.isTerkini,
            isDirasakan: isDirasakan ? true : existing.isDirasakan,
          },
        });
        jumlahDiperbarui++;
      }
    }

    const durasiMs = Date.now() - startTime;
    await prisma.syncLog.create({
      data: {
        sumber: source,
        status: "OK",
        jumlahBaru,
        jumlahDiperbarui,
        durasiMs,
      },
    });

    return {
      sumber: source,
      status: "OK",
      jumlahBaru,
      jumlahDiperbarui,
      durasiMs,
    };
  } catch (error: unknown) {
    const durasiMs = Date.now() - startTime;
    const pesanError = error instanceof Error ? error.message : "Unknown error";
    try {
      await prisma.syncLog.create({
        data: {
          sumber: source,
          status: "GAGAL",
          jumlahBaru: 0,
          jumlahDiperbarui: 0,
          pesanError,
          durasiMs,
        },
      });
    } catch (logErr) {
      console.error("Gagal mencatat SyncLog ke DB:", logErr);
    }

    return {
      sumber: source,
      status: "GAGAL",
      jumlahBaru: 0,
      jumlahDiperbarui: 0,
      pesanError,
      durasiMs,
    };
  }
}

export async function syncAllBmkg(): Promise<SyncResult[]> {
  const r1 = await syncSource("autogempa");
  const r2 = await syncSource("terkini");
  const r3 = await syncSource("dirasakan");
  return [r1, r2, r3];
}
