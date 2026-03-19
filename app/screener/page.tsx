"use client";
import { useEffect, useState, useCallback } from "react";
import { Filter, ArrowUp, ArrowDown, TrendingUp, BarChart2, Star, Zap, DollarSign, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, formatVolume } from "@/lib/utils";
import Link from "next/link";

const SCREENS = [
  { id:"all",      label:"All Stocks",     icon: BarChart2,   desc:"All 50 Nifty constituents" },
  { id:"momentum", label:"Momentum",       icon: TrendingUp,  desc:"Stocks gaining today" },
  { id:"value",    label:"Value Picks",    icon: DollarSign,  desc:"P/E below 20x" },
  { id:"highvol",  label:"High Volume",    icon: Activity,    desc:"Most actively traded" },
  { id:"near52h",  label:"Near 52W High",  icon: ArrowUp,     desc:"Within 3% of 52-week high" },
  { id:"near52l",  label:"Near 52W Low",   icon: ArrowDown,   desc:"Within 3% of 52-week low" },
  { id:"dividend", label:"Dividend Stars", icon: Star,        desc:"Dividend yield > 1%" },
  { id:"lowbeta",  label:"Low Beta",       icon: Zap,         desc:"Beta less than 1.0" },
  { id:"largecap", label:"Large Cap",      icon: BarChart2,   desc:"Ranked by market cap" },
];

export default function ScreenerPage() {
  const [screen,  setScreen]  = useState("all");
  const [stocks,  setStocks]  = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRestored, setIsRestored] = useState(false);

  // Persistence: Load
  useEffect(() => {
    const saved = localStorage.getItem("nifty_screener_v1");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.screen) setScreen(p.screen);
      } catch {}
    }
    setIsRestored(true);
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (isRestored) {
      localStorage.setItem("nifty_screener_v1", JSON.stringify({ screen }));
    }
  }, [screen, isRestored]);

  const load = useCallback(async (s: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/screener?screen=${s}`, { cache:"no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setStocks(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(screen); }, [screen, load]);

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <h1 className="font-display font-800 text-2xl text-text-primary tracking-tight flex items-center gap-2">
          <Filter size={20} className="text-accent-purple"/> Stock Screener
        </h1>
        <p className="text-text-muted text-sm mt-1">Filter and discover Nifty 50 stocks by criteria</p>
      </div>

      {/* Screen selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {SCREENS.map(s => {
          const Icon = s.icon;
          return (
            <button key={s.id} onClick={() => setScreen(s.id)}
              className={cn("flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all",
                screen === s.id ? "bg-accent-blue/10 border-accent-blue/40 text-text-primary" : "bg-bg-card border-border-subtle text-text-secondary hover:border-border-default hover:bg-bg-elevated")}>
              <Icon size={14} className={screen===s.id?"text-accent-blue":"text-text-muted"} />
              <div>
                <div className="text-xs font-600">{s.label}</div>
                <div className="text-[10px] text-text-muted mt-0.5 hidden sm:block">{s.desc}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Results */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-border-subtle flex items-center gap-3">
          <span className="font-display font-600 text-text-primary text-sm">{SCREENS.find(s=>s.id===screen)?.label}</span>
          <span className="text-text-muted text-[10px] font-mono">({stocks.length} results)</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border-subtle/60 text-[10px] font-mono text-text-muted uppercase bg-bg-secondary/30">
                <th className="px-4 py-2.5 text-left">#</th>
                <th className="px-4 py-2.5 text-left">Stock</th>
                <th className="px-4 py-2.5 text-right">Price</th>
                <th className="px-4 py-2.5 text-right">Change</th>
                <th className="px-4 py-2.5 text-right hidden sm:table-cell">Mkt Cap</th>
                <th className="px-4 py-2.5 text-right hidden md:table-cell">Volume</th>
                <th className="px-4 py-2.5 text-right hidden lg:table-cell">P/E</th>
                <th className="px-4 py-2.5 text-right hidden lg:table-cell">Beta</th>
                <th className="px-4 py-2.5 text-right hidden xl:table-cell">Div Yield</th>
                <th className="px-4 py-2.5 text-right hidden xl:table-cell">52W H/L</th>
                <th className="px-4 py-2.5 text-center">Chart</th>
              </tr>
            </thead>
            <tbody>
              {loading ? [...Array(8)].map((_,i) => (
                <tr key={i} className="border-b border-border-subtle/20">
                  {[...Array(6)].map((_,j) => <td key={j} className="px-4 py-3"><div className="skeleton h-4 rounded"/></td>)}
                </tr>
              )) : stocks.map((s, i) => {
                const pos = s.changePercent >= 0;
                return (
                  <tr key={s.symbol} className="border-b border-border-subtle/20 hover:bg-bg-elevated/40 transition-colors">
                    <td className="px-4 py-3 text-text-muted font-mono">{i+1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center text-[9px] font-mono font-700 text-text-secondary shrink-0">
                          {s.symbol.slice(0,2)}
                        </div>
                        <div>
                          <div className="text-text-primary font-600">{s.symbol}</div>
                          <div className="text-text-muted text-[10px]">{s.sector}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-600 text-text-primary tabular-nums">
                      ₹{s.price?.toLocaleString("en-IN",{minimumFractionDigits:2})}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className={cn("inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono font-600",
                        pos?"bg-accent-green/10 text-accent-green":"bg-accent-red/10 text-accent-red")}>
                        {pos?<ArrowUp size={8}/>:<ArrowDown size={8}/>}
                        {Math.abs(s.changePercent)?.toFixed(2)}%
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[10px] text-text-secondary hidden sm:table-cell">{formatCurrency(s.marketCap)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[10px] text-text-secondary hidden md:table-cell">{formatVolume(s.volume)}</td>
                    <td className="px-4 py-3 text-right font-mono text-[10px] text-text-secondary hidden lg:table-cell">{s.pe ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono text-[10px] text-text-secondary hidden lg:table-cell">{s.beta ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-mono text-[10px] hidden xl:table-cell">
                      <span className={s.dividendYield ? "text-accent-amber" : "text-text-muted"}>
                        {s.dividendYield ? `${s.dividendYield}%` : "Nil"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right hidden xl:table-cell">
                      <div className="text-accent-green text-[10px] font-mono">↑ ₹{s.fiftyTwoWeekHigh?.toLocaleString("en-IN",{minimumFractionDigits:0})}</div>
                      <div className="text-accent-red text-[10px] font-mono">↓ ₹{s.fiftyTwoWeekLow?.toLocaleString("en-IN",{minimumFractionDigits:0})}</div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Link href={`/charts?symbol=${s.symbol}`}
                        className="inline-flex items-center gap-1 text-[10px] font-mono text-accent-blue hover:text-accent-blue/80 bg-accent-blue/10 px-2 py-1 rounded-lg transition-all">
                        <BarChart2 size={9}/> Chart
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
