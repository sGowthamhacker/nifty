const axios = require("axios");

(async () => {
  try {
    const res = await axios.get("http://localhost:3000/api/stock-chart?symbol=NIFTY50&timeframe=1D");
    console.log("API Response Meta:", JSON.stringify(res.data.meta, null, 2));
  } catch (e) {
    console.log("Error:", e.message);
  }
})();
