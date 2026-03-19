"use client";
import { useEffect, useState, useCallback } from "react";
import { Activity, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Stock { symbol:string; changePercent:number; volume:number; marketCap:number; }

export default function MarketDepthPanel() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/stocks", { cache:"no-store" });
      const data = await res.json();
      if (Array.isArray(data)) setStocks(data);
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); const iv = setInterval(load, 1000); return () => clearInterval(iv); }, [load]);

  if (loading) return <div className="skeleton h-36 rounded-2xl"/>;

  const advances = stocks.filter(s => s.changePercent > 0).length;
  const declines = stocks.filter(s => s.changePercent < 0).length;
  const unchanged = stocks.length - advances - declines;
  const totalVol = stocks.reduce((a,s) => a+s.volume, 0);
  const advVol = stocks.filter(s=>s.changePercent>0).reduce((a,s)=>a+s.volume,0);
  const decVol = stocks.filter(s=>s.changePercent<0).reduce((a,s)=>a+s.volume,0);
  const adRatio = advances / Math.max(declines, 1);

  const fmtVol = (v:number) => v>=1e9 ? `${(v/1e9).toFixed(1)}B` : v>=1e7 ? `${(v/1e7).toFixed(1)}Cr` : `${(v/1e5).toFixed(1)}L`;

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <BarChart2 size={14} className="text-accent-blue"/>
        <h3 className="font-display font-600 text-text-primary text-sm">Market Breadth</h3>
        <span className="text-text-muted text-[10px] font-mono ml-auto">Nifty 50 breadth</span>
      </div>

      {/* A/D bar */}
      <div>
        <div className="flex h-3 rounded-full overflow-hidden gap-px">
          <div className="bg-accent-green rounded-l-full transition-all duration-500" style={{width:`${(advances/50)*100}%`}}/>
          <div className="bg-text-muted/30 transition-all duration-500" style={{width:`${(unchanged/50)*100}%`}}/>
          <div className="bg-accent-red rounded-r-full transition-all duration-500" style={{width:`${(declines/50)*100}%`}}/>
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] font-mono">
          <span className="text-accent-green font-600">▲ {advances} Adv</span>
          <span className="text-text-muted">{unchanged} Unch</span>
          <span className="text-accent-red font-600">{declines} Dec ▼</span>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <div className="bg-bg-elevated rounded-xl px-3 py-2">
          <div className="text-text-muted text-[9px] font-mono uppercase">A/D Ratio</div>
          <div className={cn("font-mono font-700 text-sm", adRatio >= 1 ? "text-accent-green" : "text-accent-red")}>
            {adRatio.toFixed(2)}
          </div>
        </div>
        <div className="bg-bg-elevated rounded-xl px-3 py-2">
          <div className="text-text-muted text-[9px] font-mono uppercase">Total Volume</div>
          <div className="font-mono font-700 text-sm text-text-primary">{fmtVol(totalVol)}</div>
        </div>
        <div className="bg-bg-elevated rounded-xl px-3 py-2">
          <div className="text-text-muted text-[9px] font-mono uppercase">Adv Volume</div>
          <div className="font-mono font-600 text-xs text-accent-green">{fmtVol(advVol)}</div>
        </div>
        <div className="bg-bg-elevated rounded-xl px-3 py-2">
          <div className="text-text-muted text-[9px] font-mono uppercase">Dec Volume</div>
          <div className="font-mono font-600 text-xs text-accent-red">{fmtVol(decVol)}</div>
        </div>
      </div>
    </div>
  );
}
