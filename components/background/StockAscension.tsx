"use client";

import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

const STOCK_LIST = [
  "HDFCBANK", "RELIANCE", "ICICIBANK", "INFY", "TCS", "ITC", "BHARTIARTL", "SBIN", "LT", "AXISBANK",
  "KOTAKBANK", "HINDUNILVR", "BAJFINANCE", "M&M", "SUNPHARMA", "MARUTI", "TITAN", "TATASTEEL", "NTPC", "HCLTECH",
  "JSWSTEEL", "ADANIPORTS", "POWERGRID", "ASIANPAINT", "ULTRACEMCO", "BAJAJFINSV", "ONGC", "COALINDIA", "TRENT", "INDIGO",
  "GRASIM", "TECHM", "SBILIFE", "DRREDDY", "BAJAJ-AUTO", "HINDALCO", "BPCL", "HEROMOTOCO", "EICHERMOT", "NESTLEIND",
  "CIPLA", "BEL", "ADANIENT", "HDFCLIFE", "SHRIRAMFIN", "APOLLOHOSP", "TATACONSUM", "MAXHEALTH", "JIOFIN", "TMPV"
];

const MOCK_PRICES: Record<string, number> = {
  HDFCBANK: 1682, RELIANCE: 2854, ICICIBANK: 1122, INFY: 1784, TCS: 3921, ITC: 482, BHARTIARTL: 1452, SBIN: 782, LT: 3687, AXISBANK: 1183,
  KOTAKBANK: 1820, HINDUNILVR: 2341, BAJFINANCE: 7208, "M&M": 2845, SUNPHARMA: 1681, MARUTI: 12840, TITAN: 3652, TATASTEEL: 164, NTPC: 342, HCLTECH: 1684,
  JSWSTEEL: 921, ADANIPORTS: 1354, POWERGRID: 298, ASIANPAINT: 2978, ULTRACEMCO: 10210, BAJAJFINSV: 1645, ONGC: 278, COALINDIA: 452, TRENT: 7210, INDIGO: 4210,
  GRASIM: 2432, TECHM: 1512, SBILIFE: 1482, DRREDDY: 6782, "BAJAJ-AUTO": 9650, HINDALCO: 642, BPCL: 612, HEROMOTOCO: 4982, EICHERMOT: 4820, NESTLEIND: 2487,
  CIPLA: 1542, BEL: 285, ADANIENT: 3120, HDFCLIFE: 682, SHRIRAMFIN: 2450, APOLLOHOSP: 6420, TATACONSUM: 1120, MAXHEALTH: 890, JIOFIN: 345, TMPV: 982
};

interface Particle {
  id: number;
  symbol: string;
  price: string;
  change: string;
  isPositive: boolean;
  left: number;
  duration: number;
  delay: number;
  fontSize: number;
  opacity: number;
}

export function StockAscension() {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const particles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: 50 }).map((_, i) => {
      const symbol = STOCK_LIST[i % STOCK_LIST.length];
      const basePrice = MOCK_PRICES[symbol] || 1000;
      const changePercent = (Math.random() * 4 - 2).toFixed(2);
      const isPositive = parseFloat(changePercent) >= 0;
      const finalPrice = (basePrice * (1 + parseFloat(changePercent) / 100)).toFixed(1);

      return {
        id: i,
        symbol,
        price: finalPrice,
        change: changePercent,
        isPositive,
        left: Math.random() * 100, // percentage
        duration: 15 + Math.random() * 25, // seconds
        delay: Math.random() * -40, // negative delay for initial distribution
        fontSize: 10 + Math.random() * 6,
        opacity: 0.1 + Math.random() * 0.3,
      } as Particle;
    });
  }, [mounted]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-40" />
      
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0 flex flex-col items-center animate-ascension whitespace-nowrap"
          style={{
            left: `${p.left}%`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            fontSize: `${p.fontSize}px`,
            opacity: p.opacity,
          }}
        >
          <div className="font-mono font-900 tracking-tighter text-white/80">
            {p.symbol}
          </div>
          <div className="flex items-center gap-1 font-mono font-700">
            <span className="text-white/40">{p.price}</span>
            <span className={cn(
              "text-[0.7em] px-1 rounded",
              p.isPositive ? "text-accent-green" : "text-accent-red"
            )}>
              {p.isPositive ? "▲" : "▼"}{Math.abs(parseFloat(p.change))}%
            </span>
          </div>
        </div>
      ))}

      <style jsx global>{`
        @keyframes ascension {
          0% {
            transform: translateY(100vh);
          }
          100% {
            transform: translateY(-120vh);
          }
        }
        .animate-ascension {
          animation: ascension linear infinite;
        }
      `}</style>
    </div>
  );
}
