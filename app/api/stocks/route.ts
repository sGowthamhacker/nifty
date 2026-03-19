export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { fetchNifty50Stocks } from "@/lib/free-api-client";

let cache: { data: any; ts: number } | null = null;

export async function GET() {
  if (cache && Date.now() - cache.ts < 1000) {
    return NextResponse.json(cache.data, { headers: { "X-Cache": "HIT" } });
  }
  const data = await fetchNifty50Stocks();
  cache = { data, ts: Date.now() };
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store", "X-Cache": "MISS" },
  });
}
