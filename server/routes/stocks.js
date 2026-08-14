const express = require('express');
const router = express.Router();
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// Helper for trending fallback
function getMockTrending() {
  return [
    { symbol: 'AAPL', companyName: 'Apple Inc.', currentPrice: 150.25, change: 2.50, changePercent: 1.69 },
    { symbol: 'TSLA', companyName: 'Tesla Inc.', currentPrice: 200.10, change: -5.20, changePercent: -2.53 },
    { symbol: 'NVDA', companyName: 'NVIDIA Corporation', currentPrice: 450.00, change: 15.00, changePercent: 3.44 },
    { symbol: 'MSFT', companyName: 'Microsoft Corp.', currentPrice: 330.50, change: 1.20, changePercent: 0.36 },
    { symbol: 'GOOGL', companyName: 'Alphabet Inc.', currentPrice: 135.20, change: -0.80, changePercent: -0.58 }
  ];
}

// GET /api/stocks/search?q=query
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Query parameter q is required' });

  try {
    const results = await yahooFinance.search(q);
    const quotes = results.quotes.filter(q => q.isYahooFinance);
    const formattedResults = quotes.map(q => ({
      symbol: q.symbol,
      companyName: q.shortname || q.longname,
      exchange: q.exchDisp,
      type: q.quoteType,
    }));
    res.json(formattedResults);
  } catch (error) {
    console.error(`Yahoo Finance search blocked for ${q}, using fallback data.`);
    res.json([
      { symbol: q.toUpperCase(), companyName: `${q.toUpperCase()} Inc. (Fallback)`, exchange: 'NMS', type: 'EQUITY' }
    ]);
  }
});

// GET /api/stocks/trending
router.get('/trending', async (req, res) => {
  try {
    const trendingData = await yahooFinance.trendingSymbols('US');
    const symbols = trendingData.quotes.map(q => q.symbol).slice(0, 5);
    const quotes = await Promise.all(symbols.map(sym => yahooFinance.quote(sym).catch(() => null)));
    
    const formattedTrending = quotes.filter(Boolean).map(quote => ({
      symbol: quote.symbol,
      companyName: quote.shortName || quote.longName,
      currentPrice: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent
    }));
    res.json(formattedTrending);
  } catch (error) {
    console.error('Yahoo Finance trending blocked, using fallback data.');
    res.json(getMockTrending());
  }
});

// Helper to generate mock data if Yahoo Finance blocks the cloud IP
function getMockQuote(symbol) {
  return {
    symbol: symbol.toUpperCase(),
    companyName: `${symbol.toUpperCase()} (Fallback Data)`,
    currentPrice: 150.25,
    change: 2.50,
    changePercent: 1.69,
    dayHigh: 152.00,
    dayLow: 148.50,
    volume: 50000000,
    marketCap: 2000000000000,
  };
}

function getMockChart(symbol) {
  const quotes = [];
  let price = 140;
  for (let i = 30; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    price += (Math.random() - 0.45) * 5;
    quotes.push({ date: d, close: price });
  }
  return { quotes };
}

// GET /api/stocks/:symbol
router.get('/:symbol', async (req, res) => {
  const { symbol } = req.params;
  try {
    const quote = await yahooFinance.quote(symbol);
    if (!quote) return res.status(404).json({ error: 'Stock not found' });

    res.json({
      symbol: quote.symbol,
      companyName: quote.shortName || quote.longName,
      currentPrice: quote.regularMarketPrice,
      change: quote.regularMarketChange,
      changePercent: quote.regularMarketChangePercent,
      dayHigh: quote.regularMarketDayHigh,
      dayLow: quote.regularMarketDayLow,
      volume: quote.regularMarketVolume,
      marketCap: quote.marketCap,
    });
  } catch (error) {
    console.error(`Yahoo Finance quote blocked for ${symbol}, using fallback data.`);
    res.json(getMockQuote(symbol));
  }
});

// GET /api/stocks/:symbol/chart?range=1mo&interval=1d
router.get('/:symbol/chart', async (req, res) => {
  const { symbol } = req.params;
  try {
    const { range = '1mo', interval = '1d' } = req.query;
    const period1 = new Date();
    if (range === '1d') period1.setDate(period1.getDate() - 1);
    else if (range === '5d') period1.setDate(period1.getDate() - 5);
    else if (range === '1mo') period1.setMonth(period1.getMonth() - 1);
    else if (range === '3mo') period1.setMonth(period1.getMonth() - 3);
    else if (range === '6mo') period1.setMonth(period1.getMonth() - 6);
    else if (range === '1y') period1.setFullYear(period1.getFullYear() - 1);
    else if (range === '2y') period1.setFullYear(period1.getFullYear() - 2);
    else if (range === '5y') period1.setFullYear(period1.getFullYear() - 5);
    else if (range === '10y') period1.setFullYear(period1.getFullYear() - 10);
    else if (range === 'ytd') period1.setMonth(0, 1);
    else if (range === 'max') period1.setFullYear(1900, 0, 1);
    
    const queryOptions = { period1: period1.toISOString().split('T')[0], interval };
    const chart = await yahooFinance.chart(symbol, queryOptions);
    res.json(chart);
  } catch (error) {
    console.error(`Yahoo Finance chart blocked for ${symbol}, using fallback data.`);
    res.json(getMockChart(symbol));
  }
});

// GET /api/stocks/:symbol/news
router.get('/:symbol/news', async (req, res) => {
  try {
    const { symbol } = req.params;
    const newsData = await yahooFinance.search(symbol, { newsCount: 8 });
    res.json(newsData.news || []);
  } catch (error) {
    console.error('Error fetching stock news:', error);
    res.status(500).json({ error: 'Failed to fetch stock news' });
  }
});

// GET /api/stocks/:symbol/ratings
router.get('/:symbol/ratings', async (req, res) => {
  try {
    const { symbol } = req.params;
    const ratingsData = await yahooFinance.quoteSummary(symbol, { modules: ['recommendationTrend'] });
    
    // Extact the current period (0m) trend
    const trends = ratingsData?.recommendationTrend?.trend || [];
    const currentTrend = trends.find(t => t.period === '0m') || null;
    
    res.json(currentTrend);
  } catch (error) {
    console.error('Error fetching stock ratings:', error);
    res.status(500).json({ error: 'Failed to fetch stock ratings' });
  }
});

module.exports = router;
