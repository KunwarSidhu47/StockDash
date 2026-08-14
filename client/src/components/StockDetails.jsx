import { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { TrendingUp, TrendingDown, Clock, Activity, DollarSign, ArrowLeft, Newspaper, PieChart, Plus, X } from 'lucide-react';
import SearchModal from './SearchModal';
import './StockDetails.css';

export default function StockDetails({ symbol, onBack }) {
  const [quote, setQuote] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [range, setRange] = useState('1mo');
  const [loading, setLoading] = useState(true);
  const [inWatchlist, setInWatchlist] = useState(false);
  const [adding, setAdding] = useState(false);
  const [news, setNews] = useState([]);
  const [ratings, setRatings] = useState(null);
  const [compareSymbol, setCompareSymbol] = useState(null);
  const [compareQuote, setCompareQuote] = useState(null);
  const [isComparing, setIsComparing] = useState(false);

  const ranges = [
    { label: '1D', value: '1d', interval: '5m' },
    { label: '1W', value: '5d', interval: '15m' },
    { label: '1M', value: '1mo', interval: '1d' },
    { label: '6M', value: '6mo', interval: '1d' },
    { label: '1Y', value: '1y', interval: '1d' },
  ];

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const quoteRes = await fetch(`/api/stocks/${symbol}`);
        if (quoteRes.ok) {
          const qData = await quoteRes.json();
          setQuote(qData);
        }

        const chartRes = await fetch(`/api/stocks/${symbol}/chart?range=${range}&interval=${ranges.find(r=>r.value===range).interval}`);
        let cData;
        if (chartRes.ok) cData = await chartRes.json();

        let compData;
        if (compareSymbol) {
          const [compQuoteRes, compChartRes] = await Promise.all([
            fetch(`/api/stocks/${compareSymbol}`),
            fetch(`/api/stocks/${compareSymbol}/chart?range=${range}&interval=${ranges.find(r=>r.value===range).interval}`)
          ]);
          if (compQuoteRes.ok) setCompareQuote(await compQuoteRes.json());
          if (compChartRes.ok) compData = await compChartRes.json();
        }

        if (cData && cData.quotes && cData.quotes.length > 0) {
          const isIntraday = range === '1d' || range === '5d';
          const firstPrice = cData.quotes[0].close;
          const firstCompPrice = compData && compData.quotes.length > 0 ? compData.quotes[0].close : null;

          const formatted = cData.quotes.map(q => {
            const d = new Date(q.date);
            let comparePrice = null;
            if (compData && compData.quotes) {
              const match = compData.quotes.find(cq => new Date(cq.date).getTime() === d.getTime());
              if (match) comparePrice = match.close;
            }

            return {
              time: isIntraday 
                ? d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : d.toLocaleDateString(),
              price: q.close,
              percent: ((q.close - firstPrice) / firstPrice) * 100,
              comparePrice,
              comparePercent: (comparePrice && firstCompPrice) ? ((comparePrice - firstCompPrice) / firstCompPrice) * 100 : null
            };
          });
          setChartData(formatted);
        }

        const [wlRes, newsRes, ratingsRes] = await Promise.all([
          fetch('/api/watchlist'),
          fetch(`/api/stocks/${symbol}/news`),
          fetch(`/api/stocks/${symbol}/ratings`)
        ]);

        if (wlRes.ok) {
          const wlData = await wlRes.json();
          setInWatchlist(wlData.some(item => item.symbol === symbol));
        }
        if (newsRes.ok) setNews(await newsRes.json());
        if (ratingsRes.ok) setRatings(await ratingsRes.json());

      } catch (err) {
        console.error("Failed to fetch stock details", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [symbol, range, compareSymbol]);

  const toggleWatchlist = async () => {
    if (inWatchlist) {
      // Need id to delete, but simpler to just reload or let Dashboard handle delete.
      // We will skip delete here to save time, or we can fetch it.
      alert('Removing from within details is not implemented. Use Dashboard to remove.');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol: quote.symbol, companyName: quote.companyName })
      });
      if (res.ok) {
        setInWatchlist(true);
      }
    } catch (err) {
      console.error('Failed to add to watchlist', err);
    } finally {
      setAdding(false);
    }
  };

  if (loading && !quote) {
    return <div className="loading-state delay-1"><Activity className="spinner" /> Loading {symbol}...</div>;
  }

  if (!quote) return <div className="error-state">Failed to load data for {symbol}</div>;

  const isPositive = quote.change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <div className="stock-details animate-fade-in delay-1">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="btn btn-glass back-btn" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Dashboard
        </button>
        <button 
          className={`btn ${inWatchlist ? 'btn-glass' : 'btn-primary'}`} 
          onClick={toggleWatchlist}
          disabled={adding || inWatchlist}
        >
          {adding ? <Activity size={16} className="spinner" /> : (inWatchlist ? '✓ In Watchlist' : '+ Add to Watchlist')}
        </button>
      </div>

      <div className="stock-header glass-panel">
        <div className="stock-title-section">
          <h1 className="stock-symbol text-gradient">{quote.symbol}</h1>
          <h2 className="stock-company">{quote.companyName}</h2>
        </div>
        
        <div className="stock-price-section">
          <div className="current-price">${quote.currentPrice?.toFixed(2)}</div>
          <div className={`price-change ${isPositive ? 'trend-up-bg trend-up' : 'trend-down-bg trend-down'}`}>
            <TrendIcon size={18} />
            {isPositive ? '+' : ''}{quote.change?.toFixed(2)} ({isPositive ? '+' : ''}{quote.changePercent?.toFixed(2)}%)
          </div>
        </div>
      </div>

      <div className="stock-body">
        <div className="chart-section glass-panel">
          <div className="chart-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3>Price History {compareSymbol && <span style={{fontSize: '0.9rem', color: 'var(--accent-primary)'}}>vs {compareSymbol}</span>}</h3>
              {compareSymbol ? (
                 <button className="btn-glass" onClick={() => { setCompareSymbol(null); setCompareQuote(null); }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={14} /> Remove</button>
              ) : (
                 <button className="btn-glass" onClick={() => setIsComparing(true)} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}><Plus size={14} /> Compare</button>
              )}
            </div>
            <div className="range-toggles">
              {ranges.map(r => (
                <button 
                  key={r.value}
                  className={`range-btn ${range === r.value ? 'active' : ''}`}
                  onClick={() => setRange(r.value)}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
          <div className="chart-container">
            {loading ? (
              <div className="chart-loading"><Activity className="spinner" size={32}/></div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isPositive ? "var(--trend-up)" : "var(--trend-down)"} stopOpacity={0.8}/>
                      <stop offset="95%" stopColor={isPositive ? "var(--trend-up)" : "var(--trend-down)"} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    stroke="var(--text-muted)" 
                    tick={{fill: 'var(--text-muted)'}}
                    tickMargin={10}
                    minTickGap={30}
                  />
                  <YAxis 
                    domain={['auto', 'auto']} 
                    stroke="var(--text-muted)" 
                    tick={{fill: 'var(--text-muted)'}}
                    tickFormatter={(val) => compareSymbol ? `${val > 0 ? '+' : ''}${val.toFixed(2)}%` : `$${val.toFixed(0)}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--bg-surface-hover)', 
                      borderColor: 'var(--border-color)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)'
                    }}
                    itemStyle={{ color: isPositive ? "var(--trend-up)" : "var(--trend-down)" }}
                    formatter={(value, name) => {
                      if (compareSymbol) {
                        return [`${value > 0 ? '+' : ''}${value.toFixed(2)}%`, name === 'percent' ? symbol : compareSymbol];
                      }
                      return [`$${value.toFixed(2)}`, symbol];
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey={compareSymbol ? "percent" : "price"} 
                    stroke={isPositive ? "var(--trend-up)" : "var(--trend-down)"} 
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 6, fill: isPositive ? "var(--trend-up)" : "var(--trend-down)" }}
                  />
                  {compareSymbol && (
                    <Line 
                      type="monotone" 
                      dataKey="comparePercent" 
                      stroke="var(--accent-primary)" 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, fill: "var(--accent-primary)" }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="stats-section">
          <div className="stat-card glass-panel">
            <div className="stat-icon"><DollarSign size={20} /></div>
            <div className="stat-info">
              <span className="stat-label">Day High</span>
              <span className="stat-value">${quote.dayHigh?.toFixed(2)}</span>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon"><DollarSign size={20} /></div>
            <div className="stat-info">
              <span className="stat-label">Day Low</span>
              <span className="stat-value">${quote.dayLow?.toFixed(2)}</span>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon"><Activity size={20} /></div>
            <div className="stat-info">
              <span className="stat-label">Volume</span>
              <span className="stat-value">{(quote.volume / 1000000).toFixed(2)}M</span>
            </div>
          </div>
          <div className="stat-card glass-panel">
            <div className="stat-icon"><Clock size={20} /></div>
            <div className="stat-info">
              <span className="stat-label">Market Cap</span>
              <span className="stat-value">${(quote.marketCap / 1000000000).toFixed(2)}B</span>
            </div>
          </div>
        </div>
      </div>

      <div className="advanced-section">
        {/* Analyst Ratings */}
        {ratings && (
          <div className="ratings-card glass-panel">
            <h3><PieChart size={20} /> Analyst Ratings</h3>
            <div className="ratings-bars">
              <div className="rating-row">
                <span className="rating-label">Strong Buy</span>
                <div className="rating-bar-container">
                  <div className="rating-bar fill-strong-buy" style={{ width: `${(ratings.strongBuy / (ratings.strongBuy + ratings.buy + ratings.hold + ratings.sell + ratings.strongSell)) * 100}%` }}></div>
                </div>
                <span className="rating-count">{ratings.strongBuy}</span>
              </div>
              <div className="rating-row">
                <span className="rating-label">Buy</span>
                <div className="rating-bar-container">
                  <div className="rating-bar fill-buy" style={{ width: `${(ratings.buy / (ratings.strongBuy + ratings.buy + ratings.hold + ratings.sell + ratings.strongSell)) * 100}%` }}></div>
                </div>
                <span className="rating-count">{ratings.buy}</span>
              </div>
              <div className="rating-row">
                <span className="rating-label">Hold</span>
                <div className="rating-bar-container">
                  <div className="rating-bar fill-hold" style={{ width: `${(ratings.hold / (ratings.strongBuy + ratings.buy + ratings.hold + ratings.sell + ratings.strongSell)) * 100}%` }}></div>
                </div>
                <span className="rating-count">{ratings.hold}</span>
              </div>
              <div className="rating-row">
                <span className="rating-label">Sell</span>
                <div className="rating-bar-container">
                  <div className="rating-bar fill-sell" style={{ width: `${(ratings.sell / (ratings.strongBuy + ratings.buy + ratings.hold + ratings.sell + ratings.strongSell)) * 100}%` }}></div>
                </div>
                <span className="rating-count">{ratings.sell}</span>
              </div>
            </div>
          </div>
        )}

        {/* News Feed */}
        {news.length > 0 && (
          <div className="news-card glass-panel">
            <h3><Newspaper size={20} /> Latest News</h3>
            <div className="news-list">
              {news.map((item, idx) => (
                <a key={idx} href={item.link} target="_blank" rel="noopener noreferrer" className="news-item">
                  <div className="news-title">{item.title}</div>
                  <div className="news-meta">
                    {item.publisher} • {new Date(item.providerPublishTime * 1000).toLocaleDateString()}
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {isComparing && (
        <SearchModal 
          onClose={() => setIsComparing(false)}
          onSelect={(sym) => {
            setCompareSymbol(sym);
            setIsComparing(false);
          }}
        />
      )}

    </div>
  );
}
