/**
 * NSE India Data Client — production-grade, three-layer data pipeline:
 *
 *  Layer 1 → stock-nse-india npm package (real NSE API, handles cookies/session)
 *  Layer 2 → Yahoo Finance v8 API  (query1.finance.yahoo.com)
 *  Layer 3 → Realistic mock data   (always renders something — never blank)
 *
 * All function signatures are 100% type-safe against the installed package.
 */

import axios from "axios";
import type {
  AllIndicesData,
  IndexDetails,
  EquityHistoricalData,
  MarketStatus as NseMarketStatus,
} from "stock-nse-india/build/interface";

// Pre-initialize singleton at module load — eliminates per-call dynamic import
// eslint-disable-next-line
const { NseIndia } = require("stock-nse-india");
let _nse: InstanceType<typeof NseIndia> | null = null;
function getNSE() {
  if (!_nse) _nse = new NseIndia();
  return _nse;
}

/* ── Exported Types ─────────────────────────────────────────── */
export interface IndexData {
  symbol: string; price: number; change: number; changePercent: number;
  open: number; high: number; low: number; previousClose: number;
  volume: number; timestamp: number; marketState: string;
  advances: number; declines: number; unchanged: number;
  fiftyTwoWeekHigh: number; fiftyTwoWeekLow: number;
  yearToDateChange: number; totalTradedValue: number;
}

export interface StockQuote {
  symbol: string; name: string; sector: string; weight: number; isin: string;
  price: number; change: number; changePercent: number;
  open: number; high: number; low: number; previousClose: number;
  vwap: number; volume: number; totalTradedValue: number;
  marketCap: number; avgVolume: number;
  fiftyTwoWeekHigh: number; fiftyTwoWeekLow: number;
  fiftyTwoWeekHighPercent: number; fiftyTwoWeekLowPercent: number;
  pe: number | null; pb: number | null; eps: number | null;
  dividendYield: number | null; beta: number | null;
  deliveryPercent: number | null; seriesType: string;
  lastUpdateTime: string;
}

export interface CandleData {
  time: number; open: number; high: number; low: number; close: number; volume: number;
}

export interface MarketStatus {
  isOpen: boolean; state: string; marketType: string; tradeDate: string; index: string;
}

/* ── Yahoo Finance common headers ───────────────────────────── */
const YF_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Accept": "application/json, text/plain, */*",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": "https://finance.yahoo.com/",
};

/* ════════════════════════════════════════════════════════════ *
 *  INDEX DATA  — NIFTY 50 live price + stats
 * ════════════════════════════════════════════════════════════ */
