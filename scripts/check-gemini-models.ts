import fs from "fs";
import path from "path";

interface GeminiModelItem {
  name: string;
  supportedGenerationMethods?: string[];
}

interface ListModelsResponse {
  models?: GeminiModelItem[];
  nextPageToken?: string;
}

function loadEnvKey(keyName: string): string | undefined {
  if (process.env[keyName]?.trim()) {
    return process.env[keyName]?.trim();
  }

  const envFiles = [".env.local", ".env"];
  for (const fileName of envFiles) {
    const fullPath = path.resolve(process.cwd(), fileName);
    if (!fs.existsSync(fullPath)) continue;

    const content = fs.readFileSync(fullPath, "utf-8");
    for (const rawLine of content.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const eqIdx = line.indexOf("=");
      if (eqIdx === -1) continue;
      const k = line.slice(0, eqIdx).trim();
      if (k !== keyName) continue;
      let v = line.slice(eqIdx + 1).trim();
      if (
        (v.startsWith('"') && v.endsWith('"')) ||
        (v.startsWith("'") && v.endsWith("'"))
      ) {
        v = v.slice(1, -1).trim();
      }
      if (v) return v;
    }
  }
  return undefined;
}

async function main(): Promise<void> {
  const apiKey = loadEnvKey("GEMINI_API_KEY");
  if (!apiKey) {
    console.error(
      "ERROR: GEMINI_API_KEY belum ditemukan atau masih kosong di .env / environment."
    );
    process.exit(1);
  }

  const models: string[] = [];
  let pageToken: string | undefined = undefined;

  do {
    const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
    url.searchParams.set("pageSize", "100");
    if (pageToken) {
      url.searchParams.set("pageToken", pageToken);
    }

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "x-goog-api-key": apiKey,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      console.error(`ERROR: ListModels gagal dengan status HTTP ${res.status}`);
      process.exit(1);
    }

    const data = (await res.json()) as ListModelsResponse;
    for (const item of data.models ?? []) {
      if (item.supportedGenerationMethods?.includes("generateContent")) {
        models.push(item.name);
      }
    }

    pageToken = data.nextPageToken;
  } while (pageToken);

  for (const name of models) {
    console.log(name);
  }
}

main().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : "Unknown error";
  console.error(`ERROR: Gagal menghubungi endpoint ListModels (${msg})`);
  process.exit(1);
});

