import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import os from "os";
import { seedContent } from "../prisma/seed";

describe("Validasi Ketat Seed Konten", () => {
  it("harus menolak artikel yang tidak memiliki sumber rujukan", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "seed-test-no-sumber-"));
    const badArticle = `---
slug: test-tanpa-sumber
judul: "Artikel Uji Tanpa Sumber"
kategori: PENGERTIAN
status: PUBLISHED
sumber: []
---
Isi artikel uji.
`;
    fs.writeFileSync(path.join(tempDir, "test.md"), badArticle, "utf-8");

    await expect(seedContent(tempDir)).rejects.toThrow(/tidak memiliki Sumber/);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("harus menolak artikel yang statusnya bukan PUBLISHED", async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "seed-test-draft-"));
    const draftArticle = `---
slug: test-draft
judul: "Artikel Masih Draf"
kategori: PENGERTIAN
status: DRAFT
sumber:
  - penerbit: "BMKG"
    judul: "Sumber Uji"
    url: "https://bmkg.go.id/test"
    tanggalAkses: 2026-11-14
---
Isi artikel draf.
`;
    fs.writeFileSync(path.join(tempDir, "test.md"), draftArticle, "utf-8");

    await expect(seedContent(tempDir)).rejects.toThrow(/hanya artikel berstatus "PUBLISHED"/);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
