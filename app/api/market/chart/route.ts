export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { fetchCandles } from "@/lib/free-api-client";

// Map frontend timeframe labels to Yahoo Finance params
const TF_MAP: Record<string, { range: string; interval: string }> = {
  "1m":  { range: "1d",  interval: "1m"  },
  "5m":  { range: "5d",  interval: "5m"  },
  "1D":  { range: "1d",  interval: "5m"  },
  "1W":  { range: "5d",  interval: "15m" },
  "1M":  { range: "1mo", interval: "1d"  },
  "3M":  { range: "3mo", interval: "1d"  },
  "6M":  { range: "6mo", interval: "1wk" },
  "1Y":  { range: "1y",  interval: "1d"  },
  "2Y":  { range: "2y",  interval: "1wk" },
  "5Y":  { range: "5y",  interval: "1mo" },
  "MAX": { range: "max", interval: "3mo" },
};

const cache = new Map<string, { data: any; ts: number }>();

export async function GET(req: NextRequest) {
  const tf  = new URL(req.url).searchParams.get("timeframe") || "1m";
  const { range, interval } = TF_MAP[tf] ?? TF_MAP["1m"];
  // 1m/5m = 1s cache, others = 15s
  const ttl = ["1m","5m","1D"].includes(tf) ? 1000 : 15000;

  const cached = cache.get(tf);
  if (cached && Date.now() - cached.ts < ttl) {
    return NextResponse.json(cached.data, { headers: { "X-Cache": "HIT", "X-Interval": interval } });
  }

  const data = await fetchCandles("NIFTY50", range, interval);
  cache.set(tf, { data, ts: Date.now() });
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store", "X-Cache": "MISS", "X-Interval": interval },
  });
}