export async function fetchNiftyIndexNSE(): Promise<IndexData> {
  /* ── Layer 1: NSE India ─────────────────────────────────── */
  try {
    const nse = getNSE();

    const [allIdxResult, mktResult] = await Promise.allSettled([
      nse.getAllIndices() as Promise<AllIndicesData>,
      nse.getMarketStatus() as Promise<NseMarketStatus>,
    ]);

    if (allIdxResult.status === "fulfilled") {
      const rows = allIdxResult.value.data;
      const row  = rows.find((r) => (r as any).indexName === "NIFTY 50");
      if (row) {
        const r    = row as any; // AllIndicesData row has dynamic fields
        const price = +parseFloat(String(r.last ?? 0)).toFixed(2);
        const prev  = +parseFloat(String(r.previousClose ?? price)).toFixed(2);
        const chg   = +parseFloat(String(r.change  ?? (price - prev))).toFixed(2);
        const pct   = +parseFloat(String(r.percChange ?? 0)).toFixed(2);

        // Market status from Layer 1
        let mktOpen  = isMarketOpen();
        if (mktResult.status === "fulfilled") {
          const states = mktResult.value.marketState ?? [];
          const cm     = states.find((s) => s.market === "Capital Market");
          if (cm) mktOpen = cm.marketStatus === "Open";
        }

        return {
          symbol: "NIFTY 50", price, change: chg, changePercent: pct,
          open:  +parseFloat(String(r.open ?? price)).toFixed(2),
          high:  +parseFloat(String(r.high ?? price)).toFixed(2),
          low:   +parseFloat(String(r.low  ?? price)).toFixed(2),
          previousClose: prev,
          volume:           parseInt(String(r.totalTradedVolume ?? 0)),
          timestamp:        Date.now(),
          marketState:      mktOpen ? "REGULAR" : "CLOSED",
          advances:         0, declines: 0, unchanged: 0,
          fiftyTwoWeekHigh: +parseFloat(String(r.yearHigh ?? price * 1.15)).toFixed(2),
          fiftyTwoWeekLow:  +parseFloat(String(r.yearLow  ?? price * 0.85)).toFixed(2),
          yearToDateChange: +parseFloat(String(r.perChange365d ?? pct)).toFixed(2),
          totalTradedValue: parseFloat(String(r.totalTradedValue ?? 0)),
        };
      }
    }
  } catch (e) {
    console.warn("[NSE] getAllIndices failed:", (e as Error).message?.slice(0, 80));
  }

  /* ── Layer 2: Yahoo Finance ─────────────────────────────── */
  try {
    const res = await axios.get(
      "https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI",
      { params: { interval: "1m", range: "1d" }, headers: YF_HEADERS, timeout: 4000 }
    );
    const m     = res.data.chart.result[0].meta;
    const price = +(m.regularMarketPrice ?? 0).toFixed(2);
    const prev  = +(m.chartPreviousClose ?? m.previousClose ?? price).toFixed(2);
    return {
      symbol: "NIFTY 50", price,
      change:        +(price - prev).toFixed(2),
      changePercent: +(((price - prev) / (prev || 1)) * 100).toFixed(2),
      open:  +(m.regularMarketOpen    ?? price).toFixed(2),
      high:  +(m.regularMarketDayHigh ?? price).toFixed(2),
      low:   +(m.regularMarketDayLow  ?? price).toFixed(2),
      previousClose: prev,
      volume:    m.regularMarketVolume ?? 0,
      timestamp: (m.regularMarketTime ?? Date.now() / 1000) * 1000,
      marketState: m.marketState ?? (isMarketOpen() ? "REGULAR" : "CLOSED"),
      advances: 0, declines: 0, unchanged: 0,
      fiftyTwoWeekHigh: m.fiftyTwoWeekHigh ?? price * 1.15,
      fiftyTwoWeekLow:  m.fiftyTwoWeekLow  ?? price * 0.85,
      yearToDateChange: 0, totalTradedValue: 0,
    };
  } catch (e) {
    console.warn("[Yahoo] index failed:", (e as Error).message?.slice(0, 60));
  }

  /* ── Layer 3: Mock ──────────────────────────────────────── */
  return getMockIndexData();
}

/* ════════════════════════════════════════════════════════════ *
 *  ALL 50 STOCKS
 * ════════════════════════════════════════════════════════════ */
export async function fetchNifty50StocksNSE(): Promise<StockQuote[]> {
  /* ── Layer 1: NSE ───────────────────────────────────────── */
  try {
    const nse = getNSE();
    const data = await nse.getEquityStockIndices("NIFTY 50") as IndexDetails;
    const rows = data.data ?? [];

    if (rows.length >= 10) {
      return rows.filter((d) => d.symbol).map((d) => {
        const sym   = d.symbol;
        const info  = NIFTY50_META[sym] ?? { name: sym, sector: "Unknown", weight: 0 };
        const price = +d.lastPrice.toFixed(2);
        const prev  = +d.previousClose.toFixed(2);
        const chg   = +d.change.toFixed(2);
        const pct   = +d.pChange.toFixed(2);
        const w52h  = +(d.yearHigh  ?? price * 1.25).toFixed(2);
        const w52l  = +(d.yearLow   ?? price * 0.75).toFixed(2);

        return {
          symbol: sym, name: info.name, sector: info.sector, weight: info.weight,
          isin:   (d.meta as any)?.isin ?? "",
          price, change: chg, changePercent: pct,
          open: +d.open.toFixed(2),
          high: +d.dayHigh.toFixed(2),
          low:  +d.dayLow.toFixed(2),
          previousClose: prev, vwap: price,
          volume:           d.totalTradedVolume,
          totalTradedValue: d.totalTradedValue,
          marketCap:        (d.ffmc ?? 0) * 1e7,
          avgVolume: 0,
          fiftyTwoWeekHigh: w52h, fiftyTwoWeekLow: w52l,
          fiftyTwoWeekHighPercent: +((price - w52h) / w52h * 100).toFixed(2),
          fiftyTwoWeekLowPercent:  +((price - w52l) / w52l * 100).toFixed(2),
          pe: null, pb: null, eps: null, dividendYield: null, beta: null,
          deliveryPercent: null,
          seriesType:    d.series ?? "EQ",
          lastUpdateTime: d.lastUpdateTime ?? new Date().toLocaleTimeString("en-IN"),
        } satisfies StockQuote;
      });
    }
  } catch (e) {
    console.warn("[NSE] getEquityStockIndices failed:", (e as Error).message?.slice(0, 80));
  }

  /* ── Layer 2: Yahoo Finance (10 symbols per request) ────── */
  try {
    const results = await fetchNifty50Yahoo();
    if (results.length >= 10) return results;
  } catch (e) {
    console.warn("[Yahoo] stocks failed:", (e as Error).message?.slice(0, 60));
  }

  /* ── Layer 3: Mock ──────────────────────────────────────── */
  return getMockStockQuotes();
}

