import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { createServerClient } from "@/lib/supabase-server";
import { LandingClient } from "@/components/landing/LandingClient";

export default async function LandingPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  return <LandingClient session={session} />;
}
