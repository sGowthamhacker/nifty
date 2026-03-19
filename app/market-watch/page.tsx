"use client";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { 
  BarChart2, ArrowUp, ArrowDown, RefreshCw, 
  Search, Download, Settings, Grid3X3, Layers, 
  BarChart, Clock, Database, ChevronDown, 
  Activity, ArrowRight, Share2, Filter,
  Monitor, Loader2, Globe, ChevronLeft
} from "lucide-react";
import Link from "next/link";
import { cn, formatVolume, formatCurrency, formatPrice } from "@/lib/utils";

const SEGMENTS = [
  { id: "equity",     label: "Equity/Stock",           icon: BarChart2 },
  { id: "indices",    label: "All Nifty Indices",      icon: Globe     },
  { id: "sme",        label: "SME Market",             icon: Monitor   },
  { id: "sgb",        label: "Sovereign Gold Bonds",   icon: Activity  },
  { id: "etf",        label: "Exchange Traded Funds",  icon: Grid3X3   },
  { id: "block",      label: "Block Deals",            icon: Database  },
];

const CATEGORIES = ["All", "Broad Market", "Sectoral", "Thematic", "Strategy", "Market Cap"];

const DENOMINATIONS = [
  { id: "lakhs",      label: "Lakhs",      factor: 1 },
  { id: "crores",     label: "Crores",     factor: 0.01 },
  { id: "billions",   label: "Billions",   factor: 0.1 }, 
];

interface MarketWatchParams {
  timestamp: string;
  marketStatus: "OPEN" | "CLOSED";
  advances: number;
  declines: number;
  unchanged: number;
  data: any[];
}

