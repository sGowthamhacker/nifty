/**
 * Unified data layer — re-exports from nse-client.
 * Primary data source: NSE India (stock-nse-india package)
 * Fallback: Yahoo Finance
 * Final fallback: realistic mock data
 */
export {
  NIFTY50_STOCKS,
  NIFTY50_META,
  isMarketOpen,
  formatCurrency,
  formatVolume,
  fetchNiftyIndexNSE    as fetchNiftyIndex,
  fetchEquityHistorical as fetchCandleData,
  fetchMarketStatus,
  fetchPreOpenData,
} from "./nse-client";

export type {
  IndexData,
  StockQuote,
  CandleData,
  MarketStatus,
} from "./nse-client";

// fetchStockQuotes — accepts optional symbol list (ignored; always returns full Nifty 50)
import { fetchNifty50StocksNSE } from "./nse-client";
export async function fetchStockQuotes(_symbols?: string[]) {
  return fetchNifty50StocksNSE();
}
