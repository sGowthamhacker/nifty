"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface Stock { symbol:string; name:string; price:number; change:number; changePercent:number; volume:number; }

export default function StockTickerStrip() {
  const [stocks, setStocks] = useState<Stock[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/stocks", { cache:"no-store" });
        const data = await res.json();
        if (Array.isArray(data)) setStocks(data);
      } catch {}
    };
    load();
    const iv = setInterval(load, 2000);
    return () => clearInterval(iv);
  }, []);

  if (stocks.length === 0) return <div className="h-10 skeleton rounded-xl"/>;

  const doubled = [...stocks, ...stocks];

  return (
    <div className="bg-bg-card border border-border-subtle rounded-xl overflow-hidden">
      <div className="overflow-hidden">
        <div className="inline-flex animate-[ticker_55s_linear_infinite] hover:[animation-play-state:paused]">
          {doubled.map((s, i) => {
            const pos = s.changePercent >= 0;
            return (
              <Link key={i} href={`/charts?symbol=${s.symbol}`}
                className="inline-flex items-center gap-2.5 px-4 py-2.5 border-r border-border-subtle/40 hover:bg-bg-elevated transition-colors shrink-0 min-w-[160px] group">
                <div className="w-6 h-6 rounded-md bg-bg-elevated flex items-center justify-center text-[8px] font-mono font-700 text-text-muted shrink-0 group-hover:bg-accent-blue/20 transition-colors">
                  {s.symbol.slice(0,2)}
                </div>
                <div>
                  <div className="text-text-primary text-[11px] font-mono font-600 leading-none">{s.symbol}</div>
                  <div className="text-text-primary text-[11px] font-mono tabular-nums leading-none mt-0.5">
                    ₹{s.price?.toLocaleString("en-IN",{minimumFractionDigits:2})}
                  </div>
                </div>
                <div className={cn("flex items-center gap-0.5 text-[10px] font-mono font-700 ml-auto", pos?"text-accent-green":"text-accent-red")}>
                  {pos?<ArrowUpRight size={9}/>:<ArrowDownRight size={9}/>}
                  {Math.abs(s.changePercent)?.toFixed(2)}%
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
