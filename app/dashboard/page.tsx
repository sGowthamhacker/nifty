// Middleware handles auth — no blocking server call needed here
import IndexHeroCard from "@/components/dashboard/IndexHeroCard";
import CandlestickChart from "@/components/charts/CandlestickChart";
import MarketDepthPanel from "@/components/dashboard/MarketDepthPanel";
import NewsWidget from "@/components/widgets/NewsWidget";
import StockTickerStrip from "@/components/widgets/StockTickerStrip";
import Link from "next/link";
import { LineChart, Filter, Newspaper, ArrowRight, Activity } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display font-800 text-2xl text-text-primary tracking-tight">Market Overview</h1>
          <p className="text-text-muted text-sm mt-0.5">NIFTY 50 · NSE India · Live data updates every 1s</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/indices" className="flex items-center gap-1.5 bg-accent-green/10 border border-accent-green/30 text-accent-green hover:bg-accent-green/20 px-3 py-1.5 rounded-xl text-xs font-mono font-600 transition-all">
            <Activity size={12}/> Indices
          </Link>
          <Link href="/charts" className="flex items-center gap-1.5 bg-accent-blue/10 border border-accent-blue/30 text-accent-blue hover:bg-accent-blue/20 px-3 py-1.5 rounded-xl text-xs font-mono font-600 transition-all">
            <LineChart size={12}/> Live Charts
          </Link>
          <Link href="/screener" className="flex items-center gap-1.5 bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-xl text-xs font-mono transition-all">
            <Filter size={12}/> Screener
          </Link>
          <Link href="/news" className="flex items-center gap-1.5 bg-bg-card border border-border-subtle text-text-secondary hover:text-text-primary px-3 py-1.5 rounded-xl text-xs font-mono transition-all">
            <Newspaper size={12}/> News
          </Link>
        </div>
      </div>

      {/* Live ticker strip */}
      <StockTickerStrip />
      
      {/* Dashboard Top Section: Hero Card, Breadth & Chart */}
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <IndexHeroCard />
          <MarketDepthPanel />
        </div>
        <CandlestickChart />
      </div>

      {/* Market News */}
      <NewsWidget />

      {/* Feature cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { href:"/indices", icon:Activity, color:"green",  title:"NSE Indices",  desc:"100+ live indices — Broad, Sectoral, Thematic, Strategy" },
          { href:"/charts",  icon:LineChart,color:"blue",   title:"Live Charts",  desc:"Candle, Line, Area for all 50 stocks. Compare up to 6." },
          { href:"/equity",  icon:LineChart,color:"purple", title:"Equity Detail",desc:"Full NSE data — orders, corporate actions, financials." },
          { href:"/screener",icon:Filter,   color:"amber",  title:"Screener",     desc:"Filter by momentum, value, volume, dividend, beta." },
        ].map(({ href, icon: Icon, color, title, desc }) => (
          <Link key={href} href={href} className={`group bg-bg-card border border-border-subtle hover:border-accent-${color}/40 rounded-2xl p-5 transition-all`}>
            <div className={`w-10 h-10 rounded-xl bg-accent-${color}/15 flex items-center justify-center mb-3`}>
              <Icon size={18} className={`text-accent-${color}`}/>
            </div>
            <h3 className="font-display font-600 text-text-primary text-sm mb-1">{title}</h3>
            <p className="text-text-muted text-xs leading-relaxed">{desc}</p>
            <div className={`flex items-center gap-1 text-accent-${color} text-xs font-mono mt-3 group-hover:gap-2 transition-all`}>
              Open <ArrowRight size={10}/>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
