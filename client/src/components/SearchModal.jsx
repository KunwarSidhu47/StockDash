import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import './SearchModal.css';

export default function SearchModal({ onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  // Auto-focus the input when modal opens
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div className="search-modal-overlay animate-fade-in" onClick={onClose}>
      <div className="search-modal-content glass-panel" onClick={e => e.stopPropagation()}>
        <div className="search-modal-header">
          <Search className="search-modal-icon" size={24} />
          <input
            ref={inputRef}
            type="text"
            className="search-modal-input"
            placeholder="Search for a stock (e.g. AAPL, Tesla)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {loading ? (
            <Loader2 className="search-modal-spinner" size={20} />
          ) : (
            <button className="search-modal-close" onClick={onClose}>
              <X size={24} />
            </button>
          )}
        </div>

        {results.length > 0 && (
          <div className="search-modal-results">
            {results.map((r, i) => (
              <div
                key={i}
                className="search-result-item"
                onClick={() => onSelect(r.symbol)}
              >
                <div className="result-symbol">{r.symbol}</div>
                <div className="result-name">{r.companyName}</div>
                <div className="result-exchange">{r.exchange}</div>
              </div>
            ))}
          </div>
        )}
        
        {query && results.length === 0 && !loading && (
          <div className="search-modal-empty">
            No results found for "{query}"
          </div>
        )}
      </div>
    </div>
  );
}