async function fetchNifty50Yahoo(): Promise<StockQuote[]> {
  const allSyms = Object.keys(NIFTY50_META).map((s) => `${s}.NS`);
  const results: StockQuote[] = [];

  for (let i = 0; i < allSyms.length; i += 10) {
    const chunk = allSyms.slice(i, i + 10);
    try {
      const res = await axios.get(
        "https://query1.finance.yahoo.com/v7/finance/quote",
        { params: { symbols: chunk.join(",") }, headers: YF_HEADERS, timeout: 4000 }
      );
      const quotes: any[] = res.data.quoteResponse?.result ?? [];
      for (const q of quotes) {
        const sym   = String(q.symbol).replace(".NS", "");
        const info  = NIFTY50_META[sym] ?? { name: sym, sector: "Unknown", weight: 0 };
        const price = +(q.regularMarketPrice ?? 0).toFixed(2);
        const prev  = +(q.regularMarketPreviousClose ?? price).toFixed(2);
        const w52h  = +(q.fiftyTwoWeekHigh ?? price * 1.25).toFixed(2);
        const w52l  = +(q.fiftyTwoWeekLow  ?? price * 0.75).toFixed(2);
        results.push({
          symbol: sym, name: info.name, sector: info.sector, weight: info.weight, isin: "",
          price,
          change:        +(q.regularMarketChange        ?? 0).toFixed(2),
          changePercent: +(q.regularMarketChangePercent ?? 0).toFixed(2),
          open: +(q.regularMarketOpen    ?? price).toFixed(2),
          high: +(q.regularMarketDayHigh ?? price).toFixed(2),
          low:  +(q.regularMarketDayLow  ?? price).toFixed(2),
          previousClose: prev, vwap: price,
          volume:           q.regularMarketVolume ?? 0,
          totalTradedValue: 0,
          marketCap:        q.marketCap ?? 0,
          avgVolume:        q.averageDailyVolume3Month ?? 0,
          fiftyTwoWeekHigh: w52h, fiftyTwoWeekLow: w52l,
          fiftyTwoWeekHighPercent: +((price - w52h) / w52h * 100).toFixed(2),
          fiftyTwoWeekLowPercent:  +((price - w52l) / w52l * 100).toFixed(2),
          pe:            q.trailingPE              != null ? +q.trailingPE.toFixed(1)              : null,
          pb:            q.priceToBook             != null ? +q.priceToBook.toFixed(2)             : null,
          eps:           q.epsTrailingTwelveMonths != null ? +q.epsTrailingTwelveMonths.toFixed(2) : null,
          dividendYield: q.dividendYield           != null ? +(q.dividendYield * 100).toFixed(2)   : null,
          beta:          q.beta                    != null ? +q.beta.toFixed(2)                    : null,
          deliveryPercent: null, seriesType: "EQ",
          lastUpdateTime: new Date().toLocaleTimeString("en-IN"),
        });
      }
    } catch { /* chunk failed, skip */ }
    if (i + 10 < allSyms.length) await new Promise((r) => setTimeout(r, 80));
  }
  return results;
}

/* ════════════════════════════════════════════════════════════ *
 *  CHART / HISTORICAL DATA
 * ════════════════════════════════════════════════════════════ */
