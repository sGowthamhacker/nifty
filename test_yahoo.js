const axios = require('axios');
const YAHOO_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Accept": "*/*",
};
async function test() {
  try {
    const res = await axios.get("https://query1.finance.yahoo.com/v7/finance/quote?symbols=RELIANCE.NS", {
      headers: YAHOO_HEADERS
    });
    console.log(JSON.stringify(res.data.quoteResponse.result[0], null, 2));
  } catch (e) {
    console.error(e.message);
  }
}
test();
