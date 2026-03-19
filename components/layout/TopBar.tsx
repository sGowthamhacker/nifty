"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { Wifi, WifiOff, Menu, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";

interface IndexData { price:number; change:number; changePercent:number; marketState:string; }

function fmtIST() {
  return new Date(Date.now() + 5.5*3600000).toISOString().slice(11,19);
}

interface TopBarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export default function TopBar({ onToggleSidebar, isSidebarOpen }: TopBarProps) {
  const [data,     setData]    = useState<IndexData|null>(null);
  const [online,   setOnline]  = useState(true);
  const [mounted,  setMounted] = useState(false);
  const [istTime,  setIstTime] = useState("");
  const hasFetched = useRef(false);

  const fetchIndex = useCallback(async () => {
    try {
      const res = await fetch("/api/market/index", { cache:"no-store" });
      if (!res.ok) throw new Error("fail");
      const d = await res.json();
      setData(d); setOnline(true);
    } catch { setOnline(false); }
  }, []);

  useEffect(() => {
    // Mark mounted — after this point all renders are client-only
    setMounted(true);
    setIstTime(fmtIST());

    if (!hasFetched.current) { hasFetched.current=true; fetchIndex(); }

    const fetchIv = setInterval(fetchIndex, 1000);
    const clockIv = setInterval(() => setIstTime(fmtIST()), 1000);
    return () => { clearInterval(fetchIv); clearInterval(clockIv); };
  }, [fetchIndex]);

  const isPos   = (data?.change ?? 0) >= 0;
  const mktOpen = /REGULAR|OPEN/i.test(data?.marketState || "");

  return (
    <header className={cn(
      "fixed top-0 right-0 h-11 bg-bg-secondary/95 backdrop-blur-sm border-b border-border-subtle z-[30] flex items-center px-4 gap-4 text-xs transition-all duration-200 ease-in-out left-0 lg:left-60"
    )}>
      {/* Menu Toggle (Dynamic Icon) */}
      <button 
        onClick={onToggleSidebar}
        className="p-1.5 -ml-1 text-text-muted hover:text-text-primary transition-all hover:bg-bg-elevated/50 rounded-lg active:scale-95 group"
        title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
      >
        {isSidebarOpen ? (
          <PanelLeftClose size={18} className="group-hover:-translate-x-0.5 transition-transform" />
        ) : (
          <Menu size={18} className="group-hover:scale-110 transition-transform" />
        )}
      </button>

      {/* Market status */}
      <div className={cn("flex items-center gap-1.5 font-mono text-[10px] shrink-0",
        mktOpen ? "text-accent-green" : "text-text-muted")}>
        <div className={cn("w-1.5 h-1.5 rounded-full shrink-0",
          mktOpen ? "bg-accent-green" : "bg-text-muted")}/>
        {mktOpen ? "NSE OPEN" : "NSE CLOSED"}
      </div>

      {/* NIFTY 50 live price */}
      {data && (
        <div className="flex items-center gap-2 pl-3 border-l border-border-subtle/50 shrink-0 overflow-hidden">
          <span className="font-mono text-[10px] text-text-muted hidden sm:inline">NIFTY 50</span>
          <span className="font-mono font-700 text-text-primary tabular-nums text-[11px] sm:text-xs">
            {data.price.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}
          </span>
          <span className={cn("font-mono font-600 text-[10px] tabular-nums",
            isPos ? "text-accent-green" : "text-accent-red")}>
            {isPos?"+":""}{data.change.toFixed(2)}&nbsp;({isPos?"+":""}{data.changePercent.toFixed(2)}%)
          </span>
        </div>
      )}

      {/* Ticker tape */}
      <div className="flex-1 overflow-hidden min-w-0 hidden lg:block">
        {mounted && <TickerTape />}
      </div>

      {/* Right: status + IST clock */}
      <div className="flex items-center gap-3 shrink-0 ml-auto">
        <div className={cn("flex items-center gap-1 font-mono text-[10px]",
          online ? "text-text-muted" : "text-accent-red")}>
          {online ? <Wifi size={10}/> : <WifiOff size={10}/>}
          <span className="hidden sm:inline ml-0.5">{online ? "LIVE·1s" : "OFFLINE"}</span>
        </div>
        {/* suppressHydrationWarning prevents React from complaining about time mismatch.
            The empty string default means server renders nothing here; client fills it in. */}
        <span
          suppressHydrationWarning
          className="font-mono text-[10px] text-text-muted tabular-nums w-16 text-right"
        >
          {mounted ? istTime + " IST" : ""}
        </span>
      </div>
    </header>
  );
}

/* ── Scrolling ticker tape ─────────────────────────── */
const TICKERS = [
  "RELIANCE","TCS","HDFCBANK","ICICIBANK","INFY","ITC","SBIN",
  "BHARTIARTL","BAJFINANCE","LT","HCLTECH","AXISBANK","MARUTI",
  "WIPRO","NTPC","TITAN","SUNPHARMA","KOTAKBANK","TATAMOTORS","ADANIPORTS",
];

function TickerTape() {
  const [prices, setPrices] = useState<Record<string,{price:number;pct:number}>>({});

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/stocks", { cache:"no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (Array.isArray(data)) {
          const m: Record<string,{price:number;pct:number}> = {};
          data.forEach((s:any) => { m[s.symbol] = { price:s.price, pct:s.changePercent }; });
          setPrices(m);
        }
      } catch {}
    };
    load();
    const iv = setInterval(load, 5000); // Slower ticker update for better performance
    return () => clearInterval(iv);
  }, []);

  const items = TICKERS.map(s => ({ sym:s, ...prices[s] })).filter(s => s.price);
  if (items.length === 0) return (
    <div className="h-full flex items-center">
      <span className="text-text-muted text-[10px] font-mono animate-pulse">Loading market data…</span>
    </div>
  );

  const band = [...items, ...items].map((s,i) => (
    <span key={i} className="inline-flex items-center gap-1.5 px-3 text-[10px] font-mono whitespace-nowrap border-r border-border-subtle/30 shrink-0">
      <span className="text-text-muted">{s.sym}</span>
      <span className="text-text-secondary tabular-nums">
        ₹{s.price?.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2})}
      </span>
      <span className={cn("font-700 tabular-nums",(s.pct??0)>=0?"text-accent-green":"text-accent-red")}>
        {(s.pct??0)>=0?"+":""}{s.pct?.toFixed(2)}%
      </span>
    </span>
  ));

  return (
    <div className="overflow-hidden h-full flex items-center select-none">
      <div className="inline-flex cursor-default" style={{ animation:"ticker 50s linear infinite" }}>
        {band}
      </div>
    </div>
  );
}
