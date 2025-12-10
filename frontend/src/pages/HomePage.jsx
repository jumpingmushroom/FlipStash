import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCard from '../components/GameCard';
import { gamesApi } from '../services/api';
import './HomePage.css';

function HomePage({ games, currency, onEdit, onDelete, onRefreshMarket, onGamesUpdate }) {
  const navigate = useNavigate();
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [postedFilter, setPostedFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');

  useEffect(() => {
    applyFiltersAndSort();
  }, [games, searchQuery, platformFilter, statusFilter, postedFilter, sortBy]);

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

    // Posted filter
    if (postedFilter === 'posted') {
      filtered = filtered.filter(game => game.posted_online === 1);
    } else if (postedFilter === 'not-posted') {
      filtered = filtered.filter(game => game.posted_online === 0 || game.posted_online === null);
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

  const handleAddGame = () => {
    navigate('/add-game');
  };

  const handleEditGame = (game) => {
    navigate(`/edit-game/${game.id}`, { state: { game } });
  };

  // Get unique platforms for filter dropdown
  const platforms = [...new Set(games.map(g => g.platform))].sort();

  return (
    <div className="home-page">
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
            value={postedFilter}
            onChange={(e) => setPostedFilter(e.target.value)}
          >
            <option value="">All (Posted Status)</option>
            <option value="posted">Posted Online</option>
            <option value="not-posted">Not Posted</option>
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

      {filteredGames.length === 0 ? (
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
              onDelete={onDelete}
              onRefreshMarket={onRefreshMarket}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
