import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import GameCard from '../components/GameCard';
import ViewModeToggle from '../components/ViewModeToggle';
import { gamesApi } from '../services/api';
import './HomePage.css';

function HomePage({ games, currency, onEdit, onDelete, onRefreshMarket, onGamesUpdate }) {
  const navigate = useNavigate();
  const [filteredGames, setFilteredGames] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [postedFilter, setPostedFilter] = useState('');
  const [acquisitionSourceFilter, setAcquisitionSourceFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [selectedGameIds, setSelectedGameIds] = useState([]);
  const [showBatchActions, setShowBatchActions] = useState(false);
  const [viewMode, setViewMode] = useState(() => {
    return localStorage.getItem('flipstash_view_mode') || 'grid';
  });

  useEffect(() => {
    applyFiltersAndSort();
  }, [games, searchQuery, platformFilter, statusFilter, postedFilter, acquisitionSourceFilter, sortBy]);

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

    // Acquisition source filter
    if (acquisitionSourceFilter) {
      filtered = filtered.filter(game => game.acquisition_source === acquisitionSourceFilter);
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

  const handleGameSelection = (gameId, isSelected) => {
    if (isSelected) {
      setSelectedGameIds(prev => [...prev, gameId]);
    } else {
      setSelectedGameIds(prev => prev.filter(id => id !== gameId));
    }
  };

  const handleSelectAll = () => {
    if (selectedGameIds.length === filteredGames.length) {
      setSelectedGameIds([]);
    } else {
      setSelectedGameIds(filteredGames.map(g => g.id));
    }
  };

  const handleBatchPostedOnline = async (posted) => {
    if (selectedGameIds.length === 0) return;

    try {
      await gamesApi.batchUpdatePostedOnline(selectedGameIds, posted);
      setSelectedGameIds([]);
      onGamesUpdate();
    } catch (err) {
      alert('Failed to update posted online status');
      console.error(err);
    }
  };

  const handleBatchCondition = async () => {
    if (selectedGameIds.length === 0) return;

    const condition = prompt('Enter condition (Sealed, CIB (Complete in Box), Loose, Box Only, Manual Only):');
    if (!condition) return;

    try {
      await gamesApi.batchUpdateCondition(selectedGameIds, condition);
      setSelectedGameIds([]);
      onGamesUpdate();
    } catch (err) {
      alert('Failed to update condition');
      console.error(err);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedGameIds.length === 0) return;

    if (!window.confirm(`Are you sure you want to delete ${selectedGameIds.length} game(s)?`)) return;

    try {
      await gamesApi.batchDelete(selectedGameIds);
      setSelectedGameIds([]);
      onGamesUpdate();
    } catch (err) {
      alert('Failed to delete games');
      console.error(err);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('flipstash_view_mode', mode);
  };

  // Get unique platforms and acquisition sources for filter dropdowns
  const platforms = [...new Set(games.map(g => g.platform))].sort();
  const acquisitionSources = [...new Set(games.map(g => g.acquisition_source).filter(s => s))].sort();

  return (
    <div className="home-page">
      <div className="controls">
        <ViewModeToggle
          currentMode={viewMode}
          onModeChange={handleViewModeChange}
        />

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
            value={acquisitionSourceFilter}
            onChange={(e) => setAcquisitionSourceFilter(e.target.value)}
          >
            <option value="">All Sources</option>
            {acquisitionSources.map(source => (
              <option key={source} value={source}>{source}</option>
            ))}
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

      {/* Batch Actions Bar */}
      {selectedGameIds.length > 0 && (
        <div style={{
          padding: '1rem',
          marginBottom: '1rem',
          backgroundColor: 'var(--card-bg)',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          flexWrap: 'wrap'
        }}>
          <span style={{ fontWeight: '500' }}>
            {selectedGameIds.length} game(s) selected
          </span>
          <button
            onClick={handleSelectAll}
            className="btn btn-secondary btn-small"
          >
            {selectedGameIds.length === filteredGames.length ? 'Deselect All' : 'Select All'}
          </button>
          <button
            onClick={() => handleBatchPostedOnline(true)}
            className="btn btn-secondary btn-small"
          >
            Mark as Posted
          </button>
          <button
            onClick={() => handleBatchPostedOnline(false)}
            className="btn btn-secondary btn-small"
          >
            Mark as Not Posted
          </button>
          <button
            onClick={handleBatchCondition}
            className="btn btn-secondary btn-small"
          >
            Update Condition
          </button>
          <button
            onClick={handleBatchDelete}
            className="btn btn-danger btn-small"
          >
            Delete Selected
          </button>
        </div>
      )}

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
        <div className={`games-container games-${viewMode}`}>
          {filteredGames.map(game => (
            <GameCard
              key={game.id}
              game={game}
              currency={currency}
              onEdit={handleEditGame}
              onDelete={onDelete}
              onRefreshMarket={onRefreshMarket}
              isSelected={selectedGameIds.includes(game.id)}
              onSelect={(isSelected) => handleGameSelection(game.id, isSelected)}
              viewMode={viewMode}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;
