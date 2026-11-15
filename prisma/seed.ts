import { PrismaClient, KategoriArtikel, TipeLokasi } from "@prisma/client";
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

  // 4. SEED SUMBER & SKENARIO SIMULASI (Preset Gempa Bersejarah dari USGS)
  const simScenarios: Array<{
    nama: string;
    magnitudo: number;
    kedalamanKm: number;
    lat: number;
    lon: number;
    tipeLokasi: TipeLokasi;
    deskripsiSingkat: string;
    urutan: number;
    sumber: {
      judul: string;
      penerbit: string;
      url: string;
      tanggalAkses: string;
    };
  }> = [
    {
      nama: "Aceh 2004 (M 9,1)",
      magnitudo: 9.1,
      kedalamanKm: 30,
      lat: 3.295,
      lon: 95.982,
      tipeLokasi: "LAUT",
      deskripsiSingkat:
        "Gempa megathrust Samudra Hindia (26 Des 2004, lepas pantai Aceh) pemicu tsunami besar. Parameter di luar rentang kalibrasi (M > 7,9, zona subduksi).",
      urutan: 1,
      sumber: {
        judul: "M 9.1 - 2004 Sumatra - Andaman Islands Earthquake (official20041226005853450_30)",
        penerbit: "USGS",
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/official20041226005853450_30/executive",
        tanggalAkses: "2026-11-15",
      },
    },
    {
      nama: "Nias 2005 (M 8,6)",
      magnitudo: 8.6,
      kedalamanKm: 30,
      lat: 2.085,
      lon: 97.108,
      tipeLokasi: "LAUT",
      deskripsiSingkat:
        "Gempa besar Sumatra Utara–Nias (28 Mar 2005, 78 km barat daya Singkil, laut). Parameter di luar rentang kalibrasi (M > 7,9, zona subduksi).",
      urutan: 2,
      sumber: {
        judul: "M 8.6 - 78 km WSW of Singkil, Indonesia (official20050328160936530_30)",
        penerbit: "USGS",
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/official20050328160936530_30/executive",
        tanggalAkses: "2026-11-15",
      },
    },
    {
      nama: "Yogyakarta 2006 (M 6,3)",
      magnitudo: 6.3,
      kedalamanKm: 12.5,
      lat: -7.961,
      lon: 110.446,
      tipeLokasi: "DARAT",
      deskripsiSingkat:
        "Gempa kerak dangkal di darat (27 Mei 2006 WIB / 26 Mei UTC, sekitar 10 km timur Pundong, Bantul).",
      urutan: 3,
      sumber: {
        judul: "M 6.3 - 10 km E of Pundong, Indonesia (usp000ej1c)",
        penerbit: "USGS",
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/usp000ej1c/executive",
        tanggalAkses: "2026-11-15",
      },
    },
    {
      nama: "Padang 2009 (M 7,6)",
      magnitudo: 7.6,
      kedalamanKm: 81,
      lat: -0.72,
      lon: 99.867,
      tipeLokasi: "LAUT",
      deskripsiSingkat:
        "Gempa menengah lepas pantai Pariaman, Sumatra Barat (30 Sep 2009). Kedalaman 81 km melebihi batas simulasi tsunami BNPB (≤ 70 km).",
      urutan: 4,
      sumber: {
        judul: "M 7.6 - 30 km WSW of Pariaman, Indonesia (usp000h237)",
        penerbit: "USGS",
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/usp000h237/executive",
        tanggalAkses: "2026-11-15",
      },
    },
    {
      nama: "Lombok 2018 (M 6,9)",
      magnitudo: 6.9,
      kedalamanKm: 34,
      lat: -8.2581,
      lon: 116.4375,
      tipeLokasi: "DARAT",
      deskripsiSingkat:
        "Gempa 5 Agu 2018 di darat utara Lombok, dekat garis pantai (~3,4 km dari pesisir). Simulasi tidak memodelkan longsor bawah laut atau jenis sesar sehingga hasil \"tidak memenuhi kriteria tsunami\" tidak boleh dianggap nihil risiko pesisir.",
      urutan: 5,
      sumber: {
        judul: "M 6.9 - 36 km NW of Labuan Lombok, Indonesia (us1000g3ub)",
        penerbit: "USGS",
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/us1000g3ub/executive",
        tanggalAkses: "2026-11-15",
      },
    },
    {
      nama: "Palu 2018 (M 7,5)",
      magnitudo: 7.5,
      kedalamanKm: 20,
      lat: -0.2559,
      lon: 119.8462,
      tipeLokasi: "DARAT",
      deskripsiSingkat:
        "Gempa 28 Sep 2018 dengan pusat di darat Donggala, dekat garis pantai (~5,6 km). Pada kejadian nyata terjadi tsunami besar akibat longsor bawah laut; simulasi tidak memodelkan longsor bawah laut atau jenis sesar sehingga hasil \"tidak memenuhi kriteria tsunami\" tidak menyesatkan.",
      urutan: 6,
      sumber: {
        judul: "M 7.5 - 72 km N of Palu, Indonesia (us1000h3p4)",
        penerbit: "USGS",
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/us1000h3p4/executive",
        tanggalAkses: "2026-11-15",
      },
    },
    {
      nama: "Cianjur 2022 (M 5,6)",
      magnitudo: 5.6,
      kedalamanKm: 10,
      lat: -6.836,
      lon: 106.9968,
      tipeLokasi: "DARAT",
      deskripsiSingkat:
        "Gempa kerak dangkal di darat Jawa Barat (21 Nov 2022, 11 km timur laut Sukabumi / kawasan Cianjur).",
      urutan: 7,
      sumber: {
        judul: "M 5.6 - 11 km NE of Sukabumi, Indonesia (us7000ir9t)",
        penerbit: "USGS",
        url: "https://earthquake.usgs.gov/earthquakes/eventpage/us7000ir9t/executive",
        tanggalAkses: "2026-11-15",
      },
    },
  ];

  let skenarioCount = 0;
  for (const item of simScenarios) {
    const sumberRecord = await prisma.sumber.upsert({
      where: { url: item.sumber.url },
      update: {
        judul: item.sumber.judul,
        penerbit: item.sumber.penerbit,
        tanggalAkses: new Date(item.sumber.tanggalAkses),
      },
      create: {
        judul: item.sumber.judul,
        penerbit: item.sumber.penerbit,
        url: item.sumber.url,
        tanggalAkses: new Date(item.sumber.tanggalAkses),
      },
    });
    uniqueSumberIds.add(sumberRecord.id);

    await prisma.skenarioSimulasi.upsert({
      where: { nama: item.nama },
      update: {
        magnitudo: item.magnitudo,
        kedalamanKm: item.kedalamanKm,
        lat: item.lat,
        lon: item.lon,
        tipeLokasi: item.tipeLokasi,
        deskripsiSingkat: item.deskripsiSingkat,
        urutan: item.urutan,
        sumberId: sumberRecord.id,
      },
      create: {
        nama: item.nama,
        magnitudo: item.magnitudo,
        kedalamanKm: item.kedalamanKm,
        lat: item.lat,
        lon: item.lon,
        tipeLokasi: item.tipeLokasi,
        deskripsiSingkat: item.deskripsiSingkat,
        urutan: item.urutan,
        sumberId: sumberRecord.id,
      },
    });
    skenarioCount++;
  }

  console.log(`[SEED SELESAI] Hasil sinkronisasi:`);
  console.log(`- Artikel diproses : ${artikelCount}`);
  console.log(`- Sumber unik      : ${uniqueSumberIds.size} (${sumberCount} relasi artikel)`);
  console.log(`- Berita diproses  : ${beritaCount}`);
  console.log(`- FAQ diproses     : ${faqCount}`);
  console.log(`- Skenario Simulasi: ${skenarioCount}`);
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
