import { PrismaClient, KategoriArtikel } from "@prisma/client";
import fs from "fs";
import path from "path";
import yaml from "yaml";

const prisma = new PrismaClient();

interface ArticleFrontmatter {
  slug: string;
  judul: string;
  kategori: KategoriArtikel;
  urutan?: number;
  ringkasan?: string;
  status: string;
  sumber: Array<{
    penerbit: string;
    judul: string;
    url: string;
    tanggalAkses: string | Date;
  }>;
}

interface BeritaYamlItem {
  judul: string;
  sumber: string;
  tanggalTerbit: string | Date;
  url: string;
  ringkasan?: string;
}

interface FaqYamlItem {
  kataKunci: string[];
  pertanyaan: string;
  jawaban: string;
  aktif?: boolean;
}

/**
 * Memisahkan YAML Frontmatter dan isi Markdown
 */
function parseFrontmatter(fileContent: string): { frontmatter: ArticleFrontmatter; body: string } {
  const match = fileContent.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) {
    throw new Error("Format markdown tidak memiliki frontmatter valid (---)");
  }
  const rawYaml = match[1];
  const body = match[2];
  const parsed = yaml.parse(rawYaml) as ArticleFrontmatter;
  return { frontmatter: parsed, body };
}

export async function seedContent(contentDir: string = path.resolve(process.cwd(), "content")) {
  console.log(`[SEED] Memulai proses seed dari direktori: ${contentDir}`);

  if (!fs.existsSync(contentDir)) {
    throw new Error(`Direktori konten tidak ditemukan: ${contentDir}`);
  }

  // 1. SEED ARTIKEL & SUMBER
  const files = fs.readdirSync(contentDir);
  const mdFiles = files.filter((f) => f.endsWith(".md") && f !== "README.md");

  console.log(`[SEED] Menemukan ${mdFiles.length} berkas artikel markdown.`);
  let artikelCount = 0;
  let sumberCount = 0;
  const uniqueSumberIds = new Set<string>();

  for (const file of mdFiles) {
    const fullPath = path.join(contentDir, file);
    const rawText = fs.readFileSync(fullPath, "utf-8");
    const { frontmatter, body } = parseFrontmatter(rawText);

    // Validasi 1: Tolak seed jika status bukan PUBLISHED
    if (frontmatter.status !== "PUBLISHED") {
      throw new Error(
        `[VALIDASI DITOLAK] Artikel "${file}" memiliki status "${frontmatter.status}". ` +
          `Sesuai aturan domain, hanya artikel berstatus "PUBLISHED" yang boleh di-seed.`
      );
    }

    // Validasi 2: Setiap artikel wajib punya minimal satu Sumber
    if (!frontmatter.sumber || !Array.isArray(frontmatter.sumber) || frontmatter.sumber.length === 0) {
      throw new Error(
        `[VALIDASI DITOLAK] Artikel "${file}" tidak memiliki Sumber rujukan. ` +
          `Sesuai aturan domain, setiap artikel wajib memiliki minimal satu Sumber.`
      );
    }

    // Upsert Sumber rujukan
    const sumberConnectList: { id: string }[] = [];
    for (const s of frontmatter.sumber) {
      if (!s.url || !s.judul || !s.penerbit) {
        throw new Error(`[VALIDASI DITOLAK] Metadata sumber pada "${file}" tidak lengkap.`);
      }
      const tglAkses = s.tanggalAkses ? new Date(s.tanggalAkses) : new Date();

      const sumberRecord = await prisma.sumber.upsert({
        where: { url: s.url },
        update: {
          judul: s.judul,
          penerbit: s.penerbit,
          tanggalAkses: tglAkses,
        },
        create: {
          judul: s.judul,
          penerbit: s.penerbit,
          url: s.url,
          tanggalAkses: tglAkses,
        },
      });
      sumberConnectList.push({ id: sumberRecord.id });
      uniqueSumberIds.add(sumberRecord.id);
      sumberCount++;
    }

    // Upsert Artikel
    await prisma.artikel.upsert({
      where: { slug: frontmatter.slug },
      update: {
        judul: frontmatter.judul,
        ringkasan: frontmatter.ringkasan || null,
        kategori: frontmatter.kategori,
        isi: body.trim(),
        urutan: frontmatter.urutan ?? 0,
        sumber: {
          set: sumberConnectList,
        },
      },
      create: {
        slug: frontmatter.slug,
        judul: frontmatter.judul,
        ringkasan: frontmatter.ringkasan || null,
        kategori: frontmatter.kategori,
        isi: body.trim(),
        urutan: frontmatter.urutan ?? 0,
        sumber: {
          connect: sumberConnectList,
        },
      },
    });
    artikelCount++;
  }

  // 2. SEED BERITA (Metadata only)
  const beritaPath = path.join(contentDir, "berita.yml");
  let beritaCount = 0;
  if (fs.existsSync(beritaPath)) {
    const rawBerita = fs.readFileSync(beritaPath, "utf-8");
    const beritaItems = yaml.parse(rawBerita) as BeritaYamlItem[];

    for (const b of beritaItems) {
      if (!b.url || !b.judul || !b.sumber) continue;
      await prisma.berita.upsert({
        where: { url: b.url },
        update: {
          judul: b.judul,
          sumber: b.sumber,
          tanggalTerbit: b.tanggalTerbit ? new Date(b.tanggalTerbit) : new Date(),
          ringkasan: b.ringkasan || null,
        },
        create: {
          judul: b.judul,
          sumber: b.sumber,
          url: b.url,
          tanggalTerbit: b.tanggalTerbit ? new Date(b.tanggalTerbit) : new Date(),
          ringkasan: b.ringkasan || null,
        },
      });
      beritaCount++;
    }
  }

  // 3. SEED FAQ
  const faqPath = path.join(contentDir, "faq.yml");
  let faqCount = 0;
  if (fs.existsSync(faqPath)) {
    const rawFaq = fs.readFileSync(faqPath, "utf-8");
    const faqItems = yaml.parse(rawFaq) as FaqYamlItem[];

    for (const f of faqItems) {
      if (!f.pertanyaan || !f.jawaban) continue;
      await prisma.faqGempa.upsert({
        where: { pertanyaan: f.pertanyaan },
        update: {
          kataKunci: f.kataKunci || [],
          jawaban: f.jawaban,
          aktif: f.aktif ?? true,
        },
        create: {
          pertanyaan: f.pertanyaan,
          kataKunci: f.kataKunci || [],
          jawaban: f.jawaban,
          aktif: f.aktif ?? true,
        },
      });
      faqCount++;
    }
  }

  console.log(`[SEED SELESAI] Hasil sinkronisasi:`);
  console.log(`- Artikel diproses : ${artikelCount}`);
  console.log(`- Sumber unik      : ${uniqueSumberIds.size} (${sumberCount} relasi artikel)`);
  console.log(`- Berita diproses  : ${beritaCount}`);
  console.log(`- FAQ diproses     : ${faqCount}`);
}

async function main() {
  try {
    await seedContent();
  } catch (error) {
    console.error("[SEED ERROR]", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module || process.argv[1]?.endsWith("seed.ts")) {
  main();
}
