const axios = require('axios');

const CHROME = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'application/json, text/plain, */*',
  'Accept-Language': 'en-IN,en-US;q=0.9,en;q=0.8',
};

async function checkYahoo() {
  try {
    const res = await axios.get('https://query1.finance.yahoo.com/v8/finance/chart/%5ENSEI', {
      params: { interval: '1m', range: '1d' }, headers: CHROME, timeout: 8000
    });
    const m = res.data.chart.result[0].meta;
    console.log('YAHOO meta.marketState =', m.marketState);
    console.log('YAHOO regularMarketPrice =', m.regularMarketPrice, 'previousClose =', m.chartPreviousClose);
  } catch (e) {
    console.error('YAHOO error:', e.message);
  }
}

async function checkNSE() {
  try {
    const res = await axios.get('https://www.nseindia.com/api/allIndices', { headers: CHROME, timeout: 8000 });
    const rows = res.data.data || res.data;
    const nifty = Array.isArray(rows) ? rows.find(r => (r.indexSymbol||r.index||'').toString().includes('NIFTY')) : null;
    if (nifty) {
      console.log('NSE nifty.marketStatus =', nifty.marketStatus || nifty.marketStatusText || nifty.marketStatus || '(no field)');
      console.log('NSE raw entry:', nifty);
    } else {
      console.log('NSE response received but NIFTY row not found');
    }
  } catch (e) {
    console.error('NSE error:', e.message);
  }
}

(async () => {
  console.log('Local time', new Date().toString());
  await checkYahoo();
  await checkNSE();
})();
