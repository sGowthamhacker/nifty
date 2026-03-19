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
    <div className="bg-bg-card border border-border-subtle rounded-2xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3.5 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <Newspaper size={14} className="text-accent-blue"/>
          <h3 className="font-display font-600 text-text-primary text-sm">Market News</h3>
        </div>
        <Link href="/news" className="flex items-center gap-1 text-text-muted text-[11px] font-mono hover:text-accent-blue transition-colors">
          View all <ArrowRight size={10}/>
        </Link>
      </div>
      <div className="divide-y divide-border-subtle/30">
        {news.length === 0 ? (
          [...Array(4)].map((_,i)=><div key={i} className="px-4 py-3"><div className="skeleton h-4 w-4/5 rounded mb-1.5"/><div className="skeleton h-3 w-1/3 rounded"/></div>)
        ) : news.map(item => (
          <div key={item.id} className="px-4 py-3 hover:bg-bg-elevated/40 transition-colors cursor-pointer">
            <div className="flex items-start gap-2">
              <div className="flex-1">
                <p className="text-text-secondary text-xs leading-snug hover:text-text-primary transition-colors line-clamp-2">{item.title}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className={cn("text-[9px] font-mono font-600 px-1.5 py-0.5 rounded",
                    item.sentiment==="positive"?"text-accent-green bg-accent-green/10":item.sentiment==="negative"?"text-accent-red bg-accent-red/10":"text-text-muted bg-bg-elevated")}>
                    {item.sentiment==="positive"?"↑":item.sentiment==="negative"?"↓":"→"} {item.sentiment}
                  </span>
                  <span className="text-text-muted text-[9px] font-mono">{item.source}</span>
                  <span className="text-text-muted text-[9px] font-mono ml-auto">{timeAgo(item.publishedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
