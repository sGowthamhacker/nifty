"use client";
import { useEffect, useRef, useState, useCallback, useMemo, memo } from "react";
import {
  Search, X, Plus, RefreshCw, Maximize2, Minimize2,
  LineChart, ChevronLeft, ChevronRight, Grid3X3, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn, formatPrice, formatVolume, formatCurrency, isIndianMarketOpen } from "@/lib/utils";
import { NIFTY50_SYMBOLS } from "@/lib/symbols";
import { ALL_NSE_INDICES } from "@/lib/nse-indices";

/* ─── Constants ─────────────────────────────────────────── */
const TIMEFRAMES = ["1D", "5D", "1M", "3M", "6M", "1Y", "2Y", "5Y", "MAX"];
const CHART_TYPES = [
  { id: "candlestick", label: "Candle" },
  { id: "hollow_candle", label: "Hollow" },
  { id: "bar", label: "Bar" },
  { id: "hlc_bar", label: "HLC Bar" },
  { id: "line", label: "Line" },
  { id: "step_line", label: "Step" },
  { id: "line_marker", label: "Marker" },
  { id: "area", label: "Area" },
  { id: "baseline", label: "Baseline" },
  { id: "histogram", label: "Column" },
  { id: "heikin_ashi", label: "H-Ashi" },
  { id: "renko", label: "Renko" },
  { id: "kagi", label: "Kagi" },
  { id: "line_break", label: "L-Break" },
];
const COLORS = [
  "#3B82F6", "#00D4AA", "#FF4D6A", "#F59E0B", "#A855F7", "#EC4899", 
  "#10B981", "#6366F1", "#F43F5E", "#8B5CF6", "#06B6D4", "#EF4444",
  "#F97316", "#84CC16", "#0EA5E9", "#D946EF"
];
const REFRESH_INTERVAL = 3000; // Increased slightly for stability

const SYMBOL_LIST = [
  ...ALL_NSE_INDICES.map(idx => ({ symbol: idx.name, name: idx.name, sector: "Index" as const, type: "Index" as const })),
  ...NIFTY50_SYMBOLS.map(s => ({ symbol: s.symbol, name: s.name, sector: s.sector, type: "Stock" as const })),
].filter((v, i, a) => a.findIndex(t => t.symbol === v.symbol) === i);
// Add NIFTY50 alias if not present
if (!SYMBOL_LIST.find(s => s.symbol === "NIFTY50")) {
  SYMBOL_LIST.unshift({ symbol: "NIFTY50", name: "NIFTY 50 Index", sector: "Index", type: "Index" });
}

/* ─── Types ─────────────────────────────────────────────── */
interface Candle { time: number; open: number; high: number; low: number; close: number; volume: number; }
interface StockMeta {
  price: number; prevClose: number; change: number; changePct: number;
  longName: string; marketState: string; high52: number; low52: number;
  open: number; high: number; low: number; volume: number;
  totalTradedValue: number; pe: number; pb: number;
  ffmc: number; advances: number; declines: number; unchanged: number;
  eps?: number; avgVolume?: number;
  targetPrice?: number; recommendation?: string;
}
interface LoadedStock { symbol: string; meta: StockMeta; candles: Candle[]; color: string; }
interface HoverData { time: string;[sym: string]: any; }

