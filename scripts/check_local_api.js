const axios = require('axios');
(async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/market/index', { timeout: 10000 });
    console.log(JSON.stringify(res.data, null, 2));
  } catch (e) {
    console.error('error fetching local api:', e.message);
    if (e.response) console.error('status', e.response.status, 'data', e.response.data);
  }
})();
