export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchChartWithMeta } from "@/lib/free-api-client";

const RANGE_MAP: Record<string, { range: string; interval: string }> = {
  "1D":  {range:"1d",  interval:"5m"},  "5D":  {range:"5d",  interval:"15m"},
  "1M":  {range:"1mo", interval:"1d"},  "3M":  {range:"3mo", interval:"1d"},
  "6M":  {range:"6mo", interval:"1wk"}, "1Y":  {range:"1y",  interval:"1d"},
  "2Y":  {range:"2y",  interval:"1wk"}, "5Y":  {range:"5y",  interval:"1mo"},
  "MAX": {range:"max", interval:"3mo"},
};

const cache = new Map<string, { data: any; ts: number }>();

export async function GET(req: NextRequest) {
  const params  = new URL(req.url).searchParams;
  const symbol  = (params.get("symbol") || "NIFTY50").toUpperCase();
  const tf      = (params.get("timeframe") || "1M").toUpperCase();
  const { range, interval } = RANGE_MAP[tf] || RANGE_MAP["1M"];
  const key = `${symbol}:${tf}`;
  const ttl = tf === "1D" ? 1000 : 30000;

  const cached = cache.get(key);
  if (cached && Date.now() - cached.ts < ttl) {
    return NextResponse.json(cached.data, { headers: { "X-Cache": "HIT" } });
  }

  const data = await fetchChartWithMeta(symbol, range, interval);
  cache.set(key, { data, ts: Date.now() });
  return NextResponse.json(data, { headers: { "Cache-Control": "no-store" } });
}
