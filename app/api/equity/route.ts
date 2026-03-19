export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import type {
  EquityDetails,
  EquityTradeInfo,
  EquityCorporateInfo,
  EquityHistoricalData,
  IntradayData,
} from "stock-nse-india/build/interface";

// eslint-disable-next-line
const { NseIndia } = require("stock-nse-india");
let _nse: any = null;
const getNSE = () => { if (!_nse) _nse = new NseIndia(); return _nse; };

const cache = new Map<string, { data: any; ts: number }>();
const TTL_SHORT  = 10000;   // 10s  — price data
const TTL_MEDIUM = 60000;   // 1min — trade info
const TTL_LONG   = 300000;  // 5min — corporate info

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol  = (searchParams.get("symbol") || "RELIANCE").toUpperCase();
  const section = searchParams.get("section") || "full";  // full | trade | corporate | historical | intraday | options

  const cacheKey = `${symbol}:${section}`;
  const ttl = section === "full" ? TTL_SHORT
    : section === "corporate" ? TTL_LONG
    : TTL_MEDIUM;

  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.ts < ttl) {
    return NextResponse.json({ ...cached.data, _cached: true });
  }

  try {
    const nse = getNSE();

    let result: any = {};

    if (section === "full" || section === "equity") {
      const d = await nse.getEquityDetails(symbol) as EquityDetails;
      result = {
        symbol,
        companyName:     d.info.companyName,
        industry:        d.info.industry,
        isin:            d.info.isin,
        isFNO:           d.info.isFNOSec,
        isSLB:           d.info.isSLBSec,
        listingDate:     d.info.listingDate,
        segment:         d.info.segment,
        series:          d.metadata.series,
        status:          d.metadata.status,
        lastUpdateTime:  d.metadata.lastUpdateTime,
        faceValue:       d.securityInfo.faceValue,
        issuedSize:      d.securityInfo.issuedSize,
        derivatives:     d.securityInfo.derivatives,
        slb:             d.securityInfo.slb,
        tradingStatus:   d.securityInfo.tradingStatus,
        surveillance:    d.securityInfo.surveillance,
        boardStatus:     d.securityInfo.boardStatus,
        pdSectorPe:      d.metadata.pdSectorPe,
        pdSymbolPe:      d.metadata.pdSymbolPe,
        pdSectorInd:     d.metadata.pdSectorInd,
        macro:           d.industryInfo.macro,
        sector:          d.industryInfo.sector,
        basicIndustry:   d.industryInfo.basicIndustry,
        price: {
          lastPrice:     d.priceInfo.lastPrice,
          change:        d.priceInfo.change,
          pChange:       d.priceInfo.pChange,
          previousClose: d.priceInfo.previousClose,
          open:          d.priceInfo.open,
          close:         d.priceInfo.close,
          vwap:          d.priceInfo.vwap,
          lowerCP:       d.priceInfo.lowerCP,
          upperCP:       d.priceInfo.upperCP,
          basePrice:     d.priceInfo.basePrice,
          intraDayHigh:  d.priceInfo.intraDayHighLow.max,
          intraDayLow:   d.priceInfo.intraDayHighLow.min,
          weekHigh:      (d.priceInfo as any).weekHighLow?.max,
          weekLow:       (d.priceInfo as any).weekHighLow?.min,
          weekHighDate:  (d.priceInfo as any).weekHighLow?.maxDate,
          weekLowDate:   (d.priceInfo as any).weekHighLow?.minDate,
        },
        preOpen: {
          IEP:                d.preOpenMarket.IEP,
          totalTradedVolume:  d.preOpenMarket.totalTradedVolume,
          finalPrice:         d.preOpenMarket.finalPrice,
          finalQuantity:      d.preOpenMarket.finalQuantity,
          totalBuyQty:        d.preOpenMarket.totalBuyQuantity,
          totalSellQty:       d.preOpenMarket.totalSellQuantity,
          lastUpdateTime:     d.preOpenMarket.lastUpdateTime,
          preopen:            d.preOpenMarket.preopen,
        },
      };
    }

    if (section === "trade") {
      const d = await nse.getEquityTradeInfo(symbol) as EquityTradeInfo;
      const ob = d.marketDeptOrderBook;
      result = {
        symbol,
        orderBook: {
          totalBuyQty:   ob.totalBuyQuantity,
          totalSellQty:  ob.totalSellQuantity,
          bids:          ob.bid,
          asks:          ob.ask,
        },
        tradeInfo: {
          totalTradedVolume: ob.tradeInfo.totalTradedVolume,
          totalTradedValue:  ob.tradeInfo.totalTradedValue,
          totalMarketCap:    ob.tradeInfo.totalMarketCap,
          ffmc:              ob.tradeInfo.ffmc,
          impactCost:        ob.tradeInfo.impactCost,
          cmDailyVolatility: ob.tradeInfo.cmDailyVolatility,
          cmAnnualVolatility:ob.tradeInfo.cmAnnualVolatility,
          activeSeries:      ob.tradeInfo.activeSeries,
        },
        valueAtRisk: ob.valueAtRisk,
        deliveryInfo: {
          quantityTraded:          d.securityWiseDP.quantityTraded,
          deliveryQuantity:        d.securityWiseDP.deliveryQuantity,
          deliveryToTradedQtyPct:  d.securityWiseDP.deliveryToTradedQuantity,
          date:                    d.securityWiseDP.secWiseDelPosDate,
        },
      };
    }

    if (section === "corporate") {
      const d = await nse.getEquityCorporateInfo(symbol) as EquityCorporateInfo;
      result = {
        symbol,
        announcements:       d.latest_announcements?.data?.slice(0, 10) || [],
        corporateActions:    d.corporate_actions?.data?.slice(0, 10) || [],
        financialResults:    d.financial_results?.data?.slice(0, 8) || [],
        boardMeetings:       d.borad_meeting?.data?.slice(0, 5) || [],
        shareholdingPattern: d.shareholdings_patterns?.data || {},
      };
    }

    if (section === "historical") {
      const days = parseInt(searchParams.get("days") || "365");
      const end   = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      const rawArr = await nse.getEquityHistoricalData(symbol, { start, end }) as unknown as EquityHistoricalData[];
      const raw    = rawArr?.[0];
      const rows   = raw?.data || [];
      result = {
        symbol,
        data: rows.map((r: any) => ({
          date:         r.chTimestamp || r.CH_TIMESTAMP,
          open:         r.chOpeningPrice    || r.CH_OPENING_PRICE,
          high:         r.chTradeHighPrice  || r.CH_TRADE_HIGH_PRICE,
          low:          r.chTradeLowPrice   || r.CH_TRADE_LOW_PRICE,
          close:        r.chClosingPrice    || r.CH_CLOSING_PRICE,
          ltp:          r.chLastTradedPrice || r.CH_LAST_TRADED_PRICE,
          prevClose:    r.chPreviousClsPrice|| r.CH_PREVIOUS_CLS_PRICE,
          vwap:         r.vwap,
          volume:       r.chTotTradedQty    || r.CH_TOT_TRADED_QTY,
          tradedValue:  r.chTotTradedVal    || r.CH_TOT_TRADED_VAL,
          trades:       r.chTotalTrades     || r.CH_TOTAL_TRADES,
          series:       r.chSeries          || r.CH_SERIES,
          deliveryQty:  r.chDeliveryQty,
          deliveryPct:  r.chDeliveryPct,
        })).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      };
    }

    if (section === "intraday") {
      const d = await nse.getEquityIntradayData(symbol) as IntradayData;
      result = {
        symbol,
        name:       d.name,
        identifier: d.identifier,
        closePrice: d.closePrice,
        candles:    d.grapthData.map(([ts, price]) => ({
          time:  Math.floor(ts / 1000),
          value: price,
        })),
      };
    }

    if (section === "options") {
      const contractInfo = await nse.getEquityOptionChain(symbol);
      result = { symbol, optionChain: contractInfo };
    }

    cache.set(cacheKey, { data: result, ts: Date.now() });
    return NextResponse.json({ ...result, _cached: false, _source: "NSE" });

  } catch (e) {
    console.warn(`[NSE equity ${symbol}/${section}]:`, (e as Error).message?.slice(0, 100));
    return NextResponse.json(
      { error: `NSE data unavailable for ${symbol}`, symbol, section, _source: "error" },
      { status: 502 }
    );
  }
}
