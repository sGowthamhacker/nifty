"use client";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  TrendingUp, TrendingDown, RefreshCw, Search, ArrowUp,
  ArrowDown, BarChart2, ChevronDown, ChevronRight, Activity,
  X, Maximize2, Info, LineChart
} from "lucide-react";
import { cn, formatPrice, formatVolume, formatCurrency } from "@/lib/utils";

/* ─── Types ─────────────────────────────────────────────── */
interface IndexRow {
  indexName: string; category: string;
  last: number; open: number; high: number; low: number;
  previousClose: number; change: number; percChange: number;
  totalTradedVolume: number; totalTradedValue: number;
  ffmc_sum: number; yearHigh: number; yearLow: number; timeVal: string;
  pe?: number; pb?: number;
}
interface IndexDetail {
  indexName: string; last: number; open: number; high: number; low: number;
  previousClose: number; change: number; percChange: number;
  yearHigh: number; yearLow: number;
  totalTradedVolume: number; totalTradedValue: number; ffmc_sum: number;
  perChange30d: number; perChange365d: number;
  advances: number; declines: number; unchanged: number;
  timestamp: string; constituents: any[];
  pe?: number; pb?: number;
}
interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number; }

const CATEGORIES = ["All","Broad Market","Market Cap","Sectoral","Thematic","Strategy","Mid/Small","Shariah"];
const TIMEFRAMES  = ["1D","5D","1M","3M","6M","1Y","2Y","5Y","MAX"];
const CHART_TYPES = ["Candle","Line","Area"];

/* ─── Formatters ─────────────────────────────────────────── */
const fmtN   = (n: number, d = 2) => formatPrice(n || 0, d);
const fmtVol = (v: number) => formatVolume(v);
const fmtVal = (v: number) => formatCurrency(v);
const fmtCap = (v: number) => v >= 1 ? `${(v/100000).toFixed(2)} L Cr` : `—`;

