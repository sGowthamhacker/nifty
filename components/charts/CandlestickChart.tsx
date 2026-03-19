"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { RefreshCw, TrendingUp, TrendingDown, Maximize2, Minimize2 } from "lucide-react";

const TIMEFRAMES = [
  {label:"1m", value:"1m", yahoo_interval:"1m",  yahoo_range:"1d"},
  {label:"5m", value:"5m", yahoo_interval:"5m",  yahoo_range:"5d"},
  {label:"1D", value:"1D", yahoo_interval:"5m",  yahoo_range:"1d"},
  {label:"1W", value:"1W", yahoo_interval:"15m", yahoo_range:"5d"},
  {label:"1M", value:"1M", yahoo_interval:"1d",  yahoo_range:"1mo"},
  {label:"3M", value:"3M", yahoo_interval:"1d",  yahoo_range:"3mo"},
  {label:"6M", value:"6M", yahoo_interval:"1wk", yahoo_range:"6mo"},
  {label:"1Y", value:"1Y", yahoo_interval:"1d",  yahoo_range:"1y"},
  {label:"5Y", value:"5Y", yahoo_interval:"1mo", yahoo_range:"5y"},
];

interface Candle { time:number; open:number; high:number; low:number; close:number; volume:number; }
interface HoverInfo { time:string; open:number; high:number; low:number; close:number; change:number; changePct:number; volume:number; }

const f2 = (n:number) => n?.toLocaleString("en-IN",{minimumFractionDigits:2,maximumFractionDigits:2}) ?? "—";
const fv  = (v:number) => v>=1e7?`${(v/1e7).toFixed(2)}Cr`:v>=1e5?`${(v/1e5).toFixed(2)}L`:`${(v/1e3).toFixed(1)}K`;

