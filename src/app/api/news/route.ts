import { NextResponse } from "next/server";
import { getLatestEarthquakeNews, NEWS_REVALIDATE_SECONDS } from "@/lib/news-rss";

export const revalidate = 1800;

export async function GET() {
  try {
    const items = await getLatestEarthquakeNews();
    return NextResponse.json({
      status: "ok",
      revalidateSeconds: NEWS_REVALIDATE_SECONDS,
      count: items.length,
      items,
    });
  } catch (err) {
    console.error("[API NEWS ERROR]", err);
    return NextResponse.json(
      {
        status: "degraded",
        revalidateSeconds: NEWS_REVALIDATE_SECONDS,
        count: 0,
        items: [],
        message: "Berita belum tersedia",
      },
      { status: 200 }
    );
  }
}
