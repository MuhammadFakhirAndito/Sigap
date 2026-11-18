import { unstable_cache } from "next/cache";
import Parser from "rss-parser";
import { prisma } from "@/lib/prisma";
import { getUrlHostname } from "@/lib/edukasi";

export interface DynamicBeritaItem {
  id: string;
  judul: string;
  sumber: string;
  domain: string;
  url: string;
  tanggalTerbit: Date;
  ringkasan: string | null;
  thumbnailUrl: string | null;
}

interface SerializedBeritaItem extends Omit<DynamicBeritaItem, "tanggalTerbit"> {
  tanggalTerbit: string;
}

interface GoogleNewsSourceField {
  _?: string;
  $?: { url?: string };
}

interface GoogleNewsRssItem {
  title?: string;
  link?: string;
  guid?: string;
  pubDate?: string;
  isoDate?: string;
  contentSnippet?: string;
  content?: string;
  source?: string | GoogleNewsSourceField;
}

interface PublisherMatch {
  matchers: string[];
  label: string;
  defaultDomain: string;
}

export const GOOGLE_NEWS_RSS_URL =
  "https://news.google.com/rss/search?q=gempa+megathrust+OR+BMKG&hl=id&gl=ID&ceid=ID:id";

export const NEWS_REVALIDATE_SECONDS = 1800; // 30 menit
const MAX_NEWS_ITEMS = 6;
const RSS_FETCH_TIMEOUT_MS = 8000;
const ARTICLE_FETCH_TIMEOUT_MS = 3500;
const KEYWORDS = ["gempa", "megathrust", "bmkg", "tsunami", "mitigasi"] as const;

const TRUSTED_PUBLISHERS: PublisherMatch[] = [
  { matchers: ["cnn indonesia", "cnnindonesia.com"], label: "CNN Indonesia", defaultDomain: "cnnindonesia.com" },
  { matchers: ["cnbc indonesia", "cnbcindonesia.com"], label: "CNBC Indonesia", defaultDomain: "cnbcindonesia.com" },
  { matchers: ["kompas", "kompas.com", "kompas.id", "kompas.tv"], label: "Kompas.com", defaultDomain: "kompas.com" },
  { matchers: ["detik", "detik.com", "detikcom"], label: "detikcom", defaultDomain: "detik.com" },
  { matchers: ["bisnis.com", "bisnis indonesia", "bisnis"], label: "Bisnis.com", defaultDomain: "bisnis.com" },
  { matchers: ["antara", "antaranews.com"], label: "ANTARA News", defaultDomain: "antaranews.com" },
  { matchers: ["tempo", "tempo.co"], label: "Tempo.co", defaultDomain: "tempo.co" },
  { matchers: ["bmkg", "bmkg.go.id"], label: "BMKG", defaultDomain: "bmkg.go.id" },
];

const FETCH_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
};

const parser = new Parser<Record<string, unknown>, GoogleNewsRssItem>({
  customFields: {
    item: [["source", "source"]],
  },
});

let lastGoodNews: DynamicBeritaItem[] = [];

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/&#(\d+);/g, (_, dec: string) => {
      const code = Number(dec);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    })
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => {
      const code = parseInt(hex, 16);
      return Number.isFinite(code) ? String.fromCodePoint(code) : _;
    });
}

