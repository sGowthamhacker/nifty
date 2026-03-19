"use client";
import { useEffect, useState } from "react";
import { Globe, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface MarketItem {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  state: string;
}

export default function GlobalPulse() {
  const [items, setItems] = useState<MarketItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/market/summary");
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filter to interesting global/Indian indices
          const interesting = data.filter(i => 
             /NIFTY|SENSEX|S&P 500|Dow|Nasdaq|DAX|FTSE|Nikkei|Hang|Shanghai/i.test(i.name || i.symbol)
          ).slice(0, 8);
          setItems(interesting);
        }
      } catch { } finally { setLoading(false); }
    };
    load();
    const iv = setInterval(load, 60000);
    return () => clearInterval(iv);
  }, []);

  if (loading && items.length === 0) return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[...Array(4)].map((_,i) => <div key={i} className="h-16 bg-bg-card border border-border-subtle rounded-xl animate-pulse"/>)}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 px-1">
        <Globe size={14} className="text-accent-blue"/>
        <h3 className="text-[11px] font-800 uppercase tracking-widest text-text-muted">Global Market Pulse</h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-3">
        {items.map(item => {
          const isPos = item.change >= 0;
          return (
            <div key={item.symbol} className="bg-bg-card border border-border-subtle hover:border-accent-blue/30 rounded-xl p-3 transition-all">
              <div className="flex justify-between items-start mb-1">
                <span className="text-[10px] font-700 text-text-secondary truncate pr-1" title={item.name}>{item.name || item.symbol}</span>
                {isPos ? <TrendingUp size={10} className="text-accent-green"/> : <TrendingDown size={10} className="text-accent-red"/>}
              </div>
              <div className="flex items-end justify-between">
                <span className="text-sm font-mono font-700 text-text-primary">{item.price?.toLocaleString(undefined, { maximumFractionDigits: 1 })}</span>
                <div className={cn("flex items-center text-[10px] font-mono font-700", isPos ? "text-accent-green" : "text-accent-red")}>
                  {isPos ? <ArrowUpRight size={9}/> : <ArrowDownRight size={9}/>}
                  {Math.abs(item.changePct * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
