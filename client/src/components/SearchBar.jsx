import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import './SearchBar.css';

export default function SearchBar({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/stocks/search?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setResults(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSelect = (symbol) => {
    setQuery('');
    setIsOpen(false);
    onSelect(symbol);
  };

  return (
    <div className="search-wrapper" ref={wrapperRef}>
      <div className="search-input-container">
        <Search className="search-icon" size={20} />
        <input
          id="stock-search-input"
          type="text"
          className="input-glass search-input"
          placeholder="Search for a stock (e.g. AAPL, Tesla)..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => { if (results.length > 0) setIsOpen(true) }}
        />
        {loading && <Loader2 className="search-spinner" size={18} />}
      </div>

      {isOpen && results.length > 0 && (
        <div className="search-dropdown glass-panel animate-fade-in">
          {results.map((r, i) => (
            <div
              key={i}
              className="search-result-item"
              onClick={() => handleSelect(r.symbol)}
            >
              <div className="result-symbol">{r.symbol}</div>
              <div className="result-name">{r.companyName}</div>
              <div className="result-exchange">{r.exchange}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
