"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BarChart2, Star, Bell, Settings, Shield,
  LogOut, ChevronRight, TrendingUp, Newspaper, Filter,
  Activity, LineChart, Grid3X3, X, Search
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

const NAV = [
  {
    group: "Overview",
    items: [
      { label:"Dashboard",   href:"/dashboard",  icon:LayoutDashboard },
      { label:"Live Charts", href:"/charts",     icon:LineChart,      badge:"NEW" },
    ],
  },
  {
    group: "Markets",
    items: [
      { label:"Indices",     href:"/indices",    icon:Activity,       badge:"LIVE" },
      { label:"Market Watch",href:"/market-watch",icon:LayoutDashboard,badge:"NEW" },
      { label:"Stocks",      href:"/stocks",     icon:BarChart2 },
      { label:"Heatmap",     href:"/heatmap",    icon:Grid3X3,        badge:"HOT" },
      { label:"Equity",      href:"/equity",     icon:TrendingUp,     badge:"NSE" },
      { label:"Screener",    href:"/screener",   icon:Filter },
      { label:"News",        href:"/news",       icon:Newspaper },
      { label:"Settings",    href:"/settings",   icon:Settings },
    ],
  },
  {
    group: "Portfolio",
    items: [
      { label:"Watchlist",   href:"/watchlist",  icon:Star },
      { label:"Alerts",      href:"/alerts",     icon:Bell },
    ],
  },
];

