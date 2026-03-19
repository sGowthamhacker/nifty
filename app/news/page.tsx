"use client";
import { useEffect, useState } from "react";
import { Newspaper, TrendingUp, TrendingDown, Minus, RefreshCw, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface NewsItem {
  id: number; title: string; category: string; symbol: string;
  sentiment: string; source: string; publishedAt: string; readTime: string; url: string;
}

const CATEGORIES = ["All","Markets","Economy","Earnings","Corp Action","Global","Commodities","Regulation"];
const SENTIMENT_COLORS: Record<string,string> = { positive:"text-accent-green bg-accent-green/10", negative:"text-accent-red bg-accent-red/10", neutral:"text-text-muted bg-bg-elevated" };

export default function NewsPage() {
  const [news,     setNews]     = useState<NewsItem[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [category, setCategory] = useState("All");
  const [lastFetch,setLastFetch]= useState<Date|null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/news", { cache:"no-store" });
      const data = await res.json();
      if (Array.isArray(data)) { setNews(data); setLastFetch(new Date()); }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { load(); const iv = setInterval(load, 120000); return () => clearInterval(iv); }, []);

  const filtered = category === "All" ? news : news.filter(n => n.category === category);

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h/24)}d ago`;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-800 text-2xl text-text-primary tracking-tight flex items-center gap-2">
            <Newspaper size={20} className="text-accent-blue"/> Market News
          </h1>
          <p className="text-text-muted text-sm mt-1">Latest from NSE, India markets and global macro</p>
        </div>
        <button onClick={load} className={cn("p-2 rounded-xl bg-bg-card border border-border-subtle text-text-muted hover:text-text-primary transition-all", loading&&"animate-spin")}>
          <RefreshCw size={14}/>
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategory(c)}
            className={cn("px-3 py-1.5 rounded-xl text-xs font-mono transition-all",
              category===c ? "bg-accent-blue text-white font-600" : "bg-bg-card border border-border-subtle text-text-muted hover:text-text-primary hover:border-border-default")}>
            {c}
          </button>
        ))}
        {lastFetch && <span className="ml-auto text-text-muted text-xs font-mono self-center">{lastFetch.toLocaleTimeString("en-IN")}</span>}
      </div>

      {/* Top story */}
      {!loading && filtered[0] && (
        <div className="bg-gradient-to-br from-accent-blue/8 to-accent-blue/3 border border-accent-blue/20 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-[10px] font-mono font-600 px-2 py-0.5 bg-accent-blue text-white rounded-full">{filtered[0].category}</span>
            <span className="text-text-muted text-[10px] font-mono">{filtered[0].source}</span>
            <span className="text-text-muted text-[10px] font-mono ml-auto">{timeAgo(filtered[0].publishedAt)}</span>
          </div>
          <h2 className="font-display font-700 text-text-primary text-lg leading-snug mb-3">{filtered[0].title}</h2>
          <div className="flex items-center gap-3">
            <span className={cn("text-[10px] font-mono font-600 px-2 py-0.5 rounded-full capitalize", SENTIMENT_COLORS[filtered[0].sentiment])}>
              {filtered[0].sentiment === "positive" ? "↑" : filtered[0].sentiment === "negative" ? "↓" : "→"} {filtered[0].sentiment}
            </span>
            <span className="text-text-muted text-[10px] font-mono">{filtered[0].symbol}</span>
            <span className="text-text-muted text-[10px] font-mono">{filtered[0].readTime}</span>
          </div>
        </div>
      )}

      {/* News list */}
      <div className="space-y-2">
        {loading ? [...Array(6)].map((_,i)=>(
          <div key={i} className="bg-bg-card border border-border-subtle rounded-xl p-4">
            <div className="skeleton h-4 w-3/4 rounded mb-2"/>
            <div className="skeleton h-3 w-1/3 rounded"/>
          </div>
        )) : filtered.slice(1).map(item => (
          <div key={item.id} className="bg-bg-card border border-border-subtle rounded-xl p-4 hover:border-border-default hover:bg-bg-elevated/30 transition-all group">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={cn("text-[9px] font-mono font-600 px-1.5 py-0.5 rounded",
                    item.category==="Earnings"?"bg-accent-amber/10 text-accent-amber":
                    item.category==="Economy"?"bg-accent-purple/10 text-accent-purple":
                    item.category==="Corp Action"?"bg-accent-blue/10 text-accent-blue":
                    item.category==="Global"?"bg-cyan-500/10 text-cyan-400":
                    "bg-bg-elevated text-text-muted")}>
                    {item.category}
                  </span>
                  <span className="text-text-muted text-[10px] font-mono">{item.symbol}</span>
                  <span className="text-text-muted text-[10px] font-mono ml-auto">{timeAgo(item.publishedAt)}</span>
                </div>
                <p className="text-text-primary text-sm font-500 leading-snug group-hover:text-white transition-colors">{item.title}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className={cn("text-[9px] font-mono font-600 px-1.5 py-0.5 rounded-full capitalize", SENTIMENT_COLORS[item.sentiment])}>
                    {item.sentiment === "positive" ? "↑" : item.sentiment === "negative" ? "↓" : "→"} {item.sentiment}
                  </span>
                  <span className="text-text-muted text-[10px]">{item.source}</span>
                  <span className="text-text-muted text-[10px]">{item.readTime}</span>
                </div>
              </div>
              <ExternalLink size={13} className="text-text-muted opacity-0 group-hover:opacity-100 transition-opacity mt-1 shrink-0"/>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
