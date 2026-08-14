const express = require('express');
const router = express.Router();
const YahooFinance = require('yahoo-finance2').default;
const yahooFinance = new YahooFinance();

// GET /api/stocks/search?q=query
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const results = await yahooFinance.search(q);
    // Filter out news, keep only quotes
    const quotes = results.quotes.filter(q => q.isYahooFinance);
    
    const formattedResults = quotes.map(q => ({
      symbol: q.symbol,
      companyName: q.shortname || q.longname,
      exchange: q.exchDisp,
      type: q.quoteType,
    }));

    res.json(formattedResults);
  } catch (error) {
    console.error('Error searching stocks:', error);
    res.status(500).json({ error: 'Failed to search stocks' });
  }
});

// GET /api/stocks/trending
router.get('/trending', async (req, res) => {
  try {
    const trendingData = await yahooFinance.trendingSymbols('US');
    const symbols = trendingData.quotes.map(q => q.symbol).slice(0, 5);
    
    // Fetch quotes for the trending symbols
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
    console.error('Error fetching trending stocks:', error);
    res.status(500).json({ error: 'Failed to fetch trending stocks' });
  }
});

// GET /api/stocks/:symbol
router.get('/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    
    // Fetch regular quote
    const quote = await yahooFinance.quote(symbol);
    
    if (!quote) {
      return res.status(404).json({ error: 'Stock not found' });
    }

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
    console.error('Error fetching stock quote:', error);
    res.status(500).json({ error: 'Failed to fetch stock quote' });
  }
});

// GET /api/stocks/:symbol/chart?range=1mo&interval=1d
router.get('/:symbol/chart', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { range = '1mo', interval = '1d' } = req.query;
    
    // Calculate period1 based on range
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
    console.error('Error fetching stock chart:', error);
    res.status(500).json({ error: 'Failed to fetch stock chart' });
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
