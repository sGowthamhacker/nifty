export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";

const NEWS = [
  { id:1,  title:"NIFTY 50 hits fresh intraday high; IT and Banking lead gains",               category:"Markets",     symbol:"NIFTY50",    sentiment:"positive", source:"Economic Times"    },
  { id:2,  title:"RBI keeps repo rate unchanged at 6.5%; maintains accommodative stance",      category:"Economy",     symbol:"MACRO",      sentiment:"neutral",  source:"Moneycontrol"      },
  { id:3,  title:"Reliance Industries Q3 profit jumps 12% YoY on Jio and retail growth",       category:"Earnings",    symbol:"RELIANCE",   sentiment:"positive", source:"Business Standard" },
  { id:4,  title:"TCS bags $1.5 billion multi-year deal from leading European bank",            category:"Corp Action", symbol:"TCS",        sentiment:"positive", source:"Livemint"          },
  { id:5,  title:"FII net inflows cross ₹8,200 Cr this week; market mood bullish",             category:"Markets",     symbol:"NIFTY50",    sentiment:"positive", source:"CNBC TV18"         },
  { id:6,  title:"Infosys raises FY25 revenue guidance after strong Q3 beat",                  category:"Earnings",    symbol:"INFY",       sentiment:"positive", source:"Economic Times"    },
  { id:7,  title:"HDFC Bank: NIM compression worries weigh on stock despite PAT growth",       category:"Earnings",    symbol:"HDFCBANK",   sentiment:"negative", source:"Moneycontrol"      },
  { id:8,  title:"IMF upgrades India GDP growth forecast to 7.2% for FY25",                    category:"Economy",     symbol:"MACRO",      sentiment:"positive", source:"Business Standard" },
  { id:9,  title:"Bajaj Finance AUM crosses ₹3.5 lakh crore milestone in Q3",                  category:"Earnings",    symbol:"BAJFINANCE", sentiment:"positive", source:"Livemint"          },
  { id:10, title:"Maruti reports 18% YoY growth in wholesale dispatches for December",         category:"Earnings",    symbol:"MARUTI",     sentiment:"positive", source:"CNBC TV18"         },
  { id:11, title:"Crude oil slips below $80; positive for OMCs — BPCL, ONGC gain",             category:"Commodities", symbol:"ONGC",       sentiment:"neutral",  source:"Economic Times"    },
  { id:12, title:"SBI records highest-ever loan book growth; NPA at decade low",               category:"Earnings",    symbol:"SBIN",       sentiment:"positive", source:"Moneycontrol"      },
  { id:13, title:"Axis Bank completes Citibank India retail integration successfully",          category:"Corp Action", symbol:"AXISBANK",   sentiment:"positive", source:"Business Standard" },
  { id:14, title:"US Fed signals 2 rate cuts in 2025; emerging markets rally",                 category:"Global",      symbol:"GLOBAL",     sentiment:"positive", source:"Livemint"          },
  { id:15, title:"Adani Ports wins ₹12,000 Cr terminal contract at JNPT Mumbai",               category:"Corp Action", symbol:"ADANIPORTS", sentiment:"positive", source:"CNBC TV18"         },
  { id:16, title:"ITC Hotels demerger: record date announced, 1:10 ratio for shareholders",    category:"Corp Action", symbol:"ITC",        sentiment:"neutral",  source:"Economic Times"    },
  { id:17, title:"Wipro Q3 revenue misses street estimates; Q4 guidance cautious",             category:"Earnings",    symbol:"WIPRO",      sentiment:"negative", source:"Moneycontrol"      },
  { id:18, title:"Tata Motors EV market share crosses 12%; Nexon EV bestseller",               category:"Corp Action", symbol:"TATAMOTORS", sentiment:"positive", source:"Business Standard" },
  { id:19, title:"Gold surges to ₹70,000/10g on geopolitical tensions and weak dollar",        category:"Commodities", symbol:"GOLD",       sentiment:"neutral",  source:"Livemint"          },
  { id:20, title:"SEBI tightens F&O norms; weekly expiry restricted to one benchmark",         category:"Regulation",  symbol:"NIFTY50",    sentiment:"neutral",  source:"CNBC TV18"         },
  { id:21, title:"Sun Pharma gets USFDA approval for key dermatology drug",                    category:"Corp Action", symbol:"SUNPHARMA",  sentiment:"positive", source:"Economic Times"    },
  { id:22, title:"Coal India production up 8% YoY; dividend yield most attractive in sector",  category:"Earnings",    symbol:"COALINDIA",  sentiment:"positive", source:"Moneycontrol"      },
  { id:23, title:"Titan Company: jewellery demand strong in festive season; guides 20% growth",category:"Earnings",    symbol:"TITAN",      sentiment:"positive", source:"Business Standard" },
  { id:24, title:"Apollo Hospitals: ARPOB rises 11% YoY; new hospitals ramp up on track",     category:"Earnings",    symbol:"APOLLOHOSP", sentiment:"positive", source:"Livemint"          },
  { id:25, title:"NSE launches T+0 settlement; sebi eyes real-time equity settlement",         category:"Markets",     symbol:"NIFTY50",    sentiment:"positive", source:"CNBC TV18"         },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const symbol = searchParams.get("symbol");
  const now = Date.now();
  let news = NEWS;
  if (symbol && symbol !== "ALL") {
    news = NEWS.filter(n => n.symbol === symbol.toUpperCase() || n.symbol === "NIFTY50" || n.symbol === "MACRO");
  }
  const result = news.map((n, i) => ({
    ...n,
    publishedAt: new Date(now - (i * 2400000 + Math.random() * 1800000)).toISOString(),
    url: "#",
    readTime: `${Math.floor(2 + Math.random() * 4)} min read`,
  })).sort((a,b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  return NextResponse.json(result);
}
