export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { createRouteClient } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

/* ── helpers ────────────────────────────────────────── */
function isTableMissing(err: string) {
  return err.includes("does not exist") ||
         err.includes("schema cache") ||
         err.includes("relation") ||
         err.includes("42P01");
}

/* ── GET: list watchlist ─────────────────────────────── */
export async function GET(_req: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data: { user }, error: authErr } = await supabase.auth.getUser();

    if (authErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("watchlists")
      .select("id, symbol, added_at")
      .eq("user_id", user.id)
      .order("added_at", { ascending: false });

    if (error) {
      if (isTableMissing(error.message)) {
        return NextResponse.json([], { headers: { "X-Schema-Missing": "true" } });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e: any) {
    console.error("[watchlist GET]", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* ── POST: add symbol ───────────────────────────────── */
export async function POST(req: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body   = await req.json().catch(() => ({}));
    const symbol = String(body.symbol || "").trim().toUpperCase();
    if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

    const { data, error } = await supabase
      .from("watchlists")
      .upsert({ user_id: user.id, symbol }, { onConflict: "user_id,symbol" })
      .select("id, symbol, added_at")
      .single();

    if (error) {
      if (isTableMissing(error.message))
        return NextResponse.json({ error: "Database not set up. Please run schema.sql in Supabase." }, { status: 503 });
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (e: any) {
    console.error("[watchlist POST]", e.message);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

/* ── DELETE: remove symbol ──────────────────────────── */
export async function DELETE(req: NextRequest) {
  try {
    const supabase = createRouteClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const symbol = new URL(req.url).searchParams.get("symbol")?.toUpperCase();
    if (!symbol) return NextResponse.json({ error: "symbol required" }, { status: 400 });

    const { error } = await supabase
      .from("watchlists")
      .delete()
      .eq("user_id", user.id)
      .eq("symbol", symbol);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