function stripTagsAndNormalize(raw: string): string {
  return decodeHtmlEntities(raw.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeTitleKey(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTitleAndSource(
  rawTitle: string,
  rawSourceField: GoogleNewsRssItem["source"]
): { judul: string; rawPublisher: string; sourceUrl: string } {
  let rawPublisher = "";
  let sourceUrl = "";

  if (typeof rawSourceField === "string") {
    rawPublisher = rawSourceField.trim();
  } else if (rawSourceField && typeof rawSourceField === "object") {
    rawPublisher = (rawSourceField._ || "").trim();
    sourceUrl = (rawSourceField.$?.url || "").trim();
  }

  let judul = stripTagsAndNormalize(rawTitle);
  const trailingMatch = judul.match(/^(.*?)\s+-\s+([^-]{2,60})$/);
  if (trailingMatch) {
    const [, head, tail] = trailingMatch;
    if (
      !rawPublisher ||
      tail.trim().toLowerCase() === rawPublisher.toLowerCase() ||
      rawPublisher.toLowerCase().includes(tail.trim().toLowerCase()) ||
      tail.trim().toLowerCase().includes(rawPublisher.toLowerCase())
    ) {
      judul = head.trim();
      if (!rawPublisher) rawPublisher = tail.trim();
    }
  }

  return { judul, rawPublisher, sourceUrl };
}

function matchTrustedPublisher(
  rawPublisher: string,
  sourceUrl: string
): { label: string; domain: string } | null {
  const pubLower = rawPublisher.toLowerCase();
  const hostLower = getUrlHostname(sourceUrl).toLowerCase();

  for (const spec of TRUSTED_PUBLISHERS) {
    const matchesHost = hostLower && spec.matchers.some((m) => hostLower.includes(m));
    const matchesPub = pubLower && spec.matchers.some((m) => pubLower.includes(m));
    if (matchesHost || matchesPub) {
      return {
        label: spec.label,
        domain: hostLower || spec.defaultDomain,
      };
    }
  }
  return null;
}

function hasRelevantKeyword(judul: string, snippet: string): boolean {
  const haystack = `${judul} ${snippet}`.toLowerCase();
  return KEYWORDS.some((kw) => haystack.includes(kw));
}

function isUsefulDescription(candidate: string, judul: string, publisher: string): boolean {
  if (!candidate || candidate.length < 25) return false;
  const candNorm = normalizeTitleKey(candidate);
  const titleNorm = normalizeTitleKey(judul);
  const titleWithPub = normalizeTitleKey(`${judul} ${publisher}`);
  if (!candNorm || candNorm === titleNorm || candNorm === titleWithPub) {
    return false;
  }
  if (candNorm.startsWith(titleNorm) && candNorm.length - titleNorm.length <= publisher.length + 5) {
    return false;
  }
  return true;
}

function extractMetaContent(html: string, keys: string[]): string | null {
  const metaTagRegex = /<meta\s+[^>]*>/gi;
  let match: RegExpExecArray | null;
  while ((match = metaTagRegex.exec(html)) !== null) {
    const tag = match[0];
    const attrMatch = tag.match(/(?:property|name)=["']([^"']+)["']/i);
    if (!attrMatch) continue;
    const key = attrMatch[1].trim().toLowerCase();
    if (!keys.includes(key)) continue;

    const contentMatch = tag.match(/content=["']([^"']*)["']/i);
    if (contentMatch && contentMatch[1].trim()) {
      return decodeHtmlEntities(contentMatch[1].trim());
    }
  }
  return null;
}

function isValidExternalImage(url: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("googleusercontent.com") ||
    lower.includes("gstatic.com") ||
    lower.includes("google.com/logos") ||
    lower.includes("news.google.com")
  ) {
    return null;
  }
  return trimmed;
}

function decodeBase64ArticleUrl(articleUrl: string): string | null {
  try {
    const parsed = new URL(articleUrl);
    if (!parsed.hostname.includes("news.google.com")) return articleUrl;
    const parts = parsed.pathname.split("/").filter(Boolean);
    const tokenIdx = parts.findIndex((p) => p === "articles" || p === "read");
    if (tokenIdx === -1 || !parts[tokenIdx + 1]) return null;

    const token = parts[tokenIdx + 1].replace(/-/g, "+").replace(/_/g, "/");
    const decoded = Buffer.from(token, "base64").toString("latin1");
    const httpIdx = decoded.indexOf("https://");
    const altIdx = httpIdx === -1 ? decoded.indexOf("http://") : httpIdx;
    if (altIdx === -1) return null;

    const slice = decoded.slice(altIdx);
    const urlMatch = slice.match(/^(https?:\/\/[^\s"'<>\x00-\x1f\x7f-\xff]+)/);
    return urlMatch ? urlMatch[1] : null;
  } catch {
    return null;
  }
}

async function resolveGoogleNewsArticleUrl(rawUrl: string): Promise<string> {
  if (!rawUrl.includes("news.google.com")) return rawUrl;

  const directDecoded = decodeBase64ArticleUrl(rawUrl);
  if (directDecoded && !directDecoded.includes("news.google.com")) {
    return directDecoded;
  }

  try {
    const parsed = new URL(rawUrl);
    const parts = parsed.pathname.split("/").filter(Boolean);
    const tokenIdx = parts.findIndex((p) => p === "articles" || p === "read");
    const articleId = tokenIdx !== -1 ? parts[tokenIdx + 1] : null;
    if (!articleId) return rawUrl;

    const pageRes = await fetch(`https://news.google.com/articles/${articleId}?hl=id&gl=ID&ceid=ID:id`, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(2500),
    });

    if (pageRes.url && !pageRes.url.includes("news.google.com")) {
      return pageRes.url;
    }

    const html = await pageRes.text();
    const sgMatch = html.match(/data-n-a-sg=["']([^"']+)["']/);
    const tsMatch = html.match(/data-n-a-ts=["']([^"']+)["']/);
    if (!sgMatch || !tsMatch) return rawUrl;

    const payload = [
      "garturlreq",
      [
        ["X", "X", ["X", "X"], null, null, 1, 1, "ID:id", null, 1, null, null, null, null, null, 0, 1],
        "X",
        "X",
        1,
        [1, 1, 1],
        1,
        1,
        null,
        0,
        0,
        null,
        0,
      ],
      articleId,
      Number(tsMatch[1]),
      sgMatch[1],
    ];
    const fReq = JSON.stringify([[["Fbv4je", JSON.stringify(payload), null, "generic"]]]);

    const batchRes = await fetch("https://news.google.com/_/DotsSplashUi/data/batchexecute", {
      method: "POST",
      headers: {
        ...FETCH_HEADERS,
        "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      },
      body: new URLSearchParams({ "f.req": fReq }),
      signal: AbortSignal.timeout(2500),
    });

    const batchText = await batchRes.text();
    const resMatch = batchText.match(/garturlres\\",\\"(https?:[^\\"]+)\\"/);
    if (resMatch) {
      return resMatch[1].replace(/\\u003d/gi, "=").replace(/\\u0026/gi, "&");
    }
  } catch {
    // Biarkan fallback menggunakan tautan Google News asli.
  }

  return rawUrl;
}

async function fetchArticleMetadata(articleUrl: string): Promise<{
  resolvedUrl: string;
  ogImage: string | null;
  ogDescription: string | null;
}> {
  const resolvedUrl = await resolveGoogleNewsArticleUrl(articleUrl);
  if (resolvedUrl.includes("news.google.com")) {
    return { resolvedUrl, ogImage: null, ogDescription: null };
  }

  try {
    const res = await fetch(resolvedUrl, {
      headers: FETCH_HEADERS,
      redirect: "follow",
      signal: AbortSignal.timeout(ARTICLE_FETCH_TIMEOUT_MS),
    });
    if (!res.ok) {
      return { resolvedUrl: res.url || resolvedUrl, ogImage: null, ogDescription: null };
    }

    const html = await res.text();
    const headEnd = html.toLowerCase().indexOf("</head>");
    const headHtml = headEnd !== -1 ? html.slice(0, headEnd + 7) : html.slice(0, 65536);

    const rawImage = extractMetaContent(headHtml, ["og:image", "twitter:image", "twitter:image:src"]);
    const rawDesc = extractMetaContent(headHtml, ["og:description", "twitter:description", "description"]);

    return {
      resolvedUrl: res.url && !res.url.includes("news.google.com") ? res.url : resolvedUrl,
      ogImage: isValidExternalImage(rawImage),
      ogDescription: rawDesc ? stripTagsAndNormalize(rawDesc) : null,
    };
  } catch {
    return { resolvedUrl, ogImage: null, ogDescription: null };
  }
}

async function fetchFromGoogleNewsRss(): Promise<SerializedBeritaItem[]> {
  const res = await fetch(GOOGLE_NEWS_RSS_URL, {
    headers: FETCH_HEADERS,
    signal: AbortSignal.timeout(RSS_FETCH_TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Google News RSS HTTP ${res.status}`);
  }

  const xml = await res.text();
  const feed = await parser.parseString(xml);
  const seenTitles = new Set<string>();

  interface Candidate {
    id: string;
    judul: string;
    sumber: string;
    domain: string;
    rawUrl: string;
    tanggalTerbit: Date;
    snippet: string;
  }

  const candidates: Candidate[] = [];

  for (const item of feed.items ?? []) {
    if (!item.title || !item.link) continue;
    const { judul, rawPublisher, sourceUrl } = parseTitleAndSource(item.title, item.source);
    if (!judul) continue;

    const matchedPublisher = matchTrustedPublisher(rawPublisher, sourceUrl);
    if (!matchedPublisher) continue;

    const snippet = stripTagsAndNormalize(item.contentSnippet || item.content || "");
    if (!hasRelevantKeyword(judul, snippet)) continue;

    const titleKey = normalizeTitleKey(judul);
    if (!titleKey || seenTitles.has(titleKey)) continue;
    seenTitles.add(titleKey);

    const parsedDate = item.isoDate
      ? new Date(item.isoDate)
      : item.pubDate
        ? new Date(item.pubDate)
        : new Date();
    const tanggalTerbit = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

    candidates.push({
      id: item.guid || item.link,
      judul,
      sumber: matchedPublisher.label,
      domain: matchedPublisher.domain,
      rawUrl: item.link,
      tanggalTerbit,
      snippet,
    });
  }

  candidates.sort((a, b) => b.tanggalTerbit.getTime() - a.tanggalTerbit.getTime());
  const topSix = candidates.slice(0, MAX_NEWS_ITEMS);

  const enriched = await Promise.allSettled(
    topSix.map(async (item): Promise<SerializedBeritaItem> => {
      const meta = await fetchArticleMetadata(item.rawUrl);
      const finalUrl = meta.resolvedUrl || item.rawUrl;
      const resolvedHost = getUrlHostname(finalUrl);
      const finalDomain =
        resolvedHost && !resolvedHost.includes("news.google.com") ? resolvedHost : item.domain;

      let ringkasan: string | null = null;
      if (meta.ogDescription && isUsefulDescription(meta.ogDescription, item.judul, item.sumber)) {
        ringkasan = meta.ogDescription;
      } else if (isUsefulDescription(item.snippet, item.judul, item.sumber)) {
        ringkasan = item.snippet;
      }

      return {
        id: item.id,
        judul: item.judul,
        sumber: item.sumber,
        domain: finalDomain,
        url: finalUrl,
        tanggalTerbit: item.tanggalTerbit.toISOString(),
        ringkasan,
        thumbnailUrl: meta.ogImage,
      };
    })
  );

  return enriched
    .filter((r): r is PromiseFulfilledResult<SerializedBeritaItem> => r.status === "fulfilled")
    .map((r) => r.value);
}

const getCachedGoogleNews = unstable_cache(
  async (): Promise<SerializedBeritaItem[]> => {
    return await fetchFromGoogleNewsRss();
  },
  ["sigap-google-news-rss-v1"],
  { revalidate: NEWS_REVALIDATE_SECONDS }
);

function deserializeItems(items: SerializedBeritaItem[]): DynamicBeritaItem[] {
  return items.map((item) => ({
    ...item,
    tanggalTerbit: new Date(item.tanggalTerbit),
  }));
}

async function getDatabaseFallbackNews(): Promise<DynamicBeritaItem[]> {
  try {
    const rows = await prisma.berita.findMany({
      orderBy: { tanggalTerbit: "desc" },
      take: MAX_NEWS_ITEMS,
    });
    if (rows.length === 0) return [];

    const enriched = await Promise.allSettled(
      rows.map(async (row): Promise<DynamicBeritaItem> => {
        const meta = await fetchArticleMetadata(row.url);
        return {
          id: row.id,
          judul: row.judul,
          sumber: row.sumber,
          domain: getUrlHostname(row.url),
          url: row.url,
          tanggalTerbit: row.tanggalTerbit,
          ringkasan: row.ringkasan,
          thumbnailUrl: meta.ogImage,
        };
      })
    );

    return enriched
      .filter((r): r is PromiseFulfilledResult<DynamicBeritaItem> => r.status === "fulfilled")
      .map((r) => r.value);
  } catch (err) {
    console.warn("[NEWS FALLBACK DB ERROR]", err);
    return [];
  }
}

export async function fetchLiveEarthquakeNews(): Promise<DynamicBeritaItem[]> {
  const items = await fetchFromGoogleNewsRss();
  return deserializeItems(items);
}

export async function getLatestEarthquakeNews(): Promise<DynamicBeritaItem[]> {
  try {
    const cached = await getCachedGoogleNews();
    if (cached.length > 0) {
      const hydrated = deserializeItems(cached);
      lastGoodNews = hydrated;
      return hydrated;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("incrementalCache")) {
      try {
        const live = await fetchLiveEarthquakeNews();
        if (live.length > 0) {
          lastGoodNews = live;
          return live;
        }
      } catch (liveErr) {
        console.warn("[NEWS RSS ERROR]", liveErr);
      }
    } else {
      console.warn("[NEWS RSS ERROR]", err);
    }
  }

  if (lastGoodNews.length > 0) {
    return lastGoodNews;
  }

  return await getDatabaseFallbackNews();
}
