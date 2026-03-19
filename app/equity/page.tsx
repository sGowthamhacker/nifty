"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ArrowUp, ArrowDown, RefreshCw, BarChart2, TrendingUp,
  Building2, Calendar, FileText, Activity, Clock, AlertCircle,
  ChevronDown, Search, Loader2, BookOpen, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SYMBOL_MAP as NIFTY50_META } from "@/lib/symbols";

/* ─── Tab definitions ────────────────────────────────────── */
const TABS = [
  { id:"equity",     label:"Equity",         icon:TrendingUp },
  { id:"trade",      label:"Derivatives",    icon:Layers     },
  { id:"corporate",  label:"Corporate",      icon:Building2  },
  { id:"historical", label:"Historical Data",icon:Calendar   },
  { id:"intraday",   label:"Intraday Chart", icon:Activity   },
];

const fmtN  = (n: number | null | undefined, d = 2) =>
  n == null ? "—" : n.toLocaleString("en-IN", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtCr = (n: number | null | undefined) =>
  n == null ? "—" : n >= 1e7 ? `₹${(n/1e7).toFixed(2)} Cr` : n >= 1e5 ? `₹${(n/1e5).toFixed(2)} L` : `₹${n.toLocaleString("en-IN")}`;
const fmtVol= (v: number) =>
  v >= 1e7 ? `${(v/1e7).toFixed(2)} Cr` : v >= 1e5 ? `${(v/1e5).toFixed(2)} L` : v.toLocaleString("en-IN");

/* ─── Stock selector ─────────────────────────────────────── */
const STOCKS = Object.entries(NIFTY50_META).map(([sym, info]) => ({
  symbol: sym, name: info.name, sector: info.sector,
}));

function StockEquityPage() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const initSym      = (searchParams.get("symbol") || "RELIANCE").toUpperCase();

  const [symbol,   setSymbol]   = useState(initSym);
  const [tab,      setTab]      = useState("equity");
  const [data,     setData]     = useState<any>(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");
  const [search,   setSearch]   = useState("");
  const [showDrop, setShowDrop] = useState(false);
  
  const [allIndices, setAllIndices] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("Broad Market");
  const [activeIdxName, setActiveIdxName] = useState("NIFTY 50");
  const [idxStocks, setIdxStocks] = useState<any[]>(STOCKS);
  const [idxLoading, setIdxLoading] = useState(false);
  
  const dropRef = useRef<HTMLDivElement>(null);

  // 1. Load indices list
  useEffect(() => {
    fetch("/api/indices").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setAllIndices(data);
    }).catch(console.error);
  }, []);

  // 2. Load constituents when selected index changes
  useEffect(() => {
    if (!showDrop) return;
    setIdxLoading(true);
    fetch(`/api/index-detail?index=${encodeURIComponent(activeIdxName)}&timeframe=1D`)
      .then(r => r.json())
      .then(d => {
        const list = d.indexStats?.constituents || [];
        if (list.length > 0) {
           setIdxStocks(list.map((s:any) => ({
             symbol: s.symbol,
             name: s.symbol, // name might not be in constituents api
             sector: "---"
           })));
        }
      })
      .catch(console.error)
      .finally(() => setIdxLoading(false));
  }, [activeIdxName, showDrop]);

  const categories = ["Broad Market", "Sectoral", "Thematic", "Strategy", "Market Cap"];
  const indicesForCat = allIndices.filter(i => i.category === activeCategory);

  const load = useCallback(async (sym: string, section: string) => {
    setLoading(true); setError(""); setData(null);
    try {
      const params: Record<string, string> = { symbol: sym, section };
      if (section === "historical") params.days = "365";
      const qs  = new URLSearchParams(params).toString();
      const res = await fetch(`/api/equity?${qs}`, { cache: "no-store" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Error ${res.status}`);
      }
      const d = await res.json();
      setData(d);
    } catch (e: any) {
      setError(e.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(symbol, tab); }, [symbol, tab, load]);

  // Close dropdown on outside click
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setShowDrop(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  const filteredStocks = STOCKS.filter(s =>
    s.symbol.toLowerCase().includes(search.toLowerCase()) ||
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const selectSymbol = (sym: string) => {
    setSymbol(sym); setShowDrop(false); setSearch("");
    router.push(`/equity?symbol=${sym}`, { scroll: false });
  };

  const info = NIFTY50_META[symbol];
  const p    = data?.price;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Symbol dropdown */}
          <div className="relative" ref={dropRef}>
            <button onClick={() => setShowDrop(!showDrop)}
              className="flex items-center gap-2 bg-bg-card border border-border-subtle hover:border-accent-blue/40 rounded-xl px-4 py-2.5 transition-all group">
              <div className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center text-[10px] font-mono font-700 text-text-secondary">
                {symbol.slice(0,2)}
              </div>
              <div className="text-left">
                <p className="font-display font-700 text-text-primary text-base leading-none">{symbol}</p>
                <p className="text-text-muted text-[10px] font-body">{info?.name || symbol}</p>
              </div>
              <ChevronDown size={14} className={cn("text-text-muted ml-1 transition-transform", showDrop && "rotate-180")}/>
            </button>

            {showDrop && (
              <div className="absolute top-full mt-1 left-0 w-[450px] bg-bg-card border border-border-default rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[600px] animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Search & Category Header */}
                <div className="p-4 border-b border-border-subtle bg-bg-secondary/30">
                  <div className="relative mb-3">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"/>
                    <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Search symbols in selected index…"
                      className="w-full bg-bg-elevated border border-border-subtle pl-10 pr-4 py-2.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-accent-blue/20 rounded-xl transition-all"/>
                  </div>
                  
                  {/* Category Filter */}
                  <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
                    {categories.map(c => (
                      <button key={c} onClick={() => setActiveCategory(c)}
                        className={cn("px-3 py-1.5 rounded-lg text-[10px] font-mono whitespace-nowrap border transition-all",
                          activeCategory === c 
                            ? "bg-accent-blue/10 border-accent-blue/50 text-accent-blue font-700" 
                            : "bg-bg-elevated border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default")}>
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex h-[400px]">
                  {/* Sidebar - Indices in Category */}
                  <div className="w-40 border-r border-border-subtle bg-bg-secondary/20 overflow-y-auto custom-scrollbar">
                    <div className="p-1">
                      {indicesForCat.map(idx => (
                        <button key={idx.indexName} onClick={() => setActiveIdxName(idx.indexName)}
                          className={cn("w-full text-left px-3 py-2.5 rounded-lg text-[10px] font-mono transition-all mb-0.5",
                            activeIdxName === idx.indexName 
                              ? "bg-accent-blue/10 text-accent-blue border-l-2 border-accent-blue" 
                              : "text-text-muted hover:bg-bg-elevated hover:text-text-primary")}>
                          {idx.indexName}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stock List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {idxLoading ? (
                      <div className="flex flex-col items-center justify-center h-full gap-2 opacity-50">
                        <Loader2 size={16} className="animate-spin text-accent-blue"/>
                        <span className="text-[10px] font-mono">Syncing List...</span>
                      </div>
                    ) : (
                      <div className="py-1">
                        {(idxStocks.filter(s => s.symbol.toLowerCase().includes(search.toLowerCase())).length > 0) ? (
                          idxStocks
                            .filter(s => s.symbol.toLowerCase().includes(search.toLowerCase()))
                            .map(s => (
                              <button key={s.symbol} onClick={() => selectSymbol(s.symbol)}
                                className={cn("w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-elevated transition-all text-left group",
                                  s.symbol === symbol && "bg-accent-blue/5")}>
                                <div className="w-8 h-8 rounded-xl bg-bg-elevated flex items-center justify-center text-[10px] font-mono font-800 text-text-secondary group-hover:bg-bg-secondary group-hover:text-accent-blue transition-all">
                                  {s.symbol.slice(0,2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-text-primary text-xs font-700 group-hover:text-accent-blue transition-colors">{s.symbol}</p>
                                  <p className="text-text-muted text-[10px] truncate opacity-60">Equity · {activeIdxName}</p>
                                </div>
                              </button>
                            ))
                        ) : (
                          <div className="px-4 py-10 text-center">
                            <p className="text-text-muted text-[11px] font-mono">No stocks found in this index.</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Live price badge */}
          {p && (
            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl border",
              p.pChange >= 0 ? "bg-accent-green/8 border-accent-green/20" : "bg-accent-red/8 border-accent-red/20")}>
              <span className="font-display font-800 text-xl text-text-primary tabular-nums">
                ₹{fmtN(p.lastPrice)}
              </span>
              <div className={cn("text-sm font-mono font-600", p.pChange >= 0 ? "text-accent-green" : "text-accent-red")}>
                {p.pChange >= 0 ? <ArrowUp size={13} className="inline"/> : <ArrowDown size={13} className="inline"/>}
                {p.pChange >= 0 ? "+" : ""}{fmtN(p.change)} ({p.pChange >= 0 ? "+" : ""}{fmtN(p.pChange)}%)
              </div>
            </div>
          )}
        </div>

        <button onClick={() => load(symbol, tab)}
          className={cn("p-2 rounded-xl bg-bg-card border border-border-subtle text-text-muted hover:text-text-primary transition-all", loading && "animate-spin")}>
          <RefreshCw size={14}/>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-bg-card border border-border-subtle rounded-xl p-1 flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn("flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-600 transition-all",
              tab === id ? "bg-accent-blue text-white shadow-sm" : "text-text-muted hover:text-text-primary hover:bg-bg-elevated")}>
            <Icon size={12}/> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-24 bg-bg-card border border-border-subtle rounded-2xl gap-3">
          <Loader2 size={20} className="animate-spin text-accent-blue"/>
          <span className="text-text-muted text-sm font-mono">Loading {symbol} {tab} data…</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 bg-bg-card border border-border-subtle rounded-2xl gap-3">
          <AlertCircle size={28} className="text-accent-red opacity-60"/>
          <p className="text-text-muted text-sm">{error}</p>
          <button onClick={() => load(symbol, tab)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-600 bg-accent-blue text-white hover:bg-accent-blue/90 transition-all">
            <RefreshCw size={13}/> Retry
          </button>
        </div>
      ) : data ? (
        <>
          {tab === "equity"     && <EquityTab     data={data}/>}
          {tab === "trade"      && <TradeTab       data={data}/>}
          {tab === "corporate"  && <CorporateTab   data={data}/>}
          {tab === "historical" && <HistoricalTab  data={data}/>}
          {tab === "intraday"   && <IntradayTab    data={data}/>}
        </>
      ) : null}
    </div>
  );
}

/* ─── Equity Tab ─────────────────────────────────────────── */
function EquityTab({ data }: { data: any }) {
  const p = data.price;
  const isPos = (p?.pChange ?? 0) >= 0;
  const r52 = p?.weekHigh && p?.weekLow
    ? ((p.lastPrice - p.weekLow) / (p.weekHigh - p.weekLow)) * 100 : 50;

  return (
    <div className="space-y-4">
      {/* Price card */}
      <div className={cn("bg-bg-card border rounded-2xl p-5 relative overflow-hidden",
        isPos ? "border-accent-green/20" : "border-accent-red/20")}>
        <div className={cn("absolute -top-20 -right-20 w-56 h-56 rounded-full blur-3xl opacity-10",
          isPos ? "bg-accent-green" : "bg-accent-red")}/>
        <div className="relative">
          <div className="flex items-start justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="font-display font-800 text-xl text-text-primary">{data.companyName}</h2>
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <span className="text-text-muted text-xs font-mono">{data.symbol}</span>
                <span className="text-text-muted text-xs">·</span>
                <span className="text-text-muted text-xs font-mono">{data.isin}</span>
                <span className="text-[10px] bg-accent-blue/10 text-accent-blue px-2 py-0.5 rounded font-mono">{data.series}</span>
                {data.isFNO && <span className="text-[10px] bg-accent-amber/10 text-accent-amber px-2 py-0.5 rounded font-mono">F&O</span>}
                {data.isSLB && <span className="text-[10px] bg-accent-purple/10 text-accent-purple px-2 py-0.5 rounded font-mono">SLB</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-text-muted text-[10px] font-mono">Last Updated</p>
              <p className="text-text-muted text-xs">{data.lastUpdateTime}</p>
              <p className={cn("text-[10px] font-mono mt-0.5", data.tradingStatus === "Active" ? "text-accent-green" : "text-accent-red")}>
                ● {data.tradingStatus}
              </p>
            </div>
          </div>

          {p && (
            <>
              {/* Big price */}
              <div className="flex items-end gap-3 mb-5">
                <span className="font-display font-800 text-5xl text-text-primary tabular-nums leading-none">
                  ₹{fmtN(p.lastPrice)}
                </span>
                <div className="pb-1">
                  <div className={cn("font-mono font-700 text-xl", isPos ? "text-accent-green" : "text-accent-red")}>
                    {isPos ? "+" : ""}{fmtN(p.change)} ({isPos ? "+" : ""}{fmtN(p.pChange)}%)
                  </div>
                  <p className="text-text-muted text-xs">vs prev close ₹{fmtN(p.previousClose)}</p>
                </div>
              </div>

              {/* OHLCV grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-4">
                {[
                  { label:"Open",       value:`₹${fmtN(p.open)}` },
                  { label:"Day High",   value:`₹${fmtN(p.intraDayHigh)}`, color:"green" },
                  { label:"Day Low",    value:`₹${fmtN(p.intraDayLow)}`,  color:"red"   },
                  { label:"Close",      value:`₹${fmtN(p.close)}` },
                  { label:"VWAP",       value:`₹${fmtN(p.vwap)}` },
                  { label:"Base Price", value:`₹${fmtN(p.basePrice)}` },
                  { label:"Lower CP",   value:p.lowerCP || "—" },
                  { label:"Upper CP",   value:p.upperCP || "—" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="bg-bg-elevated rounded-xl px-3 py-2.5">
                    <p className="text-text-muted text-[9px] font-mono uppercase tracking-wide mb-0.5">{label}</p>
                    <p className={cn("font-mono font-700 text-sm tabular-nums",
                      color === "green" ? "text-accent-green" : color === "red" ? "text-accent-red" : "text-text-primary")}>
                      {value}
                    </p>
                  </div>
                ))}
              </div>

              {/* 52-week range */}
              <div className="mb-4">
                <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1.5">
                  <span>52W Low: <span className="text-accent-red">₹{fmtN(p.weekLow)}</span> <span className="text-text-muted/60">({p.weekLowDate})</span></span>
                  <span className="text-text-muted">52-Week Range</span>
                  <span>52W High: <span className="text-accent-green">₹{fmtN(p.weekHigh)}</span> <span className="text-text-muted/60">({p.weekHighDate})</span></span>
                </div>
                <div className="relative h-2.5 bg-bg-elevated rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-accent-red via-accent-amber to-accent-green opacity-30 rounded-full"/>
                  <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-md border-2 border-accent-blue transition-all duration-700"
                    style={{ left:`calc(${Math.max(2, Math.min(98, r52))}% - 6px)` }}/>
                </div>
              </div>

              {/* Price bands */}
              <div className="flex items-center gap-3 text-xs font-mono text-text-muted">
                <span>Price Band: <span className="text-text-primary">{p.lowerCP} – {p.upperCP}</span></span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Company info grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard title="Company Info" icon={Building2}>
          {[
            ["Company",       data.companyName],
            ["Sector",        data.sector || data.industryInfo?.sector],
            ["Industry",      data.industry],
            ["Basic Industry",data.basicIndustry],
            ["Macro",         data.macro],
            ["Listing Date",  data.listingDate],
            ["ISIN",          data.isin],
            ["Series",        data.series],
          ].map(([l,v]) => v && (
            <InfoRow key={String(l)} label={String(l)} value={String(v)}/>
          ))}
        </InfoCard>

        <InfoCard title="Security Info" icon={FileText}>
          {[
            ["Face Value",    `₹${data.faceValue}`],
            ["Issued Size",   fmtVol(data.issuedSize || 0)],
            ["Board Status",  data.boardStatus],
            ["Trading Seg.",  data.segment],
            ["F&O",           data.isFNO ? "Yes" : "No"],
            ["SLB",           data.isSLB ? "Yes" : "No"],
            ["Derivatives",   data.derivatives || "—"],
            ["P/E",           data.pdSymbolPe ? fmtN(data.pdSymbolPe) : "—"],
            ["Sector P/E",    data.pdSectorPe ? fmtN(data.pdSectorPe) : "—"],
          ].map(([l,v]) => v && (
            <InfoRow key={String(l)} label={String(l)} value={String(v)}/>
          ))}
        </InfoCard>
      </div>

      {/* Pre-open market data */}
      {data.preOpen?.preopen?.length > 0 && (
        <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border-subtle">
            <Clock size={14} className="text-accent-amber"/>
            <h3 className="font-display font-600 text-text-primary text-sm">Pre-Open Market</h3>
            <span className="ml-auto text-xs font-mono text-text-muted">IEP: <span className="text-text-primary font-600">₹{fmtN(data.preOpen.IEP)}</span></span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border-subtle/50 text-[10px] font-mono text-text-muted uppercase bg-bg-secondary/20">
                  <th className="px-4 py-2 text-right">Price</th>
                  <th className="px-4 py-2 text-right">Buy Qty</th>
                  <th className="px-4 py-2 text-right">Sell Qty</th>
                  <th className="px-4 py-2 text-center">IEP</th>
                </tr>
              </thead>
              <tbody>
                {data.preOpen.preopen.slice(0, 10).map((row: any, i: number) => (
                  <tr key={i} className="border-b border-border-subtle/20 hover:bg-bg-elevated/30">
                    <td className="px-4 py-2 text-right font-mono text-text-primary tabular-nums">₹{fmtN(row.price)}</td>
                    <td className="px-4 py-2 text-right font-mono text-accent-green tabular-nums">{row.buyQty?.toLocaleString("en-IN") || "—"}</td>
                    <td className="px-4 py-2 text-right font-mono text-accent-red tabular-nums">{row.sellQty?.toLocaleString("en-IN") || "—"}</td>
                    <td className="px-4 py-2 text-center">{row.iep ? <span className="text-[9px] bg-accent-amber/15 text-accent-amber px-1.5 py-0.5 rounded font-mono">IEP</span> : ""}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-bg-elevated/40 text-[10px] font-mono font-700 text-text-secondary">
                  <td className="px-4 py-2 text-right">Total</td>
                  <td className="px-4 py-2 text-right text-accent-green">{data.preOpen.totalBuyQty?.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-2 text-right text-accent-red">{data.preOpen.totalSellQty?.toLocaleString("en-IN")}</td>
                  <td/>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Trade / Derivatives Tab ────────────────────────────── */
function TradeTab({ data }: { data: any }) {
  if (!data.orderBook) return <EmptyState msg="Trade data not available"/>;
  const ob = data.orderBook;
  const ti = data.tradeInfo;
  const di = data.deliveryInfo;
  const vr = data.valueAtRisk;

  return (
    <div className="space-y-4">
      {/* Order book */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bids */}
        <div className="bg-bg-card border border-accent-green/20 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
            <div className="w-2 h-2 rounded-full bg-accent-green"/>
            <span className="font-display font-600 text-text-primary text-sm">Buy Orders</span>
            <span className="ml-auto text-xs font-mono text-accent-green">{ob.totalBuyQty?.toLocaleString("en-IN")}</span>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="bg-bg-secondary/20 text-[10px] font-mono text-text-muted uppercase">
              <th className="px-4 py-2 text-right">#</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Quantity</th>
            </tr></thead>
            <tbody>
              {(ob.bids || []).slice(0,5).map((b: any, i: number) => (
                <tr key={i} className="border-t border-border-subtle/20">
                  <td className="px-4 py-2 text-right text-text-muted font-mono">{i+1}</td>
                  <td className="px-4 py-2 text-right font-mono font-600 text-accent-green tabular-nums">₹{fmtN(b.price)}</td>
                  <td className="px-4 py-2 text-right font-mono text-text-secondary tabular-nums">{b.quantity?.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Asks */}
        <div className="bg-bg-card border border-accent-red/20 rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
            <div className="w-2 h-2 rounded-full bg-accent-red"/>
            <span className="font-display font-600 text-text-primary text-sm">Sell Orders</span>
            <span className="ml-auto text-xs font-mono text-accent-red">{ob.totalSellQty?.toLocaleString("en-IN")}</span>
          </div>
          <table className="w-full text-xs">
            <thead><tr className="bg-bg-secondary/20 text-[10px] font-mono text-text-muted uppercase">
              <th className="px-4 py-2 text-right">#</th>
              <th className="px-4 py-2 text-right">Price</th>
              <th className="px-4 py-2 text-right">Quantity</th>
            </tr></thead>
            <tbody>
              {(ob.asks || []).slice(0,5).map((a: any, i: number) => (
                <tr key={i} className="border-t border-border-subtle/20">
                  <td className="px-4 py-2 text-right text-text-muted font-mono">{i+1}</td>
                  <td className="px-4 py-2 text-right font-mono font-600 text-accent-red tabular-nums">₹{fmtN(a.price)}</td>
                  <td className="px-4 py-2 text-right font-mono text-text-secondary tabular-nums">{a.quantity?.toLocaleString("en-IN")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Trade stats + Delivery + VaR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ti && (
          <InfoCard title="Trade Info" icon={BarChart2}>
            {[
              ["Total Volume",     fmtVol(ti.totalTradedVolume)],
              ["Traded Value",     fmtCr(ti.totalTradedValue * 1e5)],
              ["Market Cap",       fmtCr(ti.totalMarketCap * 1e5)],
              ["FFMC",             fmtCr(ti.ffmc * 1e5)],
              ["Impact Cost",      ti.impactCost?.toFixed(4)],
              ["Daily Volatility", ti.cmDailyVolatility + "%"],
              ["Annual Volatility",ti.cmAnnualVolatility + "%"],
              ["Active Series",    ti.activeSeries],
            ].map(([l,v]) => v && <InfoRow key={String(l)} label={String(l)} value={String(v)}/>)}
          </InfoCard>
        )}
        {di && (
          <InfoCard title="Delivery Info" icon={Activity}>
            {[
              ["Qty Traded",     di.quantityTraded?.toLocaleString("en-IN")],
              ["Delivery Qty",   di.deliveryQuantity?.toLocaleString("en-IN")],
              ["Delivery %",     di.deliveryToTradedQtyPct?.toFixed(2) + "%"],
              ["Date",           di.date],
            ].map(([l,v]) => v && <InfoRow key={String(l)} label={String(l)} value={String(v)}/>)}
          </InfoCard>
        )}
        {vr && (
          <InfoCard title="Risk / Margin" icon={AlertCircle}>
            {[
              ["Security VaR",      fmtN(vr.securityVar) + "%"],
              ["Index VaR",         fmtN(vr.indexVar) + "%"],
              ["VaR Margin",        fmtN(vr.varMargin) + "%"],
              ["Extreme Loss Mrgn", fmtN(vr.extremeLossMargin) + "%"],
              ["Adhoc Margin",      fmtN(vr.adhocMargin) + "%"],
              ["Applicable Margin", fmtN(vr.applicableMargin) + "%"],
            ].map(([l,v]) => v && <InfoRow key={String(l)} label={String(l)} value={String(v)}/>)}
          </InfoCard>
        )}
      </div>
    </div>
  );
}

/* ─── Corporate Tab ──────────────────────────────────────── */
function CorporateTab({ data }: { data: any }) {
  return (
    <div className="space-y-4">
      {/* Latest announcements */}
      {data.announcements?.length > 0 && (
        <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border-subtle">
            <BookOpen size={14} className="text-accent-blue"/>
            <h3 className="font-display font-600 text-text-primary text-sm">Latest Announcements</h3>
          </div>
          <div className="divide-y divide-border-subtle/30">
            {data.announcements.map((a: any, i: number) => (
              <div key={i} className="px-5 py-3 hover:bg-bg-elevated/30 transition-colors">
                <p className="text-text-primary text-sm">{a.subject}</p>
                <p className="text-text-muted text-xs font-mono mt-0.5">{a.broadcastdate}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Corporate actions */}
      {data.corporateActions?.length > 0 && (
        <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border-subtle">
            <Calendar size={14} className="text-accent-amber"/>
            <h3 className="font-display font-600 text-text-primary text-sm">Corporate Actions (Dividends, Bonus, Splits)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-bg-secondary/20 text-[10px] font-mono text-text-muted uppercase border-b border-border-subtle/50">
                <th className="px-4 py-2.5 text-left">Purpose</th>
                <th className="px-4 py-2.5 text-right">Ex-Date</th>
              </tr></thead>
              <tbody>
                {data.corporateActions.map((a: any, i: number) => (
                  <tr key={i} className="border-b border-border-subtle/20 hover:bg-bg-elevated/30">
                    <td className="px-4 py-2.5 text-text-primary">{a.purpose}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-text-secondary">{a.exdate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial results */}
      {data.financialResults?.length > 0 && (
        <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border-subtle">
            <FileText size={14} className="text-accent-green"/>
            <h3 className="font-display font-600 text-text-primary text-sm">Financial Results</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="bg-bg-secondary/20 text-[10px] font-mono text-text-muted uppercase border-b border-border-subtle/50">
                <th className="px-4 py-2.5 text-left">Period</th>
                <th className="px-4 py-2.5 text-right">Income</th>
                <th className="px-4 py-2.5 text-right">PAT</th>
                <th className="px-4 py-2.5 text-right">EPS</th>
                <th className="px-4 py-2.5 text-center hidden md:table-cell">Type</th>
              </tr></thead>
              <tbody>
                {data.financialResults.map((r: any, i: number) => (
                  <tr key={i} className="border-b border-border-subtle/20 hover:bg-bg-elevated/30">
                    <td className="px-4 py-2.5 font-mono text-text-muted">{r.to_date}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-text-primary">{r.income}</td>
                    <td className="px-4 py-2.5 text-right font-mono">
                      <span className={cn(parseFloat(r.proLossAftTax) >= 0 ? "text-accent-green" : "text-accent-red")}>
                        {r.proLossAftTax}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-text-secondary">{r.reDilEPS}</td>
                    <td className="px-4 py-2.5 text-center hidden md:table-cell">
                      <span className="text-[9px] bg-bg-elevated px-1.5 py-0.5 rounded font-mono text-text-muted">
                        {r.consolidated === "Yes" ? "Consol." : "Standalone"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Board meetings */}
      {data.boardMeetings?.length > 0 && (
        <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-border-subtle">
            <Building2 size={14} className="text-accent-purple"/>
            <h3 className="font-display font-600 text-text-primary text-sm">Board Meetings</h3>
          </div>
          <div className="divide-y divide-border-subtle/30">
            {data.boardMeetings.map((m: any, i: number) => (
              <div key={i} className="flex items-center justify-between px-5 py-3 hover:bg-bg-elevated/30 transition-colors">
                <p className="text-text-primary text-sm">{m.purpose}</p>
                <p className="text-text-muted text-xs font-mono shrink-0 ml-4">{m.meetingdate}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Historical Tab ─────────────────────────────────────── */
function HistoricalTab({ data }: { data: any }) {
  const rows = data.data || [];
  if (!rows.length) return <EmptyState msg="No historical data available"/>;

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-accent-blue"/>
          <h3 className="font-display font-600 text-text-primary text-sm">Historical Data</h3>
        </div>
        <span className="text-text-muted text-xs font-mono">{rows.length} records</span>
      </div>
      <div className="overflow-auto" style={{ maxHeight: 520 }}>
        <table className="w-full text-xs min-w-[700px]">
          <thead className="sticky top-0">
            <tr className="bg-bg-secondary text-[10px] font-mono text-text-muted uppercase border-b border-border-subtle">
              {["Date","Series","Open","High","Low","Close","VWAP","Volume","Traded Value","Trades","Delivery Qty","Del %"].map(h => (
                <th key={h} className="px-3 py-2.5 text-right first:text-left whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any, i: number) => {
              const isUp = r.close >= r.prevClose;
              return (
                <tr key={i} className="border-b border-border-subtle/15 hover:bg-bg-elevated/30 transition-colors">
                  <td className="px-3 py-2 font-mono text-text-muted whitespace-nowrap">{r.date?.split("T")[0] || r.date}</td>
                  <td className="px-3 py-2 font-mono text-text-muted text-right">{r.series || "EQ"}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary text-right tabular-nums">{fmtN(r.open)}</td>
                  <td className="px-3 py-2 font-mono text-accent-green text-right tabular-nums">{fmtN(r.high)}</td>
                  <td className="px-3 py-2 font-mono text-accent-red text-right tabular-nums">{fmtN(r.low)}</td>
                  <td className={cn("px-3 py-2 font-mono font-600 text-right tabular-nums", isUp ? "text-accent-green" : "text-accent-red")}>
                    {fmtN(r.close)}
                  </td>
                  <td className="px-3 py-2 font-mono text-text-secondary text-right tabular-nums">{fmtN(r.vwap)}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary text-right tabular-nums">{r.volume ? fmtVol(r.volume) : "—"}</td>
                  <td className="px-3 py-2 font-mono text-text-secondary text-right tabular-nums">{r.tradedValue ? `₹${fmtN(r.tradedValue/1e5, 2)}L` : "—"}</td>
                  <td className="px-3 py-2 font-mono text-text-muted text-right">{r.trades?.toLocaleString("en-IN") || "—"}</td>
                  <td className="px-3 py-2 font-mono text-text-muted text-right">{r.deliveryQty ? fmtVol(r.deliveryQty) : "—"}</td>
                  <td className="px-3 py-2 font-mono text-right">
                    {r.deliveryPct
                      ? <span className={cn("font-600", parseFloat(r.deliveryPct) > 50 ? "text-accent-green" : "text-text-secondary")}>
                          {fmtN(r.deliveryPct, 1)}%
                        </span>
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Intraday Chart Tab ─────────────────────────────────── */
function IntradayTab({ data }: { data: any }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<any>(null);
  const isInitialLoadRef = useRef(false);
  const candles      = data.candles || [];

  useEffect(() => {
    if (!containerRef.current || candles.length === 0) return;
    let destroyed = false;
    (async () => {
      const LW = await import("lightweight-charts");
      if (destroyed || !containerRef.current) return;
      const chart = LW.createChart(containerRef.current, {
        width:  containerRef.current.clientWidth,
        height: 500,
        layout: { background:{ type:LW.ColorType.Solid, color:"transparent" }, textColor:"#9AA0B4", fontFamily:"'JetBrains Mono',monospace", fontSize:11 },
        grid:   { vertLines:{color:"rgba(37,40,64,0.7)"}, horzLines:{color:"rgba(37,40,64,0.7)"} },
        crosshair: { mode:LW.CrosshairMode.Normal, vertLine:{color:"rgba(59,130,246,0.5)",labelBackgroundColor:"#1A1D27"}, horzLine:{color:"rgba(59,130,246,0.5)",labelBackgroundColor:"#1A1D27"} },
        rightPriceScale: { borderColor:"#252840", minimumWidth:80 },
        timeScale: { borderColor:"#252840", timeVisible:true, secondsVisible:false },
        handleScroll:{ mouseWheel:true, pressedMouseMove:true, horzTouchDrag:true, vertTouchDrag:true },
        handleScale:{ mouseWheel:true, pinch:true, axisPressedMouseMove: { time:true, price:true } },
        kineticScroll: { touch: true, mouse: true },
      });
      const series = chart.addAreaSeries({
        lineColor: "#3B82F6", topColor: "rgba(59,130,246,0.3)", bottomColor: "rgba(59,130,246,0.02)", lineWidth: 2,
      });
      series.setData(candles.map((c: any) => ({ time: c.time as any, value: c.value })));
      
      if (!isInitialLoadRef.current) {
        chart.timeScale().fitContent();
        isInitialLoadRef.current = true;
      }

      chartRef.current = chart;
      const ro = new ResizeObserver(() => { if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth }); });
      ro.observe(containerRef.current);
      return () => { destroyed = true; ro.disconnect(); chart.remove(); };
    })();
    return () => { destroyed = true; };
  }, [candles]);

  useEffect(() => {
    isInitialLoadRef.current = false;
  }, [data.symbol]);

  if (!candles.length) return <EmptyState msg="Intraday data not available (market may be closed)"/>;

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-accent-blue"/>
          <h3 className="font-display font-600 text-text-primary text-sm">Today's Intraday Chart</h3>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="text-text-muted">Close: <span className="text-text-primary font-600">₹{fmtN(data.closePrice)}</span></span>
          <span className="text-text-muted">{candles.length} points</span>
        </div>
      </div>
      <div ref={containerRef} className="w-full h-[500px]"/>
    </div>
  );
}

/* ─── Helpers ────────────────────────────────────────────── */
function InfoCard({ title, icon:Icon, children }: { title:string; icon:any; children:React.ReactNode }) {
  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border-subtle">
        <Icon size={13} className="text-accent-blue"/>
        <h3 className="font-display font-600 text-text-primary text-xs uppercase tracking-wide">{title}</h3>
      </div>
      <div className="px-4 py-3 space-y-1.5">{children}</div>
    </div>
  );
}
function InfoRow({ label, value }: { label:string; value:string }) {
  return (
    <div className="flex items-start justify-between gap-4 py-1 border-b border-border-subtle/30 last:border-0">
      <span className="text-text-muted text-xs shrink-0">{label}</span>
      <span className="text-text-primary text-xs font-500 text-right">{value}</span>
    </div>
  );
}
function EmptyState({ msg }: { msg:string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-bg-card border border-border-subtle rounded-2xl gap-3">
      <AlertCircle size={28} className="text-text-muted opacity-40"/>
      <p className="text-text-muted text-sm">{msg}</p>
    </div>
  );
}

export default function EquityPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-accent-blue"/>
      </div>
    }>
      <StockEquityPage/>
    </Suspense>
  );
}