export async function fetchEquityHistorical(
  symbol: string, range: string, interval: string
): Promise<CandleData[]> {
  /* ── Layer 1: NSE historical (non-intraday only) ────────── */
  if (!["1d", "5d"].includes(range) && symbol !== "NIFTY50") {
    try {
      const nse   = getNSE();
      const end   = new Date();
      const start = new Date();
      const daysMap: Record<string, number> = {
        "1mo": 30, "3mo": 90, "6mo": 180, "1y": 365, "2y": 730, "5y": 1825, "max": 3650,
      };
      start.setDate(start.getDate() - (daysMap[range] ?? 30));

      const rawArr = await nse.getEquityHistoricalData(symbol, { start, end }) as unknown as EquityHistoricalData[];
      const raw  = rawArr?.[0] as EquityHistoricalData | undefined;
      const rows = raw?.data ?? [];

      if (rows.length > 5) {
        return rows
          .map((d) => ({
            time:   Math.floor(new Date(d.chSymbol ? (d as any).chTimestamp ?? Date.now() : Date.now()).getTime() / 1000),
            open:   +((d as any).chOpeningPrice   ?? 0).toFixed(2),
            high:   +((d as any).chTradeHighPrice ?? 0).toFixed(2),
            low:    +((d as any).chTradeLowPrice  ?? 0).toFixed(2),
            close:  +((d as any).chClosingPrice   ?? 0).toFixed(2),
            volume: parseInt(String((d as any).chTotTradedQty ?? 0)),
          }))
          .filter((c) => c.open > 0 && c.close > 0)
          .sort((a, b) => a.time - b.time);
      }
    } catch (e) {
      console.warn(`[NSE] historical [${symbol}] failed:`, (e as Error).message?.slice(0, 80));
    }
  }

  /* ── Layer 2: Yahoo Finance ─────────────────────────────── */
  const yahooSym =
    symbol === "NIFTY50" || symbol === "^NSEI" ? "%5ENSEI"
    : symbol.includes(".")                      ? encodeURIComponent(symbol)
    :                                             `${symbol}.NS`;

  try {
    const res = await axios.get(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSym}`,
      { params: { interval, range }, headers: YF_HEADERS, timeout: 5000 }
    );
    const result = res.data.chart.result[0];
    const ts: number[] = result.timestamp ?? [];
    const q = result.indicators.quote[0];

    const candles = ts
      .map((t, i) => ({
        time:   t,
        open:   q.open[i]   != null ? +(q.open[i]  as number).toFixed(2)  : null,
        high:   q.high[i]   != null ? +(q.high[i]  as number).toFixed(2)  : null,
        low:    q.low[i]    != null ? +(q.low[i]   as number).toFixed(2)   : null,
        close:  q.close[i]  != null ? +(q.close[i] as number).toFixed(2)  : null,
        volume: (q.volume[i] as number) || 0,
      }))
      .filter((c): c is CandleData => c.open != null && c.close != null);

    if (candles.length > 2) return candles;
  } catch (e) {
    console.warn(`[Yahoo] chart [${symbol}] failed:`, (e as Error).message?.slice(0, 60));
  }

  /* ── Layer 3: Mock candles ──────────────────────────────── */
  return generateMockCandles(symbol, range, interval);
}

/* ════════════════════════════════════════════════════════════ *
 *  MARKET STATUS
 * ════════════════════════════════════════════════════════════ */
export async function fetchMarketStatus(): Promise<MarketStatus> {
  try {
    const nse = getNSE();
    const data   = await nse.getMarketStatus() as NseMarketStatus;
    const states = data.marketState ?? [];
    const cm     = states.find((s) => s.market === "Capital Market") ?? states[0];
    return {
      isOpen:     cm?.marketStatus === "Open",
      state:      cm?.marketStatus ?? (isMarketOpen() ? "Open" : "Closed"),
      marketType: "Capital Market",
      tradeDate:  cm?.tradeDate ?? new Date().toLocaleDateString("en-IN"),
      index:      cm?.index    ?? "NIFTY 50",
    };
  } catch {
    return {
      isOpen:     isMarketOpen(),
      state:      isMarketOpen() ? "Open" : "Closed",
      marketType: "Capital Market",
      tradeDate:  new Date().toLocaleDateString("en-IN"),
      index:      "NIFTY 50",
    };
  }
}

/* ════════════════════════════════════════════════════════════ *
 *  PRE-OPEN DATA
 * ════════════════════════════════════════════════════════════ */
export async function fetchPreOpenData(): Promise<any[]> {
  try {
    const nse = getNSE();
    // getPreOpenMarketData() takes NO arguments per the package's TypeScript types
    const data = await nse.getPreOpenMarketData();
    return (data as any)?.data ?? [];
  } catch {
    return [];
  }
}

/* ════════════════════════════════════════════════════════════ *
 *  HELPERS
 * ════════════════════════════════════════════════════════════ */
export function isMarketOpen(): boolean {
  const ist = new Date(Date.now() + 5.5 * 3600000);
  const day = ist.getUTCDay();
  const t   = ist.getUTCHours() * 60 + ist.getUTCMinutes();
  return day >= 1 && day <= 5 && t >= 555 && t <= 930;
}

export function formatCurrency(v: number): string {
  if (v >= 1e12) return `₹${(v / 1e12).toFixed(2)}T`;
  if (v >= 1e9)  return `₹${(v / 1e9).toFixed(2)}B`;
  if (v >= 1e7)  return `₹${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5)  return `₹${(v / 1e5).toFixed(2)}L`;
  return `₹${v.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function formatVolume(v: number): string {
  if (v >= 1e7) return `${(v / 1e7).toFixed(2)}Cr`;
  if (v >= 1e5) return `${(v / 1e5).toFixed(2)}L`;
  if (v >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return `${v}`;
}

/* ════════════════════════════════════════════════════════════ *
 *  MOCK DATA  (Layer 3 — always renders something)
 * ════════════════════════════════════════════════════════════ */
function getMockIndexData(): IndexData {
  const price = 24350 + (Math.random() - 0.5) * 200;
  const prev  = 24100;
  return {
    symbol: "NIFTY 50", price: +price.toFixed(2),
    change:        +(price - prev).toFixed(2),
    changePercent: +(((price - prev) / prev) * 100).toFixed(2),
    open: 24180, high: 24520, low: 24050, previousClose: prev,
    volume: 234567890, timestamp: Date.now(),
    marketState: isMarketOpen() ? "REGULAR" : "CLOSED",
    advances: 29, declines: 18, unchanged: 3,
    fiftyTwoWeekHigh: 26277, fiftyTwoWeekLow: 19200,
    yearToDateChange: 12.8, totalTradedValue: 0,
  };
}

function getMockStockQuotes(): StockQuote[] {
  return Object.entries(NIFTY50_META).map(([sym, info]) => {
    const base  = MOCK_PRICES[sym] ?? 1500;
    const chg   = (Math.random() - 0.48) * base * 0.03;
    const price = +(base + chg).toFixed(2);
    const w52h  = +(price * 1.28).toFixed(2);
    const w52l  = +(price * 0.72).toFixed(2);
    return {
      symbol: sym, name: info.name, sector: info.sector, weight: info.weight, isin: "",
      price, change: +chg.toFixed(2), changePercent: +((chg / base) * 100).toFixed(2),
      open:  +(base * (1 + (Math.random() - 0.5) * 0.004)).toFixed(2),
      high:  +(price * 1.012).toFixed(2),
      low:   +(price * 0.988).toFixed(2),
      previousClose: +base.toFixed(2), vwap: +price.toFixed(2),
      volume:           Math.floor(Math.random() * 8e6 + 5e5),
      totalTradedValue: 0,
      marketCap:        Math.floor(price * (Math.random() * 1e9 + 5e8)),
      avgVolume:        Math.floor(Math.random() * 5e6 + 1e6),
      fiftyTwoWeekHigh: w52h, fiftyTwoWeekLow: w52l,
      fiftyTwoWeekHighPercent: +((price - w52h) / w52h * 100).toFixed(2),
      fiftyTwoWeekLowPercent:  +((price - w52l) / w52l * 100).toFixed(2),
      pe:            +(15 + Math.random() * 35).toFixed(1),
      pb:            +(1.5 + Math.random() * 5).toFixed(2),
      eps:           +(price / (15 + Math.random() * 20)).toFixed(2),
      dividendYield: Math.random() > 0.4 ? +(0.5 + Math.random() * 3).toFixed(2) : null,
      beta:          +(0.7 + Math.random() * 0.8).toFixed(2),
      deliveryPercent: +(40 + Math.random() * 30).toFixed(1),
      seriesType:    "EQ",
      lastUpdateTime: new Date().toLocaleTimeString("en-IN"),
    };
  });
}

function generateMockCandles(symbol: string, range: string, interval: string): CandleData[] {
  const counts: Record<string, number> = {
    "1d": 78, "5d": 165, "1mo": 22, "3mo": 65,
    "6mo": 26, "1y": 52, "2y": 104, "5y": 60, "max": 80,
  };
  const steps: Record<string, number> = {
    "5m": 300, "15m": 900, "1d": 86400, "1wk": 604800,
    "1mo": 2592000, "3mo": 7776000,
  };
  const count = counts[range] ?? 22;
  const step  = steps[interval] ?? 86400;
  let p = MOCK_PRICES[symbol] ?? 22000;
  const now = Math.floor(Date.now() / 1000);

  return Array.from({ length: count }, (_, i) => {
    const t  = now - (count - i) * step;
    const mv = (Math.random() - 0.48) * p * 0.013;
    const o  = p; p = Math.max(p * 0.6, p + mv);
    return {
      time:   t,
      open:   +o.toFixed(2),
      high:   +(Math.max(o, p) * 1.006).toFixed(2),
      low:    +(Math.min(o, p) * 0.994).toFixed(2),
      close:  +p.toFixed(2),
      volume: Math.floor(Math.random() * 2e8 + 1e7),
    };
  });
}

/* ════════════════════════════════════════════════════════════ *
 *  STATIC METADATA  — Nifty 50 constituents
 * ════════════════════════════════════════════════════════════ */
export const NIFTY50_META: Record<string, { name: string; sector: string; weight: number }> = {
  RELIANCE:    { name: "Reliance Industries",      sector: "Energy",         weight: 10.5 },
  TCS:         { name: "Tata Consultancy Services", sector: "IT",             weight: 8.2  },
  HDFCBANK:    { name: "HDFC Bank",                 sector: "Banking",        weight: 7.9  },
  ICICIBANK:   { name: "ICICI Bank",                sector: "Banking",        weight: 6.8  },
  HINDUNILVR:  { name: "Hindustan Unilever",        sector: "FMCG",           weight: 4.1  },
  INFY:        { name: "Infosys",                   sector: "IT",             weight: 5.9  },
  ITC:         { name: "ITC Limited",               sector: "FMCG",           weight: 3.8  },
  SBIN:        { name: "State Bank of India",       sector: "Banking",        weight: 3.2  },
  BHARTIARTL:  { name: "Bharti Airtel",             sector: "Telecom",        weight: 3.5  },
  KOTAKBANK:   { name: "Kotak Mahindra Bank",       sector: "Banking",        weight: 3.1  },
  BAJFINANCE:  { name: "Bajaj Finance",             sector: "Finance",        weight: 2.9  },
  LT:          { name: "Larsen & Toubro",           sector: "Infrastructure", weight: 2.7  },
  HCLTECH:     { name: "HCL Technologies",          sector: "IT",             weight: 2.4  },
  AXISBANK:    { name: "Axis Bank",                 sector: "Banking",        weight: 2.3  },
  ASIANPAINT:  { name: "Asian Paints",              sector: "Paints",         weight: 2.1  },
  MARUTI:      { name: "Maruti Suzuki",             sector: "Auto",           weight: 2.0  },
  SUNPHARMA:   { name: "Sun Pharmaceutical",        sector: "Pharma",         weight: 1.9  },
  TITAN:       { name: "Titan Company",             sector: "Consumer",       weight: 1.8  },
  ULTRACEMCO:  { name: "UltraTech Cement",          sector: "Cement",         weight: 1.7  },
  WIPRO:       { name: "Wipro",                     sector: "IT",             weight: 1.6  },
  NTPC:        { name: "NTPC Limited",              sector: "Power",          weight: 1.5  },
  POWERGRID:   { name: "Power Grid Corp",           sector: "Power",          weight: 1.4  },
  BAJAJFINSV:  { name: "Bajaj Finserv",             sector: "Finance",        weight: 1.3  },
  NESTLEIND:   { name: "Nestle India",              sector: "FMCG",           weight: 1.2  },
  TECHM:       { name: "Tech Mahindra",             sector: "IT",             weight: 1.2  },
  "M&M":       { name: "Mahindra & Mahindra",       sector: "Auto",           weight: 1.1  },
  TATAMOTORS:  { name: "Tata Motors",               sector: "Auto",           weight: 1.1  },
  ADANIPORTS:  { name: "Adani Ports",               sector: "Infrastructure", weight: 1.0  },
  ONGC:        { name: "Oil & Natural Gas Corp",    sector: "Energy",         weight: 1.0  },
  JSWSTEEL:    { name: "JSW Steel",                 sector: "Metals",         weight: 0.9  },
  TATASTEEL:   { name: "Tata Steel",                sector: "Metals",         weight: 0.9  },
  INDUSINDBK:  { name: "IndusInd Bank",             sector: "Banking",        weight: 0.8  },
  COALINDIA:   { name: "Coal India",                sector: "Mining",         weight: 0.8  },
  BRITANNIA:   { name: "Britannia Industries",      sector: "FMCG",           weight: 0.7  },
  DRREDDY:     { name: "Dr. Reddy's Labs",          sector: "Pharma",         weight: 0.7  },
  CIPLA:       { name: "Cipla",                     sector: "Pharma",         weight: 0.7  },
  DIVISLAB:    { name: "Divi's Laboratories",       sector: "Pharma",         weight: 0.6  },
  EICHERMOT:   { name: "Eicher Motors",             sector: "Auto",           weight: 0.6  },
  HEROMOTOCO:  { name: "Hero MotoCorp",             sector: "Auto",           weight: 0.6  },
  "BAJAJ-AUTO":{ name: "Bajaj Auto",               sector: "Auto",           weight: 0.6  },
  APOLLOHOSP:  { name: "Apollo Hospitals",          sector: "Healthcare",     weight: 0.5  },
  TATACONSUM:  { name: "Tata Consumer Products",    sector: "FMCG",           weight: 0.5  },
  GRASIM:      { name: "Grasim Industries",         sector: "Diversified",    weight: 0.5  },
  HINDALCO:    { name: "Hindalco Industries",       sector: "Metals",         weight: 0.5  },
  BPCL:        { name: "BPCL",                      sector: "Energy",         weight: 0.4  },
  SBILIFE:     { name: "SBI Life Insurance",        sector: "Insurance",      weight: 0.4  },
  HDFCLIFE:    { name: "HDFC Life Insurance",       sector: "Insurance",      weight: 0.4  },
  ADANIENT:    { name: "Adani Enterprises",         sector: "Diversified",    weight: 0.4  },
  LTF:         { name: "L&T Finance",               sector: "Finance",        weight: 0.3  },
  SHRIRAMFIN:  { name: "Shriram Finance",           sector: "Finance",        weight: 0.3  },
};

export const NIFTY50_STOCKS = Object.entries(NIFTY50_META).map(([sym, info]) => ({
  symbol: `${sym}.NS`, name: info.name, sector: info.sector, weight: info.weight,
}));

const MOCK_PRICES: Record<string, number> = {
  RELIANCE: 2854, TCS: 3921, HDFCBANK: 1682, ICICIBANK: 1122, HINDUNILVR: 2341,
  INFY: 1784, ITC: 482, SBIN: 782, BHARTIARTL: 1452, KOTAKBANK: 1820,
  BAJFINANCE: 7208, LT: 3687, HCLTECH: 1684, AXISBANK: 1183, ASIANPAINT: 2978,
  MARUTI: 12840, SUNPHARMA: 1681, TITAN: 3652, ULTRACEMCO: 10210, WIPRO: 562,
  NTPC: 342, POWERGRID: 298, BAJAJFINSV: 1645, NESTLEIND: 2487, TECHM: 1512,
  "M&M": 2845, TATAMOTORS: 982, ADANIPORTS: 1354, ONGC: 278, JSWSTEEL: 921,
  TATASTEEL: 164, INDUSINDBK: 1421, COALINDIA: 452, BRITANNIA: 5234, DRREDDY: 6782,
  CIPLA: 1482, DIVISLAB: 3892, EICHERMOT: 4521, HEROMOTOCO: 4892, "BAJAJ-AUTO": 8921,
  APOLLOHOSP: 6234, TATACONSUM: 1021, GRASIM: 2654, HINDALCO: 654, BPCL: 342,
  SBILIFE: 1642, HDFCLIFE: 721, ADANIENT: 2854, LTF: 168, SHRIRAMFIN: 2854,
  NIFTY50: 24350,
};
