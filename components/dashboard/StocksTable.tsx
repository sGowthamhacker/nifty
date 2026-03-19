"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Search, ArrowUp, ArrowDown, Star, ChevronUp, ChevronDown, RefreshCw, Filter, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatVolume, formatCurrency } from "@/lib/utils";

interface Stock {
  symbol:string; name:string; sector:string; weight:number;
  price:number; change:number; changePercent:number;
  open:number; high:number; low:number; previousClose:number;
  volume:number; avgVolume:number; marketCap:number;
  pe:number|null; pb:number|null; eps:number|null;
  dividendYield:number|null; beta:number|null; ffmc:number;
  fiftyTwoWeekHigh:number; fiftyTwoWeekLow:number;
}
type SortKey = keyof Pick<Stock,"price"|"changePercent"|"volume"|"marketCap"|"pe"|"beta"|"dividendYield">;
type SortDir = "asc"|"desc";

export default function StocksTable() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string|null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date|null>(null);

  const load = useCallback(async (spin=false) => {
    if (spin) setRefreshing(true);
    try {
      const [stocksRes, wlRes] = await Promise.all([
        fetch(`/api/stocks?t=${Date.now()}`, { cache:"no-store" }),
        fetch("/api/watchlist").catch(()=>null),
      ]);
      const data = await stocksRes.json();
      if (Array.isArray(data)) { setStocks(data); setLastUpdated(new Date()); }
      if (wlRes?.ok) {
        const wl = await wlRes.json();
        setWatchlist(new Set(wl.map((w:any)=>w.symbol)));
      }
    } catch(e){ console.error(e); } finally {
      setLoading(false); if (spin) setRefreshing(false);
    }
  }, []);

  const [isRestored, setIsRestored] = useState(false);

  // Persistence: Load
  useEffect(() => {
    const saved = localStorage.getItem("nifty_dashboard_stocks_v1");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.sector) setSector(p.sector);
        if (p.sortKey) setSortKey(p.sortKey);
        if (p.sortDir) setSortDir(p.sortDir);
      } catch {}
    }
    setIsRestored(true);
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (isRestored) {
      localStorage.setItem("nifty_dashboard_stocks_v1", JSON.stringify({ sector, sortKey, sortDir }));
    }
  }, [sector, sortKey, sortDir, isRestored]);

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [load]);

  const sectors = useMemo(() => ["All",...Array.from(new Set(stocks.map(s=>s.sector))).sort()], [stocks]);

  const filtered = useMemo(() => stocks
    .filter(s => {
      const q = search.toLowerCase();
      return (s.name.toLowerCase().includes(q)||s.symbol.toLowerCase().includes(q)) && (sector==="All"||s.sector===sector);
    })
    .sort((a,b) => {
      const av = (a[sortKey]??0) as number; const bv = (b[sortKey]??0) as number;
      return sortDir==="asc" ? av-bv : bv-av;
    }), [stocks, search, sector, sortKey, sortDir]);

  const handleSort = (k: SortKey) => { if (sortKey===k) setSortDir(d=>d==="asc"?"desc":"asc"); else { setSortKey(k); setSortDir("desc"); } };

  const toggleWatchlist = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const inWl = watchlist.has(symbol);
    try {
      if (inWl) {
        await fetch(`/api/watchlist?symbol=${symbol}`, { method:"DELETE" });
        setWatchlist(prev => { const n=new Set(prev); n.delete(symbol); return n; });
      } else {
        const res = await fetch("/api/watchlist", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({symbol}) });
        if (res.ok) setWatchlist(prev => new Set([...prev, symbol]));
        else { const d=await res.json(); alert(d.error||"Failed"); }
      }
    } catch(e){ console.error(e); }
  };

  const SortBtn = ({col}:{col:SortKey}) => (
    <span className="inline-flex flex-col ml-1 opacity-60">
      <ChevronUp size={8} className={sortKey===col&&sortDir==="asc"?"text-accent-blue opacity-100":""}/>
      <ChevronDown size={8} className={sortKey===col&&sortDir==="desc"?"text-accent-blue opacity-100":""}/>
    </span>
  );

  const pct52 = (s: Stock) => {
    const range = (s.fiftyTwoWeekHigh || 0) - (s.fiftyTwoWeekLow || 0);
    if (!range || range <= 0) return 50;
    return ((s.price - s.fiftyTwoWeekLow) / range) * 100;
  };

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border-subtle">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <h3 className="font-display font-800 text-text-primary text-base tracking-tight pt-0.5">
                Nifty 50 Constituents
              </h3>
              <span className="bg-bg-elevated px-2 py-0.5 rounded text-[10px] font-mono text-text-muted border border-border-subtle/50">
                {filtered.length}/50
              </span>
            </div>
            {lastUpdated && (
              <p className="text-text-muted text-[10px] font-mono opacity-60">
                Sync: {lastUpdated.toLocaleTimeString("en-IN")} · Live NSE Update
              </p>
            )}
          </div>
          <button 
            onClick={() => load(true)} 
            className={cn(
              "flex items-center justify-center gap-2 bg-bg-elevated hover:bg-bg-secondary text-text-primary text-[11px] font-mono px-4 py-2 rounded-xl border border-border-subtle/50 transition-all active:scale-95 group",
              refreshing && "opacity-70"
            )}
          >
            <RefreshCw size={12} className={cn("text-accent-blue group-hover:rotate-180 transition-transform duration-500", refreshing && "animate-spin")} />
            {refreshing ? "Refreshing..." : "Sync Market Data"}
          </button>
        </div>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search stocks..."
              className="w-full bg-bg-elevated border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition-all"/>
          </div>
          <select value={sector} onChange={e=>setSector(e.target.value)}
            className="bg-bg-elevated border border-border-subtle rounded-xl px-4 py-2.5 text-xs font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-accent-blue/20 transition-all cursor-pointer">
            {sectors.map(s=><option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Scrollable table container */}
      <div className="overflow-x-auto w-full border-t border-border-subtle/30 custom-scrollbar pb-1">
        <table className="w-full text-left border-collapse table-fixed min-w-[1200px] xl:min-w-0">
          <thead>
            <tr className="bg-bg-secondary/40 text-[10px] font-mono text-text-muted uppercase tracking-widest border-b border-border-subtle/50">
              <th className="pl-6 pr-2 py-4 text-center w-14"></th>
              <th className="px-4 py-4 text-left w-52 xl:w-64">Company</th>
              <th className="px-4 py-4 text-right cursor-pointer hover:text-text-primary select-none w-32" onClick={()=>handleSort("price")}>LTP <SortBtn col="price"/></th>
              <th className="px-4 py-4 text-right cursor-pointer hover:text-text-primary select-none w-28" onClick={()=>handleSort("changePercent")}>Chg% <SortBtn col="changePercent"/></th>
              <th className="px-4 py-4 text-right hidden sm:table-cell w-36">Day range</th>
              <th className="px-4 py-4 text-right cursor-pointer hover:text-text-primary select-none hidden md:table-cell w-36" onClick={()=>handleSort("marketCap")}>Mkt Cap (Cr) <SortBtn col="marketCap"/></th>
              <th className="px-4 py-4 text-right cursor-pointer hover:text-text-primary select-none hidden lg:table-cell w-36" onClick={()=>handleSort("volume")}>Vol (Lakhs) <SortBtn col="volume"/></th>
              <th className="px-4 py-4 text-right cursor-pointer hover:text-text-primary select-none hidden xl:table-cell w-28" onClick={()=>handleSort("pe")}>P/E <SortBtn col="pe"/></th>
              <th className="px-4 py-4 text-right hidden xl:table-cell w-48 pr-6">52-Week Range</th>
            </tr>
          </thead>
          <tbody>
            {loading ? [...Array(10)].map((_,i)=>(
              <tr key={i} className="border-b border-border-subtle/30">
                {[...Array(7)].map((_,j)=><td key={j} className="px-3 py-3"><div className="skeleton h-4 rounded"/></td>)}
              </tr>
            )) : filtered.map(s => {
              const pos = s.changePercent >= 0;
              const isExp = expanded === s.symbol;
              const r52 = pct52(s);
              return [
                <tr key={s.symbol}
                  onClick={() => setExpanded(isExp ? null : s.symbol)}
                  className={cn("border-b border-border-subtle/20 cursor-pointer transition-colors",
                    isExp ? "bg-bg-elevated/80" : "hover:bg-bg-elevated/40")}>
                  <td className="pl-4 pr-2 py-3 text-center">
                    <button onClick={e=>toggleWatchlist(s.symbol,e)}
                      className={cn("transition-colors", watchlist.has(s.symbol)?"text-accent-amber":"text-text-muted hover:text-accent-amber")}>
                      <Star size={12} fill={watchlist.has(s.symbol)?"currentColor":"none"}/>
                    </button>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center text-[9px] font-mono font-700 text-text-secondary shrink-0">
                        {s.symbol.slice(0,2)}
                      </div>
                      <div>
                        <div className="text-text-primary font-500 text-xs">{s.symbol}</div>
                        <div className="text-text-muted text-[10px] truncate max-w-[120px] xl:max-w-[180px]">{s.name}</div>
                      </div>
                      <span className="hidden lg:inline text-[9px] font-mono text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded">{s.sector}</span>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="font-mono font-600 text-text-primary tabular-nums">₹{s.price?.toLocaleString("en-IN",{minimumFractionDigits:2}) || "—"}</div>
                    <div className={cn("text-[10px] font-mono", pos?"text-accent-green":"text-accent-red")}>
                      {pos?"+":""}{s.change.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <span className={cn("inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] font-mono font-600",
                      pos?"bg-accent-green/10 text-accent-green":"bg-accent-red/10 text-accent-red")}>
                      {pos?<ArrowUp size={9}/>:<ArrowDown size={9}/>}
                      {Math.abs(s.changePercent).toFixed(2)}%
                    </span>
                  </td>
                  <td className="px-3 py-3 text-right hidden sm:table-cell">
                    <div className="text-accent-green text-[10px] font-mono tabular-nums">₹{s.high?.toLocaleString("en-IN",{minimumFractionDigits:2}) || "—"}</div>
                    <div className="text-accent-red text-[10px] font-mono tabular-nums">₹{s.low?.toLocaleString("en-IN",{minimumFractionDigits:2}) || "—"}</div>
                  </td>
                  <td className="px-3 py-3 text-right hidden md:table-cell">
                    <span className="font-mono text-[10px] text-text-secondary">{formatCurrency(s.marketCap)}</span>
                  </td>
                  <td className="px-3 py-3 text-right hidden lg:table-cell">
                    <div className="font-mono text-[10px] text-text-secondary">{formatVolume(s.volume)}</div>
                    {s.avgVolume>0 && <div className="font-mono text-[9px] text-text-muted">avg {formatVolume(s.avgVolume)}</div>}
                  </td>
                  <td className="px-3 py-3 text-right hidden xl:table-cell">
                    <span className="font-mono text-[10px] text-text-secondary">{s.pe ?? "—"}</span>
                  </td>
                  <td className="px-3 py-3 hidden xl:table-cell pr-4">
                    <div className="w-36">
                      <div className="h-1.5 bg-bg-elevated rounded-full overflow-hidden mb-0.5">
                        <div className="h-full bg-gradient-to-r from-accent-red via-accent-amber to-accent-green rounded-full w-full opacity-40"/>
                        <div className="h-full -mt-1.5 flex items-center pr-1.5" style={{paddingLeft:`${Math.max(2,Math.min(98,r52))}%`}}>
                          <div className="w-1.5 h-1.5 rounded-full bg-white -ml-0.5 border border-accent-blue shadow-sm shrink-0"/>
                        </div>
                      </div>
                      <div className="flex justify-between text-[8px] font-mono text-text-muted">
                        <span>L: {s.fiftyTwoWeekLow.toLocaleString("en-IN")}</span>
                        <span>H: {s.fiftyTwoWeekHigh.toLocaleString("en-IN")}</span>
                      </div>
                    </div>
                  </td>
                </tr>,
                isExp && (
                  <tr key={`${s.symbol}-detail`} className="bg-bg-elevated/30 border-b border-border-subtle/30">
                    <td colSpan={9} className="px-5 py-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs font-mono">
                        {[
                          ["Open",          s.open ? `₹${s.open.toLocaleString("en-IN",{minimumFractionDigits:2})}` : "—"],
                          ["Prev Close",    s.previousClose ? `₹${s.previousClose.toLocaleString("en-IN",{minimumFractionDigits:2})}` : "—"],
                          ["P/E Ratio",     s.pe || "—"],
                          ["P/B Ratio",     s.pb || "—"],
                          ["EPS (TTM)",     s.eps ? `₹${s.eps}` : "—"],
                          ["Div Yield",     s.dividendYield ? `${s.dividendYield}%` : "Nil"],
                          ["Beta",          s.beta || "—"],
                          ["52W High",      s.fiftyTwoWeekHigh ? `₹${s.fiftyTwoWeekHigh.toLocaleString("en-IN",{minimumFractionDigits:2})}` : "—"],
                          ["52W Low",       s.fiftyTwoWeekLow  ? `₹${s.fiftyTwoWeekLow.toLocaleString("en-IN",{minimumFractionDigits:2})}` : "—"],
                          ["Index Weight",  s.weight ? `${s.weight}%` : "0%"],
                          ["FFMC (Lakh Cr)", s.ffmc ? (s.ffmc/100000).toFixed(2) : "—"],
                          ["Avg Vol (Lakhs)", formatVolume(s.avgVolume)],
                        ].map(([l,v])=>(
                          <div key={l} className="bg-bg-card rounded-lg px-3 py-2">
                            <div className="text-text-muted text-[9px] uppercase tracking-wider mb-0.5">{l}</div>
                            <div className="text-text-primary font-500">{v}</div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-end">
                        <a href={`/charts?symbol=${s.symbol}`} 
                           className="flex items-center gap-2 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/20 px-4 py-2 rounded-xl text-xs font-mono font-700 transition-all">
                          <BarChart2 size={13}/> Open Advanced Chart
                        </a>
                      </div>
                    </td>
                  </tr>
                )
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
