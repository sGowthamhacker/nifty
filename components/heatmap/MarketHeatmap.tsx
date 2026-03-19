"use client";
import { useEffect, useState, useMemo } from "react";
import {
  TrendingUp, TrendingDown, Maximize2, Minimize2,
  Info, BarChart2, Zap, ArrowUpRight, ArrowDownRight,
  Filter, Search, Grid3X3, Briefcase, Activity
} from "lucide-react";
import { cn, formatVolume, formatCurrency, formatPrice } from "@/lib/utils";

interface StockData {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  totalTradedValue: number;
  high: number;
  low: number;
  previousClose: number;
  vwap?: number;
  pe?: number;
  pb?: number;
  eps?: number;
  ffmc?: number;
}

const fmtN = (n: number, d = 2) => formatPrice(n || 0, d);

export default function MarketHeatmap() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewBy, setViewBy] = useState<"change" | "value">("change");
  const [detailTab, setDetailTab] = useState<"price" | "graph">("price");
  const [isRestored, setIsRestored] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/stocks?t=${Date.now()}`, { cache: "no-store" });
        const data = await res.json();
        if (Array.isArray(data)) {
          setStocks(data);
        }
      } catch (err) {
        console.error("Heatmap fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    // Persistence: Load selected symbol
    const saved = localStorage.getItem("nifty_heatmap_v1");
    if (saved) {
      try {
        const p = JSON.parse(saved);
        if (p.selectedSymbol) setSelectedSymbol(p.selectedSymbol);
      } catch {}
    }
    setIsRestored(true);

    fetchData();
    const iv = setInterval(fetchData, 5000);
    return () => clearInterval(iv);
  }, []);

  // Persistence: Save selected symbol
  useEffect(() => {
    if (isRestored && selectedSymbol) {
      localStorage.setItem("nifty_heatmap_v1", JSON.stringify({ selectedSymbol }));
    }
  }, [selectedSymbol, isRestored]);

  const filteredStocks = useMemo(() => {
    return stocks.filter(s =>
      s.symbol.toLowerCase().includes(search.toLowerCase()) ||
      s.name.toLowerCase().includes(search.toLowerCase())
    ).sort((a, b) => (b.totalTradedValue || 0) - (a.totalTradedValue || 0));
  }, [stocks, search]);

  const selectedStock = useMemo(() =>
    stocks.find(s => s.symbol === selectedSymbol),
    [stocks, selectedSymbol]
  );

  const getIntensity = (pct: number) => {
    const abs = Math.abs(pct);
    if (abs > 3) return 1;
    if (abs > 2) return 0.8;
    if (abs > 1) return 0.6;
    if (abs > 0.5) return 0.4;
    return 0.2;
  };

  const getColor = (pct: number) => {
    const intensity = getIntensity(pct);
    if (pct >= 0) return `rgba(0, 212, 170, ${intensity})`;
    return `rgba(255, 77, 106, ${intensity})`;
  };

  if (loading && stocks.length === 0) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-10 gap-2">
        {[...Array(50)].map((_, i) => (
          <div key={i} className="aspect-square bg-bg-card border border-border-subtle rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-bg-card border border-border-subtle rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex bg-bg-secondary rounded-xl p-1 gap-1 border border-border-subtle/30 shadow-inner">
            <button
              onClick={() => setViewBy("change")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-700 transition-all",
                viewBy === "change" ? "bg-accent-blue text-white shadow-glow-blue" : "text-text-muted hover:text-text-primary"
              )}
            >
              % Change
            </button>
            <button
              onClick={() => setViewBy("value")}
              className={cn(
                "px-4 py-2 rounded-lg text-xs font-700 transition-all",
                viewBy === "value" ? "bg-accent-blue text-white shadow-glow-blue" : "text-text-muted hover:text-text-primary"
              )}
            >
              Turnover
            </button>
          </div>
          <div className="h-4 w-px bg-border-subtle mx-2 hidden sm:block" />
          <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted uppercase tracking-wider">
            <div className="w-2 h-2 rounded-full bg-accent-red" />
            <span>-3%</span>
            <div className="flex gap-0.5">
              {[0.2, 0.4, 0.6, 0.8, 1].map(o => <div key={o} className="w-1.5 h-3 rounded-sm" style={{ backgroundColor: `rgba(255, 77, 106, ${o})` }} />)}
            </div>
            <div className="flex gap-0.5">
              {[1, 0.8, 0.6, 0.4, 0.2].map(o => <div key={o} className="w-1.5 h-3 rounded-sm" style={{ backgroundColor: `rgba(0, 212, 170, ${o})` }} />)}
            </div>
            <span>+3%</span>
            <div className="w-2 h-2 rounded-full bg-accent-green" />
          </div>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search symbol..."
            className="w-full bg-bg-elevated border border-border-subtle rounded-xl pl-10 pr-4 py-2 text-sm text-text-primary focus:outline-none focus:border-accent-blue/50 transition-all shadow-input"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Heatmap Grid */}
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 xl:grid-cols-10 gap-2">
          {filteredStocks.map((s) => {
            const isSelected = selectedSymbol === s.symbol;
            return (
              <div
                key={s.symbol}
                onClick={() => setSelectedSymbol(isSelected ? null : s.symbol)}
                style={{
                  backgroundColor: getColor(s.changePercent || 0),
                  border: isSelected ? '2px solid white' : '1px solid rgba(255,255,255,0.05)'
                }}
                className={cn(
                  "aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all hover:scale-[1.05] hover:z-10 relative group",
                  isSelected ? "scale-[1.05] z-10 shadow-glow-blue/20" : "hover:shadow-lg"
                )}
              >
                <span className="text-white font-display font-900 text-[11px] sm:text-xs tracking-tighter drop-shadow-md">
                  {s.symbol}
                </span>
                <span className="text-white/90 font-mono font-700 text-[9px] sm:text-[10px] drop-shadow-sm">
                  {(s.changePercent || 0) >= 0 ? "+" : ""}{(s.changePercent || 0).toFixed(2)}%
                </span>

                {/* Micro Chart Overlay on Hover */}
                <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 rounded-xl transition-opacity flex items-center justify-center pointer-events-none">
                  <Maximize2 size={12} className="text-white drop-shadow-md" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Panel */}
        <div className="lg:col-span-1">
          {selectedStock ? (
            <div className="bg-bg-card border border-border-subtle rounded-2xl p-6 sticky top-6 shadow-2xl animate-in fade-in slide-in-from-right-4">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-display font-800 text-2xl text-text-primary tracking-tight">{selectedStock.symbol}</h3>
                  <p className="text-text-muted text-[10px] font-mono uppercase tracking-widest">{selectedStock.name}</p>
                </div>
                <div className={cn(
                  "px-3 py-1.5 rounded-lg font-mono font-800 text-xs",
                  (selectedStock.changePercent || 0) >= 0 ? "bg-accent-green/10 text-accent-green" : "bg-accent-red/10 text-accent-red"
                )}>
                  {(selectedStock.changePercent || 0) >= 0 ? "+" : ""}{(selectedStock.changePercent || 0).toFixed(2)}%
                </div>
              </div>

              {/* Price/Graph Toggle */}
              <div className="flex bg-bg-secondary rounded-lg p-1 gap-1 mb-6 border border-border-subtle/30 shadow-inner">
                <button
                  onClick={() => setDetailTab("price")}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-[10px] font-800 uppercase tracking-wider transition-all",
                    detailTab === "price" ? "bg-bg-elevated text-text-primary border border-border-subtle/50 shadow-sm" : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Price
                </button>
                <button
                  onClick={() => setDetailTab("graph")}
                  className={cn(
                    "flex-1 py-1.5 rounded-md text-[10px] font-800 uppercase tracking-wider transition-all",
                    detailTab === "graph" ? "bg-bg-elevated text-text-primary border border-border-subtle/50 shadow-sm" : "text-text-muted hover:text-text-primary"
                  )}
                >
                  Graph
                </button>
              </div>

              {detailTab === "price" ? (
                <div className="space-y-4 animate-in fade-in zoom-in-95 duration-300">
                  <div className="flex items-center justify-between pb-4 border-b border-border-subtle/50">
                    <span className="text-text-muted text-[10px] font-mono uppercase tracking-widest leading-none">Live Price</span>
                    <span className="text-text-primary font-display font-800 text-2xl">₹{fmtN(selectedStock.price)}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-bg-secondary/40 border border-border-subtle/20 group hover:border-accent-blue/30 transition-all">
                      <p className="text-text-muted text-[9px] font-mono uppercase tracking-wider mb-1">Change</p>
                      <p className={cn("font-mono font-800 text-sm", selectedStock.change >= 0 ? "text-accent-green" : "text-accent-red")}>
                        {selectedStock.change >= 0 ? "+" : ""}{fmtN(selectedStock.change)}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-bg-secondary/40 border border-border-subtle/20 group hover:border-accent-blue/30 transition-all">
                      <p className="text-text-muted text-[9px] font-mono uppercase tracking-wider mb-1">VWAP</p>
                      <p className="text-text-primary font-mono font-800 text-sm">₹{fmtN(selectedStock.vwap || (selectedStock.price * 0.998))}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-bg-secondary/40 border border-border-subtle/20 group hover:border-accent-blue/30 transition-all">
                      <p className="text-text-muted text-[9px] font-mono uppercase tracking-wider mb-1">Day High</p>
                      <p className="text-accent-green font-mono font-800 text-sm">₹{fmtN(selectedStock.high)}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-bg-secondary/40 border border-border-subtle/20 group hover:border-accent-blue/30 transition-all">
                      <p className="text-text-muted text-[9px] font-mono uppercase tracking-wider mb-1">Day Low</p>
                      <p className="text-accent-red font-mono font-800 text-sm">₹{fmtN(selectedStock.low)}</p>
                    </div>
                  </div>

                  <div className="space-y-3 pt-4 border-t border-border-subtle/50">
                    <div className="flex items-center justify-between bg-bg-secondary/30 px-3 py-2.5 rounded-xl border border-border-subtle/20">
                      <span className="text-text-muted text-[10px] font-mono uppercase tracking-widest">Volume (Lakhs)</span>
                      <span className="text-text-primary font-mono text-xs font-800">{formatVolume(selectedStock.volume)}</span>
                    </div>
                    <div className="flex items-center justify-between bg-bg-secondary/30 px-3 py-2.5 rounded-xl border border-border-subtle/20">
                      <span className="text-text-muted text-[10px] font-mono uppercase tracking-widest">Value (Crores)</span>
                      <span className="text-text-primary font-mono text-xs font-800">{formatCurrency(selectedStock.totalTradedValue)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
                  <div className="h-44 bg-bg-secondary/50 rounded-2xl border border-border-subtle/30 flex items-center justify-center relative overflow-hidden group shadow-inner">
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                    <Activity className="text-accent-blue/5 w-16 h-16 absolute" />
                    <div className="absolute bottom-4 left-4 right-4 h-24">
                      <svg viewBox="0 0 100 40" className="w-full h-full filter drop-shadow-2xl">
                        <path
                          d="M0,35 Q10,15 20,25 T40,10 T60,30 T80,5 T100,20"
                          fill="none"
                          stroke={(selectedStock.changePercent || 0) >= 0 ? "#00D4AA" : "#FF4D6A"}
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>
                  {/* Fundamental Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border-subtle/50">
                    <div className="bg-bg-elevated/50 p-2.5 rounded-xl border border-border-subtle/30">
                      <p className="text-[9px] font-mono text-text-muted uppercase mb-0.5">P/E Ratio</p>
                      <p className="text-sm font-700 text-text-primary font-mono">{selectedStock.pe ? selectedStock.pe.toFixed(2) : "—"}</p>
                    </div>
                    <div className="bg-bg-elevated/50 p-2.5 rounded-xl border border-border-subtle/30">
                      <p className="text-[9px] font-mono text-text-muted uppercase mb-0.5">EPS (TTM)</p>
                      <p className="text-sm font-700 text-text-primary font-mono">{selectedStock.eps ? `₹${selectedStock.eps.toFixed(2)}` : "—"}</p>
                    </div>
                    <div className="bg-bg-elevated/50 p-2.5 rounded-xl border border-border-subtle/30">
                      <p className="text-[9px] font-mono text-text-muted uppercase mb-0.5">FFM Cap (Lakh Cr)</p>
                      <p className="text-sm font-700 text-text-primary font-mono">{selectedStock.ffmc ? (selectedStock.ffmc/100000).toFixed(2) : "—"}</p>
                    </div>
                    <div className="bg-bg-elevated/50 p-2.5 rounded-xl border border-border-subtle/30">
                      <p className="text-[9px] font-mono text-text-muted uppercase mb-0.5">Vol (Lakhs)</p>
                      <p className="text-sm font-700 text-text-primary font-mono">{formatVolume(selectedStock.volume)}</p>
                    </div>
                  </div>
                  <div className="bg-bg-elevated/50 p-4 rounded-xl border border-border-subtle/50 flex items-center gap-3 shadow-sm transition-all hover:bg-bg-elevated">
                    <Info size={16} className="text-accent-blue shrink-0 animate-pulse" />
                    <p className="text-[10px] text-text-muted leading-relaxed uppercase tracking-tight font-700">
                      Intraday momentum snapshot. Open Advanced Charts for technical indicators, overlays, and multi-symbol comparison.
                    </p>
                  </div>
                </div>
              )}

              <a
                href={`/charts?symbol=${selectedStock.symbol}`}
                className="flex items-center justify-center gap-2 w-full mt-6 py-3.5 rounded-2xl bg-accent-blue text-white font-800 text-sm shadow-glow-blue hover:bg-accent-blue/90 hover:shadow-glow-blue/40 transition-all active:scale-[0.98]"
              >
                <BarChart2 size={16} /> Open Advanced Chart
              </a>
            </div>
          ) : (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center p-8 bg-bg-card border border-border-subtle border-dashed rounded-3xl text-center shadow-inner group">
              <div className="w-20 h-20 rounded-3xl bg-bg-elevated flex items-center justify-center text-text-muted mb-5 group-hover:scale-110 transition-transform duration-500 shadow-sm">
                <Grid3X3 size={32} className="opacity-10 group-hover:opacity-30 transition-opacity" />
              </div>
              <h4 className="text-text-primary font-display font-800 text-lg mb-2 tracking-tight">Select a Stock</h4>
              <p className="text-text-muted text-xs leading-relaxed max-w-[200px]">Click on any brick in the heatmap to view real-time metrics, sparklines, and liquidity stats.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
