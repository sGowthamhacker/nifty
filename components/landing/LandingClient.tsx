"use client";

import Link from "next/link";
import {
  TrendingUp, TrendingDown, BarChart2, Bell, Star, Shield,
  Zap, ArrowRight, Check, Activity, ChevronRight, Globe,
  LogOut, LayoutDashboard, Menu, X, Sparkles, Layers, 
  Cpu, Rocket, MousePointer2
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import Footer from "@/components/layout/Footer";
import { StockAscension } from "@/components/background/StockAscension";

const FEATURES = [
  {
    icon: Activity,
    title: "Live Market Intelligence",
    desc: "Real-time NIFTY 50 index tracking with sub-second latency precision. Performance metrics at your fingertips.",
    color: "blue",
    tags: ["Real-time", "Fast"]
  },
  {
    icon: BarChart2,
    title: "Institutional Engine",
    desc: "Interactive TradingView-grade charting system. Zoom, pan, and analyze with professional precision.",
    color: "green",
    tags: ["Analysis", "UX"]
  },
  {
    icon: Star,
    title: "Precision Watchlists",
    desc: "Curate your portfolio with surgical accuracy. Track movements across all 50 Nifty constituents instantly.",
    color: "amber",
    tags: ["Personalized"]
  },
  {
    icon: Bell,
    title: "Instant Edge Alerts",
    desc: "Never miss a breakout. Intelligent price triggers with instant browser and push notifications.",
    color: "purple",
    tags: ["Reactive"]
  },
  {
    icon: TrendingUp,
    title: "Momentum Scanning",
    desc: "Identify market leadership in seconds. proprietary gainer/loser logic for day trading alpha.",
    color: "red",
    tags: ["Alpha"]
  },
  {
    icon: Shield,
    title: "Hardened Security",
    desc: "Enterprise-grade auth with Supabase. Your data is protected by industry-standard encryption protocols.",
    color: "indigo",
    tags: ["Secure"]
  },
];

function LiveTickerTape() {
  const [tickers, setTickers] = useState<{ sym: string; price: string; chg: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/stocks", { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data)) {
          setTickers(data.slice(0, 20).map((s: any) => ({
            sym: s.symbol,
            price: `₹${(s.price ?? 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            chg:  `${(s.changePercent ?? 0) >= 0 ? "+" : ""}${(s.changePercent ?? 0).toFixed(2)}%`,
          })));
        }
      } catch {}
    };
    load();
    const iv = setInterval(load, 5000);
    return () => clearInterval(iv);
  }, []);

  if (tickers.length === 0) return <div className="h-10 bg-white/5 animate-pulse rounded-full mx-6" />;
  const doubled = [...tickers, ...tickers, ...tickers];
  
  return (
    <div className="relative flex overflow-hidden py-3 bg-black/40 border-y border-white/5 backdrop-blur-sm group">
      <div className="flex animate-marquee group-hover:pause gap-12 whitespace-nowrap px-6">
        {doubled.map((t, i) => (
          <div key={i} className="flex items-center gap-3 transition-opacity duration-300 hover:opacity-100 opacity-80 cursor-default">
            <span className="text-white/40 font-mono text-[10px] uppercase tracking-[0.2em] font-700">{t.sym}</span>
            <span className="text-white font-mono text-xs font-800 tracking-tighter">{t.price}</span>
            <span className={cn(
               "font-mono text-[9px] font-900 px-2 py-0.5 rounded-full border",
               t.chg.startsWith("+") ? "bg-accent-green/10 text-accent-green border-accent-green/20" : "bg-accent-red/10 text-accent-red border-accent-red/20"
            )}>
              {t.chg}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const colorMap: Record<string, string> = {
  blue: "bg-accent-blue/20 text-accent-blue border-accent-blue/30 shadow-glow-blue/20",
  green: "bg-accent-green/20 text-accent-green border-accent-green/30 shadow-glow-green/20",
  amber: "bg-accent-amber/20 text-accent-amber border-accent-amber/30 shadow-glow-amber/20",
  purple: "bg-accent-purple/20 text-accent-purple border-accent-purple/30 shadow-glow-purple/20",
  red: "bg-accent-red/20 text-accent-red border-accent-red/30 shadow-glow-red/20",
  indigo: "bg-blue-400/20 text-blue-400 border-blue-400/30 shadow-glow-blue/20",
};

export function LandingClient({ session }: { session: any }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="min-h-screen bg-[#07090D] selection:bg-accent-blue selection:text-white overflow-x-hidden">
      {/* Dynamic Immersive Background */}
      <div className="fixed inset-0 z-[-1] pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.15),transparent_70%)]" />
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent-blue/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent-green/5 blur-[120px] rounded-full animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-grid-pattern bg-[size:32px_32px] opacity-[0.12] [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)]" />
      </div>

      <div className="fixed inset-0 z-[-1] pointer-events-none opacity-50">
        <StockAscension />
      </div>

      {/* Hero Navbar Overlay */}
      <nav className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500 border-b border-white/5 bg-black/20 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 active:scale-95 transition-transform group">
            <div className="relative w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-accent-blue to-accent-purple p-[1px] shadow-glow-blue/30 overflow-hidden">
               <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
               <div className="relative w-full h-full flex items-center justify-center">
                  <TrendingUp size={18} className="text-white group-hover:scale-110 transition-transform" />
               </div>
            </div>
            <div>
              <span className="font-display font-900 text-white text-lg sm:text-xl tracking-tighter block leading-none">NIFTY50</span>
              <span className="block text-[7px] sm:text-[8px] text-accent-blue font-900 uppercase tracking-[0.3em] sm:tracking-[0.4em] mt-0.5 opacity-80">Analytics Pro</span>
            </div>
          </Link>

          <div className="hidden xl:flex items-center gap-10 text-[13px] font-700 text-white/60 tracking-wide uppercase">
            <a href="#features" className="hover:text-white transition-all hover:tracking-widest">Ecosystem</a>
            <a href="#pricing" className="hover:text-white transition-all hover:tracking-widest">Pricing</a>
            <a href="https://htwth.vercel.app/" target="_blank" className="hover:text-accent-blue transition-all flex items-center gap-1.5">
               Vercel <Sparkles size={12} className="text-accent-blue" />
            </a>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-3">
              {session ? (
                <Link href="/dashboard" className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-800 text-white bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
                  <LayoutDashboard size={15} className="text-accent-blue" />
                  Terminal
                </Link>
              ) : (
                <>
                  <Link href="/login" className="px-4 py-2 rounded-xl text-[13px] font-800 text-white/70 hover:text-white transition-all hidden md:block">
                    Login
                  </Link>
                  <Link href="/signup" className="flex items-center gap-2 bg-accent-blue hover:bg-accent-blue/90 text-white px-5 py-2 rounded-xl text-[13px] font-900 transition-all shadow-glow-blue border border-white/20 active:scale-95">
                    Join <ArrowRight size={14} />
                  </Link>
                </>
              )}
            </div>

            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="xl:hidden p-2.5 rounded-xl bg-white/5 border border-white/10 text-white active:scale-90 transition-transform"
            >
              {isMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Drawer */}
        {isMenuOpen && (
          <div className="xl:hidden border-t border-white/5 bg-black/80 backdrop-blur-2xl">
            <div className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
              <a href="#features" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-700 text-white/70 hover:text-white hover:bg-white/5 transition-all">Ecosystem</a>
              <a href="#pricing" onClick={() => setIsMenuOpen(false)} className="px-4 py-3 rounded-xl text-sm font-700 text-white/70 hover:text-white hover:bg-white/5 transition-all">Pricing</a>
              <div className="border-t border-white/5 mt-2 pt-3 flex flex-col gap-2">
                {session ? (
                  <Link href="/dashboard" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-2 bg-accent-blue text-white py-3 rounded-xl text-sm font-900">
                    <LayoutDashboard size={16} /> Enter Terminal
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setIsMenuOpen(false)} className="text-center py-3 rounded-xl text-sm font-700 text-white/70 border border-white/10 hover:bg-white/5 transition-all">Login</Link>
                    <Link href="/signup" onClick={() => setIsMenuOpen(false)} className="flex items-center justify-center gap-2 bg-accent-blue text-white py-3 rounded-xl text-sm font-900 shadow-glow-blue">Join Free <ArrowRight size={14} /></Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Main Container */}
      <main className="relative z-10 pt-16 sm:pt-20">
        <div className="mt-0">
          <LiveTickerTape />
        </div>

        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-16 sm:pb-24 text-center relative">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl px-3 sm:px-4 py-1.5 sm:py-2 text-[9px] sm:text-[10px] font-900 text-accent-blue mb-6 sm:mb-8 shadow-2xl backdrop-blur-md animate-fade-in-up uppercase tracking-[0.2em]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-blue opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-blue"></span>
            </span>
            Professional Market Analytics v5.5
          </div>

          <h1 className="font-display font-900 text-4xl sm:text-5xl md:text-7xl text-white leading-[1.1] tracking-tight mb-6 sm:mb-8 animate-fade-in-up">
            The Pro Standard<br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent-blue via-accent-purple to-accent-green leading-relaxed">
              for High-Speed Market Data
            </span>
          </h1>

          <p className="text-white/60 text-sm sm:text-base md:text-xl max-w-xl mx-auto mb-8 sm:mb-10 leading-relaxed font-body font-500 animate-fade-in-up opacity-90 px-2">
            Experience advanced market intelligence architected for precision. Live NIFTY50 tracking 
            and professional-tier analytics—all in one refined ecosystem.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center animate-fade-in-up px-4 sm:px-0" style={{ animationDelay: "300ms" }}>
            <Link
              href={session ? "/dashboard" : "/signup"}
              className="inline-flex items-center justify-center gap-2 bg-accent-blue hover:bg-accent-blue/90 text-white px-7 py-3.5 rounded-[18px] text-sm sm:text-base font-900 transition-all shadow-glow-blue border border-white/20 group active:scale-95"
            >
              Get Started <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            {!session && (
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 bg-white/5 backdrop-blur-xl hover:bg-white/10 border border-white/10 px-7 py-3.5 rounded-[18px] text-sm sm:text-base font-900 text-white transition-all active:scale-95"
              >
                Access Terminal
              </Link>
            )}
          </div>

          <div className="mt-12 sm:mt-20 relative mx-auto max-w-5xl group animate-fade-in-up">
            <div className="absolute -inset-4 bg-gradient-to-br from-accent-blue/10 to-accent-green/10 rounded-[32px] sm:rounded-[40px] blur-[60px] opacity-40" />
            <div className="relative bg-[#0F1117] border border-white/5 rounded-[20px] sm:rounded-[24px] overflow-hidden shadow-2xl">
              <div className="bg-[#161922] border-b border-white/5 h-10 sm:h-12 flex items-center justify-between px-4 sm:px-6">
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/10" />
                  <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-white/10" />
                </div>
                <div className="bg-black/40 rounded-lg px-3 sm:px-6 py-1 sm:py-1.5 border border-white/5 flex items-center gap-2 sm:gap-3">
                   <div className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-red opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-red"></span>
                   </div>
                   <span className="text-white/40 text-[8px] sm:text-[9px] font-mono tracking-widest uppercase font-700">Live Simulation • HTWTH-v5.5</span>
                </div>
                <div className="hidden sm:flex items-center gap-2 opacity-20">
                   <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                   <div className="w-1.5 h-1.5 bg-white/40 rounded-full" />
                </div>
              </div>

              {/* HIGH FIDELITY DASHBOARD MOCKUP - responsive aspect ratio */}
              <div className="aspect-[4/3] sm:aspect-video md:aspect-[21/9] bg-[#07090D] relative overflow-hidden flex items-center justify-center group/vid">
                 {/* Cinematic Panning Mockup Image */}
                 <div className="absolute inset-0 select-none">
                    <img 
                      src="/nifty50-dashboard.png" 
                      alt="HTWTH Dashboard" 
                      className="w-[120%] h-full object-cover opacity-60 scale-110 group-hover/vid:opacity-80 transition-all duration-1000 animate-pan-slow"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#07090D] via-transparent to-transparent opacity-60" />
                 </div>

                 {/* Simulated Terminal Overlay */}
                 <div className="relative z-10 text-center scale-90 md:scale-100 flex flex-col items-center gap-6">
                    <div className="p-8 bg-black/60 border border-white/10 rounded-[32px] backdrop-blur-2xl shadow-[0_0_80px_-20px_rgba(59,130,246,0.5)] flex flex-col items-center gap-5 transition-transform group-hover/vid:scale-110 duration-700">
                       <div className="w-16 h-16 rounded-full bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
                          <Cpu size={32} className="text-accent-blue animate-pulse" />
                       </div>
                       <div>
                          <h4 className="text-white font-display font-900 text-2xl tracking-tight mb-2 uppercase italic">Market Performance Core</h4>
                          <p className="text-accent-blue text-[10px] font-mono font-900 tracking-[0.4em] uppercase">NIFTY50 ACTIVE DATA</p>
                       </div>
                    </div>
                    
                    {/* Demo Activity Indicator */}
                    <div className="flex items-center gap-4 bg-white/5 border border-white/10 px-6 py-2 rounded-full opacity-60 group-hover/vid:opacity-100 transition-opacity">
                       <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 bg-accent-green rounded-full shadow-[0_0_10px_rgba(34,197,94,0.5)] animate-pulse" />
                          <span className="text-[10px] font-mono font-800 text-white uppercase tracking-widest">Live Sync</span>
                       </div>
                       <div className="h-1 w-24 bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full bg-accent-blue animate-progress-demo" />
                       </div>
                       <div className="text-[9px] font-mono font-900 text-white/40 uppercase">Latency-0.01s</div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="relative z-10 border-y border-white/5 bg-black/20 backdrop-blur-3xl py-10 sm:py-16">
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { value: "50+", label: "Dynamic Indices" },
              { value: "10ms", label: "Logic Latency" },
              { value: "Live", label: "Global Sync" },
              { value: "Pro", label: "Market Intelligence" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center md:text-left">
                <div className="font-display font-900 text-3xl md:text-4xl text-white mb-1">{value}</div>
                <div className="text-white/40 text-[9px] font-mono font-700 uppercase tracking-[0.2em]">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-display font-900 text-2xl sm:text-3xl md:text-5xl text-white mb-4 sm:mb-6 tracking-tight leading-tight">
              Institutional Tools,<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-blue to-accent-purple">Simply Delivered.</span>
            </h2>
            <p className="text-white/50 text-sm sm:text-base md:text-lg max-w-xl mx-auto px-4">
              Everything you need to navigate the Indian markets with certainty.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {FEATURES.map(({ icon: Icon, title, desc, color, tags }) => (
              <div
                key={title}
                className="group bg-white/5 border border-white/10 rounded-[24px] sm:rounded-[32px] p-6 sm:p-8 hover:bg-white/[0.08] transition-all shadow-xl"
              >
                <div className={cn("w-12 h-12 rounded-[18px] flex items-center justify-center mb-6 border shadow-2xl", colorMap[color])}>
                  <Icon size={24} />
                </div>
                <h3 className="font-display font-900 text-xl text-white mb-3 tracking-tight">{title}</h3>
                <p className="text-white/50 text-sm leading-relaxed mb-6">{desc}</p>
                <div className="flex gap-2">
                   {tags.map(tag => (
                     <span key={tag} className="px-2 py-0.5 bg-white/5 border border-white/5 rounded text-[8px] font-900 text-white/30 uppercase tracking-widest">{tag}</span>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 border-t border-white/5">
          <div className="text-center mb-10 sm:mb-16">
             <h2 className="font-display font-900 text-2xl sm:text-3xl md:text-5xl text-white mb-3 sm:mb-4 tracking-tight">
                Complete Access. <span className="text-white/20">Market Alpha.</span>
             </h2>
             <p className="text-white/40 text-sm sm:text-base">Professional tools for the community.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 max-w-5xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 shadow-2xl">
              <div className="flex justify-between items-start mb-7 sm:mb-10">
                 <div>
                    <h3 className="font-display font-900 text-xl sm:text-2xl text-white mb-1">Standard Pro</h3>
                    <p className="text-accent-blue text-[9px] font-900 uppercase tracking-widest">Free for everyone</p>
                 </div>
                 <div className="text-white font-display font-900 text-3xl sm:text-4xl">₹0</div>
              </div>
              <div className="space-y-3 sm:space-y-4 mb-7 sm:mb-10 opacity-60">
                {["Watchlists", "Live Ticker", "Candle Charting", "Cloud Sync"].map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-white font-700">
                    <Check size={14} className="text-accent-blue shrink-0" /> {f}
                  </div>
                ))}
              </div>
              <Link href={session ? "/dashboard" : "/signup"} className="block w-full text-center bg-white/5 border border-white/5 text-white py-3.5 sm:py-4 rounded-[18px] text-sm font-900 hover:bg-white/10 transition-all">
                {session ? "Enter" : "Get Started"}
              </Link>
            </div>

            <div className="bg-gradient-to-br from-accent-blue/20 to-black border border-accent-blue/30 rounded-[24px] sm:rounded-[32px] p-6 sm:p-10 shadow-[0_0_50px_-15px_rgba(59,130,246,0.3)]">
              <div className="flex justify-between items-start mb-7 sm:mb-10">
                 <div>
                    <h3 className="font-display font-900 text-xl sm:text-2xl text-white mb-1">Elite Alpha</h3>
                    <p className="text-accent-green text-[9px] font-900 uppercase tracking-widest">Early Access</p>
                 </div>
                 <div className="text-white font-display font-900 text-3xl sm:text-4xl italic">FREE</div>
              </div>
              <div className="space-y-3 sm:space-y-4 mb-7 sm:mb-10">
                {["Advanced Refresh", "Global Screener", "Pulse Alerts", "Premium Access"].map((f) => (
                  <div key={f} className="flex items-center gap-3 text-sm text-white font-900">
                    <Check size={14} className="text-accent-green shrink-0" /> {f}
                  </div>
                ))}
              </div>
              <Link href={session ? "/dashboard" : "/signup"} className="block w-full text-center bg-accent-blue text-white py-3.5 sm:py-4 rounded-[18px] text-sm font-900 transition-all shadow-glow-blue border border-white/20">
                Join Now
              </Link>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 sm:pb-24">
           <div className="bg-[#0F1117] rounded-[28px] sm:rounded-[40px] p-8 sm:p-12 md:p-20 text-center border border-white/5 relative overflow-hidden">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-accent-blue/10 blur-[80px] sm:blur-[120px] rounded-full pointer-events-none" />
              <h2 className="font-display font-900 text-2xl sm:text-3xl md:text-5xl text-white mb-6 sm:mb-8 tracking-tight relative z-10">
                 Market Performance.<br /><span className="text-white/20">At Your Fingertips.</span>
              </h2>
              <Link
                href={session ? "/dashboard" : "/signup"}
                className="relative z-10 inline-flex items-center justify-center gap-3 bg-white text-black px-8 sm:px-10 py-3.5 sm:py-4 rounded-[20px] sm:rounded-[24px] text-base sm:text-lg font-900 transition-all hover:scale-105 active:scale-95"
              >
                Get Started Now
              </Link>
           </div>
        </section>

        <Footer />
      </main>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.33%); }
        }
        @keyframes growVertical {
          0% { transform: scaleY(0.3); transform-origin: bottom; }
          100% { transform: scaleY(1); transform-origin: bottom; }
        }
        @keyframes pan-slow {
          0% { transform: translateX(-5%) scale(1.1); }
          100% { transform: translateX(5%) scale(1.1); }
        }
        @keyframes progress-demo {
          0% { width: 0%; opacity: 0.5; }
          50% { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }
        .animate-pan-slow {
          animation: pan-slow 20s ease-in-out infinite alternate;
        }
        .animate-progress-demo {
          animation: progress-demo 3s ease-in-out infinite;
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        .perspective-1000 {
          perspective: 1000px;
        }
        .group:hover .animate-marquee {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