interface Profile { email?: string; full_name?: string | null; plan?: string; is_admin?: boolean; }

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname    = usePathname();
  const [profile, setProfile] = useState<Profile | null>(null);

  // Load user profile & session
  useEffect(() => {
    let mounted = true;

    const loadData = async (user: any) => {
      if (!user) {
        setProfile(null);
        return;
      }

      // IMMEDIATELY set from auth — always has email
      const fallbackName = user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split("@")[0]
        || "User";

      setProfile({
        email: user.email,
        full_name: fallbackName,
        plan: "free",
        is_admin: false,
      });

      // Try enriching from DB
      try {
        const { data, error } = await supabase
          .from("users")
          .select("full_name, plan, is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (mounted && data) {
          setProfile(prev => ({
            ...prev,
            full_name: data.full_name || prev?.full_name,
            plan: data.plan || prev?.plan,
            is_admin: data.is_admin ?? prev?.is_admin,
          }));
        } else if (!data && !error) {
          // Row doesn't exist — create it silently
          await supabase.from("users").upsert({
            id: user.id,
            email: user.email,
            full_name: fallbackName,
            plan: "free",
            is_admin: false,
            created_at: new Date().toISOString(),
          }, { onConflict: "id" });
        }
      } catch (e) {
        console.warn("Profile DB fetch failed, using auth fallback:", e);
      }
    };

    // 1. Listen for auth changes AND get initial session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      if (mounted) loadData(session?.user || null);
    });

    // 2. Initial manual sync
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted) loadData(session?.user || null);
      } catch (e) {
        console.error("getSession error:", e);
      }
    })();

    return () => { 
      mounted = false; 
      subscription.unsubscribe();
    };
  }, []);



  const displayName = profile?.full_name || profile?.email?.split("@")[0] || "…";
  const initial     = displayName[0]?.toUpperCase() || "?";

  return (
    <>
      {/* Mobile Backdrop - Glossy Blur */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[45] xl:hidden animate-in fade-in duration-300"
        />
      )}

      <aside className={cn(
        "fixed left-0 top-0 h-full w-[280px] sm:w-60 bg-bg-secondary/95 backdrop-blur-xl border-r border-border-subtle flex flex-col z-[50] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-2xl xl:shadow-none",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
      {/* Logo & Close */}
      <div className="px-5 py-4 border-b border-border-subtle flex items-center justify-between gap-3">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-accent-blue to-accent-blue/70 flex items-center justify-center shadow-glow-blue">
            <TrendingUp size={15} className="text-white"/>
          </div>
          <div>
            <span className="font-display font-800 text-text-primary text-sm tracking-tight">NIFTY50</span>
            <span className="block text-[9px] text-text-muted font-mono uppercase tracking-widest">Analytics Pro</span>
          </div>
        </Link>

        {/* Mobile Close Button - Premium Circle */}
        <button 
          onClick={onClose}
          className="xl:hidden w-8 h-8 flex items-center justify-center rounded-full bg-bg-elevated text-text-muted hover:text-text-primary transition-all border border-border-subtle active:scale-90"
        >
          <X size={16} />
        </button>
      </div>

      {/* Sidebar Search - Nav Shortcut */}
      <div className="px-3 pt-3">
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-accent-blue transition-colors" />
          <input 
            type="text" 
            placeholder="Search navigation..." 
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl pl-9 pr-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-accent-blue/30 focus:border-accent-blue/40 transition-all"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto space-y-4">
        {NAV.map(({ group, items }) => (
          <div key={group}>
            <p className="px-3 mb-1.5 text-[9px] font-mono uppercase tracking-widest text-text-muted">{group}</p>
            <div className="space-y-0.5">
              {items.map(({ label, href, icon: Icon, badge }) => {
                const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href + "/"));
                return (
                  <Link 
                    key={href} 
                    href={href} 
                    onClick={() => {
                      if (window.innerWidth < 1024 && onClose) onClose();
                    }}
                    className={cn(
                      "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] font-body transition-all active:scale-95",
                      active
                        ? "bg-accent-blue/12 text-text-primary font-600 border-l-2 border-accent-blue pl-[10px]"
                        : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
                    )}>
                    <Icon size={14} className={active ? "text-accent-blue" : ""}/>
                    <span className="flex-1">{label}</span>
                    {badge && (
                      <span className={cn("text-[8px] font-mono font-700 px-1.5 py-0.5 rounded-full",
                        badge === "LIVE" ? "bg-accent-green/20 text-accent-green"
                        : badge === "NEW" ? "bg-accent-amber/20 text-accent-amber"
                        : "bg-accent-blue/20 text-accent-blue")}>
                        {badge}
                      </span>
                    )}
                    {active && !badge && <ChevronRight size={11} className="text-accent-blue"/>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {profile?.is_admin && (
          <div>
            <p className="px-3 mb-1.5 text-[9px] font-mono uppercase tracking-widest text-text-muted">Admin</p>
            <Link 
              href="/admin" 
              onClick={() => {
                if (window.innerWidth < 1024 && onClose) onClose();
              }}
              className={cn(
                "flex items-center gap-2.5 px-3 py-2 rounded-xl text-[13px] transition-all active:scale-95",
                pathname.startsWith("/admin")
                  ? "bg-accent-purple/12 text-text-primary font-600"
                  : "text-text-secondary hover:text-text-primary hover:bg-bg-elevated"
              )}>
              <Shield size={14} className={pathname.startsWith("/admin") ? "text-accent-purple" : ""}/>
              Admin Panel
            </Link>
          </div>
        )}
      </nav>
      {/* User profile - Premium Floating Card Section */}
      <div className="mt-auto p-3 border-t border-border-subtle/40 bg-bg-secondary/40 backdrop-blur-xl">
        <div className="flex items-center gap-3 p-2.5 rounded-2xl transition-all hover:bg-bg-elevated/60 group border border-border-subtle/20 hover:border-accent-blue/20 shadow-lg relative overflow-hidden">
          {/* Subtle background glow */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-accent-blue/5 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative shrink-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-blue via-accent-blue/80 to-accent-purple/60 shadow-glow-blue border border-white/10 flex items-center justify-center font-display font-800 text-white text-[15px] select-none">
              {initial}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent-green border-2 border-bg-secondary shadow-[0_0_8px_rgba(0,212,170,0.6)] animate-pulse-live" />
          </div>
          
          <div className="flex-1 min-w-0 z-10">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="text-text-primary text-[13px] font-700 truncate block group-hover:text-accent-blue transition-colors">{displayName}</span>
              {profile?.plan === "pro" && (
                <span className="text-[7px] font-mono font-900 bg-accent-amber/20 text-accent-amber border border-accent-amber/40 px-1 py-0.5 rounded leading-none shrink-0 tracking-tighter shadow-sm">PRO</span>
              )}
            </div>
            <p className="text-text-muted text-[10px] truncate leading-none opacity-50 font-mono tracking-tight" title={profile?.email || ""}>
              {profile?.email || "…"}
            </p>
          </div>

          <form action="/api/auth/signout" method="post" className="shrink-0 ml-1 z-10">
            <button type="submit" className="p-2.5 text-text-muted hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all group/out" title="Sign out">
              <LogOut size={16} className="group-hover/out:translate-x-0.5 transition-transform" />
            </button>
          </form>
        </div>
      </div>
    </aside>
    </>
  );
}