export default function MarketWatchPage() {
  const [segment, setSegment] = useState("equity");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeIndex, setActiveIndex] = useState("NIFTY 50");
  const [denomination, setDenomination] = useState("crores");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [marketData, setMarketData] = useState<MarketWatchParams | null>(null);
  const [sortKey, setSortKey] = useState<string>("value");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  
  const [allIndicesList, setAllIndicesList] = useState<any[]>([]);

  // Fetch indices list for the selector
  useEffect(() => {
    fetch("/api/indices").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAllIndicesList(data);
    }).catch(console.error);
  }, []);

  const load = useCallback(async (spin = false) => {
    if (spin) setRefreshing(true);
    try {
      const idxParam = segment === "equity" ? `&index=${encodeURIComponent(activeIndex)}` : "";
      const res  = await fetch(`/api/market-watch?segment=${segment}${idxParam}&t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      setMarketData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
      if (spin) setRefreshing(false);
    }
  }, [segment, activeIndex]);

  useEffect(() => {
    setLoading(true);
    load();
    const iv = setInterval(() => load(), 10000);
    return () => clearInterval(iv);
  }, [load]);

  const filtered = useMemo(() => {
    if (!marketData?.data) return [];
    return marketData.data
      .filter(s => {
        const matchSearch = s.symbol.toLowerCase().includes(search.toLowerCase());
        const matchCat = activeCategory === "All" || (segment === "indices" ? s.category === activeCategory : true);
        return matchSearch && matchCat;
      })
      .sort((a, b) => {
        const av = a[sortKey] ?? 0;
        const bv = b[sortKey] ?? 0;
        return sortDir === "asc" ? av - bv : bv - av;
      });
  }, [marketData, search, sortKey, sortDir, activeCategory, segment]);

  const handleSort = (k: string) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const currentDenom = DENOMINATIONS.find(d => d.id === denomination) || DENOMINATIONS[1];
  const indicesForCat = allIndicesList.filter(i => activeCategory === "All" || i.category === activeCategory);

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Symbol", "Open", "High", "Low", "Prev Close", "LTP", "Change", "%Change", "Volume", "Value (Cr)", "52W H", "52W L"];
    const rows = filtered.map(s => [
      s.symbol, s.open, s.high, s.low, s.prevClose, s.ltp, s.change, s.pChange, s.volume, s.value, s.h52, s.l52
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `MarketWatch_${segment}_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-fade-in max-w-[1600px] mx-auto px-4 sm:px-0">
      {/* Page Header with Back Button */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-3 sm:gap-4">
          <Link href="/dashboard" className="p-2.5 rounded-xl bg-bg-card border border-border-subtle hover:bg-bg-elevated text-text-muted hover:text-text-primary transition-all shrink-0 mt-1 shadow-sm active:scale-95">
            <ChevronLeft size={20}/>
          </Link>
          <div>
            <h1 className="font-display font-800 text-2xl sm:text-3xl text-text-primary tracking-tight">Market Analytics Watch</h1>
            <p className="text-text-muted text-xs sm:text-sm mt-0.5 font-mono">Real-time surveillance for NIFTY & broader market segments</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
          <div className="flex bg-bg-card border border-border-subtle rounded-xl p-0.5 shadow-inner w-full sm:w-auto">
            {DENOMINATIONS.map(d => (
              <button key={d.id} onClick={() => setDenomination(d.id)}
                className={cn("flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-[10px] font-mono font-700 uppercase transition-all whitespace-nowrap",
                  denomination === d.id ? "bg-accent-blue text-white shadow-glow-blue" : "text-text-muted hover:text-text-primary")}>
                {d.label}
              </button>
            ))}
          </div>
          <button onClick={exportCSV} className="flex flex-1 sm:flex-none items-center justify-center gap-2 bg-bg-card border border-border-subtle hover:bg-bg-elevated px-4 py-2 rounded-xl text-xs font-mono text-text-primary border-b-2 active:border-b-0 active:translate-y-[2px] transition-all shadow-sm">
            <Download size={14} className="text-accent-blue"/> CSV
          </button>
        </div>
      </div>

      {/* Segment Selector Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
        {SEGMENTS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { setSegment(id); if(id !== "indices") setActiveCategory("All"); }}
            className={cn("flex items-center gap-3 px-4 py-3 border rounded-2xl transition-all relative group overflow-hidden",
              segment === id 
                ? "bg-accent-blue/10 border-accent-blue shadow-glow-blue" 
                : "bg-bg-card border-border-subtle hover:border-border-default shadow-sm hover:shadow-md")}>
            <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all shadow-inner",
              segment === id ? "bg-accent-blue text-white" : "bg-bg-elevated text-text-muted group-hover:text-text-primary")}>
              <Icon size={16}/>
            </div>
            <span className={cn("text-xs font-700 leading-tight", segment === id ? "text-text-primary" : "text-text-secondary")}>{label}</span>
            {segment === id && <div className="absolute top-0 right-0 w-2 h-2 bg-accent-blue rounded-bl-lg animate-pulse"/>}
          </button>
        ))}
      </div>

      {/* Sub-Category & Index Selection (Dynamic) - Premium Scrolling */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl shadow-sm flex flex-col divide-y divide-border-subtle/30 overflow-hidden">
        {/* Category Row */}
        <div className="relative group/cat">
          <div className="flex items-center gap-2 overflow-x-auto p-4 no-scrollbar scroll-smooth relative z-10">
            <span className="text-[10px] font-mono font-800 text-text-muted uppercase tracking-wider mr-3 shrink-0 py-1 border-r border-border-subtle pr-3">Category</span>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className={cn("px-4 py-2 rounded-xl text-[11px] font-mono whitespace-nowrap border transition-all shadow-sm active:scale-95",
                  activeCategory === c 
                    ? "bg-accent-blue text-white border-accent-blue shadow-glow-blue" 
                    : "bg-bg-secondary/50 border-border-subtle text-text-secondary hover:text-text-primary hover:border-border-default")}>
                {c}
              </button>
            ))}
          </div>
          {/* Edge Gradients */}
          <div className="absolute top-0 right-0 bottom-0 w-20 bg-gradient-to-l from-bg-card to-transparent z-20 pointer-events-none opacity-0 group-hover/cat:opacity-100 transition-opacity hidden sm:block"/>
          <div className="absolute top-0 left-32 bottom-0 w-12 bg-gradient-to-r from-bg-card/80 to-transparent z-20 pointer-events-none opacity-0 group-hover/cat:opacity-100 transition-opacity hidden sm:block"/>
        </div>
        
        {segment === "equity" && (
          <div className="relative group/idx bg-bg-secondary/10">
            <div className="flex items-center gap-2 overflow-x-auto px-4 py-3 no-scrollbar scroll-smooth relative z-10">
              <div className="flex items-center shrink-0 py-1 border-r border-accent-blue/20 pr-3 mr-1">
                <span className="text-[10px] font-mono font-800 text-accent-blue uppercase tracking-wider">Watch Index</span>
              </div>
              <div className="flex items-center gap-1.5 min-w-max pr-24">
                {indicesForCat.length > 0 ? indicesForCat.map(idx => (
                  <button key={idx.indexName} onClick={() => setActiveIndex(idx.indexName)}
                    className={cn("px-3.5 py-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all border active:scale-95",
                      activeIndex === idx.indexName 
                        ? "bg-accent-blue/10 text-accent-blue font-800 border-accent-blue/30 shadow-[0_0_10px_rgba(0,112,243,0.1)]" 
                        : "text-text-muted hover:text-text-primary hover:bg-bg-elevated border-transparent")}>
                    {idx.indexName}
                  </button>
                )) : (
                  <div className="flex items-center gap-2 opacity-40">
                    <Loader2 size={10} className="animate-spin text-accent-blue"/>
                    <span className="text-[10px] font-mono text-text-muted italic">Scanning ecosystem...</span>
                  </div>
                )}
              </div>
            </div>
            {/* Edge Gradients - Only visible on hover/scroll to indicate depth */}
            <div className="absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l from-bg-secondary via-bg-secondary/80 to-transparent z-20 pointer-events-none opacity-0 group-hover/idx:opacity-100 transition-opacity hidden sm:block"/>
            <div className="absolute top-0 left-28 bottom-0 w-8 bg-gradient-to-r from-bg-secondary/40 to-transparent z-20 pointer-events-none opacity-0 group-hover/idx:opacity-100 transition-opacity hidden sm:block"/>
          </div>
        )}
      </div>

      {/* Market Pulse Banner */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-accent-blue/5 rounded-full blur-3xl opacity-50"/>
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative">
          <div className="flex items-center gap-4">
            <div className={cn("px-4 py-2.5 rounded-2xl border flex flex-col items-center justify-center min-w-[120px] shadow-inner", 
              marketData?.marketStatus === "OPEN" ? "bg-accent-green/10 border-accent-green/20" : "bg-accent-red/10 border-accent-red/20")}>
              <p className="text-[10px] font-mono font-700 text-text-muted uppercase tracking-wider mb-0.5">Status</p>
              <p className={cn("text-sm font-display font-800", marketData?.marketStatus === "OPEN" ? "text-accent-green" : "text-accent-red")}>
                MARKET {marketData?.marketStatus || "---"}
              </p>
            </div>
            <div>
              <p className="text-text-primary font-display font-800 text-base leading-none">
                {segment === "equity" ? `${activeIndex} Constituents` : segment === "indices" ? "All Nifty Indices Pulse" : SEGMENTS.find(s=>s.id===segment)?.label}
              </p>
              <p className="text-text-muted text-[11px] font-mono mt-1 opacity-80 flex items-center gap-1.5">
                <Clock size={11}/> {marketData?.timestamp ? `As on 17-Mar-2026 ${marketData.timestamp} IST` : "Syncing market state..."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-8 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="text-center bg-bg-elevated/40 border border-border-subtle/50 px-4 py-1.5 rounded-xl shadow-sm">
                <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-0.5">Advances</p>
                <p className="text-accent-green font-display font-800 text-lg leading-none">{marketData?.advances ?? "--"}</p>
              </div>
              <div className="text-center bg-bg-elevated/40 border border-border-subtle/50 px-4 py-1.5 rounded-xl shadow-sm">
                <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-0.5">Declines</p>
                <p className="text-accent-red font-display font-800 text-lg leading-none">{marketData?.declines ?? "--"}</p>
              </div>
              <div className="text-center bg-bg-elevated/40 border border-border-subtle/50 px-4 py-1.5 rounded-xl shadow-sm">
                <p className="text-[9px] font-mono text-text-muted uppercase tracking-widest mb-0.5">No Change</p>
                <p className="text-text-muted font-display font-800 text-lg leading-none">{marketData?.unchanged ?? "--"}</p>
              </div>
            </div>
            
            <button onClick={() => load(true)} className={cn("flex flex-col items-center justify-center p-3 rounded-2xl bg-bg-elevated hover:bg-bg-secondary border border-border-subtle transition-all active:scale-95 group shadow-sm", refreshing && "opacity-50 pointer-events-none")}>
              <RefreshCw size={18} className={cn("text-accent-blue mb-1 group-hover:rotate-180 transition-transform duration-700", refreshing && "animate-spin")}/>
              <span className="text-[9px] font-mono font-700 text-text-muted uppercase">Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden shadow-2xl border-b-0">
        <div className="px-6 py-5 border-b border-border-subtle flex flex-col md:flex-row md:items-center justify-between gap-4 bg-bg-secondary/40">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${filtered.length} symbols...`}
              className="w-full bg-bg-elevated border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/10 transition-all"/>
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 bg-bg-elevated md:bg-transparent border md:border-0 border-border-subtle px-3 py-2 md:p-0 rounded-xl text-[10px] font-mono text-text-muted">
               <span className="w-1.5 h-1.5 rounded-full bg-accent-blue animate-pulse"/> Tracking {filtered.length} Live Items
             </div>
             <button className="p-2.5 rounded-xl bg-bg-elevated border border-border-subtle text-text-muted hover:text-text-primary transition-all">
               <Settings size={14}/>
             </button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar pb-4">
          <table className="w-full text-left border-collapse table-fixed min-w-[1650px]">
            <thead>
              <tr className="bg-bg-secondary/60 text-[10px] font-mono text-text-muted uppercase tracking-widest border-b border-border-subtle/70">
                <th className="px-6 py-4 w-56 cursor-pointer hover:text-text-primary select-none whitespace-nowrap" onClick={() => handleSort("symbol")}>
                  {segment === "indices" ? "Index Name" : "Symbol"} {sortKey==="symbol" && <ChevronDown size={10} className={cn("inline ml-1", sortDir==="asc" && "rotate-180")}/>}
                </th>
                <th className="px-4 py-4 text-right w-24">Open</th>
                <th className="px-4 py-4 text-right w-24">High</th>
                <th className="px-4 py-4 text-right w-24">Low</th>
                <th className="px-4 py-4 text-right w-32 uppercase">Prev. Close</th>
                <th className="px-4 py-4 text-right w-32 font-800 text-text-secondary uppercase">LTP</th>
                <th className="px-4 py-4 text-right w-36 text-[9px] leading-tight text-text-muted">Indicative Close</th>
                <th className="px-4 py-4 text-right w-28 cursor-pointer hover:text-text-primary select-none" onClick={() => handleSort("change")}>chng {sortKey==="change" && <ChevronDown size={10} className={cn("inline ml-1", sortDir==="asc" && "rotate-180")}/>}</th>
                <th className="px-4 py-4 text-right w-24">%Chng</th>
                <th className="px-4 py-4 text-right w-40">{segment === "indices" ? "Total Volume" : "Volume (shares)"}</th>
                <th className="px-4 py-4 text-right w-44">Value (₹ {denomination==="crores" ? "Crores" : denomination==="lakhs" ? "Lakhs" : "Billions"})</th>
                <th className="px-4 py-4 text-right w-32">52W H</th>
                <th className="px-4 py-4 text-right w-32">52W L</th>
                <th className="px-4 py-4 text-right w-32 pr-8 leading-tight">30 d %chng</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/40">
              {loading && !refreshing ? (
                [...Array(12)].map((_, i) => (
                  <tr key={i} className="animate-pulse border-b border-border-subtle/20">
                    {[...Array(14)].map((_, j) => <td key={j} className="px-4 py-5"><div className="h-4 bg-bg-elevated rounded w-full"/></td>)}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr><td colSpan={14} className="px-6 py-20 text-center text-text-muted font-mono text-sm">No live data found for this selection.</td></tr>
              ) : (
                filtered.map(s => {
                  const isPos = s.change >= 0;
                  const valueConv = s.value * currentDenom.factor;
                  return (
                    <tr key={s.symbol} className="hover:bg-bg-secondary/40 transition-colors group">
                      <td className="px-6 py-4.5">
                        <div className="flex flex-col">
                          <span className="text-text-primary text-xs font-800 group-hover:text-accent-blue transition-colors truncate">{s.symbol}</span>
                          <span className="text-[9px] font-mono text-text-muted uppercase opacity-60">
                            {segment === "indices" ? s.category : "EQ-NS"}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4.5 text-right font-mono text-xs text-text-secondary tabular-nums">{formatPrice(s.open)}</td>
                      <td className="px-4 py-4.5 text-right font-mono text-xs text-accent-green/80 tabular-nums">{formatPrice(s.high)}</td>
                      <td className="px-4 py-4.5 text-right font-mono text-xs text-accent-red/80 tabular-nums">{formatPrice(s.low)}</td>
                      <td className="px-4 py-4.5 text-right font-mono text-xs text-text-muted tabular-nums opacity-60">{formatPrice(s.prevClose)}</td>
                      <td className="px-4 py-4.5 text-right font-mono text-xs text-text-primary font-700 tabular-nums">{formatPrice(s.ltp)}</td>
                      <td className="px-4 py-4.5 text-right font-mono text-xs text-text-muted tabular-nums opacity-40">--</td>
                      <td className="px-4 py-4.5 text-right">
                        <span className={cn("text-xs font-800 font-mono", isPos ? "text-accent-green" : "text-accent-red")}>
                          {isPos ? "+" : ""}{s.change.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-4 py-4.5 text-right">
                        <span className={cn("text-[10px] font-mono px-1.5 py-0.5 rounded border leading-none", 
                          isPos ? "bg-accent-green/10 text-accent-green border-accent-green/20" : "bg-accent-red/10 text-accent-red border-accent-red/20")}>
                          {isPos ? "+" : ""}{s.pChange.toFixed(2)}%
                        </span>
                      </td>
                      <td className="px-4 py-4.5 text-right font-mono text-xs text-text-secondary tabular-nums opacity-80">{formatVolume(s.volume)}</td>
                      <td className="px-4 py-4.5 text-right font-mono text-xs text-text-primary font-600 tabular-nums">{valueConv.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      <td className="px-4 py-4.5 text-right font-mono text-xs text-accent-green/90 opacity-80 tabular-nums">{formatPrice(s.h52)}</td>
                      <td className="px-4 py-4.5 text-right font-mono text-xs text-accent-red/90 opacity-80 tabular-nums">{formatPrice(s.l52)}</td>
                      <td className="px-4 py-4.5 text-right pr-8">
                        <span className={cn("text-[11px] font-mono font-700", parseFloat(s.p30d) >= 0 ? "text-accent-green" : "text-accent-red")}>
                          {parseFloat(s.p30d) >= 0 ? "+" : ""}{s.p30d}%
                        </span>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer Disclaimer */}
      <div className="flex items-center justify-between px-2 pt-2">
        <p className="text-[10px] font-mono text-text-muted uppercase tracking-widest opacity-60">NIFTY50 Analytics Terminal · v2.5.0-Cat-Pulse</p>
        <div className="flex items-center gap-4 text-[10px] font-mono text-text-muted">
           <span className="flex items-center gap-1.5"><Monitor size={10}/> Global Markets Gateway</span>
           <span className="flex items-center gap-1.5 whitespace-nowrap"><Globe size={10}/> {segment === "indices" ? "Multi-Index Tracking" : "Full NSE Universe"}</span>
        </div>
      </div>
    </div>
  );
}
