export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import { fetchMarketStats } from "@/lib/free-api-client";

export async function GET() {
  try {
    const data = await fetchMarketStats();
    if (!data) {
      return NextResponse.json({ error: "Failed to fetch market stats" }, { status: 500 });
    }
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
