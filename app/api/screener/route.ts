export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchNifty50Stocks, STOCK_META } from "@/lib/free-api-client";

let cache: { data: any[]; ts: number } | null = null;

export async function GET(req: NextRequest) {
  const screen = new URL(req.url).searchParams.get("screen") || "all";
  if (!cache || Date.now() - cache.ts > 5000) {
    const stocks = await fetchNifty50Stocks();
    cache = { data: stocks, ts: Date.now() };
  }
  let result = [...cache.data];
  switch (screen) {
    case "momentum":  result = result.filter(s => s.changePercent > 0).sort((a,b) => b.changePercent - a.changePercent); break;
    case "value":     result = result.sort((a,b) => (a.changePercent) - (b.changePercent)); break;
    case "highvol":   result = result.sort((a,b) => b.volume - a.volume); break;
    case "near52h":   result = result.filter(s => s.yearHigh && s.price >= s.yearHigh * 0.95).sort((a,b) => b.price - a.price); break;
    case "near52l":   result = result.filter(s => s.yearLow  && s.price <= s.yearLow  * 1.05).sort((a,b) => a.price - b.price); break;
    case "largecap":  result = result.sort((a,b) => b.marketCap - a.marketCap); break;
    case "losers":    result = result.filter(s => s.changePercent < 0).sort((a,b) => a.changePercent - b.changePercent); break;
    case "gainers":   result = result.filter(s => s.changePercent > 0).sort((a,b) => b.changePercent - a.changePercent); break;
  }
  return NextResponse.json(result.slice(0, 25), { headers: { "Cache-Control": "no-store" } });
}
