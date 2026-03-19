const axios = require('axios');
const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Accept": "*/*",
};
async function test() {
  try {
    const res = await axios.get("https://query2.finance.yahoo.com/v8/finance/chart/RELIANCE.NS?interval=1d&range=1d", {
      headers: YAHOO_HEADERS
    });
    console.log(JSON.stringify(res.data.chart.result[0].meta, null, 2));
  } catch (e) {
    console.error(e.message);
  }
}
test();
