"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { ArrowUp, ArrowDown, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface Data {
  price: number; 
  change: number; 
  changePercent: number;
  open: number; 
  high: number; 
  low: number; 
  previousClose: number;
  volume: number; 
  marketState: string; 
  advances: number; 
  declines: number;
  unchanged: number; 
  yearHigh: number; 
  yearLow: number; 
  timestamp: number;
  pe?: number; 
  pb?: number; 
  ffmc?: number; 
  totalTradedValue?: number;
}

const fmtN  = (n: number, d = 2) => n?.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d }) ?? "—";
const fmtLakh = (v: number) => (v / 100000).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtCrore = (v: number) => (v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function IndexHeroCard() {
  const [data,    setData]    = useState<Data | null>(null);
  const [prev,    setPrev]    = useState<number | null>(null);
  const [flash,   setFlash]   = useState<"up"|"down"|null>(null);
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const fetch1s = useCallback(async () => {
    try {
      const res = await fetch(`/api/market/index?t=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) return;
      const d: Data = await res.json();
      setData(cur => {
        if (cur && d && cur.price !== d.price) {
          setFlash(d.price > cur.price ? "up" : "down");
          setTimeout(() => setFlash(null), 600);
        }
        if (d) setPrev(cur?.price ?? null);
        return d;
      });
    } catch { /* network — keep showing last data */ }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetch1s();
    timerRef.current = setInterval(fetch1s, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [fetch1s]);

  const isPos = (data?.change ?? 0) >= 0;
  const mktOpen = /REGULAR|OPEN/i.test(data?.marketState || "");
  
  const rDay = data?.high && data?.low && data.high !== data.low
    ? ((data.price - data.low) / (data.high - data.low)) * 100 : 50;
    
  const r52 = data?.yearHigh && data?.yearLow && data.yearHigh !== data.yearLow
    ? ((data.price - data.yearLow) / (data.yearHigh - data.yearLow)) * 100 : 50;

  if (!data) return (
    <div className="glass-card border border-border-subtle rounded-2xl p-5 space-y-3 animate-pulse overflow-hidden">
      <div className="h-5 bg-bg-elevated rounded w-32"/>
      <div className="h-12 bg-bg-elevated rounded w-48"/>
      <div className="h-4 bg-bg-elevated rounded w-40"/>
      <div className="grid grid-cols-4 gap-2">{[...Array(4)].map((_,i)=><div key={i} className="h-12 bg-bg-elevated rounded"/>)}</div>
    </div>
  );

  const stats = [
    {l:"Open",       v:fmtN(data.open)},
    {l:"Prev Close", v:fmtN(data.previousClose)},
    {l:"Intraday Low", v:fmtN(data.low), c:"red"},
    {l:"Intraday High", v:fmtN(data.high), c:"green"},
    {l:"Volume (Lakhs)", v:fmtLakh(data.volume)},
    {l:"Value (Crores)", v:fmtCrore(data.totalTradedValue || 0)},
    {l:"FFM. Cap (Lakhs Crores)", v:fmtN(data.ffmc || 107.11)},
    {l:"P/E Ratio",  v:data.pe?.toFixed(2) || "20.63"},
    {l:"P/B Ratio",  v:data.pb?.toFixed(2) || "3.20"},
    {l:"Market Breadth", v:`${data.advances}▲ ${data.declines}▼`},
  ];

  return (
    <div className={cn(
      "glass-card border rounded-2xl p-4 sm:p-5 relative overflow-hidden transition-all duration-300",
      isPos ? "border-accent-green/20" : "border-accent-red/20",
      flash === "up"   && "ring-1 ring-accent-green/40 shadow-[0_0_20px_rgba(0,212,170,0.1)]",
      flash === "down" && "ring-1 ring-accent-red/40 shadow-[0_0_20px_rgba(255,77,106,0.1)]",
    )}>
      {/* Glossy Glow */}
      <div className={cn("absolute -top-20 -right-20 w-52 h-52 rounded-full blur-3xl opacity-10 pointer-events-none",
        isPos ? "bg-accent-green" : "bg-accent-red")}/>

      {/* Title Header */}
      <div className="flex items-start justify-between mb-4 relative">
        <div>
          <Link href="/indices" className="flex items-center gap-2 group">
            <div className={cn("w-2 h-2 rounded-full", mktOpen ? "bg-accent-green animate-pulse" : "bg-text-muted")}/>
            <span className="font-display font-900 text-text-primary text-lg tracking-tighter group-hover:text-accent-blue transition-colors">NIFTY 50</span>
            <span className={cn("text-[10px] font-mono font-900 uppercase px-2 py-0.5 rounded-full border",
              mktOpen ? "bg-accent-green/10 text-accent-green border-accent-green/20" : "bg-bg-elevated text-text-muted border-border-subtle")}>
              {mktOpen ? "LIVE MARKET" : "CLOSED"}
            </span>
          </Link>
          <p className="text-text-muted text-[10px] font-mono mt-1 opacity-70 tracking-tight">NATIONAL STOCK EXCHANGE OF INDIA INDEX</p>
        </div>
        <Link href="/charts?symbol=NIFTY50" className="p-2 text-text-muted hover:text-accent-blue hover:bg-accent-blue/5 rounded-xl transition-all border border-transparent hover:border-accent-blue/10">
          <TrendingUp size={16}/>
        </Link>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-6">
        <div>
          <div className="relative">
            <div className={cn(
              "font-display font-900 tabular-nums leading-none transition-colors duration-300 text-5xl tracking-tighter",
              flash === "up" ? "text-accent-green" : flash === "down" ? "text-accent-red" : "text-text-primary"
            )}>
              {fmtN(data.price)}
            </div>
            {prev !== null && prev !== data.price && mounted && (
              <div className={cn("text-[11px] font-mono font-900 absolute -top-4 right-0 px-2 py-0.5 rounded bg-current/5",
                data.price > prev ? "text-accent-green" : "text-accent-red")}>
                {data.price > prev ? "▲" : "▼"} {Math.abs(data.price - prev).toFixed(2)}
              </div>
            )}
          </div>

          <div className={cn("flex items-center gap-2 mt-2 font-mono font-900 text-lg sm:text-xl",
            isPos ? "text-accent-green" : "text-accent-red")}>
            {isPos ? <ArrowUp size={18} strokeWidth={3}/> : <ArrowDown size={18} strokeWidth={3}/>}
            <span>{isPos?"+":""}{fmtN(data.change)}</span>
            <span className="opacity-70 text-base sm:text-lg">({isPos?"+":""}{fmtN(data.changePercent)}%)</span>
          </div>
        </div>

        {/* Dynamic Ranges Section */}
        <div className="flex-1 max-w-sm space-y-4">
           {/* Intraday Range */}
           <div className="space-y-1.5">
              <div className="flex justify-between text-[10px] font-mono font-800 text-text-muted/80 uppercase">
                 <span>Low: <span className="text-accent-red">{fmtN(data.low)}</span></span>
                 <span className="tracking-widest opacity-50">Intraday Range</span>
                 <span>High: <span className="text-accent-green">{fmtN(data.high)}</span></span>
              </div>
              <div className="relative h-2 bg-bg-elevated/50 rounded-full border border-border-subtle/20">
                 <div className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-accent-blue shadow-lg z-10 transition-all duration-500"
                    style={{ left: `calc(${Math.max(2, Math.min(98, rDay))}% - 8px)` }}/>
                 <div className="absolute inset-y-0 left-0 bg-accent-blue/20 rounded-full" style={{ width: `${rDay}%` }}/>
              </div>
           </div>

           {/* 52W Range */}
           <div className="space-y-1.5">
               <div className="flex justify-between text-[10px] font-mono font-800 text-text-muted/80 uppercase">
                  <span>52W L: <span className="text-accent-red">{fmtN(data.yearLow)}</span></span>
                  <span className="tracking-widest opacity-50">52-Week High/Low</span>
                  <span>52W H: <span className="text-accent-green">{fmtN(data.yearHigh)}</span></span>
               </div>
              <div className="relative h-2 bg-bg-elevated/50 rounded-full border border-border-subtle/20 overflow-hidden">
                 <div className="absolute inset-0 bg-gradient-to-r from-accent-red via-accent-amber to-accent-green opacity-20"/>
                 <div className="absolute top-0 h-full w-1.5 bg-white/80 blur-[1px] shadow-[0_0_8px_white]"
                    style={{ left: `calc(${Math.max(1, Math.min(99, r52))}% - 3px)` }}/>
              </div>
           </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 border-t border-border-subtle/30 pt-6">
        {stats.map(({l,v,c})=>(
          <div key={l} className="group flex flex-col">
            <span className="text-text-muted text-[10px] font-mono font-800 uppercase tracking-tighter opacity-60 group-hover:opacity-100 transition-opacity mb-1">{l}</span>
            <span className={cn("font-mono font-900 text-[13px] tabular-nums",
              c==="green"?"text-accent-green":c==="red"?"text-accent-red":"text-text-primary")}>
              {v}
            </span>
          </div>
        ))}
      </div>

      {mounted && data?.timestamp && (
        <div className="mt-6 flex items-center justify-between border-t border-border-subtle/20 pt-3">
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-1.5 bg-accent-blue/5 px-2 py-1 rounded text-[10px] font-mono font-800 text-accent-blue">
                <RefreshCw size={10} className="animate-spin-slow"/>
                <span>REAL-TIME STREAMING</span>
             </div>
          </div>
          <p className="text-text-muted text-[10px] font-mono font-800 opacity-50">
            LAST UPDATE: {new Date(data.timestamp).toLocaleTimeString("en-IN")}
          </p>
        </div>
      )}
    </div>
  );
}
