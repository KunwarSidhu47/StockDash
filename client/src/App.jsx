import { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import SearchModal from './components/SearchModal';
import Dashboard from './components/Dashboard';
import StockDetails from './components/StockDetails';
import Login from './components/Login';
import { LineChart, BarChart2, Search, LogOut } from 'lucide-react';
import './App.css';

function App() {
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const user = localStorage.getItem('auth_user');
    if (token) {
      setIsAuthenticated(true);
      setUsername(user || 'admin123');
    }
  }, []);

  const handleLogin = (user) => {
    setIsAuthenticated(true);
    setUsername(user);
    setShowWelcome(true);
    
    // Hide welcome message after 5 seconds
    setTimeout(() => {
      setShowWelcome(false);
    }, 5000);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');
    setIsAuthenticated(false);
    setSelectedSymbol(null);
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-layout">
      {/* Welcome Toast */}
      {showWelcome && (
        <div className="welcome-toast animate-fade-in">
          Welcome back, {username}! 👋
        </div>
      )}

      {/* Navbar */}
      <header className="navbar glass-panel">
        <div className="nav-logo" onClick={() => setSelectedSymbol(null)} style={{cursor: 'pointer'}}>
          <div className="logo-icon">
            <BarChart2 size={24} color="var(--accent-primary)" />
          </div>
          <span className="logo-text">Stock<span className="text-gradient">Dash</span></span>
        </div>
        
        <div className="nav-search">
          <SearchBar onSelect={(symbol) => setSelectedSymbol(symbol)} />
        </div>

        <div className="nav-actions">
          <button className="btn-glass" onClick={handleLogout} style={{ padding: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <LogOut size={18} />
            <span className="hide-mobile">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="main-content">
        {selectedSymbol ? (
          <StockDetails 
            symbol={selectedSymbol} 
            onBack={() => setSelectedSymbol(null)} 
          />
        ) : (
          <Dashboard 
            onSelectStock={(symbol) => setSelectedSymbol(symbol)} 
            onOpenSearch={() => setIsSearchOpen(true)}
          />
        )}
      </main>

      {isSearchOpen && (
        <SearchModal 
          onClose={() => setIsSearchOpen(false)}
          onSelect={(symbol) => {
            setSelectedSymbol(symbol);
            setIsSearchOpen(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
