const axios = require('axios');

async function test() {
  try {
    const res = await axios.get('http://localhost:3001/api/stock-chart?symbol=NIFTY50&timeframe=1D');
    console.log('Status:', res.status);
    console.log('Data Keys:', Object.keys(res.data));
    console.log('Candles count:', res.data.candles?.length);
    console.log('Meta Price:', res.data.meta?.price);
  } catch (e) {
    console.error('Error:', e.message);
  }
}

test();
