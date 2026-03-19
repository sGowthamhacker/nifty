export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { fetchNiftyLive } from "@/lib/free-api-client";

let cache: { data: any; ts: number } | null = null;

export async function GET() {
  // 1-second cache — fresh data every request effectively
  if (cache && Date.now() - cache.ts < 1000) {
    return NextResponse.json(cache.data, { headers: { "X-Cache": "HIT" } });
  }
  const data = await fetchNiftyLive();
  cache = { data, ts: Date.now() };
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store, no-cache", "X-Cache": "MISS", "X-Source": "free-api" },
  });
}
