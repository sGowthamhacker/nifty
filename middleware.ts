import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_ROUTES = ["/dashboard", "/stocks", "/watchlist", "/alerts", "/settings", "/admin", "/indices", "/charts", "/screener", "/news", "/equity"];
const AUTH_ROUTES = ["/login", "/signup"];

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Guard for missing environment variables during build or if not set in Vercel yet
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return res;
  }

  try {
    const supabase = createMiddlewareClient({ req, res });
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const isProtected = PROTECTED_ROUTES.some((r) => pathname.startsWith(r));
    if (isProtected && !session) {
      const redirectUrl = new URL("/login", req.url);
      redirectUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(redirectUrl);
    }

    const isAuthRoute = AUTH_ROUTES.some((r) => pathname.startsWith(r));
    if (isAuthRoute && session) {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  } catch (err) {
    console.error("Middleware Auth Error:", err);
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook).*)",
  ],
};
