import { useState, useEffect } from 'react';
import { Activity, Plus, Trash2, TrendingUp, TrendingDown, Search } from 'lucide-react';
import './Dashboard.css';

export default function Dashboard({ onSelectStock, onOpenSearch }) {
  const [watchlist, setWatchlist] = useState([]);
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [wlRes, trRes] = await Promise.all([
        fetch('/api/watchlist'),
        fetch('/api/stocks/trending')
      ]);
      
      if (wlRes.ok) setWatchlist(await wlRes.json());
      if (trRes.ok) setTrending(await trRes.json());
    } catch (err) {
      console.error('Failed to fetch dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const removeFromWatchlist = async (e, id) => {
    e.stopPropagation();
    try {
      await fetch(`/api/watchlist/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err) {
      console.error('Failed to delete from watchlist', err);
    }
  };

  if (loading) {
    return <div className="loading-state"><Activity className="spinner" /> Loading Dashboard...</div>;
  }

  return (
    <div className="dashboard-container animate-fade-in delay-1">
      
      {/* Trending Section */}
      {trending.length > 0 && (
        <>
          <div className="dashboard-header">
            <h2>Trending Stocks</h2>
            <p className="subtitle">Most popular tickers right now</p>
          </div>
          <div className="trending-row">
            {trending.map((item, i) => {
              const isPositive = item.change >= 0;
              const TrendIcon = isPositive ? TrendingUp : TrendingDown;
              return (
                <div 
                  key={item.symbol} 
                  className={`trending-card glass-panel animate-fade-in delay-${(i % 3) + 1}`}
                  onClick={() => onSelectStock(item.symbol)}
                >
                  <div className="trend-header">
                    <span className="trend-symbol">{item.symbol}</span>
                    <span className={`trend-badge ${isPositive ? 'trend-up' : 'trend-down'}`}>
                      <TrendIcon size={14} /> {isPositive ? '+' : ''}{item.changePercent?.toFixed(2)}%
                    </span>
                  </div>
                  <div className="trend-price">${item.currentPrice?.toFixed(2)}</div>
                  {item.analystRating && (
                    <div className="trend-rating" style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontWeight: '500' }}>
                      Rating: <span style={{ color: item.analystRating.toLowerCase().includes('buy') ? 'var(--trend-up)' : item.analystRating.toLowerCase().includes('sell') ? 'var(--trend-down)' : 'var(--text-primary)' }}>
                        {item.analystRating.includes('-') ? item.analystRating.split('-')[1].trim() : item.analystRating}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Watchlist Section */}
      <div className="dashboard-header" style={{ marginTop: '2rem' }}>
        <h2>Your Watchlist</h2>
        <p className="subtitle">Keep track of your favorite stocks</p>
      </div>

      {watchlist.length === 0 ? (
        <div className="empty-state glass-panel">
          <div 
            className="empty-icon" 
            style={{ cursor: 'pointer' }} 
            onClick={onOpenSearch}
            title="Search to add stocks"
          >
            <Plus size={48} />
          </div>
          <h3>Watchlist is Empty</h3>
          <p>Click the plus icon to search and add stocks to your watchlist.</p>
        </div>
      ) : (
        <div className="watchlist-grid">
          {watchlist.map((item, i) => (
            <div 
              key={item._id} 
              className={`watchlist-card glass-panel animate-fade-in delay-${(i % 3) + 1}`}
              onClick={() => onSelectStock(item.symbol)}
            >
              <div className="card-header">
                <div className="card-symbol text-gradient">{item.symbol}</div>
                <button 
                  className="btn-delete"
                  onClick={(e) => removeFromWatchlist(e, item._id)}
                  title="Remove from watchlist"
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="card-company">{item.companyName}</div>
              <div className="card-footer">
                <span className="view-link">View Details &rarr;</span>
              </div>
            </div>
          ))}
          <div 
            className="watchlist-card glass-panel animate-fade-in" 
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', minHeight: '130px', gap: '0.5rem', border: '1px dashed rgba(255, 255, 255, 0.2)' }}
            onClick={onOpenSearch}
            title="Search to add stocks"
          >
            <div className="empty-icon" style={{ width: '48px', height: '48px', cursor: 'pointer' }}>
              <Plus size={24} />
            </div>
            <div style={{ color: 'var(--text-secondary)', fontWeight: '500' }}>Add Stock</div>
          </div>
        </div>
      )}
    </div>
  );
}
