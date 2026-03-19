const axios = require("axios");
const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Accept": "*/*",
};

(async () => {
  try {
    const symbol = "%5ENSEI";
    const res = await axios.get(`https://query2.finance.yahoo.com/v8/finance/chart/${symbol}`, {
      params: { interval: "1m", range: "1d" }, headers: YAHOO_HEADERS
    });
    const m = res.data.chart.result[0].meta;
    console.log("Yahoo Chart Meta for", symbol);
    console.log("Market State:", m.marketState);
    console.log("Exchange Name:", m.exchangeName);
    console.log("Timezone:", m.timezone);
  } catch (e) {
    console.error("Error:", e.message);
  }
})();