export default function CandlestickChart() {
  const containerRef  = useRef<HTMLDivElement>(null);
  const chartRef      = useRef<any>(null);
  const seriesRef     = useRef<any>(null);
  const volSerRef     = useRef<any>(null);
  const intervalRef   = useRef<NodeJS.Timeout|null>(null);

  const [tf,        setTf]        = useState("1m");
  const [chartType, setChartType] = useState("candle");
  const [loading,   setLoading]   = useState(true);
  const [ready,     setReady]     = useState(false);
  const [hover,     setHover]     = useState<HoverInfo|null>(null);
  const [summary,   setSummary]   = useState<Omit<HoverInfo,"time">|null>(null);
  const [srcLabel,  setSrcLabel]  = useState("—");
  const [mounted,   setMounted]   = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const isInitialLoadRef = useRef(false);
  const [isRestored, setIsRestored] = useState(false);

  // Persistence: Load
  useEffect(() => {
    const saved = localStorage.getItem("nifty_dashboard_chart_v1");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.tf) setTf(p.tf);
        if (p.chartType) setChartType(p.chartType);
      } catch {}
    }
    setIsRestored(true);
  }, []);

  // Persistence: Save
  useEffect(() => {
    if (isRestored) {
      localStorage.setItem("nifty_dashboard_chart_v1", JSON.stringify({ tf, chartType }));
    }
  }, [tf, chartType, isRestored]);

  /* Init chart once */
  useEffect(() => {
    setMounted(true);
    if (!containerRef.current || ready) return;
    let dead = false;
    (async () => {
      const LW = await import("lightweight-charts");
      if (dead || !containerRef.current) return;

      const chart = LW.createChart(containerRef.current, {
        width:  containerRef.current.clientWidth,
        height: 500,
        layout: {
          background: { type: LW.ColorType.Solid, color: "transparent" },
          textColor: "#9AA0B4", fontFamily: "'JetBrains Mono',monospace", fontSize: 11,
        },
        grid: {
          vertLines: { color: "rgba(37,40,64,0.8)" },
          horzLines: { color: "rgba(37,40,64,0.8)" },
        },
        crosshair: {
          mode: LW.CrosshairMode.Normal,
          vertLine: { color: "rgba(59,130,246,0.7)", width: 1, style: 0, labelBackgroundColor: "#1e2035" },
          horzLine: { color: "rgba(59,130,246,0.7)", width: 1, style: 0, labelBackgroundColor: "#1e2035" },
        },
        rightPriceScale: { borderColor: "#252840", minimumWidth: 85, scaleMargins: { top: 0.05, bottom: 0.26 } },
        timeScale: { borderColor: "#252840", timeVisible: true, secondsVisible: true },
        localization: {
          locale: "en-IN",
          timeFormatter: (time: number) => {
            return new Date(time * 1000).toLocaleString("en-IN", {
              timeZone: "UTC",
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
              hourCycle: "h23",
            });
          },
        },
        handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: true },
        handleScale:  { mouseWheel: true, pinch: true, axisPressedMouseMove: { time: true, price: true } },
        kineticScroll: { touch: true, mouse: true },
      });

      const updateDimensions = () => {
        if (!containerRef.current || !chartRef.current) return;
        chartRef.current.applyOptions({ 
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight || (isFullScreen ? window.innerHeight - 150 : 500)
        });
      };

      const volSer = chart.addHistogramSeries({ priceScaleId: "vol", priceFormat: { type: "volume" } });
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.80, bottom: 0 }, borderVisible: false });
      volSerRef.current = volSer;

      const ro = new ResizeObserver(updateDimensions);
      ro.observe(containerRef.current);
      window.addEventListener("resize", updateDimensions);

      chartRef.current = chart;
      setReady(true);

      return () => { 
        dead = true; 
        ro.disconnect(); 
        window.removeEventListener("resize", updateDimensions);
        chart.remove(); 
      };
    })();
    return () => { dead = true; };
  }, []); // eslint-disable-line

  /* Handle Chart Type / Series Creation */
  useEffect(() => {
    if (!ready || !chartRef.current) return;
    
    if (seriesRef.current) {
      try { chartRef.current.removeSeries(seriesRef.current); } catch {}
    }

    if (chartType === "line") {
      seriesRef.current = chartRef.current.addLineSeries({ color: "#3B82F6", lineWidth: 2 });
    } else if (chartType === "area") {
      seriesRef.current = chartRef.current.addAreaSeries({ 
        lineColor: "#3B82F6", 
        topColor: "rgba(59, 130, 246, 0.4)", 
        bottomColor: "rgba(59, 130, 246, 0.05)",
        lineWidth: 2 
      });
    } else {
      seriesRef.current = chartRef.current.addCandlestickSeries({
        upColor: "#00D4AA", downColor: "#FF4D6A",
        borderUpColor: "#00D4AA", borderDownColor: "#FF4D6A",
        wickUpColor: "#00D4AA", wickDownColor: "#FF4D6A",
      });
    }

    const currentSeries = seriesRef.current;
    chartRef.current.subscribeCrosshairMove((p: any) => {
      if (!p?.time || !p.seriesData) { setHover(null); return; }
      const c = p.seriesData.get(currentSeries);
      if (!c) { setHover(null); return; }
      
      const t = typeof p.time === "number"
        ? new Date(p.time * 1000).toLocaleString("en-IN", {
            timeZone: "UTC",
            day: "2-digit", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit",
          })
        : String(p.time);
      
      const vol = p.seriesData.get(volSerRef.current)?.value ?? 0;
      
      if (chartType === "candle") {
        const chg = +(c.close - c.open).toFixed(2);
        const chgPct = c.open ? +(((c.close - c.open) / c.open) * 100).toFixed(2) : 0;
        setHover({ time: t, open: c.open, high: c.high, low: c.low, close: c.close, change: chg, changePct: chgPct, volume: vol });
      } else {
        setHover({ time: t, open: 0, high: 0, low: 0, close: c.value, change: 0, changePct: 0, volume: vol });
      }
    });

    isInitialLoadRef.current = false;
    loadData(tf);
  }, [chartType, ready]); // eslint-disable-line

  const loadData = useCallback(async (timeframe: string) => {
    if (!seriesRef.current || !chartRef.current) return;
    try {
      const res = await fetch(`/api/market/chart?timeframe=${timeframe}`, { cache: "no-store" });
      const candles: Candle[] = await res.json();
      if (!Array.isArray(candles) || candles.length === 0) return;

      const sorted = [...candles].sort((a, b) => a.time - b.time);

      if (chartType === "candle") {
        seriesRef.current.setData(sorted.map(c => ({
          time: c.time as any, open: c.open, high: c.high, low: c.low, close: c.close,
        })));
      } else {
        seriesRef.current.setData(sorted.map(c => ({
          time: c.time as any, value: c.close,
        })));
      }
      
      volSerRef.current?.setData(sorted.map(c => ({
        time: c.time as any, value: c.volume,
        color: c.close >= c.open ? "rgba(0,212,170,0.25)" : "rgba(255,77,106,0.25)",
      })));

      if (!isInitialLoadRef.current) {
        chartRef.current?.timeScale().fitContent();
        isInitialLoadRef.current = true;
      }

      const last = sorted[sorted.length - 1];
      const period = sorted[0];
      const chg = +(last.close - period.open).toFixed(2);
      const pct = period.open ? +(((last.close - period.open) / period.open) * 100).toFixed(2) : 0;
      
      setSummary({ 
        open: period.open, 
        high: Math.max(...sorted.map(c=>c.high)), 
        low: Math.min(...sorted.map(c=>c.low)), 
        close: last.close, 
        change: chg, 
        changePct: pct, 
        volume: last.volume 
      });
      setSrcLabel(res.headers.get("X-Cache") === "HIT" ? "cached" : "live");
      setLoading(false);
    } catch (e) {
      console.warn("chart load error:", (e as Error).message);
      setLoading(false);
    }
  }, [chartType]);

  useEffect(() => {
    if (!ready) return;
    setLoading(true);
    isInitialLoadRef.current = false;
    loadData(tf);

    if (intervalRef.current) clearInterval(intervalRef.current);
    const ttl = ["1m","5m","1D"].includes(tf) ? 1000 : 10000;
    intervalRef.current = setInterval(() => loadData(tf), ttl);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [tf, ready, loadData]);

  useEffect(() => {
    if (!chartRef.current) return;
    chartRef.current.applyOptions({
      localization: {
        locale: "en-IN",
        timeFormatter: (time: number) => {
          const date = new Date(time * 1000);
          if (["1m","5m","1D","1W"].includes(tf)) {
            return date.toLocaleTimeString("en-IN", { timeZone: "UTC", hour: "2-digit", minute: "2-digit", hour12: false });
          }
          return date.toLocaleDateString("en-IN", { timeZone: "UTC", day: "2-digit", month: "short" });
        }
      }
    });
  }, [tf]);

  const display = hover ?? (summary ? { ...summary, time: "" } : null);
  const isPos = (display?.change ?? 0) >= 0;

  useEffect(() => {
    if (isFullScreen) {
      document.body.classList.add('chart-fullscreen');
    } else {
      document.body.classList.remove('chart-fullscreen');
    }
    return () => document.body.classList.remove('chart-fullscreen');
  }, [isFullScreen]);

  useEffect(() => {
    if (ready && chartRef.current && containerRef.current) {
      const currentContainer = containerRef.current;
      const currentChart = chartRef.current;
      setTimeout(() => {
        if (!currentContainer || !currentChart) return;
        currentChart.applyOptions({ 
          width: currentContainer.clientWidth,
          height: currentContainer.clientHeight || (isFullScreen ? window.innerHeight - 150 : 500) 
        });
        currentChart.timeScale().fitContent();
      }, 350);
    }
  }, [isFullScreen, ready]);

  return (
    <>
    {isFullScreen && <div className="fixed inset-0 bg-bg-primary z-[9990] transition-opacity duration-300" />}
    <div className={cn(
      "bg-bg-card border border-border-subtle rounded-2xl overflow-hidden flex flex-col transition-all duration-300",
      isFullScreen ? "fixed inset-4 z-[9999] shadow-2xl h-[calc(100vh-32px)]" : "relative h-auto"
    )}>
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-subtle flex-wrap gap-2">
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="shrink-0">
            <span className="font-display font-700 text-sm text-text-primary">NIFTY 50</span>
            <span className="text-text-muted text-[10px] font-mono ml-2 uppercase">{chartType} · 1s</span>
          </div>
          {display && (
            <div className="hidden md:flex items-center gap-2 text-[11px] font-mono flex-wrap">
              {chartType === "candle" ? (
                <>
                  <span className="text-text-muted">O<span className="text-text-primary ml-0.5 tabular-nums">{f2(display.open)}</span></span>
                  <span className="text-text-muted">H<span className="text-accent-green ml-0.5 tabular-nums">{f2(display.high)}</span></span>
                  <span className="text-text-muted">L<span className="text-accent-red ml-0.5 tabular-nums">{f2(display.low)}</span></span>
                  <span className="text-text-muted">C<span className="text-text-primary ml-0.5 tabular-nums">{f2(display.close)}</span></span>
                  <span className={cn("font-700 tabular-nums", isPos ? "text-accent-green" : "text-accent-red")}>
                    {isPos?"+":""}{f2(display.change)} ({isPos?"+":""}{display.changePct}%)
                  </span>
                </>
              ) : (
                <span className="text-text-muted">Price<span className="text-text-primary ml-1 tabular-nums">₹{f2(display.close)}</span></span>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex bg-bg-elevated rounded-lg p-0.5 gap-0.5 mr-2 shadow-inner border border-border-subtle/30">
            {["candle", "line", "area"].map(type => (
              <button key={type} onClick={() => setChartType(type)}
                className={cn("px-2.5 py-1 rounded-md text-[10px] font-mono capitalize transition-all",
                  chartType === type ? "bg-accent-blue text-white font-700 shadow-sm" : "text-text-muted hover:text-text-primary")}>
                {type}
              </button>
            ))}
          </div>

          {mounted && (
            <span className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded",
              srcLabel==="live" ? "bg-accent-green/10 text-accent-green" : "bg-bg-elevated text-text-muted")}>
              {srcLabel}
            </span>
          )}
          
          <div className="flex bg-bg-elevated rounded-lg p-0.5 gap-0.5">
            {TIMEFRAMES.map(t => (
              <button key={t.value} onClick={() => setTf(t.value)}
                className={cn("px-2 py-1 rounded text-[10px] font-mono transition-all",
                  tf === t.value ? "bg-accent-blue text-white font-700" : "text-text-muted hover:text-text-primary")}>
                {t.label}
              </button>
            ))}
          </div>

          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 rounded-lg bg-bg-elevated text-text-muted hover:text-text-primary hover:bg-bg-secondary transition-all border border-border-subtle/50"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? <Minimize2 size={14}/> : <Maximize2 size={14}/>}
          </button>
        </div>
      </div>

      <div className={cn("relative w-full", isFullScreen ? "flex-1 min-h-0" : "")}>
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg-card/80 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-accent-blue border-t-transparent rounded-full animate-spin"/>
              <span className="text-text-muted text-xs font-mono">Loading {tf} chart…</span>
            </div>
          </div>
        )}
        <div ref={containerRef} className={cn("w-full transition-all focus:outline-none", isFullScreen ? "h-full" : "h-[500px]")}/>
      </div>

      {hover && (
        <div className="px-4 py-2 border-t border-border-subtle/50 bg-bg-elevated/40 flex items-center gap-4 flex-wrap text-[11px] font-mono">
          <span className="text-text-muted shrink-0 text-[10px]">{hover.time}</span>
          <div className="flex items-center gap-3 flex-wrap">
            {chartType === "candle" && (
              <>
                <span>O<span className="text-text-primary ml-0.5">{f2(hover.open)}</span></span>
                <span>H<span className="text-accent-green ml-0.5">{f2(hover.high)}</span></span>
                <span>L<span className="text-accent-red ml-0.5">{f2(hover.low)}</span></span>
                <span>C<span className="text-text-primary ml-0.5">{f2(hover.close)}</span></span>
              </>
            )}
            {chartType !== "candle" && (
              <span>Price<span className="text-text-primary ml-1 font-700">₹{f2(hover.close)}</span></span>
            )}
            <span>Vol<span className="text-text-secondary ml-0.5">{fv(hover.volume)}</span></span>
          </div>
          {chartType === "candle" && (
            <div className={cn("ml-auto flex items-center gap-1 font-700 tabular-nums", isPos?"text-accent-green":"text-accent-red")}>
              {isPos ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
              {isPos?"+":""}{f2(hover.change)} ({isPos?"+":""}{hover.changePct}%)
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}
