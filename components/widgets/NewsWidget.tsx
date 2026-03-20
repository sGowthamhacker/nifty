"use client";
import { useEffect, useState } from "react";
import { Newspaper, ArrowRight } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface NewsItem { id:number; title:string; category:string; symbol:string; sentiment:string; source:string; publishedAt:string; }

export default function NewsWidget() {
  const [news, setNews] = useState<NewsItem[]>([]);

  useEffect(() => {
    fetch("/api/news").then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setNews(d.slice(0,5)); }).catch(()=>{});
    const iv = setInterval(() => fetch("/api/news").then(r=>r.json()).then(d=>{ if(Array.isArray(d)) setNews(d.slice(0,5)); }).catch(()=>{}), 120000);
    return () => clearInterval(iv);
  }, []);

  const timeAgo = (iso:string) => { const m=Math.floor((Date.now()-new Date(iso).getTime())/60000); return m<60?`${m}m ago`:`${Math.floor(m/60)}h ago`; };

  return (
    <div className="glass-card border border-border-subtle rounded-2xl overflow-hidden shadow-premium">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle bg-bg-secondary/30">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-accent-blue"/>
          <h3 className="font-display font-600 text-text-primary text-sm tracking-tight">Market News</h3>
        </div>
        <Link href="/news" className="flex items-center gap-1 text-text-muted text-[11px] font-mono hover:text-accent-blue transition-colors group">
          View all <ArrowRight size={10} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
      <div className="divide-y divide-border-subtle/30">
        {news.length === 0 ? (
          [...Array(4)].map((_,i)=><div key={i} className="px-4 py-3"><div className="skeleton h-4 w-4/5 rounded mb-1.5"/><div className="skeleton h-3 w-1/3 rounded"/></div>)
        ) : news.map(item => (
          <div key={item.id} className="px-4 py-3.5 hover:bg-bg-elevated/40 transition-all cursor-pointer active:bg-bg-elevated/60">
            <div className="flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-text-primary text-xs font-500 leading-snug line-clamp-2 mb-2 group-hover:text-accent-blue transition-colors">{item.title}</p>
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className={cn("w-2 h-2 rounded-full shadow-sm", 
                      item.sentiment==="positive"?"bg-accent-green shadow-accent-green/20":item.sentiment==="negative"?"bg-accent-red shadow-accent-red/20":"bg-text-muted shadow-text-muted/20")}/>
                    <span className="text-text-muted text-[10px] font-mono uppercase tracking-tight">{item.source}</span>
                  </div>
                  <span className="text-text-muted text-[10px] font-mono ml-auto opacity-60">{timeAgo(item.publishedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
