
const express = require("express");
const fetch = require("node-fetch");
const app = express();
const ADDRESS = process.env.LTC_ADDRESS || "LRu77ago3SiWEWKedsDh7A2Ru3zLe1pXP6";

// fetch JSON helper
async function fetchJSON(url) {
  const res = await fetch(url, { timeout: 5000 });
  if (!res.ok) throw new Error(res.statusText);
  return res.json();
}

// Get LTC balance (in LTC) using BlockCypher
async function getBalanceLTC() {
  const data = await fetchJSON(
    `https://api.blockcypher.com/v1/ltc/main/addrs/${ADDRESS}/balance`
  );
  return data.final_balance / 1e8;
}

// Get current LTC price in USD from CoinGecko
async function getPriceUSD() {
  const data = await fetchJSON(
    "https://api.coingecko.com/api/v3/simple/price?ids=litecoin&vs_currencies=usd"
  );
  return data.litecoin.usd;
}

// JSON endpoint
app.get('/balance', async (req, res) => {
  try {
    const [ltc, price] = await Promise.all([getBalanceLTC(), getPriceUSD()]);
    const usd = +(ltc * price).toFixed(2);
    res.json({ usd_balance: usd });
  } catch (err) {
    res.status(500).json({ error: 'fetch_failed' });
  }
});

// Simplified SVG badge: thick green circle with centered USD amount
app.get('/badge.svg', async (req, res) => {
  try {
    const [ltc, price] = await Promise.all([getBalanceLTC(), getPriceUSD()]);
    const usd = (ltc * price).toFixed(2);
    const message = `$${usd}`;

    // SVG parameters
    const diameter = 120;
    const radius = diameter / 2;
    const strokeWidth = 10;
    const fontSize = 24;

    res.setHeader('Content-Type', 'image/svg+xml;charset=utf-8');
    res.send(`
<svg xmlns="http://www.w3.org/2000/svg" width="${diameter}" height="${diameter}">
  <!-- Circle background -->
  <circle cx="${radius}" cy="${radius}" r="${radius - strokeWidth/2}" fill="#ffffff" stroke="#4caf50" stroke-width="${strokeWidth}"/>
  <!-- Centered text -->
  <text x="50%" y="50%" text-anchor="middle" dy=".35em"
        font-family="Arial, sans-serif" font-size="${fontSize}" fill="#4caf50">${message}</text>
</svg>`);
  } catch (err) {
    res.status(500).send('<!-- error fetching -->');
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Listening on ${PORT}`));