/* ─── Main Page ──────────────────────────────────────────── */
export default function IndicesPage() {
  const [indices,     setIndices]     = useState<IndexRow[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [search,      setSearch]      = useState("");
  const [category,    setCategory]    = useState("All");
  const [selected,    setSelected]    = useState<IndexRow | null>(null);
  const [lastUpdate,  setLastUpdate]  = useState<Date | null>(null);
  const [sortKey,     setSortKey]     = useState<"percChange" | "last" | "totalTradedValue">("percChange");
  const [sortDir,     setSortDir]     = useState<"asc" | "desc">("desc");

  const load = useCallback(async (spin = false) => {
    if (spin) setRefreshing(true);
    try {
      const res  = await fetch(`/api/indices?t=${Date.now()}`, { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data)) { 
        setIndices(data); 
        setLastUpdate(new Date()); 
      }
    } catch (e) { console.error(e); }
    finally { setLoading(false); if (spin) setRefreshing(false); }
  }, []);

  useEffect(() => {
    load();
    const iv = setInterval(load, 2000); // Live update like Dashboard
    return () => clearInterval(iv);
  }, [load]);

  // Auto-select NIFTY 50 on load
  useEffect(() => {
    if (indices.length > 0 && !selected) {
      const nifty50 = indices.find(i => i.indexName === "NIFTY 50");
      if (nifty50) setSelected(nifty50);
    }
  }, [indices, selected]);

  const filtered = useMemo(() => {
    return indices
      .filter(i => {
        const q = search.toLowerCase();
        const matchCat = category === "All" || i.category === category;
        const matchQ   = i.indexName.toLowerCase().includes(q);
        return matchCat && matchQ;
      })
      .sort((a, b) => {
        const av = a[sortKey] ?? 0;
        const bv = b[sortKey] ?? 0;
        return sortDir === "asc" ? av - bv : bv - av;
      });
  }, [indices, search, category, sortKey, sortDir]);

  const handleSort = (k: typeof sortKey) => {
    if (sortKey === k) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(k); setSortDir("desc"); }
  };

  const advances = indices.filter(i => i.percChange > 0).length;
  const declines = indices.filter(i => i.percChange < 0).length;
  const unchanged= indices.length - advances - declines;

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-800 text-2xl text-text-primary tracking-tight flex items-center gap-2">
            <Activity size={20} className="text-accent-blue"/> NSE Indices
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            {indices.length} indices · Live data · Updates every 2s
            {lastUpdate && <span className="ml-2 text-[11px]">· {lastUpdate.toLocaleTimeString("en-IN")}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-3 bg-bg-card border border-border-subtle rounded-xl px-3 py-1.5 text-xs font-mono">
            <span className="text-accent-green font-600">▲ {advances}</span>
            <span className="text-text-muted">{unchanged} Unch</span>
            <span className="text-accent-red font-600">{declines} ▼</span>
          </div>
          <button onClick={() => load(true)}
            className={cn("p-2 rounded-xl bg-bg-card border border-border-subtle text-text-muted hover:text-text-primary transition-all", refreshing && "animate-spin")}>
            <RefreshCw size={14}/>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
        <div className="xl:col-span-2 flex flex-col gap-3">
          <div className="bg-bg-card border border-border-subtle rounded-2xl p-3 space-y-2">
            <div className="relative">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"/>
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search indices..."
                className="w-full bg-bg-elevated border border-border-subtle rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50"/>
            </div>
            <div className="flex flex-wrap gap-1">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={cn("px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all",
                    category === c ? "bg-accent-blue text-white font-700" : "bg-bg-elevated text-text-muted hover:text-text-primary")}>
                  {c}
                </button>
              ))}
            </div>
            <div className="flex gap-2 text-[10px] font-mono text-text-muted pt-1">
              <span>Sort by:</span>
              {[["percChange","% Change"],["last","Price"],["totalTradedValue","Value"]] .map(([k,l]) => (
                <button key={k} onClick={() => handleSort(k as typeof sortKey)}
                  className={cn("flex items-center gap-0.5 transition-colors", sortKey === k ? "text-accent-blue" : "hover:text-text-primary")}>
                  {l}
                  {sortKey === k && (sortDir === "asc" ? <ChevronDown size={9}/> : <ChevronDown size={9} className="rotate-180"/>)}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
            <div className="overflow-y-auto" style={{ maxHeight: "70vh" }}>
              {loading ? (
                [...Array(12)].map((_, i) => (
                  <div key={i} className="px-4 py-3 border-b border-border-subtle/30 flex items-center gap-3">
                    <div className="flex-1 skeleton h-4 rounded"/>
                    <div className="skeleton h-4 w-20 rounded"/>
                    <div className="skeleton h-4 w-14 rounded"/>
                  </div>
                ))
              ) : filtered.map((idx) => {
                const pos  = idx.percChange >= 0;
                const isSelected = selected?.indexName === idx.indexName;
                const r52  = idx.yearHigh > idx.yearLow
                  ? ((idx.last - idx.yearLow) / (idx.yearHigh - idx.yearLow)) * 100
                  : 50;

                return (
                  <div key={idx.indexName}
                    onClick={() => setSelected(idx)}
                    className={cn("px-4 py-3 border-b border-border-subtle/20 cursor-pointer transition-all hover:bg-bg-elevated/50",
                      isSelected && "bg-accent-blue/8 border-l-2 border-accent-blue pl-[14px]")}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          {isSelected && <ChevronRight size={10} className="text-accent-blue shrink-0"/>}
                          <p className="text-text-primary text-xs font-600 truncate">{idx.indexName}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-mono text-text-muted bg-bg-elevated px-1.5 py-0.5 rounded">{idx.category}</span>
                          {idx.totalTradedValue > 0 && (
                            <span className="text-[9px] font-mono text-text-muted">{fmtVal(idx.totalTradedValue)}</span>
                          )}
                          {idx.pe && (
                            <span className="text-[9px] font-mono font-700 bg-accent-blue/10 text-accent-blue px-1 py-0.5 rounded">PE: {idx.pe.toFixed(1)}</span>
                          )}
                          {idx.pb && (
                            <span className="text-[9px] font-mono font-700 bg-bg-elevated text-text-muted px-1 py-0.5 rounded">PB: {idx.pb.toFixed(1)}</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-700 text-sm text-text-primary tabular-nums">
                          {fmtN(idx.last)}
                        </div>
                        <div className={cn("flex items-center justify-end gap-0.5 text-[10px] font-mono font-700",
                          pos ? "text-accent-green" : "text-accent-red")}>
                          {pos ? <ArrowUp size={9}/> : <ArrowDown size={9}/>}
                          {pos ? "+" : ""}{idx.percChange.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center text-[9px] font-mono text-text-muted mt-2 gap-1 sm:gap-2">
                      <span className="shrink-0">D: <span className="text-accent-red font-600">{fmtN(idx.low,0)}</span> - <span className="text-accent-green font-600">{fmtN(idx.high,0)}</span></span>
                      <span className="shrink-0 opacity-80 sm:opacity-100">52W: <span className="text-accent-red font-600">{fmtN(idx.yearLow,0)}</span> - <span className="text-accent-green font-600">{fmtN(idx.yearHigh,0)}</span></span>
                    </div>
                    <div className="mt-1 h-1 bg-bg-elevated rounded-full overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-accent-red via-accent-amber to-accent-green opacity-30 rounded-full"/>
                      <div className="absolute top-0 h-full w-0.5 bg-white rounded-full transition-all"
                        style={{ left: `${Math.max(1, Math.min(99, r52))}%` }}/>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="xl:col-span-3">
          {selected ? (
            <IndexDetailPanel index={selected} />
          ) : (
            <div className="bg-bg-card border border-border-subtle rounded-2xl h-96 flex items-center justify-center">
              <div className="text-center text-text-muted">
                <BarChart2 size={40} className="mx-auto mb-3 opacity-30"/>
                <p className="text-sm font-body">Select an index to view chart & details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Index Detail Panel ─────────────────────────────────── */
function IndexDetailPanel({ index }: { index: IndexRow }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<any>(null);
  const seriesRef    = useRef<any>(null);
  const volRef       = useRef<any>(null);
  const isInitialLoadRef = useRef(false);
  const lastTypeRef      = useRef<string>("");

  const [detail,     setDetail]     = useState<IndexDetail | null>(null);
  const [candles,    setCandles]    = useState<Candle[]>([]);
  const [timeframe,  setTimeframe]  = useState("1M");
  const [chartType,  setChartType]  = useState("Candle");
  const [loading,    setLoading]    = useState(true);
  const [chartReady, setChartReady] = useState(false);
  const [hover,      setHover]      = useState<any>(null);
  const [showConst,  setShowConst]  = useState(false);
  const [isRestored, setIsRestored] = useState(false);

  // Persistence: Load
  useEffect(() => {
    const saved = localStorage.getItem("nifty_indices_chart_v1");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.timeframe) setTimeframe(p.timeframe);
        if (p.chartType) setChartType(p.chartType);
      } catch {}
    }
    setIsRestored(true);
  }, []); // eslint-disable-line

  // Persistence: Save
  useEffect(() => {
    if (isRestored) {
      localStorage.setItem("nifty_indices_chart_v1", JSON.stringify({ timeframe, chartType }));
    }
  }, [timeframe, chartType, isRestored]);

  /* Init chart once */
  useEffect(() => {
    if (!containerRef.current || chartReady) return;
    let dead = false;
    (async () => {
      const LW = await import("lightweight-charts");
      if (dead || !containerRef.current) return;
      const chart = LW.createChart(containerRef.current, {
        width: containerRef.current.clientWidth, height: 500,
        layout: { background:{ type:LW.ColorType.Solid, color:"transparent"}, textColor:"#9AA0B4", fontFamily:"'JetBrains Mono',monospace", fontSize:11 },
        grid: { vertLines:{color:"rgba(37,40,64,0.7)"}, horzLines:{color:"rgba(37,40,64,0.7)"} },
        crosshair: { mode:LW.CrosshairMode.Normal, vertLine:{color:"rgba(59,130,246,0.5)",labelBackgroundColor:"#1A1D27"}, horzLine:{color:"rgba(59,130,246,0.5)",labelBackgroundColor:"#1A1D27"} },
        rightPriceScale: { borderColor:"#252840", minimumWidth:80, scaleMargins:{top:0.06,bottom:0.25} },
        timeScale: { borderColor:"#252840", timeVisible:true, secondsVisible:false },
        handleScroll:{ mouseWheel:true, pressedMouseMove:true, horzTouchDrag:true, vertTouchDrag:true }, 
        handleScale:{ mouseWheel:true, pinch:true, axisPressedMouseMove: { time:true, price:true } },
        kineticScroll: { touch: true, mouse: true },
      });
      const vol = chart.addHistogramSeries({ priceScaleId:"vol", priceFormat:{ type:"volume" } });
      chart.priceScale("vol").applyOptions({ scaleMargins:{ top:0.80, bottom:0 }, borderVisible:false });
      volRef.current = vol;
      chart.subscribeCrosshairMove((p: any) => {
        if (!p?.time || !p.seriesData || !seriesRef.current) { setHover(null); return; }
        const d = p.seriesData.get(seriesRef.current);
        if (!d) return;
        const t = typeof p.time === "number"
          ? new Date(p.time * 1000).toLocaleString("en-IN", { 
              timeZone: "UTC", 
              day: "2-digit", month: "short", year: "numeric", 
              hour: "2-digit", minute: "2-digit" 
            })
          : String(p.time);
        setHover({ ...d, time:t });
      });
      const ro = new ResizeObserver(() => {
        if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
      });
      ro.observe(containerRef.current);
      chartRef.current = chart;
      setChartReady(true);
      return () => { dead=true; ro.disconnect(); chart.remove(); };
    })();
    return () => { dead=true; };
  }, []); // eslint-disable-line

  /* Update Localization on timeframe change */
  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      localization: {
        locale: "en-IN",
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          if (timeframe === "1D" || timeframe === "5D") {
            return date.toLocaleTimeString("en-IN", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false });
          }
          return date.toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short" });
        }
      }
    });
  }, [timeframe]);

  /* Load data */
  useEffect(() => {
    if (!chartReady) return;
    setLoading(true);
    setHover(null);
    isInitialLoadRef.current = false;
    
    fetch(`/api/index-detail?index=${encodeURIComponent(index.indexName)}&timeframe=${timeframe}`, { cache:"no-store" })
      .then(r => r.json())
      .then(async (data) => {
        if (data.indexStats) setDetail(data.indexStats);
        if (data.candles?.length > 0) {
          const sorted = [...data.candles].sort((a: Candle, b: Candle) => a.time - b.time);
          
          // Rebuild series if type changed
          if (lastTypeRef.current !== chartType || !seriesRef.current) {
            if (seriesRef.current) chartRef.current.removeSeries(seriesRef.current);
            
            if (chartType === "Candle") {
              seriesRef.current = chartRef.current.addCandlestickSeries({ 
                upColor:"#00D4AA", downColor:"#FF4D6A", borderUpColor:"#00D4AA", borderDownColor:"#FF4D6A", wickUpColor:"#00D4AA", wickDownColor:"#FF4D6A" 
              });
            } else if (chartType === "Area") {
              seriesRef.current = chartRef.current.addAreaSeries({ 
                lineColor:"#3B82F6", topColor:"rgba(59,130,246,0.4)", bottomColor:"rgba(59,130,246,0.02)", lineWidth:2 
              });
            } else {
              seriesRef.current = chartRef.current.addLineSeries({ 
                color:"#3B82F6", lineWidth:2, lastValueVisible:true, priceLineVisible:true 
              });
            }
            lastTypeRef.current = chartType;
          }

          // Set Data
          if (chartType === "Candle") {
            seriesRef.current.setData(sorted.map(c => ({ time:c.time as any, open:c.open, high:c.high, low:c.low, close:c.close })));
          } else {
            seriesRef.current.setData(sorted.map(c => ({ time:c.time as any, value:c.close })));
          }

          volRef.current?.setData(sorted.map(c => ({
            time:c.time as any, value:c.volume || 0,
            color: c.close >= c.open ? "rgba(0,212,170,0.25)" : "rgba(255,77,106,0.25)",
          })));

          if (!isInitialLoadRef.current) {
            chartRef.current?.timeScale().fitContent();
            isInitialLoadRef.current = true;
          }
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [index.indexName, timeframe, chartType, chartReady]);

  const isPos = (detail?.percChange ?? index.percChange) >= 0;
  const r52 = detail && detail.yearHigh > detail.yearLow
    ? ((detail.last - detail.yearLow) / (detail.yearHigh - detail.yearLow)) * 100
    : 50;

  return (
    <div className="space-y-3">
      {/* Detail card */}
      <div className={cn("bg-bg-card border rounded-2xl p-4 relative overflow-hidden",
        isPos ? "border-accent-green/20" : "border-accent-red/20")}>
        <div className={cn("absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-10 pointer-events-none",
          isPos ? "bg-accent-green" : "bg-accent-red")}/>

        <div className="flex items-start justify-between mb-3 relative">
          <div>
            <h2 className="font-display font-800 text-text-primary text-lg leading-tight">{detail?.indexName ?? index.indexName}</h2>
            <p className="text-text-muted text-[11px] font-mono mt-0.5">NSE India · {detail?.timestamp ? new Date(detail.timestamp).toLocaleString("en-IN",{hour:"2-digit",minute:"2-digit"}) : "—"}</p>
          </div>
          {detail && (
            <div className="flex items-center gap-1.5 text-[10px] font-mono bg-bg-elevated rounded-lg px-2.5 py-1.5">
              <span className="text-accent-green font-600">▲{detail.advances}</span>
              <span className="text-text-muted">{detail.unchanged}</span>
              <span className="text-accent-red font-600">{detail.declines}▼</span>
            </div>
          )}
        </div>

        <div className="flex items-end gap-3 mb-4">
          <span className="font-display font-800 text-4xl text-text-primary tabular-nums leading-none">
            {fmtN(detail?.last ?? index.last)}
          </span>
          <div className="pb-0.5">
            <div className={cn("font-mono font-700 text-lg", isPos ? "text-accent-green" : "text-accent-red")}>
              {isPos?"+":""}{fmtN(detail?.change ?? index.change)}&nbsp;
              <span className="text-base">({isPos?"+":""}{(detail?.percChange ?? index.percChange).toFixed(2)}%)</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-3">
          {[
            { label:"Prev Close",   v:fmtN(detail?.previousClose ?? index.previousClose) },
            { label:"Open",         v:fmtN(detail?.open ?? index.open) },
            { label:"Intraday High",v:fmtN(detail?.high ?? index.high),   c:"green" },
            { label:"Intraday Low", v:fmtN(detail?.low  ?? index.low),    c:"red"   },
            { label:"P/E",          v:detail?.pe ? detail.pe.toFixed(2) : index.pe ? index.pe.toFixed(2) : "—" },
            { label:"P/B",          v:detail?.pb ? detail.pb.toFixed(2) : index.pb ? index.pb.toFixed(2) : "—" },
            { label:"Vol (L)",      v:formatVolume(detail?.totalTradedVolume ?? index.totalTradedVolume) },
            { label:"Val (Cr)",     v:formatCurrency(detail?.totalTradedValue ?? index.totalTradedValue) },
            { label:"FFM Cap (L Cr)",v:detail?.ffmc_sum ? fmtN(detail.ffmc_sum) : index.ffmc_sum ? fmtN(index.ffmc_sum) : "—" },
          ].map(({ label, v, c }) => (
            <div key={label} className="bg-bg-elevated rounded-xl px-2.5 py-1.5 min-w-0">
              <p className="text-text-muted text-[8px] font-mono uppercase truncate opacity-70">{label}</p>
              <p className={cn("font-mono font-700 text-[11px] tabular-nums truncate",
                c === "green" ? "text-accent-green" : c === "red" ? "text-accent-red" : "text-text-primary")}>
                {v}
              </p>
            </div>
          ))}
        </div>

        <div>
           <div className="flex justify-between text-[10px] font-mono text-text-muted mb-1">
            <span>52W L: <span className="text-accent-red">{fmtN(detail?.yearLow ?? index.yearLow)}</span></span>
            <span className="text-text-muted">52W Range</span>
            <span>52W H: <span className="text-accent-green">{fmtN(detail?.yearHigh ?? index.yearHigh)}</span></span>
          </div>
          <div className="relative h-2 bg-bg-elevated rounded-full overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-accent-red via-accent-amber to-accent-green opacity-30 rounded-full"/>
            <div className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-sm border border-accent-blue transition-all duration-500"
              style={{ left: `${Math.max(2, Math.min(98, r52))}%` }}/>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle flex-wrap gap-2">
          <div className="flex items-center gap-3 text-[11px] font-mono min-w-0 flex-1">
            {hover ? (
              <>
                <span className="text-text-muted shrink-0">{hover.time}</span>
                <span className="text-text-primary font-600">{fmtN(hover.close || hover.value)}</span>
              </>
            ) : (
              <span className="text-text-muted text-[10px] uppercase font-700">{index.indexName} · {timeframe}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="flex bg-bg-elevated rounded-lg p-0.5 gap-0.5">
              {CHART_TYPES.map(ct => (
                <button key={ct} onClick={() => setChartType(ct)}
                  className={cn("px-2 py-0.5 rounded text-[10px] font-mono transition-all",
                    chartType === ct ? "bg-accent-blue text-white font-700" : "text-text-muted hover:text-text-primary")}>
                  {ct}
                </button>
              ))}
            </div>
            <div className="flex bg-bg-elevated rounded-lg p-0.5 gap-0.5">
              {TIMEFRAMES.map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)}
                  className={cn("px-1.5 py-0.5 rounded text-[10px] font-mono transition-all",
                    timeframe === tf ? "bg-accent-blue text-white font-700" : "text-text-muted hover:text-text-primary")}>
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-card/80 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-2">
                <div className="w-6 h-6 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"/>
                <span className="text-text-muted text-xs font-mono">Loading {index.indexName}…</span>
              </div>
            </div>
          )}
          <div ref={containerRef} className="w-full h-[500px]"/>
        </div>
      </div>

       {/* Constituents */}
      {detail?.constituents && detail.constituents.length > 0 && (
        <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
          <button onClick={() => setShowConst(v => !v)}
            className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-bg-elevated/30 transition-colors">
            <div className="flex items-center gap-2">
              <BarChart2 size={13} className="text-accent-blue"/>
              <span className="font-display font-600 text-text-primary text-sm">Constituents ({detail.constituents.length})</span>
            </div>
            <ChevronDown size={14} className={cn("text-text-muted transition-transform", showConst && "rotate-180")}/>
          </button>
          {showConst && (
            <div className="overflow-x-auto w-full border-t border-border-subtle">
              <table className="w-full text-xs table-fixed min-w-[500px] sm:min-w-0">
                 <thead>
                  <tr className="bg-bg-secondary/30 text-[10px] font-mono text-text-muted uppercase border-b border-border-subtle/50">
                    <th className="px-4 py-2 text-left w-32">Symbol</th>
                    <th className="px-4 py-2 text-right w-24">Price</th>
                    <th className="px-4 py-2 text-right w-24">Chg%</th>
                    <th className="px-4 py-2 text-right hidden sm:table-cell w-32">Vol</th>
                    <th className="px-4 py-2 text-right w-20">Chart</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.constituents.map((c: any) => (
                    <tr key={c.symbol} className="border-b border-border-subtle/20 hover:bg-bg-elevated/40">
                      <td className="px-4 py-2.5 font-600 text-text-primary">{c.symbol}</td>
                      <td className="px-4 py-2.5 text-right font-mono tabular-nums">₹{fmtN(c.lastPrice)}</td>
                      <td className={cn("px-4 py-2.5 text-right font-mono font-700", c.pChange >=0 ? "text-accent-green":"text-accent-red")}>
                        {c.pChange >=0 ? "+" : ""}{c.pChange.toFixed(2)}%
                      </td>
                      <td className="px-4 py-2.5 text-right font-mono text-text-muted hidden sm:table-cell">{fmtVol(c.totalTradedVolume)}</td>
                      <td className="px-4 py-2.5 text-right">
                        <a href={`/charts?symbol=${c.symbol}`} className="text-accent-blue hover:underline font-mono text-[10px] uppercase font-700">Open</a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
