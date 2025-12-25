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
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(null);

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

  const handleBatchRefreshMarketValues = async () => {
    if (selectedGameIds.length === 0) return;

    // Filter out sold games
    const unsoldSelectedGames = games.filter(g =>
      selectedGameIds.includes(g.id) && g.sold_value === null
    );

    if (unsoldSelectedGames.length === 0) {
      alert('All selected games are sold. Market value refresh is only available for unsold games.');
      return;
    }

    if (!window.confirm(`Refresh market values for ${unsoldSelectedGames.length} game(s)? This may take several minutes.`)) return;

    setIsRefreshing(true);
    setRefreshProgress({
      total: unsoldSelectedGames.length,
      completed: 0,
      succeeded: 0,
      failed: 0,
      skipped: 0,
      current: null,
      results: []
    });

    try {
      await gamesApi.batchRefreshMarketValuesSSE(
        unsoldSelectedGames.map(g => g.id),
        (data) => {
          // Handle different event types
          if (data.type === 'start') {
            setRefreshProgress({
              total: data.total,
              completed: 0,
              succeeded: 0,
              failed: 0,
              skipped: 0,
              current: null,
              results: []
            });
          } else if (data.type === 'progress') {
            setRefreshProgress(prev => ({
              ...prev,
              completed: data.completed,
              succeeded: data.stats.succeeded,
              failed: data.stats.failed,
              skipped: data.stats.skipped,
              current: data.current,
              results: data.result ? [...(prev.results || []), data.result] : prev.results
            }));
          } else if (data.type === 'complete') {
            setRefreshProgress(prev => ({
              ...prev,
              completed: data.results.total,
              succeeded: data.results.succeeded,
              failed: data.results.failed,
              skipped: data.results.skipped,
              current: null,
              isComplete: true,
              details: data.results.details
            }));

            // Refresh the games list
            setTimeout(() => {
              onGamesUpdate();
              setIsRefreshing(false);
              setSelectedGameIds([]);

              // Close progress modal after a short delay
              setTimeout(() => {
                setRefreshProgress(null);
              }, 3000);
            }, 1000);
          } else if (data.type === 'error') {
            alert('Failed to refresh market values: ' + data.message);
            setIsRefreshing(false);
            setRefreshProgress(null);
          }
        }
      );
    } catch (err) {
      alert('Failed to refresh market values');
      console.error(err);
      setIsRefreshing(false);
      setRefreshProgress(null);
    }
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('flipstash_view_mode', mode);
  };

  // Count active advanced filters
  const getActiveFiltersCount = () => {
    let count = 0;
    if (postedFilter) count++;
    if (acquisitionSourceFilter) count++;
    return count;
  };

  // Get unique platforms and acquisition sources for filter dropdowns
  const platforms = [...new Set(games.map(g => g.platform))].sort();
  const acquisitionSources = [...new Set(games.map(g => g.acquisition_source).filter(s => s))].sort();

  return (
    <div className="home-page">
      <div className="controls">
        <div className="main-controls-row">
          <ViewModeToggle
            currentMode={viewMode}
            onModeChange={handleViewModeChange}
          />

          <input
            type="text"
            className="input search-input"
            placeholder="🔍 Search games..."
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

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="btn btn-secondary advanced-filters-toggle"
          >
            🔍 Filters {getActiveFiltersCount() > 0 && `(${getActiveFiltersCount()})`}
          </button>

          <button onClick={handleAddGame} className="btn btn-primary">
            + Add Game
          </button>
        </div>

        {showAdvancedFilters && (
          <div className="advanced-filters">
            <select
              className="select"
              value={postedFilter}
              onChange={(e) => setPostedFilter(e.target.value)}
            >
              <option value="">Posted Status: All</option>
              <option value="posted">Posted Online</option>
              <option value="not-posted">Not Posted</option>
            </select>

            <select
              className="select"
              value={acquisitionSourceFilter}
              onChange={(e) => setAcquisitionSourceFilter(e.target.value)}
            >
              <option value="">Source: All</option>
              {acquisitionSources.map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>

            <button
              onClick={() => {
                setPostedFilter('');
                setAcquisitionSourceFilter('');
              }}
              className="btn btn-secondary btn-small"
            >
              Clear Filters
            </button>
          </div>
        )}
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
            onClick={handleBatchRefreshMarketValues}
            className="btn btn-primary btn-small"
            disabled={isRefreshing}
          >
            {isRefreshing ? 'Refreshing...' : '🔄 Refresh Market Values'}
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
          {viewMode === 'list' && (
            <div className="game-list-header">
              <div className="game-list-header-checkbox"></div>
              <div className="game-list-header-cover"></div>
              <div className="game-list-header-info">Game</div>
              <div className="game-list-header-condition">Condition</div>
              <div className="game-list-header-value">Purchase</div>
              <div className="game-list-header-value">Market</div>
              <div className="game-list-header-badges">Badges</div>
              <div className="game-list-header-actions">Actions</div>
            </div>
          )}
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

      {/* Batch Refresh Progress Modal */}
      {refreshProgress && (
        <div className="modal-overlay">
          <div className="modal-content refresh-progress-modal">
            <h2>Refreshing Market Values</h2>

            {/* Progress Bar */}
            <div className="progress-info">
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{
                    width: `${(refreshProgress.completed / refreshProgress.total) * 100}%`
                  }}
                ></div>
              </div>
              <p className="progress-text">
                {refreshProgress.completed} of {refreshProgress.total} games processed
              </p>
            </div>

            {/* Statistics */}
            <div className="progress-stats">
              <div className="stat-item success">
                <span className="stat-icon">✓</span>
                <span className="stat-label">Succeeded:</span>
                <span className="stat-value">{refreshProgress.succeeded}</span>
              </div>
              <div className="stat-item failed">
                <span className="stat-icon">✗</span>
                <span className="stat-label">Failed:</span>
                <span className="stat-value">{refreshProgress.failed}</span>
              </div>
              {refreshProgress.skipped > 0 && (
                <div className="stat-item skipped">
                  <span className="stat-icon">⊝</span>
                  <span className="stat-label">Skipped:</span>
                  <span className="stat-value">{refreshProgress.skipped}</span>
                </div>
              )}
            </div>

            {/* Current Game Being Processed */}
            {refreshProgress.current && (
              <div className="current-game-card">
                <div className="current-game-header">
                  <div className="spinner"></div>
                  <h3>Processing...</h3>
                </div>
                <div className="current-game-content">
                  {refreshProgress.current.coverUrl && (
                    <img
                      src={refreshProgress.current.coverUrl}
                      alt={refreshProgress.current.name}
                      className="current-game-cover"
                    />
                  )}
                  <div className="current-game-details">
                    <h4>{refreshProgress.current.name}</h4>
                    <div className="current-game-meta">
                      <span className="meta-item">
                        <strong>Platform:</strong> {refreshProgress.current.platform}
                      </span>
                      {refreshProgress.current.condition && (
                        <span className="meta-item">
                          <strong>Condition:</strong> {refreshProgress.current.condition}
                        </span>
                      )}
                      {refreshProgress.current.region && (
                        <span className="meta-item">
                          <strong>Region:</strong> {refreshProgress.current.region}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Completed Games List (show last 5) */}
            {refreshProgress.results && refreshProgress.results.length > 0 && (
              <div className="results-list">
                <h3>Recent Results</h3>
                <div className="results-scroll">
                  {refreshProgress.results.slice(-5).reverse().map((result, idx) => (
                    <div key={idx} className={`result-item ${result.status}`}>
                      <span className="result-icon">
                        {result.status === 'success' && '✓'}
                        {result.status === 'failed' && '✗'}
                        {result.status === 'skipped' && '⊝'}
                      </span>
                      <div className="result-details">
                        <div className="result-name">{result.name}</div>
                        {result.status === 'success' && result.newValue !== undefined && (
                          <div className="result-value">
                            {result.oldValue !== null ? (
                              <>
                                {result.oldValue} {result.currency} → {result.newValue} {result.currency}
                                <span className={result.newValue > result.oldValue ? 'change-up' : 'change-down'}>
                                  {' '}({result.newValue > result.oldValue ? '+' : ''}
                                  {((result.newValue - result.oldValue) / (result.oldValue || 1) * 100).toFixed(1)}%)
                                </span>
                              </>
                            ) : (
                              <>New: {result.newValue} {result.currency}</>
                            )}
                          </div>
                        )}
                        {result.status === 'failed' && (
                          <div className="result-message error">{result.message}</div>
                        )}
                        {result.status === 'skipped' && (
                          <div className="result-message">{result.message}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completion Summary */}
            {refreshProgress.isComplete && (
              <div className="completion-message">
                <h3>✓ Refresh Complete!</h3>
                <p>All market values have been processed.</p>
              </div>
            )}

            {/* Close Button */}
            {!isRefreshing && (
              <button
                onClick={() => setRefreshProgress(null)}
                className="btn btn-primary"
                style={{ marginTop: '1rem' }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default HomePage;