/* ─── Main Component ─────────────────────────────────────── */
export default function AdvancedChartPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesMap = useRef<Map<string, any>>(new Map());
  const seriesToSymMap = useRef<Map<any, string>>(new Map());
  const volRef = useRef<any>(null);

  const [chartType, setChartType] = useState("candlestick");
  const [timeframe, setTimeframe] = useState("1M");
  const [stocks, setStocks] = useState<LoadedStock[]>([]);
  const [mainSymbol, setMainSymbol] = useState("NIFTY50");
  const [loading, setLoading] = useState<Set<string>>(new Set());
  const isFetchingRef = useRef(false);
  const isInitialLoadRef = useRef<Record<string, boolean>>({});
  const [searchQ, setSearchQ] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [hover, setHover] = useState<HoverData | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [optimisticSymbol, setOptimisticSymbol] = useState("NIFTY50");
  const searchParams = useSearchParams();
  const [isRestored, setIsRestored] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 5);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [stocks, checkScroll]);

  const scroll = (dir: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = dir === 'left' ? -200 : 200;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  // Persistence: Load
  useEffect(() => {
    const saved = localStorage.getItem("nifty_advanced_chart_v1");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.chartType) setChartType(p.chartType);
        if (p.timeframe) setTimeframe(p.timeframe);
        // Only override if no URL param
        if (p.mainSymbol && !searchParams.get("symbol")) {
          setMainSymbol(p.mainSymbol);
          setOptimisticSymbol(p.mainSymbol);
        }
      } catch { }
    }
    setIsRestored(true);
  }, []); // eslint-disable-line

  // Persistence: Save
  useEffect(() => {
    if (isRestored) {
      localStorage.setItem("nifty_advanced_chart_v1", JSON.stringify({ chartType, timeframe, mainSymbol }));
    }
  }, [chartType, timeframe, mainSymbol, isRestored]);

  // Handle symbol from query params (Heatmap connection)
  useEffect(() => {
    const symbolParam = searchParams.get("symbol");
    if (symbolParam && symbolParam !== mainSymbol) {
      setMainSymbol(symbolParam);
      setOptimisticSymbol(symbolParam);
    }
  }, [searchParams]);

  /* init chart once */
  useEffect(() => {
    if (!containerRef.current || chartReady) return;
    let dead = false;
    (async () => {
      const LW = await import("lightweight-charts");
      if (dead || !containerRef.current) return;
      const chart = LW.createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight || 650,
        layout: { background: { type: LW.ColorType.Solid, color: "transparent" }, textColor: "#9AA0B4", fontFamily: "'JetBrains Mono',monospace", fontSize: 11 },
        grid: { vertLines: { color: "rgba(37,40,64,0.7)" }, horzLines: { color: "rgba(37,40,64,0.7)" } },
        crosshair: { mode: LW.CrosshairMode.Normal, vertLine: { color: "rgba(59,130,246,0.6)", labelBackgroundColor: "#1A1D27" }, horzLine: { color: "rgba(59,130,246,0.6)", labelBackgroundColor: "#1A1D27" } },
        rightPriceScale: { borderColor: "#252840", minimumWidth: 80, scaleMargins: { top: 0.06, bottom: 0.28 } },
        timeScale: { borderColor: "#252840", timeVisible: true, secondsVisible: false },
        localization: {
          locale: "en-IN",
          timeFormatter: (time: number) => {
            const date = new Date(time * 1000);
            if (timeframe === "1D" || timeframe === "5D") {
              return date.toLocaleTimeString("en-IN", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false });
            }
            return date.toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short" });
          }
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
        handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: { time: true, price: true } },
        kineticScroll: { touch: true, mouse: true },
      });
      const vol = chart.addHistogramSeries({ priceScaleId: "vol", priceFormat: { type: "volume" } });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.80, bottom: 0 }, borderVisible: false });
      volRef.current = vol;
      chart.subscribeCrosshairMove((p: any) => {
        if (!p?.time || !p.seriesData) { setHover(null); return; }
        const t = typeof p.time === "number"
          ? new Date(p.time * 1000).toLocaleString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })
          : String(p.time);
        const info: HoverData = { time: t };

        // Defensively iterate over seriesData provided by the event
        p.seriesData.forEach((data: any, series: any) => {
          const sym = seriesToSymMap.current.get(series);
          if (sym) info[sym] = data;
        });

        setHover(info);
      });
      const ro = new ResizeObserver(() => {
        if (containerRef.current && chart) {
          chart.resize(containerRef.current.clientWidth, containerRef.current.clientHeight);
        }
      });
      ro.observe(containerRef.current);
      chartRef.current = chart;
      setChartReady(true);
      return () => { dead = true; ro.disconnect(); chart.remove(); };
    })();
    return () => { dead = true; };
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

  /* build series of correct type */
  const buildSeries = useCallback(async (color: string, isPrimary: boolean) => {
    if (!chartRef.current) return null;
    const LW = await import("lightweight-charts");
    if (isPrimary) {
      if (chartType === "candlestick") return chartRef.current.addCandlestickSeries({ upColor: "#00D4AA", downColor: "#FF4D6A", borderUpColor: "#00D4AA", borderDownColor: "#FF4D6A", wickUpColor: "#00D4AA", wickDownColor: "#FF4D6A" });
      if (chartType === "hollow_candle") return chartRef.current.addCandlestickSeries({ upColor: "transparent", downColor: "#FF4D6A", borderUpColor: "#00D4AA", borderDownColor: "#FF4D6A", wickUpColor: "#00D4AA", wickDownColor: "#FF4D6A" });
      if (chartType === "bar") return chartRef.current.addBarSeries({ upColor: "#00D4AA", downColor: "#FF4D6A" });
      if (chartType === "hlc_bar") return chartRef.current.addBarSeries({ upColor: "#00D4AA", downColor: "#FF4D6A", openVisible: false });
      if (chartType === "area") return chartRef.current.addAreaSeries({ lineColor: color, topColor: `${color}50`, bottomColor: `${color}05`, lineWidth: 2 });
      if (chartType === "baseline") return chartRef.current.addBaselineSeries({ topLineColor: "#00D4AA", bottomLineColor: "#FF4D6A", topFillColor1: "rgba(0,212,170,0.28)", topFillColor2: "rgba(0,212,170,0.04)", bottomFillColor1: "rgba(255,77,106,0.04)", bottomFillColor2: "rgba(255,77,106,0.28)" });
      if (chartType === "step_line") return chartRef.current.addLineSeries({ color, lineWidth: 2, lineType: LW.LineType.WithSteps });
      if (chartType === "line_marker") return chartRef.current.addLineSeries({ color, lineWidth: 2, lastValueVisible: true, priceLineVisible: true }); // Markers added via setMarkers if needed, but pointVisible is not directly in addLineSeries options in some versions
      if (chartType === "histogram") return chartRef.current.addHistogramSeries({ color, lineWidth: 2, priceFormat: { type: "price" } });
      if (chartType === "heikin_ashi") return chartRef.current.addCandlestickSeries({ upColor: "#00D4AA", downColor: "#FF4D6A", borderUpColor: "#00D4AA", borderDownColor: "#FF4D6A", wickUpColor: "#00D4AA", wickDownColor: "#FF4D6A" });
      if (chartType === "renko") return chartRef.current.addCandlestickSeries({ upColor: "#00D4AA", downColor: "#FF4D6A", borderUpColor: "#00D4AA", borderDownColor: "#FF4D6A", wickVisible: false });
      if (chartType === "kagi") return chartRef.current.addLineSeries({ color, lineWidth: 2 });
      if (chartType === "line_break") return chartRef.current.addCandlestickSeries({ upColor: "#00D4AA", downColor: "#FF4D6A", borderUpColor: "#00D4AA", borderDownColor: "#FF4D6A", wickVisible: false });

      const lineSeries = chartRef.current.addLineSeries({ color, lineWidth: 2, lastValueVisible: true, priceLineVisible: true });
      if (chartType === "line_marker") lineSeries.applyOptions({ pointVisible: true, pointSize: 4 });
      return lineSeries;
    }
    return chartRef.current.addLineSeries({ color, lineWidth: 1.5, lastValueVisible: true, priceLineVisible: false, priceScaleId: "right" });
  }, [chartType, timeframe]);

  const updatePriceScale = useCallback((isComparing: boolean) => {
    if (!chartRef.current) return;
    chartRef.current.priceScale("right").applyOptions({
      mode: isComparing ? 2 : 0, // 2 = Percentage, 0 = Normal
      autoScale: true,
    });
  }, []);

  /* load + paint a symbol */
  const loadStock = useCallback(async (symbol: string, color: string, isPrimary: boolean) => {
    if (isFetchingRef.current && isPrimary) return;
    if (isPrimary) isFetchingRef.current = true;
    setLoading(prev => new Set([...prev, symbol]));
    try {
      const res = await fetch(`/api/stock-chart?symbol=${symbol}&timeframe=${timeframe}`, { cache: "no-store" });
      const data = await res.json();
      const { candles, meta } = data;
      if (!candles || candles.length === 0) return;

      let series = seriesMap.current.get(symbol);
      if (!series) {
        series = await buildSeries(color, isPrimary);
        if (series) {
          seriesMap.current.set(symbol, series);
          seriesToSymMap.current.set(series, symbol);
        }
      }

      if (!series) return;
      const sorted = [...candles].sort((a: Candle, b: Candle) => a.time - b.time);

      if (isPrimary && (chartType === "candlestick" || chartType === "hollow_candle" || chartType === "bar" || chartType === "hlc_bar" || chartType === "heikin_ashi" || chartType === "renko" || chartType === "line_break" || chartType === "kagi")) {
        let finalData = sorted;

        if (chartType === "heikin_ashi") {
          const haData: any[] = [];
          sorted.forEach((c, i) => {
            if (i === 0) { haData.push({ ...c, time: c.time as any }); }
            else {
              const prev = haData[i - 1];
              const close = (c.open + c.high + c.low + c.close) / 4;
              const open = (prev.open + prev.close) / 2;
              const high = Math.max(c.high, open, close);
              const low = Math.min(c.low, open, close);
              haData.push({ time: c.time as any, open, high, low, close });
            }
          });
          finalData = haData;
        } else if (chartType === "renko") {
          const renkoData: any[] = [];
          const boxSize = (sorted[sorted.length - 1].close * 0.005); // 0.5% box size
          let stone = sorted[0].close;
          sorted.forEach(c => {
            const diff = c.close - stone;
            if (Math.abs(diff) >= boxSize) {
              const num = Math.floor(Math.abs(diff) / boxSize);
              const dir = diff > 0 ? 1 : -1;
              for (let j = 0; j < num; j++) {
                const nextStone = stone + (dir * boxSize);
                renkoData.push({ time: c.time as any, open: stone, high: Math.max(stone, nextStone), low: Math.min(stone, nextStone), close: nextStone });
                stone = nextStone;
              }
            }
          });
          finalData = renkoData;
        } else if (chartType === "kagi") {
          const kagiData: any[] = [];
          const rev = (sorted[sorted.length - 1].close * 0.01); // 1% reversal
          let direction = 0;
          let lastVal = sorted[0].close;
          let peak = lastVal;
          let valley = lastVal;
          sorted.forEach(c => {
            const price = c.close;
            if (direction === 0) {
              if (price > lastVal + rev) { direction = 1; peak = price; kagiData.push({ time: c.time as any, value: price }); }
              else if (price < lastVal - rev) { direction = -1; valley = price; kagiData.push({ time: c.time as any, value: price }); }
            } else if (direction === 1) {
              if (price > peak) { peak = price; kagiData.push({ time: c.time as any, value: price }); }
              else if (price < peak - rev) { direction = -1; valley = price; kagiData.push({ time: c.time as any, value: price }); }
            } else {
              if (price < valley) { valley = price; kagiData.push({ time: c.time as any, value: price }); }
              else if (price > valley + rev) { direction = 1; peak = price; kagiData.push({ time: c.time as any, value: price }); }
            }
            lastVal = price;
          });
          finalData = kagiData;
        } else if (chartType === "line_break") {
          const lbData: any[] = [];
          let lines: number[] = [sorted[0].close];
          sorted.forEach(c => {
            const price = c.close;
            const high = Math.max(...lines);
            const low = Math.min(...lines);
            if (price > high) {
              lbData.push({ time: c.time as any, open: high, high: price, low: high, close: price });
              lines.push(price); if (lines.length > 3) lines.shift();
            } else if (price < low) {
              lbData.push({ time: c.time as any, open: low, high: low, low: price, close: price });
              lines.push(price); if (lines.length > 3) lines.shift();
            }
          });
          finalData = lbData;
        }

        if (chartType === "kagi") {
          const processed = finalData
            .filter((c: any) => c && c.time && typeof c.value === 'number')
            .map((c: any) => ({ time: c.time as any, value: c.value }));
          if (processed.length > 0) series.setData(processed);
        } else {
          const processed = finalData
            .filter((c: any) => c && c.time && typeof c.open === 'number' && typeof c.close === 'number')
            .map((c: any) => ({ time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close }));
          if (processed.length > 0) series.setData(processed);
        }
      } else if (isPrimary && chartType === "baseline") {
        const base = sorted[0]?.close || 0;
        series.applyOptions({ baseValue: { type: "price", price: base } });
        const data = sorted.map((c: Candle) => ({ time: c.time as any, value: c.close }));
        if (data.length > 0) series.setData(data);
      } else if (isPrimary && chartType === "histogram") {
        const data = sorted.map((c: Candle, i: number) => ({
          time: c.time as any,
          value: c.close,
          color: c.close >= (sorted[i - 1]?.close || c.open) ? "rgba(0,212,170,0.5)" : "rgba(255,77,106,0.5)"
        }));
        if (data.length > 0) series.setData(data);
      } else {
        const data = sorted.map((c: Candle) => ({ time: c.time as any, value: c.close }));
        if (data.length > 0) series.setData(data);
      }

      if (isPrimary && volRef.current) {
        const volData = sorted.map((c: Candle) => ({
          time: c.time as any,
          value: c.volume,
          color: c.close >= c.open ? "rgba(0,212,170,0.25)" : "rgba(255,77,106,0.25)"
        }));
        if (volData.length > 0) volRef.current.setData(volData);
      }

      // Only auto-fit on the very first load of this symbol to respect user zoom/pan
      if (!isInitialLoadRef.current[symbol]) {
        chartRef.current?.timeScale().fitContent();
        isInitialLoadRef.current[symbol] = true;
      }

      setStocks(prev => {
        const entry = { symbol, meta, candles: sorted, color };
        const exists = prev.findIndex(s => s.symbol === symbol);
        
        // Use functional state updates to avoid race conditions
        if (isPrimary) {
          setOptimisticSymbol(symbol);
          
          // If we're updating current primary, just update entry
          if (exists === 0) return [entry, ...prev.slice(1)];
          
          // If switching primary from as secondary, swap positions
          if (exists > 0) {
            const others = prev.filter((_, i) => i !== exists);
            return [entry, ...others];
          }

          // Fully new primary (clearing happens in switchPrimary if needed)
          return [entry];
        }
        
        // Secondary Stock (Overlay)
        if (exists >= 0) {
          const next = [...prev];
          next[exists] = entry;
          return next;
        }
        return [...prev, entry];
      });
      setLastRefresh(new Date());
    } catch (e) { console.error("loadStock:", e); }
    finally {
      setLoading(prev => { const n = new Set(prev); n.delete(symbol); return n; });
      if (isPrimary) isFetchingRef.current = false;
    }
  }, [timeframe, chartType, buildSeries, updatePriceScale]);

  /* initial load */
  useEffect(() => { if (chartReady) loadStock(mainSymbol, COLORS[0], true); }, [chartReady, mainSymbol]); // eslint-disable-line

  /* reload on timeframe/type change */
  useEffect(() => {
    if (!chartReady || stocks.length === 0) return;
    isInitialLoadRef.current = {}; // Allow one auto-fit for the new timeframe/style
    const syms = stocks.map(s => s.symbol);
    seriesMap.current.forEach(s => { try { chartRef.current?.removeSeries(s); } catch { } });
    seriesMap.current.clear();
    seriesToSymMap.current.clear();
    if (syms[0]) loadStock(syms[0], COLORS[0], true).then(() => {
      syms.slice(1).forEach((sym, i) => loadStock(sym, COLORS[i + 1] || COLORS[0], false));
    });
  }, [timeframe, chartType, mainSymbol]); // eslint-disable-line

  /* live refresh every 2s on 1D */
  useEffect(() => {
    if (timeframe !== "1D" || !chartReady) return;
    const iv = setInterval(() => {
      if (stocks[0]) loadStock(stocks[0].symbol, stocks[0].color, true);
    }, REFRESH_INTERVAL);
    return () => clearInterval(iv);
  }, [timeframe, chartReady, stocks, loadStock]);

  const addOverlay = useCallback((symbol: string) => {
    if (stocks.find(s => s.symbol === symbol)) return;
    updatePriceScale(true);
    loadStock(symbol, COLORS[stocks.length % COLORS.length], false);
    setShowSearch(false); setSearchQ("");
  }, [stocks, loadStock, updatePriceScale]);

  const removeStock = useCallback((symbol: string) => {
    const s = seriesMap.current.get(symbol);
    if (s) {
      try { chartRef.current?.removeSeries(s); } catch { }
      seriesToSymMap.current.delete(s);
      seriesMap.current.delete(symbol);
    }
    setStocks(prev => {
      const remaining = prev.filter(st => st.symbol !== symbol);
      if (remaining.length <= 1) updatePriceScale(false);
      return remaining;
    });
  }, [updatePriceScale]);

  const switchPrimary = useCallback((symbol: string) => {
    setMainSymbol(symbol);
    setOptimisticSymbol(symbol);
    isInitialLoadRef.current = {}; 
    
    // Atomically reorder stocks to move the promoted stock to index 0
    setStocks(prev => {
      const idx = prev.findIndex(s => s.symbol === symbol);
      if (idx <= 0) return prev; 
      const target = prev[idx];
      const others = prev.filter((_, i) => i !== idx);
      // This reorder ensures syms[0] is the correct one in the useEffect reloader
      return [target, ...others];
    });
  }, []);

  const searchResults = useMemo(() => {
    const list = SYMBOL_LIST.filter(s =>
      !stocks.find(st => st.symbol === s.symbol) &&
      (s.symbol.toLowerCase().includes(searchQ.toLowerCase()) || s.name.toLowerCase().includes(searchQ.toLowerCase()))
    );
    const indices = list.filter(x => x.type === "Index");
    const stocksList = list.filter(x => x.type === "Stock");
    return { indices, stocks: stocksList, total: list.length };
  }, [stocks, searchQ]);

  const mainStock = stocks[0];
  const isPos = (mainStock?.meta.changePct ?? 0) >= 0;
  const isLoading = loading.size > 0;
  const isMarketLive = /REGULAR|OPEN/i.test(mainStock?.meta.marketState || "") || (mainStock ? false : isIndianMarketOpen());

  return (
    <div className={cn("flex flex-col gap-4", fullscreen ? "fixed inset-0 z-50 bg-bg-primary p-4 h-screen overflow-hidden" : "")}>
      {/* page title */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-800 text-2xl text-text-primary tracking-tight flex items-center gap-2">
            <LineChart size={24} className="text-accent-blue" /> Live Charts
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <p className="text-text-muted text-sm shrink-0">Interactive insights for all NIFTY 50 stocks</p>
            <span className="w-1 h-1 rounded-full bg-border-default shrink-0" />
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-bg-elevated border border-border-subtle/50">
              <div className={cn("w-1.5 h-1.5 rounded-full shadow-[0_0_8px]", isMarketLive ? "bg-accent-green shadow-accent-green/50 animate-pulse" : "bg-text-muted/50")} />
              <span className="text-[9px] font-mono font-700 uppercase tracking-wider text-text-secondary">
                Market {isMarketLive ? "Live" : "Closed"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastRefresh && (
            <div className="hidden lg:flex flex-col items-end mr-2">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider">Last Pulse</span>
              <span className="text-xs font-mono text-text-primary font-600">{lastRefresh.toLocaleTimeString("en-IN", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
            </div>
          )}
          <button onClick={() => { if (mainStock) loadStock(mainStock.symbol, mainStock.color, true); }}
            disabled={isLoading}
            className={cn("p-2 rounded-xl bg-bg-card border border-border-subtle text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-all active:scale-95 flex items-center gap-2 group", isLoading && "opacity-50")}>
            <RefreshCw size={14} className={cn(isLoading && "animate-spin")} />
            {isLoading && <span className="text-[10px] font-mono font-700 hidden sm:block">Syncing...</span>}
          </button>
        </div>
      </div>

      {/* chart card */}
      <div className={cn("bg-bg-card border border-border-subtle rounded-2xl overflow-hidden flex flex-col shadow-card relative", fullscreen && "flex-1 min-h-0")}>
        {/* top-edge loading pulse */}
        <div className={cn("absolute top-0 left-0 right-0 h-[2px] bg-accent-blue z-50 transition-transform duration-300 origin-left",
          isLoading ? "scale-x-100 opacity-100 animate-pulse" : "scale-x-0 opacity-0")} />

        {/* toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle gap-4 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-3 flex-1 min-w-0 flex-nowrap">
            <div className="flex items-center gap-2 shrink-0">
              {!showSearch ? (
                <button 
                  onClick={() => setShowSearch(true)}
                  className="w-9 h-9 flex items-center justify-center rounded-xl border border-dashed border-border-default text-text-muted hover:text-text-primary hover:border-accent-blue/50 transition-all bg-bg-card/50 shrink-0 group"
                  title="Compare symbols (+)"
                >
                  <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                </button>
              ) : (
                <div className="relative flex items-center animate-in fade-in slide-in-from-left-2 duration-200">
                  <div className="flex items-center bg-bg-elevated border border-accent-blue/30 rounded-xl px-3 py-1.5 w-48 sm:w-64 focus-within:w-64 sm:focus-within:w-80 transition-all shadow-lg shadow-accent-blue/5">
                    <Search size={14} className="text-accent-blue shrink-0" />
                    <input 
                      autoFocus 
                      value={searchQ} 
                      onChange={e => setSearchQ(e.target.value)}
                      placeholder="Compare..."
                      className="w-full bg-transparent pl-2.5 pr-2 py-0.5 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none" 
                    />
                    <button 
                      onClick={() => { setShowSearch(false); setSearchQ(""); }}
                      className="text-text-muted hover:text-accent-red transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Search Results Dropdown */}
                  <div className="absolute top-full left-0 mt-3 w-80 bg-bg-card border border-border-default rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-4 ring-black/10">
                    <div className="max-h-[420px] overflow-y-auto py-2 custom-scrollbar">
                      {searchResults.indices.length > 0 && (
                        <div className="px-3 pb-3">
                          <div className="px-2 text-[10px] font-800 text-accent-blue uppercase tracking-widest mb-1.5 flex items-center justify-between opacity-80">
                            <span>Indices</span>
                            <span className="text-[9px] lowercase font-500 tabular-nums">{searchResults.indices.length} items</span>
                          </div>
                          <div className="space-y-0.5">
                            {searchResults.indices.map(s => (
                              <button key={s.symbol} onClick={() => addOverlay(s.symbol)}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-elevated transition-all text-left rounded-xl active:scale-[0.98] group">
                                <div className="w-7 h-7 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center text-[9px] font-mono font-900 text-text-secondary group-hover:border-accent-blue/50 group-hover:text-accent-blue shrink-0 transition-all">IX</div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-text-primary text-xs font-700 truncate group-hover:text-accent-blue transition-colors uppercase">{s.symbol}</div>
                                  <div className="text-text-muted text-[10px] truncate leading-tight">NSE Benchmark</div>
                                </div>
                                <Plus size={10} className="text-text-muted group-hover:text-accent-blue opacity-0 group-hover:opacity-100 transition-all" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.stocks.length > 0 && (
                        <div className={cn("px-3 pb-2 pt-2", searchResults.indices.length > 0 && "border-t border-border-subtle/30")}>
                          <div className="px-2 text-[10px] font-800 text-accent-green uppercase tracking-widest mb-1.5 flex items-center justify-between opacity-80">
                            <span>Equities</span>
                            <span className="text-[9px] lowercase font-500 tabular-nums">{searchResults.stocks.length} items</span>
                          </div>
                          <div className="space-y-0.5">
                            {searchResults.stocks.map(s => (
                              <button key={s.symbol} onClick={() => addOverlay(s.symbol)}
                                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-bg-elevated transition-all text-left rounded-xl active:scale-[0.98] group">
                                <div className="w-7 h-7 rounded-lg bg-bg-elevated border border-border-subtle flex items-center justify-center text-[9px] font-mono font-900 text-text-secondary group-hover:border-accent-green/50 group-hover:text-accent-green shrink-0 transition-all">{s.symbol.slice(0, 2)}</div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-text-primary text-xs font-700 truncate group-hover:text-accent-green transition-colors uppercase">{s.symbol}</div>
                                  <div className="text-text-muted text-[10px] truncate leading-tight">{s.name}</div>
                                </div>
                                <Plus size={10} className="text-text-muted group-hover:text-accent-green opacity-0 group-hover:opacity-100 transition-all" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {searchResults.total === 0 && (
                        <div className="px-4 py-8 text-center bg-bg-secondary/10">
                          <div className="w-10 h-10 bg-bg-elevated rounded-2xl flex items-center justify-center mx-auto mb-3 text-text-muted/30">
                            <Search size={20} />
                          </div>
                          <p className="text-text-muted text-xs font-mono mb-1">No matches for "{searchQ}"</p>
                          <p className="text-[10px] text-text-muted/50 max-w-[160px] mx-auto">Try searching for index names or Nifty tickers</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="relative min-w-0 flex-1 group/scroll flex items-center">
              {canScrollLeft && (
                <button 
                  onClick={() => scroll('left')}
                  className="absolute left-0 z-20 w-6 h-6 flex items-center justify-center bg-bg-card/80 backdrop-blur-sm border border-border-subtle rounded-full text-text-primary shadow-xl -ml-2 hover:bg-bg-elevated transition-all"
                >
                  <ChevronLeft size={14} />
                </button>
              )}
              
              <div 
                ref={scrollRef}
                onScroll={checkScroll}
                className="flex items-center gap-2 overflow-x-auto custom-scrollbar whitespace-nowrap px-1 pb-1.5 min-w-0 flex-1 hide-scrollbar-on-inactive"
                style={{ 
                  maskImage: `linear-gradient(to right, ${canScrollLeft ? 'transparent' : 'black'} 0%, black 5%, black 95%, ${canScrollRight ? 'transparent' : 'black'} 100%)`, 
                  WebkitMaskImage: `linear-gradient(to right, ${canScrollLeft ? 'transparent' : 'black'} 0%, black 5%, black 95%, ${canScrollRight ? 'transparent' : 'black'} 100%)` 
                }}
              >
                {stocks.map((s, i) => (
                  <div key={s.symbol}
                    style={{ borderColor: `${s.color}60`, backgroundColor: `${s.color}12` }}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono cursor-pointer hover:opacity-80 shrink-0"
                    onClick={() => i !== 0 && switchPrimary(s.symbol)}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-600 text-text-primary uppercase tracking-tighter">{s.symbol}</span>
                    <span className={cn("font-500", s.meta.changePct >= 0 ? "text-accent-green" : "text-accent-red")}>
                      {s.meta.changePct >= 0 ? "+" : ""}{s.meta.changePct?.toFixed(1)}%
                    </span>
                    {i !== 0 && <button onClick={e => { e.stopPropagation(); removeStock(s.symbol); }} className="text-text-muted hover:text-accent-red ml-0.5"><X size={10} /></button>}
                  </div>
                ))}
              </div>

              {canScrollRight && (
                <button 
                  onClick={() => scroll('right')}
                  className="absolute right-0 z-20 w-6 h-6 flex items-center justify-center bg-bg-card/80 backdrop-blur-sm border border-border-subtle rounded-full text-text-primary shadow-xl -mr-1 hover:bg-bg-elevated transition-all"
                >
                  <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0 flex-nowrap ml-auto">
            {/* Chart Type Dropdown */}
            <div className="relative">
              <button 
                onClick={() => setShowTypeMenu(!showTypeMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-bg-elevated border border-border-subtle text-text-primary hover:border-accent-blue/50 transition-all text-xs font-mono group shrink-0"
              >
                <LineChart size={14} className="text-accent-blue group-hover:scale-110 transition-transform" />
                <span className="font-600">{CHART_TYPES.find(ct => ct.id === chartType)?.label}</span>
                <div className={cn("w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[4px] border-t-text-muted group-hover:border-t-accent-blue transition-all", showTypeMenu && "rotate-180")} />
              </button>

              {showTypeMenu && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-bg-card border border-border-default rounded-2xl shadow-2xl z-[60] py-2 animate-fade-in origin-top-right ring-1 ring-black/20">
                  <div className="max-h-80 overflow-y-auto custom-scrollbar">
                    {CHART_TYPES.map(ct => (
                      <button 
                        key={ct.id} 
                        onClick={() => { setChartType(ct.id); setShowTypeMenu(false); }}
                        className={cn(
                          "w-full flex items-center justify-between px-4 py-2 text-xs font-mono transition-colors",
                          chartType === ct.id ? "bg-accent-blue/10 text-accent-blue font-700" : "text-text-muted hover:bg-bg-elevated hover:text-text-primary"
                        )}
                      >
                        <span>{ct.label}</span>
                        {chartType === ct.id && <div className="w-1.5 h-1.5 rounded-full bg-accent-blue" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-4 w-px bg-border-subtle mx-1 opacity-50" />

            {/* Timeframes */}
            <div className="flex bg-bg-elevated rounded-lg p-0.5 gap-0.5 shrink-0 border border-border-subtle/30">
              {TIMEFRAMES.map(tf => (
                <button key={tf} onClick={() => setTimeframe(tf)}
                  className={cn(
                    "px-1.5 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-mono transition-all active:scale-95", 
                    timeframe === tf ? "bg-accent-blue text-white font-700 shadow-sm" : "text-text-muted hover:text-text-primary"
                  )}>
                  {tf}
                </button>
              ))}
            </div>

            <div className="h-4 w-px bg-border-subtle mx-1 opacity-50 hidden sm:block" />

            <button onClick={() => setFullscreen(f => !f)} className="p-2 rounded-xl bg-bg-card border border-border-subtle text-text-muted hover:text-text-primary hover:border-accent-blue/50 transition-all hidden sm:flex items-center justify-center">
              {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
          </div>
        </div>

        {/* OHLCV bar */}
        <div className="flex-none px-4 py-2 bg-bg-secondary/40 border-b border-border-subtle/40 min-h-[34px] flex items-center gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          {hover ? (
            <>
              <span className="text-text-muted text-[11px] font-mono shrink-0">{hover.time}</span>
              {stocks.map(s => {
                const d = hover[s.symbol];
                if (!d) return null;
                const isOHLC = d.open != null;
                const chg = isOHLC ? (d.close - d.open) : 0;
                return (
                  <div key={s.symbol} className="flex items-center gap-2 text-[11px] font-mono">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-600 text-text-secondary">{s.symbol}</span>
                    {isOHLC && <>
                      <span className="text-text-muted">O:<span className="text-text-primary ml-0.5">{d.open?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></span>
                      <span className="text-text-muted">H:<span className="text-accent-green ml-0.5">{d.high?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></span>
                      <span className="text-text-muted">L:<span className="text-accent-red ml-0.5">{d.low?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></span>
                      <span className="text-text-muted">C:<span className="text-text-primary ml-0.5">{d.close?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span></span>
                      <span className={cn("font-600", chg >= 0 ? "text-accent-green" : "text-accent-red")}>{chg >= 0 ? "+" : ""}{chg.toFixed(2)} ({chg >= 0 ? "+" : ""}{((chg / d.open) * 100).toFixed(2)}%)</span>
                    </>}
                    {!isOHLC && <span className="text-text-primary">{d.value?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>}
                  </div>
                );
              })}
            </>
          ) : mainStock ? (
            <div className="flex-1 flex flex-col gap-3 py-1 overflow-x-auto no-scrollbar">
              <div className="flex items-center gap-4 text-[11px] font-mono whitespace-nowrap">
                <div className="flex items-center gap-1.5 bg-bg-elevated px-2 py-0.5 rounded border border-border-subtle/30 transition-all active:scale-95 cursor-default">
                  <span className="font-800 text-text-primary uppercase tracking-tighter">{optimisticSymbol}</span>
                  <span className="w-1 h-3 border-l border-border-subtle mx-0.5" />
                  <span className="text-text-secondary font-500 whitespace-nowrap">{mainStock.meta.longName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-800 text-text-primary tabular-nums text-sm">₹{mainStock.meta.price?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                  <div className={cn("flex items-center gap-1 font-800 px-1.5 py-0.5 rounded text-[10px]", isPos ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red")}>
                    {isPos ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                    {isPos ? "+" : ""}{mainStock.meta.changePct?.toFixed(2)}%
                  </div>
                </div>
                <div className="h-4 w-[1px] bg-border-subtle/50 mx-1 hidden md:block" />
                <div className="flex items-center gap-3 sm:gap-6 flex-nowrap text-[9px] sm:text-[10px] uppercase font-700 tracking-tight">
                  <div className="flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">Prev Close</span>
                    <span className="text-text-secondary text-[10px] sm:text-[11px]">₹{mainStock.meta.prevClose?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">Open</span>
                    <span className="text-text-secondary text-[10px] sm:text-[11px]">₹{mainStock.meta.open?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">High</span>
                    <span className="text-accent-green text-[10px] sm:text-[11px]">₹{mainStock.meta.high?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">Low</span>
                    <span className="text-accent-red text-[10px] sm:text-[11px]">₹{mainStock.meta.low?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="hidden sm:flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">Volume (L)</span>
                    <span className="text-text-primary text-[11px]">{formatVolume(mainStock.meta.volume)}</span>
                  </div>
                  <div className="hidden md:flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">Value (Cr)</span>
                    <span className="text-text-primary text-[11px]">{formatCurrency(mainStock.meta.totalTradedValue)}</span>
                  </div>
                  <div className="hidden md:flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">FFM. Cap (Lakh Cr)</span>
                    <span className="text-text-primary text-[11px]">{mainStock.meta.ffmc > 0 ? (mainStock.meta.ffmc / 100000).toFixed(2) : "--"}</span>
                  </div>
                  <div className="hidden lg:flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">P/E</span>
                    <span className="text-text-secondary text-[11px]">{mainStock.meta.pe > 0 ? mainStock.meta.pe.toFixed(2) : "--"}</span>
                  </div>
                  <div className="hidden md:flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">P/B</span>
                    <span className="text-text-secondary text-[11px]">{mainStock.meta.pb > 0 ? mainStock.meta.pb.toFixed(2) : "--"}</span>
                  </div>
                  <div className="hidden lg:flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">EPS</span>
                    <span className="text-text-secondary text-[11px]">{mainStock.meta.eps ? `₹${mainStock.meta.eps.toFixed(2)}` : "--"}</span>
                  </div>
                  <div className="hidden sm:flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">Avg Vol (L)</span>
                    <span className="text-text-primary text-[11px]">{formatVolume(mainStock.meta.avgVolume)}</span>
                  </div>
                  <div className="hidden sm:flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">52W High</span>
                    <span className="text-accent-green font-800 text-[10px] sm:text-[11px]">₹{mainStock.meta.high52?.toLocaleString("en-IN")}</span>
                  </div>
                  <div className="hidden sm:flex flex-col shrink-0">
                    <span className="text-text-muted text-[8px]">52W Low</span>
                    <span className="text-accent-red font-800 text-[10px] sm:text-[11px]">₹{mainStock.meta.low52?.toLocaleString("en-IN")}</span>
                  </div>
                  {mainStock.meta.targetPrice && (
                    <div className="hidden xl:flex flex-col shrink-0 border-l border-border-subtle pl-4">
                      <span className="text-text-muted text-[8px]">Analyst Target</span>
                      <span className="text-accent-blue font-800 text-[11px]">₹{mainStock.meta.targetPrice.toLocaleString("en-IN")}</span>
                    </div>
                  )}
                  {mainStock.meta.recommendation && mainStock.meta.recommendation !== "none" && (
                    <div className="hidden xl:flex flex-col shrink-0">
                      <span className="text-text-muted text-[8px]">Sentiment</span>
                      <span className={cn("font-900 text-[10px] uppercase tracking-tighter px-1.5 py-0.5 rounded",
                        mainStock.meta.recommendation.includes("buy") ? "bg-accent-green/20 text-accent-green" : "bg-accent-amber/20 text-accent-amber")}>
                        {mainStock.meta.recommendation.replace("_", " ")}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : <span className="text-text-muted text-[11px] font-mono">Hover for OHLCV data</span>}
          {isLoading && <div className="ml-auto flex items-center gap-1.5 text-[10px] font-mono text-text-muted"><div className="w-3 h-3 border border-accent-blue border-t-transparent rounded-full animate-spin" />Loading...</div>}
        </div>

        {/* chart canvas */}
        <div className="relative group/chart">
          {isLoading && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-accent-blue/90 text-white shadow-xl backdrop-blur-md border border-white/20 animate-fade-in">
              <RefreshCw size={12} className="animate-spin" />
              <span className="text-[10px] font-mono font-800 uppercase tracking-widest truncate max-w-[120px]">
                Syncing {stocks[0]?.symbol || "Data"}...
              </span>
            </div>
          )}
          <div ref={containerRef} className={cn("w-full transition-all duration-300", fullscreen ? "flex-1" : "h-[500px] sm:h-[600px] lg:h-[calc(100vh-280px)] min-h-[500px]")} />
          {!mainStock && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-bg-card z-10 transition-all">
              <div className="flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-bg-elevated flex items-center justify-center text-text-muted border border-border-subtle">
                  <Grid3X3 size={24} className="opacity-30" />
                </div>
                <p className="text-text-muted text-sm font-body">Initialize chart to begin</p>
                <button onClick={() => loadStock("NIFTY50", COLORS[0], true)} className="px-5 py-2 rounded-xl bg-accent-blue text-white text-xs font-700 shadow-glow-blue">Connect to NIFTY 50</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!fullscreen && (
        <>
          {/* market summary */}
          <MarketSummary onSelect={switchPrimary} />

          {/* stock grid */}
          <StockGrid stocks={stocks} mainSymbol={mainSymbol} onSelect={switchPrimary} onAdd={addOverlay} loadingSet={loading} />
        </>
      )}
    </div>
  );
}

/* ─── Stock Grid ─────────────────────────────────────────── */
const StockGrid = memo(({ stocks, mainSymbol, onSelect, onAdd, loadingSet }: {
  stocks: LoadedStock[]; mainSymbol: string;
  onSelect: (s: string) => void; onAdd: (s: string) => void; loadingSet: Set<string>;
}) => {
  const [prices, setPrices] = useState<Record<string, any>>({});
  const [search, setSearch] = useState("");
  const [sector, setSector] = useState("All");
  const [typeFilter, setTypeFilter] = useState<"All" | "Stock" | "Index">("All");
  const [sortBy, setSortBy] = useState<"default" | "gainers" | "losers" | "volume">("default");
  const [view, setView] = useState<"grid" | "list">("grid");

  useEffect(() => {
    const load = async () => {
      try {
        const [sR, iR] = await Promise.all([
          fetch(`/api/stocks?t=${Date.now()}`, { cache: "no-store" }),
          fetch(`/api/indices?t=${Date.now()}`, { cache: "no-store" })
        ]);
        const sD = await sR.json();
        const iD = await iR.json();
        const m: Record<string, any> = {};
        if (Array.isArray(sD)) sD.forEach((s: any) => { m[s.symbol] = s; });
        if (Array.isArray(iD)) iD.forEach((idx: any) => {
          m[idx.indexName] = { ...idx, symbol: idx.indexName, price: idx.last, changePercent: idx.percChange };
        });
        setPrices(m);
      } catch { }
    };
    load();
    const iv = setInterval(load, 3000);
    return () => clearInterval(iv);
  }, []);

  const sectors = useMemo(() => ["All", ...Array.from(new Set(SYMBOL_LIST.map(s => s.sector))).filter(Boolean).sort()], []);
  const list = useMemo(() => SYMBOL_LIST
    .filter(s => {
      const q = search.toLowerCase();
      const matchesSearch = s.symbol.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      const matchesSector = sector === "All" || s.sector === sector;
      const matchesType = typeFilter === "All" || s.type === typeFilter;
      return matchesSearch && matchesSector && matchesType;
    })
    .sort((a, b) => {
      const pa = prices[a.symbol]; const pb = prices[b.symbol];
      if (sortBy === "gainers") return (pb?.changePercent || 0) - (pa?.changePercent || 0);
      if (sortBy === "losers") return (pa?.changePercent || 0) - (pb?.changePercent || 0);
      if (sortBy === "volume") return (pb?.volume || 0) - (pa?.volume || 0);
      return 0;
    }), [search, sector, sortBy, prices]);

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle gap-4 overflow-hidden">
        <div className="flex items-center gap-2 shrink-0">
          <Grid3X3 size={14} className="text-accent-blue" />
          <h2 className="font-display font-700 text-text-primary text-sm whitespace-nowrap">Market Hub</h2>
          <span className="text-text-muted text-[10px] font-mono">({list.length})</span>
        </div>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar whitespace-nowrap -mr-4 pr-4">
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="bg-bg-elevated border border-border-subtle rounded-lg px-2 py-1.5 text-[11px] font-mono text-text-primary focus:outline-none">
            <option value="default">Default</option>
            <option value="gainers">Top Gainers</option>
            <option value="losers">Top Losers</option>
            <option value="volume">High Volume</option>
          </select>
          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as any)}
            className="bg-bg-elevated border border-border-subtle rounded-lg px-2 py-1.5 text-[11px] font-mono text-text-primary focus:outline-none">
            <option value="All">All Types</option>
            <option value="Stock">Stocks Only</option>
            <option value="Index">Indices Only</option>
          </select>
          <select value={sector} onChange={e => setSector(e.target.value)}
            className="bg-bg-elevated border border-border-subtle rounded-lg px-2 py-1.5 text-[11px] font-mono text-text-primary focus:outline-none">
            {sectors.map(s => <option key={s}>{s}</option>)}
          </select>
          <div className="relative">
            <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              className="bg-bg-elevated border border-border-subtle rounded-lg pl-7 pr-3 py-1.5 text-[11px] font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50 w-36" />
          </div>
          <div className="flex bg-bg-elevated rounded-lg p-0.5">
            {(["grid", "list"] as const).map(v => (
              <button key={v} onClick={() => setView(v)} className={cn("px-2 py-1 rounded text-[10px] font-mono capitalize transition-all", view === v ? "bg-accent-blue text-white" : "text-text-muted hover:text-text-primary")}>{v}</button>
            ))}
          </div>
        </div>
      </div>

      <div className={cn("overflow-y-auto p-2", view === "grid" ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2" : "divide-y divide-border-subtle/30 p-0")}
        style={{ maxHeight: 480 }}>
        {list.map(s => {
          const p = prices[s.symbol];
          const isMain = mainSymbol === s.symbol;
          const isOverlay = stocks.slice(1).some(st => st.symbol === s.symbol);
          const busyThis = loadingSet.has(s.symbol);
          const pos = (p?.changePercent ?? 0) >= 0;
          const overlayColor = stocks.find(st => st.symbol === s.symbol)?.color;

          if (view === "list") return (
            <div key={s.symbol} className={cn("flex items-center gap-3 px-4 py-2.5 hover:bg-bg-elevated/50 cursor-pointer transition-colors", isMain && "bg-accent-blue/8")}
              onClick={() => onSelect(s.symbol)}>
              <div className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center text-[9px] font-mono font-700 text-text-secondary shrink-0">{s.symbol.slice(0, 2)}</div>
              <div className="flex-1 min-w-0">
                <span className="text-text-primary text-xs font-600">{s.symbol}</span>
                <span className="text-text-muted text-[10px] ml-2 hidden sm:inline">{s.name}</span>
              </div>
              {p && <>
                <span className="font-mono text-xs text-text-primary tabular-nums shrink-0">₹{p.price?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                <span className={cn("font-mono text-[11px] font-600 w-16 text-right tabular-nums shrink-0", pos ? "text-accent-green" : "text-accent-red")}>{pos ? "+" : ""}{p.changePercent?.toFixed(2)}%</span>
              </>}
              <MiniSparkline price={p?.price} prevClose={p?.previousClose} positive={pos} />
              <div className="flex gap-1 shrink-0">
                {isMain && <span className="text-[9px] font-mono px-1.5 py-0.5 bg-accent-blue/15 text-accent-blue rounded">LIVE</span>}
                {isOverlay && <div className="w-2.5 h-2.5 rounded-full mt-0.5" style={{ backgroundColor: overlayColor }} />}
                <button onClick={e => { e.stopPropagation(); onAdd(s.symbol); }} className="text-text-muted hover:text-accent-blue transition-colors ml-1"><Plus size={12} /></button>
              </div>
            </div>
          );

          return (
            <div key={s.symbol}
              style={isMain ? { borderColor: "#3B82F6" } : isOverlay ? { borderColor: `${overlayColor}60` } : {}}
              className={cn("relative p-3 rounded-xl border cursor-pointer transition-all group hover:border-accent-blue/40 active:scale-95 overflow-hidden",
                isMain ? "border-accent-blue/50 bg-accent-blue/8" : isOverlay ? "border-opacity-60 bg-bg-elevated/20" : "border-border-subtle/50 bg-bg-secondary/20")}
              onClick={() => onSelect(s.symbol)}>
              {busyThis && <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 border border-accent-blue border-t-transparent rounded-full animate-spin" />}
              {(isMain || isOverlay) && <div className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full ring-2 ring-bg-card" style={{ backgroundColor: overlayColor || "#3B82F6" }} />}
              <div className="flex items-center gap-1.5 mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-bg-elevated flex items-center justify-center text-[9px] font-mono font-700 text-text-secondary shrink-0">{s.symbol.slice(0, 2)}</div>
                <div className="min-w-0"><div className="text-text-primary text-[11px] font-600 truncate">{s.symbol}</div><div className="text-text-muted text-[9px] truncate">{s.sector}</div></div>
              </div>
              {p ? <>
                <div className="font-mono font-700 text-sm text-text-primary tabular-nums">₹{p.price?.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</div>
                <div className={cn("flex items-center gap-0.5 text-[10px] font-mono font-600 mt-0.5", pos ? "text-accent-green" : "text-accent-red")}>
                  {pos ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}{pos ? "+" : ""}{p.changePercent?.toFixed(2)}%
                </div>
                <div className="mt-2"><MiniSparkline price={p.price} prevClose={p.previousClose} positive={pos} fullWidth /></div>
              </> : <div className="space-y-1.5 mt-1"><div className="skeleton h-4 w-20 rounded" /><div className="skeleton h-3 w-12 rounded" /><div className="skeleton h-7 rounded mt-1" /></div>}
              <button onClick={e => { e.stopPropagation(); onAdd(s.symbol); }}
                className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-accent-blue/20 hover:bg-accent-blue/40 text-accent-blue rounded-lg p-1">
                <Plus size={10} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
});

/* ─── Mini Sparkline ─────────────────────────────────────── */
const MiniSparkline = memo(({ price, prevClose, positive, fullWidth }: { price?: number; prevClose?: number; positive: boolean; fullWidth?: boolean }) => {
  const pts = generateSpark(price, prevClose);
  if (!pts.length) return <div style={{ height: 30 }} className="skeleton rounded" />;
  const min = Math.min(...pts); const max = Math.max(...pts); const r = max - min || 1;
  const W = 60; const H = 30;
  const d = pts.map((v: number, i: number) => `${(i / (pts.length - 1)) * W},${H - ((v - min) / r) * H}`).join(" ");
  const color = positive ? "#00D4AA" : "#FF4D6A";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: fullWidth ? "100%" : 60, height: H }} preserveAspectRatio="none">
      <polyline points={d} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
});

function generateSpark(price?: number, prevClose?: number): number[] {
  if (!price) return [];
  const base = prevClose || price; const steps = 20; const arr: number[] = [];
  let cur = base;
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1); const noise = (Math.random() - 0.5) * base * 0.006;
    cur = base + (price - base) * t + noise; arr.push(cur);
  }
  arr[arr.length - 1] = price; return arr;
}

/* ─── Market Summary ───────────────────────────────────────── */
const MarketSummary = memo(({ onSelect }: { onSelect: (s: string) => void }) => {
  const [stats, setStats] = useState<any>(null);
  const [tab, setTab] = useState<"gainers" | "losers" | "activeValue" | "activeVolume" | "global">("gainers");
  const [global, setGlobal] = useState<any[]>([]);

  useEffect(() => {
    const loadGlobal = async () => {
      try {
        const r = await fetch("/api/market/summary");
        const d = await r.json();
        if (Array.isArray(d)) setGlobal(d.slice(0, 10));
      } catch { }
    };
    loadGlobal();
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`/api/market/stats?t=${Date.now()}`, { cache: "no-store" });
        const d = await r.json();
        if (d && !d.error) setStats(d);
      } catch { }
    };
    load();
    const iv = setInterval(load, REFRESH_INTERVAL);
    return () => clearInterval(iv);
  }, []);

  if (!stats) return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden p-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-accent-blue/20 border-t-accent-blue animate-spin" />
        <div className="space-y-2">
          <div className="skeleton h-4 w-48 mx-auto rounded" />
          <div className="skeleton h-3 w-32 mx-auto rounded opacity-50" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden shadow-sm transition-all">
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-border-subtle bg-bg-secondary/20 gap-3">
        <div className="flex items-center gap-6">
          <h3 className="text-xs font-800 uppercase tracking-widest text-text-muted">Market Pulse</h3>
          <div className="flex bg-bg-elevated rounded-lg p-1 gap-1">
            {[
              { id: "gainers", label: "Gainers" },
              { id: "losers", label: "Losers" },
              { id: "activeValue", label: "Most Active Value" },
              { id: "activeVolume", label: "Most Active Volume" },
              { id: "etf", label: "ETF" },
              { id: "global", label: "Global" },
            ].map(t => (
              <button key={t.id}
                onClick={() => setTab(t.id as any)}
                className={cn("px-2.5 py-1 rounded text-[10px] font-800 uppercase tracking-tighter transition-all",
                  tab === t.id ? "bg-accent-blue text-white shadow-sm" : "text-text-muted hover:text-text-primary")}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <button className="text-[10px] font-700 text-accent-blue hover:underline">View All Statistics</button>
      </div>

      <div className="overflow-x-auto min-h-[300px]">
        {tab === "global" ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-secondary/10 border-b border-border-subtle/30">
                <th className="px-4 py-2.5 text-[10px] font-800 text-text-muted uppercase tracking-wider whitespace-nowrap">Asset</th>
                <th className="px-4 py-2.5 text-[10px] font-800 text-text-muted uppercase tracking-wider text-right whitespace-nowrap">Price</th>
                <th className="px-4 py-2.5 text-[10px] font-800 text-text-muted uppercase tracking-wider text-right whitespace-nowrap">% Change</th>
                <th className="px-4 py-2.5 text-[10px] font-800 text-text-muted uppercase tracking-wider text-right whitespace-nowrap">State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/20 font-mono">
              {global.map((s: any) => {
                const isPos = s.changePct >= 0;
                return (
                  <tr key={s.symbol} className="hover:bg-bg-elevated/30 transition-colors">
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col">
                        <span className="text-xs font-800 text-text-primary">{s.name || s.symbol}</span>
                        <span className="text-[9px] text-text-muted uppercase">{s.symbol}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-primary font-600 tabular-nums">
                      {s.price?.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                    </td>
                    <td className={cn("px-4 py-2.5 text-right text-xs font-800 tabular-nums", isPos ? "text-accent-green" : "text-accent-red")}>
                      {isPos ? "+" : ""}{(s.changePct * 100).toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right whitespace-nowrap">
                      <span className={cn("text-[9px] px-1.5 py-0.5 rounded font-800", s.state === "REGULAR" ? "bg-accent-green/10 text-accent-green" : "bg-bg-elevated text-text-muted")}>
                        {s.state}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-bg-secondary/10 border-b border-border-subtle/30">
                <th className="px-4 py-2.5 text-[10px] font-800 text-text-muted uppercase tracking-wider whitespace-nowrap">Symbol</th>
                <th className="px-4 py-2.5 text-[10px] font-800 text-text-muted uppercase tracking-wider text-right whitespace-nowrap">LTP</th>
                <th className="px-4 py-2.5 text-[10px] font-800 text-text-muted uppercase tracking-wider text-right whitespace-nowrap">CHNG</th>
                <th className="px-4 py-2.5 text-[10px] font-800 text-text-muted uppercase tracking-wider text-right whitespace-nowrap">%CHNG</th>
                <th className="px-4 py-2.5 text-[10px] font-800 text-text-muted uppercase tracking-wider text-right whitespace-nowrap">Volume (Lakhs)</th>
                <th className="px-4 py-2.5 text-[10px] font-800 text-text-muted uppercase tracking-wider text-right whitespace-nowrap">Value (Cr)</th>
                <th className="px-4 py-2.5 text-[10px] font-800 text-text-muted uppercase tracking-wider text-center whitespace-nowrap">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-subtle/20 font-mono">
              {(stats[tab] || []).map((s: any) => {
                const isPos = s.changePercent >= 0;
                const volLakhs = (s.volume || 0) / 100000;
                // If value is provided directly, use it, else calculate. 
                // In our API client, for NSE stocks we get totalTradedValue which is often in lakhs, for Yahoo we normalize to Cr.
                // We'll normalize to Cr here.
                let valCr = s.totalTradedValue || 0;
                if (valCr > 10000) valCr = valCr / 100; // If it's in lakhs and too high, it's likely absolute or lakhs. Crude heuristic.

                return (
                  <tr key={s.symbol} className="hover:bg-bg-elevated/30 transition-colors cursor-pointer group" onClick={() => onSelect(s.symbol)}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className={cn("w-1 h-6 rounded-full transition-all group-hover:w-1.5", isPos ? "bg-accent-green/40" : "bg-accent-red/40")} />
                        <div className="flex flex-col">
                          <span className="text-xs font-800 text-text-primary">{s.symbol}</span>
                          <span className="text-[9px] text-text-muted truncate w-20">{s.name}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-primary font-600 tabular-nums">
                      {s.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                    <td className={cn("px-4 py-2.5 text-right text-xs font-600 tabular-nums", isPos ? "text-accent-green" : "text-accent-red")}>
                      {isPos ? "+" : ""}{s.change.toFixed(2)}
                    </td>
                    <td className={cn("px-4 py-2.5 text-right text-xs font-800 tabular-nums", isPos ? "text-accent-green" : "text-accent-red")}>
                      {isPos ? "+" : ""}{s.changePercent.toFixed(2)}%
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-primary tabular-nums">
                      {volLakhs.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-right text-xs text-text-primary tabular-nums font-600">
                      {valCr.toFixed(2)}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      <MiniSparkline price={s.price} prevClose={s.previousClose} positive={isPos} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
});
