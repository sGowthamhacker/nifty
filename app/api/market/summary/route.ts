export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { fetchMarketSummary } from "@/lib/free-api-client";

let cache: { data: any; ts: number } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.ts < 30000) {
    return NextResponse.json(cache.data, { headers: { "X-Cache": "HIT" } });
  }
  const data = await fetchMarketSummary();
  cache = { data, ts: Date.now() };
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store, no-cache" },
  });
}
