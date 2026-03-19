import { createServerComponentClient, createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const isEnvSet = !!(supabaseUrl && supabaseAnonKey);

/** For Server Components (pages, layouts) */
export function createServerClient() {
  if (!isEnvSet) return new Proxy({}, { get: () => new Proxy(() => {}, { get: () => () => ({ data: { session: null, user: null }, error: null }) }) }) as any;
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
}

/** For Route Handlers (API routes) — pass cookies() result directly */
export function createRouteClient() {
  if (!isEnvSet) return new Proxy({}, { get: () => new Proxy(() => {}, { get: () => () => ({ data: { session: null, user: null }, error: null }) }) }) as any;
  const cookieStore = cookies();
  return createRouteHandlerClient({ cookies: () => cookieStore });
}
