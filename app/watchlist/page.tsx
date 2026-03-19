"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Star, Plus, Trash2, ArrowUp, ArrowDown, Search,
  RefreshCw, TrendingUp, TrendingDown, AlertCircle,
  Loader2, BarChart2, X,
} from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { NIFTY50_SYMBOLS, SYMBOL_MAP } from "@/lib/symbols";
import toast from "react-hot-toast";
import Link from "next/link";

interface WatchlistItem { id: string; symbol: string; added_at: string; }
interface StockPrice {
  symbol: string; price: number; change: number; changePercent: number;
  high: number; low: number; open: number; previousClose: number;
  volume: number; name: string;
}

// All available symbols to add
const AVAILABLE_STOCKS = NIFTY50_SYMBOLS.map(info => ({
  symbol: info.symbol, name: info.name, sector: info.sector,
}));

export default function WatchlistPage() {
  const [items,      setItems]      = useState<WatchlistItem[]>([]);
  const [prices,     setPrices]     = useState<Record<string, StockPrice>>({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [search,     setSearch]     = useState("");
  const [addSearch,  setAddSearch]  = useState("");
  const [showAdd,    setShowAdd]    = useState(false);
  const [adding,     setAdding]     = useState<string | null>(null);
  const [removing,   setRemoving]   = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const addRef = useRef<HTMLDivElement>(null);

  /* ── Load watchlist ─────────────────────────────────── */
  const fetchWatchlist = useCallback(async () => {
    try {
      const res = await fetch("/api/watchlist", { cache: "no-store" });
      if (res.status === 401) {
        setError("Please sign in to view your watchlist");
        return;
      }
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Server error ${res.status}`);
      }
      // Check if schema is missing (table doesn't exist yet)
      if (res.headers.get("X-Schema-Missing") === "true") {
        setError("SCHEMA_MISSING");
        setItems([]);
        return;
      }
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load watchlist");
    } finally {
      setLoading(false);
    }
  }, []);

  /* ── Load prices ─────────────────────────────────── */
  const fetchPrices = useCallback(async () => {
    try {
      const res  = await fetch("/api/stocks", { cache: "no-store" });
      if (!res.ok) return;
      const data: StockPrice[] = await res.json();
      const map: Record<string, StockPrice> = {};
      data.forEach(s => { map[s.symbol] = s; });
      setPrices(map);
      setLastUpdate(new Date());
    } catch {}
  }, []);

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  useEffect(() => {
    fetchPrices();
    const iv = setInterval(fetchPrices, 1000);
    return () => clearInterval(iv);
  }, [fetchPrices]);

  // Close add panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (addRef.current && !addRef.current.contains(e.target as Node)) {
        setShowAdd(false); setAddSearch("");
      }
    };
    if (showAdd) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAdd]);

  /* ── Add stock — optimistic ─────────────────────── */
  const addStock = async (symbol: string) => {
    if (items.find(i => i.symbol === symbol)) {
      toast("Already in watchlist", { icon: "ℹ️" }); return;
    }
    setAdding(symbol);
    // Optimistic add
    const temp: WatchlistItem = { id: `temp-${Date.now()}`, symbol, added_at: new Date().toISOString() };
    setItems(prev => [temp, ...prev]);
    setShowAdd(false); setAddSearch("");
    try {
      const res  = await fetch("/api/watchlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add");
      // Replace temp with real item
      setItems(prev => prev.map(i => i.id === temp.id ? data : i));
      toast.success(`${symbol} added to watchlist`);
    } catch (e: any) {
      // Rollback
      setItems(prev => prev.filter(i => i.id !== temp.id));
      toast.error(e.message || "Failed to add stock");
    } finally {
      setAdding(null);
    }
  };

  /* ── Remove stock — optimistic ──────────────────── */
  const removeStock = async (symbol: string) => {
    setRemoving(symbol);
    // Optimistic remove
    const backup = items.find(i => i.symbol === symbol);
    setItems(prev => prev.filter(i => i.symbol !== symbol));
    try {
      const res = await fetch(`/api/watchlist?symbol=${symbol}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove");
      toast.success(`${symbol} removed`);
    } catch (e: any) {
      // Rollback
      if (backup) setItems(prev => [backup, ...prev]);
      toast.error(e.message);
    } finally {
      setRemoving(null);
    }
  };

  const watchedSymbols   = new Set(items.map(i => i.symbol));
  const filteredItems    = items.filter(i => i.symbol.toLowerCase().includes(search.toLowerCase()));
  const filteredAddList  = AVAILABLE_STOCKS.filter(s =>
    !watchedSymbols.has(s.symbol) &&
    (s.symbol.toLowerCase().includes(addSearch.toLowerCase()) ||
     s.name.toLowerCase().includes(addSearch.toLowerCase()))
  ).slice(0, 12);

  /* ── Gainers / Losers within watchlist ──────────── */
  const watchedPrices = items.map(i => prices[i.symbol]).filter(Boolean);
  const bestStock  = watchedPrices.sort((a, b) => b.changePercent - a.changePercent)[0];
  const worstStock = watchedPrices.sort((a, b) => a.changePercent - b.changePercent)[0];
  const totalValue = watchedPrices.reduce((s, p) => s + p.price, 0);

  if (error === "SCHEMA_MISSING") return (
    <div className="flex flex-col items-center justify-center py-20 gap-4 bg-bg-card border border-accent-amber/30 rounded-2xl">
      <div className="w-14 h-14 rounded-2xl bg-accent-amber/10 flex items-center justify-center">
        <AlertCircle size={24} className="text-accent-amber"/>
      </div>
      <h2 className="font-display font-700 text-text-primary text-xl">Database setup required</h2>
      <p className="text-text-muted text-sm text-center max-w-md">
        The database tables haven't been created yet. Run the schema in your Supabase SQL Editor.
      </p>
      <div className="bg-bg-elevated border border-border-subtle rounded-xl px-5 py-4 font-mono text-xs text-text-secondary max-w-md w-full">
        <p className="text-text-muted mb-2">1. Open Supabase Dashboard → SQL Editor</p>
        <p className="text-text-muted mb-2">2. Open <span className="text-accent-blue">supabase/schema.sql</span> from the project</p>
        <p className="text-text-muted mb-2">3. Paste the entire file and click <span className="text-accent-green">Run</span></p>
        <p className="text-text-muted">4. Refresh this page</p>
      </div>
      <button onClick={() => { setError(null); setLoading(true); fetchWatchlist(); }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-600 hover:bg-accent-blue/90 transition-all">
        <RefreshCw size={14}/> Check Again
      </button>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-accent-red/10 flex items-center justify-center">
        <AlertCircle size={24} className="text-accent-red"/>
      </div>
      <h2 className="font-display font-700 text-text-primary text-xl">Unable to load watchlist</h2>
      <p className="text-text-muted text-sm text-center max-w-sm">{error}</p>
      <button onClick={() => { setError(null); setLoading(true); fetchWatchlist(); }}
        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-accent-blue text-white text-sm font-600 hover:bg-accent-blue/90 transition-all">
        <RefreshCw size={14}/> Try Again
      </button>
    </div>
  );

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-800 text-2xl text-text-primary tracking-tight flex items-center gap-2">
            <Star size={20} className="text-accent-amber"/> Watchlist
          </h1>
          <p className="text-text-muted text-sm mt-0.5">
            {items.length} stock{items.length !== 1 ? "s" : ""} tracked
            {lastUpdate && <span className="ml-2 text-[11px]">· {lastUpdate.toLocaleTimeString("en-IN")}</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchPrices}
            className="p-2 rounded-xl bg-bg-card border border-border-subtle text-text-muted hover:text-text-primary transition-all">
            <RefreshCw size={14}/>
          </button>
          {/* Add button with dropdown */}
          <div className="relative" ref={addRef}>
            <button onClick={() => setShowAdd(!showAdd)}
              className="flex items-center gap-2 bg-accent-blue hover:bg-accent-blue/90 text-white px-4 py-2.5 rounded-xl text-sm font-600 transition-all shadow-glow-blue">
              <Plus size={14}/> Add Stock
            </button>
            {showAdd && (
              <div className="absolute top-full mt-2 right-0 w-80 bg-bg-card border border-border-default rounded-2xl shadow-card z-50 overflow-hidden">
                <div className="p-3 border-b border-border-subtle">
                  <div className="relative">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"/>
                    <input autoFocus value={addSearch} onChange={e => setAddSearch(e.target.value)}
                      placeholder="Search Nifty 50 stocks…"
                      className="w-full bg-bg-elevated border border-border-subtle rounded-xl pl-8 pr-3 py-2.5 text-sm font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50"/>
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {filteredAddList.length === 0 ? (
                    <div className="px-4 py-6 text-center text-text-muted text-sm">
                      {addSearch ? "No matching stocks" : "All stocks already in watchlist"}
                    </div>
                  ) : filteredAddList.map(s => {
                    const p = prices[s.symbol];
                    const isAdding = adding === s.symbol;
                    return (
                      <button key={s.symbol} onClick={() => addStock(s.symbol)} disabled={isAdding}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-bg-elevated transition-colors text-left group">
                        <div className="w-8 h-8 rounded-xl bg-bg-elevated flex items-center justify-center text-[10px] font-mono font-700 text-text-secondary shrink-0 group-hover:bg-accent-blue/15 transition-colors">
                          {s.symbol.slice(0,2)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-text-primary text-sm font-600">{s.symbol}</div>
                          <div className="text-text-muted text-xs truncate">{s.name}</div>
                        </div>
                        {p && (
                          <div className="text-right shrink-0">
                            <div className="font-mono text-xs text-text-primary">₹{formatPrice(p.price)}</div>
                            <div className={cn("text-[10px] font-mono font-600", p.changePercent >= 0 ? "text-accent-green" : "text-accent-red")}>
                              {p.changePercent >= 0 ? "+" : ""}{p.changePercent?.toFixed(2)}%
                            </div>
                          </div>
                        )}
                        {isAdding && <Loader2 size={14} className="animate-spin text-accent-blue shrink-0"/>}
                        {!isAdding && <Plus size={13} className="text-text-muted opacity-0 group-hover:opacity-100 shrink-0 transition-opacity"/>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats strip */}
      {items.length > 0 && watchedPrices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label:"Total Stocks",  value: items.length.toString(),                    sub:"In watchlist" },
            { label:"Best Today",    value: bestStock  ? `${bestStock.symbol} +${bestStock.changePercent.toFixed(2)}%`  : "—", sub:"Top gainer", color:"green" },
            { label:"Worst Today",   value: worstStock ? `${worstStock.symbol} ${worstStock.changePercent.toFixed(2)}%` : "—", sub:"Top loser",  color:"red"   },
            { label:"Gainers",       value: `${watchedPrices.filter(p=>p.changePercent>0).length}/${watchedPrices.length}`, sub:"In green today" },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-bg-card border border-border-subtle rounded-2xl px-4 py-3">
              <p className="text-text-muted text-[10px] font-mono uppercase tracking-wider">{label}</p>
              <p className={cn("font-display font-700 text-base mt-1 leading-tight",
                color === "green" ? "text-accent-green" : color === "red" ? "text-accent-red" : "text-text-primary")}>
                {value}
              </p>
              <p className="text-text-muted text-[10px] mt-0.5">{sub}</p>
            </div>
          ))}
        </div>
      )}

      {/* Search filter */}
      {items.length > 3 && (
        <div className="relative max-w-xs">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"/>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Filter watchlist…"
            className="w-full bg-bg-card border border-border-subtle rounded-xl pl-8 pr-3 py-2 text-xs font-mono text-text-primary placeholder:text-text-muted focus:outline-none focus:border-accent-blue/50"/>
        </div>
      )}

      {/* Watchlist cards */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-bg-card border border-border-subtle rounded-2xl p-5 space-y-3">
              <div className="flex gap-2.5"><div className="skeleton w-9 h-9 rounded-xl"/><div className="flex-1 space-y-1.5"><div className="skeleton h-4 rounded"/><div className="skeleton h-3 w-2/3 rounded"/></div></div>
              <div className="skeleton h-8 rounded"/>
              <div className="skeleton h-3 rounded"/>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4 bg-bg-card border border-border-subtle rounded-2xl">
          <div className="w-16 h-16 rounded-2xl bg-accent-amber/10 flex items-center justify-center">
            <Star size={28} className="text-accent-amber opacity-60"/>
          </div>
          <div className="text-center">
            <h3 className="font-display font-700 text-text-primary text-xl mb-2">
              {search ? "No matching stocks" : "Your watchlist is empty"}
            </h3>
            <p className="text-text-muted text-sm mb-5 max-w-sm">
              {search ? `No stocks match "${search}"` : "Add stocks from the Nifty 50 to track their live prices and performance."}
            </p>
            {!search && (
              <button onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 bg-accent-blue text-white px-5 py-2.5 rounded-xl text-sm font-600 hover:bg-accent-blue/90 transition-all shadow-glow-blue">
                <Plus size={14}/> Add your first stock
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredItems.map(item => {
            const p     = prices[item.symbol];
            const info  = SYMBOL_MAP[item.symbol];
            const isPos = (p?.changePercent ?? 0) >= 0;
            const isRemoving = removing === item.symbol;

            return (
              <div key={item.id}
                className={cn(
                  "relative bg-bg-card border rounded-2xl p-4 group transition-all hover:shadow-card",
                  isPos ? "border-accent-green/15 hover:border-accent-green/30" : "border-accent-red/15 hover:border-accent-red/30",
                  isRemoving && "opacity-50 scale-95"
                )}>
                {/* Remove button */}
                <button
                  onClick={() => removeStock(item.symbol)}
                  disabled={isRemoving}
                  className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all p-1.5 rounded-lg hover:bg-accent-red/10 text-text-muted hover:text-accent-red">
                  {isRemoving ? <Loader2 size={12} className="animate-spin"/> : <X size={12}/>}
                </button>

                {/* Stock header */}
                <div className="flex items-center gap-2.5 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-bg-elevated flex items-center justify-center text-[10px] font-mono font-800 text-text-secondary shrink-0">
                    {item.symbol.slice(0,2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-text-primary font-700 text-sm">{item.symbol}</p>
                    <p className="text-text-muted text-[10px] truncate">{info?.name || item.symbol}</p>
                  </div>
                </div>

                {/* Price display */}
                {p ? (
                  <>
                    <div className="flex items-end justify-between mb-2">
                      <div>
                        <p className="font-display font-800 text-2xl text-text-primary tabular-nums leading-none">
                          ₹{formatPrice(p.price)}
                        </p>
                        <div className={cn("flex items-center gap-1 mt-1 text-xs font-mono font-700", isPos ? "text-accent-green" : "text-accent-red")}>
                          {isPos ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                          {isPos ? "+" : ""}{formatPrice(p.change)} ({isPos ? "+" : ""}{p.changePercent?.toFixed(2)}%)
                        </div>
                      </div>
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", isPos ? "bg-accent-green/10" : "bg-accent-red/10")}>
                        {isPos ? <ArrowUp size={16} className="text-accent-green"/> : <ArrowDown size={16} className="text-accent-red"/>}
                      </div>
                    </div>

                    {/* OHLV mini strip */}
                    <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-border-subtle/40">
                      {[["H",p.high,"green"],["L",p.low,"red"],["O",p.open,""],["PC",p.previousClose,""]].map(([l,v,c]) => (
                        <div key={String(l)} className="bg-bg-elevated rounded-lg px-2 py-1">
                          <span className="text-text-muted text-[9px] font-mono">{l} </span>
                          <span className={cn("font-mono text-[10px] font-600 tabular-nums",
                            c==="green"?"text-accent-green":c==="red"?"text-accent-red":"text-text-secondary")}>
                            ₹{formatPrice(Number(v))}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Chart link */}
                    <Link href={`/charts?symbol=${item.symbol}`}
                      className="flex items-center justify-center gap-1.5 mt-2 py-1.5 rounded-lg text-[10px] font-mono text-text-muted hover:text-accent-blue hover:bg-accent-blue/5 transition-all border border-transparent hover:border-accent-blue/20">
                      <BarChart2 size={10}/> View Chart
                    </Link>
                  </>
                ) : (
                  <div className="space-y-2">
                    <div className="skeleton h-8 rounded"/>
                    <div className="skeleton h-4 rounded"/>
                    <div className="grid grid-cols-2 gap-1.5"><div className="skeleton h-8 rounded"/><div className="skeleton h-8 rounded"/></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
