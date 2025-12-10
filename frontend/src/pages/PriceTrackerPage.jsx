import { useState, useEffect } from 'react';
import api from '../services/api';
import PriceChart from '../components/PriceChart';
import './PriceTrackerPage.css';

export default function PriceTrackerPage() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedGame, setSelectedGame] = useState(null);
  const [sortBy, setSortBy] = useState('last_refresh');

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await api.get('/games/refresh-dashboard');
      setDashboard(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Failed to load refresh dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getSortedGames = () => {
    if (!dashboard?.games) return [];

    const games = [...dashboard.games];

    switch (sortBy) {
      case 'last_refresh':
        return games.sort((a, b) => {
          if (!a.last_refresh_at && !b.last_refresh_at) return 0;
          if (!a.last_refresh_at) return 1;
          if (!b.last_refresh_at) return -1;
          return new Date(b.last_refresh_at) - new Date(a.last_refresh_at);
        });
      case 'name':
        return games.sort((a, b) => a.name.localeCompare(b.name));
      case 'price_change':
        return games.sort((a, b) => {
          const changeA = a.price_change_percentage || 0;
          const changeB = b.price_change_percentage || 0;
          return changeB - changeA;
        });
      default:
        return games;
    }
  };

  const getRefreshStatus = (game) => {
    if (!game.last_refresh_at) {
      return { text: 'Never refreshed', class: 'status-warning' };
    }

    const lastRefresh = new Date(game.last_refresh_at);
    const now = new Date();
    const hoursSince = (now - lastRefresh) / (1000 * 60 * 60);

    if (hoursSince < 24) {
      return { text: 'Up to date', class: 'status-success' };
    } else if (hoursSince < 72) {
      return { text: 'Recent', class: 'status-info' };
    } else {
      return { text: 'Needs update', class: 'status-warning' };
    }
  };

  if (loading) {
    return (
      <div className="price-tracker-page">
        <div className="loading">Loading refresh dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="price-tracker-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  const sortedGames = getSortedGames();

  return (
    <div className="price-tracker-page">
      <div className="page-header">
        <h1>📈 Market Value Tracker</h1>
        <p className="page-subtitle">
          Overview of automated market value tracking for {dashboard?.total_games || 0} unsold games
        </p>
      </div>

      <div className="dashboard-controls">
        <div className="sort-controls">
          <label>Sort by:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="select">
            <option value="last_refresh">Last Refresh</option>
            <option value="name">Name</option>
            <option value="price_change">Price Change</option>
          </select>
        </div>
        <button onClick={fetchDashboard} className="btn btn-secondary">
          Refresh Data
        </button>
      </div>

      <div className="dashboard-list">
        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Game</th>
              <th>Last Updated</th>
              <th>Current Value</th>
              <th>Price Change</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedGames.map((game) => {
              const status = getRefreshStatus(game);
              const hasPriceData = game.price_change_percentage !== null;

              return (
                <tr key={game.id} className="dashboard-row">
                  <td className="game-info-cell">
                    <div className="game-info-container">
                      {game.igdb_cover_url ? (
                        <img src={game.igdb_cover_url} alt={game.name} className="game-thumbnail" />
                      ) : (
                        <div className="game-thumbnail-placeholder">🎮</div>
                      )}
                      <div className="game-text-info">
                        <div className="game-name">{game.name}</div>
                        <div className="game-platform">{game.platform}</div>
                      </div>
                    </div>
                  </td>
                  <td className="last-updated-cell">
                    {game.last_refresh_at ? (
                      <div className="last-updated-container">
                        <div className="last-updated-date">
                          {new Date(game.last_refresh_at).toLocaleDateString()}
                        </div>
                        <div className="last-updated-time">
                          {new Date(game.last_refresh_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <span className={`refresh-status-badge ${status.class}`}>
                          {status.text}
                        </span>
                      </div>
                    ) : (
                      <span className={`refresh-status-badge ${status.class}`}>
                        {status.text}
                      </span>
                    )}
                  </td>
                  <td className="value-cell">
                    <div className="current-value">
                      ${game.market_value?.toFixed(2) || 'N/A'}
                    </div>
                  </td>
                  <td className="price-change-cell">
                    {hasPriceData ? (
                      <div className={`price-change ${game.price_change >= 0 ? 'positive' : 'negative'}`}>
                        <div className="price-change-amount">
                          {game.price_change >= 0 ? '+' : ''}${game.price_change.toFixed(2)}
                        </div>
                        <div className="price-change-percentage">
                          ({game.price_change_percentage >= 0 ? '+' : ''}{game.price_change_percentage.toFixed(2)}%)
                        </div>
                      </div>
                    ) : (
                      <span className="no-data">—</span>
                    )}
                  </td>
                  <td className="actions-cell">
                    <button
                      onClick={() => setSelectedGame(game)}
                      className="btn-link"
                    >
                      View History
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {sortedGames.length === 0 && (
        <div className="empty-state">
          <p>No unsold games to display</p>
          <p className="empty-state-subtitle">Add some games to start tracking market values</p>
        </div>
      )}

      {/* Detailed Price History Modal */}
      {selectedGame && (
        <PriceChart
          gameId={selectedGame.id}
          mode="detailed"
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
}
