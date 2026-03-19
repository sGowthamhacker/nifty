"use client";
import { useEffect, useState, useCallback, useMemo } from "react";
import { TrendingUp, TrendingDown, ArrowUp, ArrowDown, RefreshCw, LineChart, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn, formatPrice, formatVolume, formatCurrency } from "@/lib/utils";

interface Stock {
  symbol:string; name:string; sector:string; price:number;
  change:number; changePercent:number; volume:number; marketCap:number;
}

export default function GainersLosers() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"gainers" | "losers" | "activeValue" | "activeVolume" | "etf">("gainers");
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/market/stats", { cache:"no-store" });
      const data = await res.json();
      if (data && !data.error) { 
        setStats(data); 
        setLastUpdated(new Date()); 
      }
    } catch(e){ console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }, [load]);

  const fmtN = (n: number, d = 2) => formatPrice(n || 0, d);

  if (loading && !stats) {
    return (
      <div className="bg-bg-card border border-border-subtle rounded-2xl h-80 flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw size={24} className="text-accent-blue animate-spin opacity-40"/>
          <p className="text-text-muted text-xs font-mono">Connecting to NSE Data Stream...</p>
        </div>
      </div>
    );
  }

  const items = stats ? (stats[tab] || []) : [];

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 py-4 border-b border-border-subtle bg-bg-secondary/10 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-accent-blue/10 flex items-center justify-center border border-accent-blue/20">
             <TrendingUp size={20} className="text-accent-blue"/>
          </div>
          <div>
            <h3 className="font-display font-800 text-text-primary text-base uppercase tracking-tight">Top {items.length || 5} Stocks / ETF</h3>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-green"></span>
              </span>
              <p className="text-text-muted text-[10px] font-mono leading-none">NSE LIVE MARKET DATA SOURCE</p>
            </div>
          </div>
        </div>
        
        <div className="flex bg-bg-elevated/50 p-1 rounded-xl gap-1 overflow-x-auto no-scrollbar border border-border-subtle/30 shadow-inner">
          {[
            { id: "gainers", label: "Gainers" },
            { id: "losers", label: "Losers" },
            { id: "activeValue", label: "Most Active Value" },
            { id: "activeVolume", label: "Most Active Volume" },
            { id: "etf", label: "ETF" },
          ].map(t => (
            <button key={t.id}
              onClick={() => setTab(t.id as any)}
              className={cn("px-4 py-1.5 rounded-lg text-[10px] font-800 uppercase tracking-tight transition-all whitespace-nowrap",
                tab === t.id ? "bg-accent-blue text-white shadow-lg scale-[1.02]" : "text-text-muted hover:text-text-primary hover:bg-bg-elevated")}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="hidden lg:flex items-center gap-4">
           {lastUpdated && <span className="text-text-muted text-[10px] font-mono bg-bg-elevated px-2 py-1 rounded-lg">Last Sync: {lastUpdated.toLocaleTimeString()}</span>}
           <Link href="/equity" className="flex items-center gap-1.5 bg-accent-blue/5 text-accent-blue text-[10px] font-800 uppercase px-3 py-1.5 rounded-lg border border-accent-blue/20 hover:bg-accent-blue/10 transition-all">
             View More <ArrowRight size={10}/>
           </Link>
        </div>
      </div>

      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse table-fixed min-w-[700px] xl:min-w-0">
          <thead>
            <tr className="bg-bg-secondary/5 border-b border-border-subtle/30">
              <th className="px-6 py-4 text-[11px] font-800 text-text-muted uppercase tracking-wider w-40">SYMBOL</th>
              <th className="px-5 py-4 text-[11px] font-800 text-text-muted uppercase tracking-wider text-right w-24">LTP</th>
              <th className="px-5 py-4 text-[11px] font-800 text-text-muted uppercase tracking-wider text-right w-20">CHNG</th>
              <th className="px-5 py-4 text-[11px] font-800 text-text-muted uppercase tracking-wider text-right w-24">%CHNG</th>
              <th className="px-5 py-4 text-[11px] font-800 text-text-muted uppercase tracking-wider text-right w-28">VOLUME (Lakhs)</th>
              <th className="px-5 py-4 text-[11px] font-800 text-text-muted uppercase tracking-wider text-right w-28">VALUE (Cr)</th>
              <th className="px-5 py-4 text-[11px] font-800 text-text-muted uppercase tracking-wider text-right hidden xl:table-cell w-28">DAY H/L</th>
              <th className="px-5 py-4 text-[11px] font-800 text-text-muted uppercase tracking-wider text-right hidden 2xl:table-cell w-32">52W H/L</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-subtle/20">
            {items.map((s:any, i:number) => {
              const pos = s.changePercent >= 0;
              const r52 = s.fiftyTwoWeekHigh && s.fiftyTwoWeekLow
                ? ((s.price - s.fiftyTwoWeekLow) / (s.fiftyTwoWeekHigh - s.fiftyTwoWeekLow)) * 100 : 50;
              return (
                <tr key={s.symbol} onClick={() => router.push(`/charts?symbol=${s.symbol}`)} 
                    className="hover:bg-bg-elevated/40 transition-all group cursor-pointer">
                  <td className="px-6 py-4 whitespace-nowrap border-l-2 border-transparent hover:border-accent-blue/50">
                    <div className="flex items-center gap-4 transition-transform group-hover:translate-x-1">
                      <span className="text-[10px] font-mono font-700 text-text-muted/50 w-4">{i+1}</span>
                      <div className="flex flex-col">
                        <span className="text-sm font-800 text-text-primary group-hover:text-accent-blue transition-colors tracking-tight">{s.symbol}</span>
                        <span className="text-[10px] text-text-muted font-600 truncate max-w-[140px] uppercase opacity-80">{s.name}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap text-xs font-700 text-text-primary font-mono tabular-nums">
                    {s.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </td>
                  <td className={cn("px-5 py-4 text-right whitespace-nowrap text-xs font-700 font-mono tabular-nums",
                    pos ? "text-accent-green" : "text-accent-red")}>
                    {pos ? "+" : ""}{s.change.toFixed(2)}
                  </td>
                  <td className={cn("px-5 py-4 text-right whitespace-nowrap text-[13px] font-800 font-mono tabular-nums",
                    pos ? "text-accent-green" : "text-accent-red")}>
                    <div className="flex items-center justify-end gap-1.5 bg-current/5 px-2 py-1 rounded-lg">
                      {pos ? <ArrowUp size={12} strokeWidth={3}/> : <ArrowDown size={12} strokeWidth={3}/>}
                      {Math.abs(s.changePercent).toFixed(2)}%
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap text-xs font-600 text-text-secondary font-mono tabular-nums opacity-80">
                    {formatVolume(s.volume)}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap text-xs font-800 text-text-primary font-mono tabular-nums">
                    {formatCurrency(s.totalTradedValue)}
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap hidden xl:table-cell group-hover:bg-bg-secondary/5 transition-colors">
                    <div className="text-[10px] font-mono font-700 text-accent-green">H: {s.high?.toLocaleString("en-IN")}</div>
                    <div className="text-[10px] font-mono font-700 text-accent-red">L: {s.low?.toLocaleString("en-IN")}</div>
                  </td>
                  <td className="px-5 py-4 text-right whitespace-nowrap hidden 2xl:table-cell">
                    <div className="flex flex-col items-end gap-1">
                      <div className="text-[9px] font-mono text-text-muted flex gap-2">
                        <span>L: {s.fiftyTwoWeekLow?.toLocaleString("en-IN")}</span>
                        <span>H: {s.fiftyTwoWeekHigh?.toLocaleString("en-IN")}</span>
                      </div>
                      <div className="w-16 h-1 bg-bg-elevated rounded-full overflow-hidden relative">
                         <div className="absolute inset-0 bg-gradient-to-r from-accent-red via-accent-amber to-accent-green opacity-20"/>
                         <div className="absolute top-0 w-1 h-full bg-white scale-125" style={{ left: `${Math.max(0,Math.min(100,r52))}%` }}/>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="p-4 bg-bg-secondary/5 border-t border-border-subtle flex justify-between items-center sm:hidden">
         {lastUpdated && <span className="text-text-muted text-[10px] font-mono">Live: {lastUpdated.toLocaleTimeString()}</span>}
         <Link href="/charts" className="text-accent-blue text-[10px] font-800 uppercase hover:underline flex items-center gap-1">View Full Market <ArrowRight size={10}/></Link>
      </div>
    </div>
  );
}
