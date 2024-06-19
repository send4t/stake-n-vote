const fetch = require('node-fetch');

let cachedPrice = null;
let cacheTimestamp = null;

const fetchPrice = async () => {
  const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=polkadot&vs_currencies=usd');
  const data = await response.json();
  cachedPrice = data.polkadot.usd;
  cacheTimestamp = Date.now();
};

export default async (req, res) => {
  const oneDay = 24 * 60 * 60 * 1000; // One day in milliseconds
  if (!cachedPrice || (Date.now() - cacheTimestamp > oneDay)) {
    await fetchPrice();
  }
  res.status(200).json({ price: cachedPrice });
};
