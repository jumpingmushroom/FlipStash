import React, { useState, useEffect } from 'react';
import GameCard from './components/GameCard';
import GameForm from './components/GameForm';
import Settings from './components/Settings';
import { gamesApi } from './services/api';
import { loadCurrencyPreference, saveCurrencyPreference, convertFromUSD, formatCurrency } from './services/currency';
import './App.css';

function App() {
  const [games, setGames] = useState([]);
  const [filteredGames, setFilteredGames] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingGame, setEditingGame] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [currency, setCurrency] = useState(loadCurrencyPreference());

  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // all, sold, available
  const [sortBy, setSortBy] = useState('created_at'); // created_at, name, purchase_value, market_value

  // Stats
  const [stats, setStats] = useState({
    totalGames: 0,
    totalValue: 0,
    totalProfit: 0,
    soldGames: 0
  });

  // Load games on mount
  useEffect(() => {
    loadGames();
  }, []);

  // Apply filters and sorting whenever games or filters change
  useEffect(() => {
    applyFiltersAndSort();
    calculateStats();
  }, [games, searchQuery, platformFilter, statusFilter, sortBy]);

  const loadGames = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await gamesApi.getAll();
      setGames(response.data);
    } catch (err) {
      setError('Failed to load games. Please check your backend connection.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...games];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(game =>
        game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        game.platform.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Platform filter
    if (platformFilter) {
      filtered = filtered.filter(game => game.platform === platformFilter);
    }

    // Status filter
    if (statusFilter === 'sold') {
      filtered = filtered.filter(game => game.sold_value !== null);
    } else if (statusFilter === 'available') {
      filtered = filtered.filter(game => game.sold_value === null);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'purchase_value':
          return (b.purchase_value || 0) - (a.purchase_value || 0);
        case 'market_value':
          return (b.market_value || 0) - (a.market_value || 0);
        case 'created_at':
        default:
          return new Date(b.created_at) - new Date(a.created_at);
      }
    });

    setFilteredGames(filtered);
  };

  const calculateStats = () => {
    const totalGames = games.length;
    const soldGames = games.filter(g => g.sold_value !== null).length;

    const totalValue = games
      .filter(g => g.sold_value === null && g.market_value !== null)
      .reduce((sum, g) => sum + (g.market_value || 0), 0);

    const totalProfit = games
      .filter(g => g.sold_value !== null && g.purchase_value !== null)
      .reduce((sum, g) => sum + ((g.sold_value || 0) - (g.purchase_value || 0)), 0);

    setStats({ totalGames, totalValue, totalProfit, soldGames });
  };

  const handleAddGame = () => {
    setEditingGame(null);
    setShowForm(true);
  };

  const handleEditGame = (game) => {
    setEditingGame(game);
    setShowForm(true);
  };

  const handleDeleteGame = async (id) => {
    if (!window.confirm('Are you sure you want to delete this game?')) return;

    try {
      await gamesApi.delete(id);
      loadGames();
    } catch (err) {
      alert('Failed to delete game');
      console.error(err);
    }
  };

  const handleRefreshMarket = async (game) => {
    try {
      const response = await gamesApi.refreshMarketValue(game.id);
      alert(response.data.message || 'Market value refreshed successfully');
      loadGames();
    } catch (err) {
      alert('Failed to refresh market value');
      console.error(err);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingGame(null);
  };

  const handleFormSave = () => {
    setShowForm(false);
    setEditingGame(null);
    loadGames();
  };

  const handleCurrencyChange = (newCurrency) => {
    setCurrency(newCurrency);
    saveCurrencyPreference(newCurrency);
  };

  // Get unique platforms for filter dropdown
  const platforms = [...new Set(games.map(g => g.platform))].sort();

  return (
    <div className="app">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <h1>🎮 FlipStash</h1>
          <button
            onClick={() => setShowSettings(true)}
            className="btn btn-secondary btn-small"
            style={{ padding: '0.5rem 1rem' }}
          >
            ⚙️ Settings
          </button>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <div className="stat-value">{stats.totalGames}</div>
            <div className="stat-label">Total Games</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{formatCurrency(convertFromUSD(stats.totalValue, currency), currency)}</div>
            <div className="stat-label">Collection Value</div>
          </div>
          <div className="stat-item">
            <div className="stat-value" style={{ color: stats.totalProfit >= 0 ? 'var(--success-color)' : 'var(--danger-color)' }}>
              {stats.totalProfit >= 0 ? '+' : ''}{formatCurrency(convertFromUSD(Math.abs(stats.totalProfit), currency), currency)}
            </div>
            <div className="stat-label">Total Profit</div>
          </div>
          <div className="stat-item">
            <div className="stat-value">{stats.soldGames}</div>
            <div className="stat-label">Games Sold</div>
          </div>
        </div>
      </header>

      <main className="main-content">
        <div className="controls">
          <div className="filters">
            <input
              type="text"
              className="input"
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            <select
              className="select"
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
            >
              <option value="">All Platforms</option>
              {platforms.map(platform => (
                <option key={platform} value={platform}>{platform}</option>
              ))}
            </select>

            <select
              className="select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Games</option>
              <option value="available">Available</option>
              <option value="sold">Sold</option>
            </select>

            <select
              className="select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="created_at">Sort: Newest</option>
              <option value="name">Sort: Name</option>
              <option value="purchase_value">Sort: Purchase Value</option>
              <option value="market_value">Sort: Market Value</option>
            </select>
          </div>

          <button onClick={handleAddGame} className="btn btn-primary">
            + Add Game
          </button>
        </div>

        {error && <div className="error">{error}</div>}

        {isLoading ? (
          <div className="loading">Loading games...</div>
        ) : filteredGames.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🎮</div>
            <div className="empty-state-title">
              {games.length === 0 ? 'No games yet' : 'No games found'}
            </div>
            <p>
              {games.length === 0
                ? 'Start building your collection by adding your first game!'
                : 'Try adjusting your filters'}
            </p>
          </div>
        ) : (
          <div className="games-grid">
            {filteredGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                currency={currency}
                onEdit={handleEditGame}
                onDelete={handleDeleteGame}
                onRefreshMarket={handleRefreshMarket}
              />
            ))}
          </div>
        )}
      </main>

      {showForm && (
        <GameForm
          game={editingGame}
          currency={currency}
          onClose={handleFormClose}
          onSave={handleFormSave}
        />
      )}

      {showSettings && (
        <Settings
          currentCurrency={currency}
          onCurrencyChange={handleCurrencyChange}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

export default App;
